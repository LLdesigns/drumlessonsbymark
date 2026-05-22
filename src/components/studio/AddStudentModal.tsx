import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui'
import { addStudioStudent } from '../../lib/student-onboarding'
import { formatAuthErrorMessage } from '../../lib/auth-errors'
import { SKILL_LEVELS } from '../../lib/studio-service'
import type { SkillLevel } from '../../types/studio'
import { getLoginPathForPortal } from '../../lib/login-portal'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  teacherId: string
  createdBy: string
  onSuccess: () => void
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  age: '',
  skill_level: '' as SkillLevel | '',
  goals: '',
  favorite_music: '',
}

export default function AddStudentModal({
  isOpen,
  onClose,
  teacherId,
  createdBy,
  onSuccess,
}: AddStudentModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [studentName, setStudentName] = useState('')
  const [copied, setCopied] = useState(false)

  const resetAndClose = () => {
    setStep('form')
    setForm(emptyForm)
    setError('')
    setTempPassword('')
    setStudentName('')
    setCopied(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await addStudioStudent({
        teacherId,
        createdBy,
        email: form.email,
        firstName: form.first_name,
        lastName: form.last_name,
        age: form.age ? Number(form.age) : undefined,
        skillLevel: form.skill_level || undefined,
        goals: form.goals || undefined,
        favoriteMusic: form.favorite_music || undefined,
      })

      setTempPassword(result.temporaryPassword)
      setStudentName(result.studentName)
      setStep('success')
      onSuccess()
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err, 'Could not add student. Please try again.'))
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
      ? `${window.location.origin}${getLoginPathForPortal('student')}`
      : getLoginPathForPortal('student')

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={step === 'form' ? 'Add student' : 'Student added'}
      size="lg"
      variant="studio"
    >
      {step === 'form' ? (
        <form onSubmit={handleSubmit}>
          <p className="studio-subtext studio-modal__intro">
            Create a private portal account for your student. They&apos;ll sign in with the{' '}
            <strong>Student</strong> tab on the login page and change their password on first visit.
          </p>

          <div className="studio-modal__form-grid">
            <label className="studio-field">
              <span className="studio-label">First name *</span>
              <input
                className="studio-input"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                autoComplete="given-name"
              />
            </label>
            <label className="studio-field">
              <span className="studio-label">Last name *</span>
              <input
                className="studio-input"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                autoComplete="family-name"
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
                autoComplete="email"
                placeholder="student or parent email"
              />
            </label>
            <label className="studio-field">
              <span className="studio-label">Age</span>
              <input
                className="studio-input"
                type="number"
                min={4}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span className="studio-label">Skill level</span>
              <select
                className="studio-select"
                value={form.skill_level}
                onChange={(e) =>
                  setForm({ ...form, skill_level: e.target.value as SkillLevel | '' })
                }
              >
                <option value="">Not set yet</option>
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field studio-field--full">
              <span className="studio-label">Goals</span>
              <textarea
                className="studio-textarea"
                rows={2}
                placeholder="What they want to work on…"
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
              />
            </label>
            <label className="studio-field studio-field--full">
              <span className="studio-label">Favorite music</span>
              <input
                className="studio-input"
                placeholder="Bands, genres, artists…"
                value={form.favorite_music}
                onChange={(e) => setForm({ ...form, favorite_music: e.target.value })}
              />
            </label>
          </div>

          {error ? <div className="studio-modal__error">{error}</div> : null}

          <div className="studio-modal__actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="studio-btn studio-btn--primary" disabled={loading}>
              {loading ? 'Creating…' : 'Add student'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="studio-journal" style={{ marginTop: 0 }}>
            <strong>{studentName}</strong> is ready for Mark&apos;s Studio Portal.
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
            <li>Share the password securely with the student or parent.</li>
            <li>
              They sign in at{' '}
              <Link to={getLoginPathForPortal('student')}>Student login</Link> ({loginUrl})
            </li>
            <li>They&apos;ll be asked to choose a new password on first sign-in.</li>
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
