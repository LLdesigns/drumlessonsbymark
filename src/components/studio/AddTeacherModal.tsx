import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui'
import { addStudioTeacher } from '../../lib/teacher-onboarding'
import { formatAuthErrorMessage } from '../../lib/auth-errors'
import { getLoginPathForPortal } from '../../lib/login-portal'

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  createdBy: string
  onSuccess?: () => void
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
}

export default function AddTeacherModal({ isOpen, onClose, createdBy, onSuccess }: AddTeacherModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [copied, setCopied] = useState(false)

  const resetAndClose = () => {
    setStep('form')
    setForm(emptyForm)
    setError('')
    setTempPassword('')
    setTeacherName('')
    setCopied(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await addStudioTeacher({
        createdBy,
        email: form.email,
        firstName: form.first_name,
        lastName: form.last_name,
      })
      setTempPassword(result.temporaryPassword)
      setTeacherName(result.teacherName)
      setStep('success')
      onSuccess?.()
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err, 'Could not add teacher. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const loginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getLoginPathForPortal('studio')}`
      : getLoginPathForPortal('studio')

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={step === 'form' ? 'Add teacher' : 'Teacher added'}
      size="lg"
      variant="studio"
    >
      {step === 'form' ? (
        <form onSubmit={handleSubmit}>
          <p className="studio-subtext studio-modal__intro">
            Create a <strong>studio teacher</strong> account (for Mark or another instructor). They sign in with the{' '}
            <strong>Studio</strong> tab on the login page — not the Student tab.
          </p>

          <div className="studio-modal__form-grid">
            <label className="studio-field">
              <span className="studio-label">First name *</span>
              <input
                className="studio-input"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span className="studio-label">Last name *</span>
              <input
                className="studio-input"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </label>
            <label className="studio-field studio-field--full">
              <span className="studio-label">Email *</span>
              <input
                className="studio-input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="mark@…"
              />
            </label>
          </div>

          {error ? <div className="studio-modal__error">{error}</div> : null}

          <div className="studio-modal__actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="studio-btn studio-btn--primary" disabled={loading}>
              {loading ? 'Creating…' : 'Add teacher'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="studio-journal" style={{ marginTop: 0 }}>
            <strong>{teacherName}</strong> can use Mark&apos;s Drum Studio as a teacher.
          </p>

          <div className="studio-modal__success-card">
            <p className="studio-label" style={{ marginBottom: 0 }}>
              Temporary password (share once)
            </p>
            <code>{tempPassword}</code>
            <button type="button" className="studio-btn studio-btn--secondary" onClick={copyPassword}>
              {copied ? 'Copied!' : 'Copy password'}
            </button>
          </div>

          <ol className="studio-modal__steps">
            <li>Share the password with the teacher.</li>
            <li>
              They sign in at <Link to={getLoginPathForPortal('studio')}>Studio login</Link> ({loginUrl})
            </li>
            <li>They choose a new password on first sign-in.</li>
          </ol>

          <div className="studio-modal__actions">
            <button type="button" className="studio-btn studio-btn--primary" onClick={resetAndClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
