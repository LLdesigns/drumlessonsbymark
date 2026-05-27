import webpush from 'npm:web-push@3.6.7'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export function isWebPushConfigured(): boolean {
  return Boolean(Deno.env.get('VAPID_PUBLIC_KEY') && Deno.env.get('VAPID_PRIVATE_KEY'))
}

export async function sendWebPushToSubscriptions(
  subs: PushSubscriptionRow[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; staleEndpoints: string[] }> {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!publicKey || !privateKey || subs.length === 0) {
    return { sent: 0, failed: 0, staleEndpoints: [] }
  }

  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@drumlessonsbymark.com'
  webpush.setVapidDetails(subject, publicKey, privateKey)

  const pushBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/app',
  })

  let sent = 0
  let failed = 0
  const staleEndpoints: string[] = []

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushBody,
        { TTL: 86400 }
      )
      sent++
    } catch (err: unknown) {
      failed++
      const status =
        err && typeof err === 'object' && 'statusCode' in err
          ? Number((err as { statusCode: number }).statusCode)
          : 0
      if (status === 404 || status === 410) {
        staleEndpoints.push(sub.endpoint)
      }
      console.error('[web-push] delivery failed:', status || 'unknown', sub.endpoint.slice(0, 48))
    }
  }

  return { sent, failed, staleEndpoints }
}

export async function sendPushToUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  if (!isWebPushConfigured()) {
    console.warn('[web-push] VAPID keys not configured — skipping push')
    return false
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) {
    console.error('[web-push] subscription lookup failed:', error.message)
    return false
  }
  if (!subs?.length) {
    console.log(`[web-push] no subscriptions for user ${userId}`)
    return false
  }

  const { sent, staleEndpoints } = await sendWebPushToSubscriptions(
    subs as PushSubscriptionRow[],
    payload
  )

  if (staleEndpoints.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .in('endpoint', staleEndpoints)
  }

  if (sent > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  return sent > 0
}
