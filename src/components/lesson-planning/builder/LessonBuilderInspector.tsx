import { useState } from 'react'
import { LESSON_CATEGORIES, LESSON_SKILL_LEVELS } from '../../../lib/lesson-planning-constants'
import type { AssignedLessonStatus, LessonTemplateSkillLevel } from '../../../types/lesson-planning'
import { ASSIGNED_LESSON_STATUSES } from '../../../lib/lesson-planning-constants'

interface LessonDetails {
  title: string
  shortDescription: string
  category: string
  skillLevel: LessonTemplateSkillLevel
  duration: number
  lessonGoal: string
  tags: string[]
  teacherNotes: string
  studentInstructions: string
  practiceAssignment: string
}

export interface AssignedDetails {
  customStudentInstructions: string
  customTeacherNotes: string
  targetBpm: number | ''
  currentBpm: number | ''
  status: AssignedLessonStatus
  dueDate: string
  studentName?: string
}

interface LessonBuilderInspectorProps {
  open: boolean
  onClose?: () => void
  details: LessonDetails
  onDetailsChange: (patch: Partial<LessonDetails>) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  variant?: 'template' | 'assigned'
  assignedDetails?: AssignedDetails
  onAssignedChange?: (patch: Partial<AssignedDetails>) => void
  hideTags?: boolean
}

export default function LessonBuilderInspector({
  open,
  onClose,
  details,
  onDetailsChange,
  onAddTag,
  onRemoveTag,
  variant = 'template',
  assignedDetails,
  onAssignedChange,
  hideTags,
}: LessonBuilderInspectorProps) {
  const [tagInput, setTagInput] = useState('')

  return (
    <aside className={`lesson-builder__inspector ${open ? 'lesson-builder__inspector--open' : ''}`}>
      {onClose ? (
        <div className="lesson-builder__panel-head lesson-builder__panel-head--inspector">
          <h2 className="lesson-builder__panel-head-title">Lesson details</h2>
          <button type="button" className="lesson-builder__panel-close" onClick={onClose} aria-label="Close details">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      ) : (
        <div className="lesson-builder__inspector-tabs">
          <button type="button" aria-selected>
            Lesson details
          </button>
        </div>
      )}
      <div className="lesson-builder__inspector-body lesson-builder__scroll">
        {variant === 'assigned' && assignedDetails?.studentName ? (
          <p className="lesson-builder__help-card" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
            <strong>Student</strong>
            {assignedDetails.studentName}
          </p>
        ) : null}
        {variant === 'assigned' && assignedDetails && onAssignedChange ? (
          <>
            <div className="lesson-builder__field">
              <label>Custom instructions for student</label>
              <textarea
                rows={2}
                value={assignedDetails.customStudentInstructions}
                onChange={(e) => onAssignedChange({ customStudentInstructions: e.target.value })}
              />
            </div>
            <div className="lesson-builder__field-row">
              <div className="lesson-builder__field">
                <label>Target BPM</label>
                <input
                  type="number"
                  value={assignedDetails.targetBpm}
                  onChange={(e) =>
                    onAssignedChange({ targetBpm: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                />
              </div>
              <div className="lesson-builder__field">
                <label>Current BPM</label>
                <input
                  type="number"
                  value={assignedDetails.currentBpm}
                  onChange={(e) =>
                    onAssignedChange({ currentBpm: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="lesson-builder__field-row">
              <div className="lesson-builder__field">
                <label>Status</label>
                <select
                  value={assignedDetails.status}
                  onChange={(e) => onAssignedChange({ status: e.target.value as AssignedLessonStatus })}
                >
                  {ASSIGNED_LESSON_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="lesson-builder__field">
                <label>Due date</label>
                <input
                  type="date"
                  value={assignedDetails.dueDate}
                  onChange={(e) => onAssignedChange({ dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="lesson-builder__field">
              <label>Private teacher notes</label>
              <textarea
                rows={2}
                value={assignedDetails.customTeacherNotes}
                onChange={(e) => onAssignedChange({ customTeacherNotes: e.target.value })}
              />
            </div>
          </>
        ) : null}
        <div className="lesson-builder__field">
          <label>Title</label>
          <input value={details.title} onChange={(e) => onDetailsChange({ title: e.target.value })} placeholder="Lesson title" />
        </div>
        <div className="lesson-builder__field-row">
          <div className="lesson-builder__field">
            <label>Category</label>
            <select value={details.category} onChange={(e) => onDetailsChange({ category: e.target.value })}>
              {LESSON_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="lesson-builder__field">
            <label>Level</label>
            <select
              value={details.skillLevel}
              onChange={(e) => onDetailsChange({ skillLevel: e.target.value as LessonTemplateSkillLevel })}
            >
              {LESSON_SKILL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="lesson-builder__field">
          <label>Duration (min)</label>
          <input type="number" min={15} step={5} value={details.duration} onChange={(e) => onDetailsChange({ duration: Number(e.target.value) })} />
        </div>
        {!hideTags ? (
          <div className="lesson-builder__field">
            <label>Tags</label>
            <div className="lesson-builder__tags">
              {details.tags.map((t) => (
                <span key={t} className="lesson-builder__tag">
                  {t}
                  <button type="button" onClick={() => onRemoveTag(t)} aria-label={`Remove ${t}`}>×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault()
                  onAddTag(tagInput.trim())
                  setTagInput('')
                }
              }}
              placeholder="Add tag, press Enter"
              style={{ marginTop: '0.35rem' }}
            />
          </div>
        ) : null}
        <div className="lesson-builder__field">
          <label>Short description</label>
          <textarea value={details.shortDescription} onChange={(e) => onDetailsChange({ shortDescription: e.target.value })} rows={2} />
        </div>
        <div className="lesson-builder__field">
          <label>Lesson goal</label>
          <textarea value={details.lessonGoal} onChange={(e) => onDetailsChange({ lessonGoal: e.target.value })} rows={2} />
        </div>
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--lb-muted)' }}>More options</summary>
          <div className="lesson-builder__field" style={{ marginTop: '0.75rem' }}>
            <label>Student instructions</label>
            <textarea value={details.studentInstructions} onChange={(e) => onDetailsChange({ studentInstructions: e.target.value })} rows={2} />
          </div>
          <div className="lesson-builder__field">
            <label>Practice assignment</label>
            <textarea value={details.practiceAssignment} onChange={(e) => onDetailsChange({ practiceAssignment: e.target.value })} rows={2} />
          </div>
          <div className="lesson-builder__field">
            <label>Teacher notes (private)</label>
            <textarea value={details.teacherNotes} onChange={(e) => onDetailsChange({ teacherNotes: e.target.value })} rows={2} />
          </div>
        </details>
        <div className="lesson-builder__help-card">
          <strong>Editing blocks</strong>
          {variant === 'assigned'
            ? 'Click a block on the canvas to edit it inline. Customize this copy for your student — the library template stays unchanged.'
            : 'Click any block on the canvas to edit it here in place. Lesson details always stay in this panel.'}
        </div>
      </div>
    </aside>
  )
}
