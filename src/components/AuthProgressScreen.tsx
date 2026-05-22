import type { LoginPortal } from '../lib/login-portal'

interface AuthProgressScreenProps {
  message: string
  subtitle?: string
  /** Studio tab uses gold accent; student uses purple */
  portal?: LoginPortal
  /** When true, use full viewport; when false, fits inside login card */
  embedded?: boolean
}

export default function AuthProgressScreen({
  message,
  subtitle,
  portal,
  embedded = false,
}: AuthProgressScreenProps) {
  const accent =
    portal === 'student' ? 'var(--color-brand-tertiary, #8b5cf6)' : 'var(--color-brand-primary)'

  return (
    <div
      className={`auth-progress${embedded ? ' auth-progress--embedded' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="auth-progress__spinner" style={{ borderTopColor: accent }} aria-hidden="true" />
      <p className="auth-progress__message">{message}</p>
      {subtitle ? <p className="auth-progress__subtitle">{subtitle}</p> : null}
    </div>
  )
}
