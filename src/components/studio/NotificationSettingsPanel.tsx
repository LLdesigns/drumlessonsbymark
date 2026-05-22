import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import {
  ensureNotificationPreferences,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  upsertNotificationPreferences,
} from '../../lib/notification-service'
import type { NotificationPreferences } from '../../types/notifications'
import { isPushSupported, setNotifyPromptState } from '../../lib/pwa'

function PrefToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="studio-pref-row">
      <div>
        <label>{label}</label>
        <span>{hint}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`studio-btn studio-btn--ghost`}
        style={{
          minWidth: 48,
          padding: '0.4rem 0.75rem',
          background: checked ? 'var(--studio-accent-soft)' : undefined,
          borderColor: checked ? 'var(--studio-accent)' : undefined,
        }}
        onClick={() => onChange(!checked)}
      >
        {checked ? 'On' : 'Off'}
      </button>
    </div>
  )
}

export default function NotificationSettingsPanel() {
  const { user } = useAuthStore()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const pushAvailable = isPushSupported()

  useEffect(() => {
    if (!user?.id) return
    ensureNotificationPreferences(user.id).then(setPrefs)
  }, [user?.id])

  const save = async (patch: Partial<NotificationPreferences>) => {
    if (!user?.id || !prefs) return
    setSaving(true)
    try {
      const updated = await upsertNotificationPreferences(user.id, { ...prefs, ...patch })
      setPrefs(updated)
      if (patch.push_enabled === true && pushAvailable) {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          await subscribeToWebPush(user.id)
          setNotifyPromptState('granted')
        }
      }
      if (patch.push_enabled === false) {
        await unsubscribeFromWebPush(user.id)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!prefs) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        Loading notification settings…
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          Notifications
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Gentle updates from Mark&apos;s studio — messages, lessons, and practice. Email is used when
          push isn&apos;t available.
        </p>
      </div>

      <PrefToggle
        label="Push notifications"
        hint={pushAvailable ? 'Phone & browser alerts when installed' : 'Not supported on this browser'}
        checked={prefs.push_enabled}
        onChange={(v) => save({ push_enabled: v })}
      />
      <PrefToggle
        label="Email notifications"
        hint="Backup when push is off or unavailable"
        checked={prefs.email_enabled}
        onChange={(v) => save({ email_enabled: v })}
      />
      <PrefToggle
        label="Messages"
        hint="When Mark or a student sends a note"
        checked={prefs.message_notifications}
        onChange={(v) => save({ message_notifications: v })}
      />
      <PrefToggle
        label="Lesson reminders"
        hint="Upcoming lesson times"
        checked={prefs.lesson_reminders}
        onChange={(v) => save({ lesson_reminders: v })}
      />
      <PrefToggle
        label="Practice & assignments"
        hint="New assignments and lesson notes"
        checked={prefs.assignment_notifications}
        onChange={(v) => save({ assignment_notifications: v })}
      />
      <PrefToggle
        label="Schedule changes"
        hint="Reschedules or cancellations"
        checked={prefs.schedule_notifications}
        onChange={(v) => save({ schedule_notifications: v })}
      />

      {saving ? (
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Saving…</p>
      ) : null}
    </div>
  )
}
