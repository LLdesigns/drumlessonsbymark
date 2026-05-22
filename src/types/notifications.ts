export type NotificationType =
  | 'message_received'
  | 'lesson_reminder'
  | 'assignment_added'
  | 'assignment_completed'
  | 'schedule_changed'
  | 'practice_upload'
  | 'lesson_note_added'
  | 'lesson_assigned'
  | 'lesson_started'
  | 'session_note_added'
  | 'practice_task_completed'
  | 'practice_note_added'

export interface StudioNotification {
  id: string
  recipient_id: string
  actor_id: string | null
  notification_type: NotificationType
  title: string
  body: string
  action_url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  pushed_at: string | null
  emailed_at: string | null
  created_at: string
}

export interface NotificationPreferences {
  user_id: string
  push_enabled: boolean
  email_enabled: boolean
  message_notifications: boolean
  lesson_reminders: boolean
  assignment_notifications: boolean
  schedule_notifications: boolean
  practice_notifications: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  created_at: string
  updated_at: string
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  'user_id' | 'created_at' | 'updated_at'
> = {
  push_enabled: true,
  email_enabled: true,
  message_notifications: true,
  lesson_reminders: true,
  assignment_notifications: true,
  schedule_notifications: true,
  practice_notifications: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
}

export interface DispatchNotificationPayload {
  recipientId: string
  actorId?: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}
