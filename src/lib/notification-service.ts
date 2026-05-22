import { supabase } from './supabase'
import type {
  DispatchNotificationPayload,
  NotificationPreferences,
  NotificationType,
  StudioNotification,
} from '../types/notifications'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notifications'
import { isMobileDevice } from './pwa'

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || error.message?.includes('does not exist') === true
}

export async function fetchNotifications(
  userId: string,
  limit = 40
): Promise<StudioNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as StudioNotification[]
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (isMissingTableError(error)) return 0
  if (error) throw error
  return count ?? 0
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error && !isMissingTableError(error)) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (error && !isMissingTableError(error)) throw error
}

export async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (isMissingTableError(error)) return null
  if (error) throw error
  return data as NotificationPreferences | null
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...prefs,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as NotificationPreferences
}

export async function ensureNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const existing = await fetchNotificationPreferences(userId)
  if (existing) return existing
  return upsertNotificationPreferences(userId, { user_id: userId })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export async function subscribeToWebPush(userId: string): Promise<boolean> {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!vapidPublicKey || !('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
      device_label: isMobileDevice() ? 'Mobile' : 'Desktop',
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  )

  if (error) throw error
  return true
}

export async function unsubscribeFromWebPush(userId: string): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
    }
  }
}

/** Server creates in-app row + optional push + email fallback */
export async function dispatchNotification(payload: DispatchNotificationPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('dispatch-notification', {
      body: payload,
    })
    if (error) console.warn('[notifications] dispatch edge function:', error.message)
  } catch (e) {
    console.warn('[notifications] dispatch failed, creating in-app only', e)
    await createInAppNotificationOnly(payload)
  }
}

async function createInAppNotificationOnly(payload: DispatchNotificationPayload): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    recipient_id: payload.recipientId,
    actor_id: payload.actorId ?? null,
    notification_type: payload.type,
    title: payload.title,
    body: payload.body,
    action_url: payload.actionUrl ?? null,
    metadata: payload.metadata ?? {},
  })
  if (error && !isMissingTableError(error)) throw error
}

export function preferenceAllowsType(
  prefs: NotificationPreferences | null,
  type: NotificationType
): boolean {
  if (!prefs) return true
  switch (type) {
    case 'message_received':
      return prefs.message_notifications
    case 'lesson_reminder':
      return prefs.lesson_reminders
    case 'assignment_added':
    case 'assignment_completed':
    case 'practice_upload':
      return prefs.assignment_notifications
    case 'schedule_changed':
      return prefs.schedule_notifications
    case 'lesson_note_added':
      return prefs.assignment_notifications
    default:
      return true
  }
}

export function subscribeToNotificationFeed(
  userId: string,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      () => onChange()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
