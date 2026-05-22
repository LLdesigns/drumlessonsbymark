import { useState } from 'react'
import type { LessonTemplate } from '../../types/lesson-planning'
import type { StudioStudent } from '../../types/studio'
import { displayName, profileFirstName } from '../../lib/studio-service'
import { attachTemplateToStudents } from '../../lib/lesson-planning-service'
import { notifyLessonAssigned } from '../../lib/notify-studio'
import type { UserProfile } from '../../types/user'

interface AttachLessonModalProps {
  template: LessonTemplate
  students: StudioStudent[]
  teacherId: string
  teacherProfile: UserProfile | null | undefined
  onClose: () => void
  onAttached: () => void
}

export default function AttachLessonModal({
  template,
  students,
  teacherId,
  teacherProfile,
  onClose,
  onAttached,
}: AttachLessonModalProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [customInstructions, setCustomInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const handleAttach = async () => {
    if (selected.length === 0) return
    setSaving(true)
    try {
      const assigned = await attachTemplateToStudents(teacherId, template.id, selected, {
        custom_student_instructions: customInstructions || undefined,
        due_date: dueDate || null,
      })
      const teacherLabel = displayName(teacherProfile) || profileFirstName(teacherProfile, teacherProfile?.email)
      for (const a of assigned) {
        await notifyLessonAssigned(a.student_id, teacherLabel, a.title, a.id)
      }
      onAttached()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="block-picker-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="block-picker lp-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Attach to student</h3>
        <p>Assign &ldquo;{template.title}&rdquo; — each student gets their own copy to customize.</p>

        <div className="lp-modal-student-list">
          {students.length === 0 ? (
            <p style={{ color: 'var(--lb-muted)', margin: 0 }}>No students yet.</p>
          ) : (
            students.map((s) => (
              <label key={s.user_id}>
                <input type="checkbox" checked={selected.includes(s.user_id)} onChange={() => toggle(s.user_id)} />
                {displayName(s)}
              </label>
            ))
          )}
        </div>

        <div className="lesson-builder__field">
          <label>Custom instructions (optional)</label>
          <textarea rows={2} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Personal note for this student…" />
        </div>

        <div className="lesson-builder__field">
          <label>Due date (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="lesson-builder__btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="lesson-builder__btn lesson-builder__btn--primary"
            disabled={selected.length === 0 || saving}
            onClick={handleAttach}
          >
            {saving ? 'Attaching…' : `Attach to ${selected.length} student${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
