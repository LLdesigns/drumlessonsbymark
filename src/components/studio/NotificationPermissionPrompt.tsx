import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import {
  ensureNotificationPreferences,
  subscribeToWebPush,
} from '../../lib/notification-service'
import {
  getNotifyPromptState,
  hasMessagingActivity,
  isPushSupported,
  isStandalonePwa,
  setNotifyPromptState,
} from '../../lib/pwa'

interface NotificationPermissionPromptProps {
  /** Show after user visits messages */
  onMessagesPage?: boolean
}

export default function NotificationPermissionPrompt({
  onMessagesPage = false,
}: NotificationPermissionPromptProps) {
  const { user } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user?.id || !isPushSupported()) return
    if (Notification.permission !== 'default') {
      setNotifyPromptState(
        Notification.permission === 'granted' ? 'granted' : 'denied'
      )
      return
    }

    const state = getNotifyPromptState()
    if (state === 'asked' || state === 'granted' || state === 'dismissed' || state === 'denied') {
      return
    }

    const shouldAsk =
      onMessagesPage ||
      hasMessagingActivity() ||
      (isStandalonePwa() && state === 'pending')

    if (!shouldAsk) return

    const delay = onMessagesPage ? 1200 : 4000
    const t = window.setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [user?.id, onMessagesPage])

  if (!visible || !user?.id) return null

  const handleEnable = async () => {
    setBusy(true)
    setNotifyPromptState('asked')
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await ensureNotificationPreferences(user.id)
        await subscribeToWebPush(user.id)
        setNotifyPromptState('granted')
        setVisible(false)
      } else {
        setNotifyPromptState('denied')
        setVisible(false)
      }
    } catch {
      setNotifyPromptState('dismissed')
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    setNotifyPromptState('dismissed')
    setVisible(false)
  }

  return (
    <div className="studio-notify-prompt" role="dialog" aria-labelledby="notify-prompt-title">
      <div className="studio-notify-prompt__card">
        <i className="bi bi-bell studio-notify-prompt__icon" aria-hidden="true" />
        <h3 id="notify-prompt-title">Stay in the loop with Mark</h3>
        <p>
          Would you like gentle reminders for lessons, messages, and practice? You can change this
          anytime in settings.
        </p>
        <div className="studio-notify-prompt__actions">
          <button
            type="button"
            className="studio-btn studio-btn--primary"
            onClick={handleEnable}
            disabled={busy}
          >
            {busy ? 'One moment…' : 'Yes, notify me'}
          </button>
          <button type="button" className="studio-btn studio-btn--ghost" onClick={handleDismiss}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
