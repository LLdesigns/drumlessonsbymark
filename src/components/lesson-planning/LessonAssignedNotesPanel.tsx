import { useEffect, useState } from 'react'
import {
  createAssignedLessonNote,
  deleteAssignedLessonNote,
  fetchAssignedLessonNotes,
  updateAssignedLessonNote,
} from '../../lib/lesson-planning-service'
import type { AssignedLessonNote, AssignedLessonNoteVisibility } from '../../types/lesson-planning'

interface LessonAssignedNotesPanelProps {
  assignedLessonId: string
  authorId: string
  authorRole: 'teacher' | 'student'
  teacherId: string
}

function visibilityLabel(visibility: AssignedLessonNoteVisibility, authorRole: 'teacher' | 'student') {
  if (visibility === 'private') {
    return authorRole === 'teacher' ? 'Only you' : 'Private (only you)'
  }
  return authorRole === 'teacher' ? 'Shared with student' : 'Shared with teacher'
}

export default function LessonAssignedNotesPanel({
  assignedLessonId,
  authorId,
  authorRole,
  teacherId,
}: LessonAssignedNotesPanelProps) {
  const [notes, setNotes] = useState<AssignedLessonNote[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<AssignedLessonNoteVisibility>('private')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchAssignedLessonNotes(assignedLessonId)
      setNotes(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [assignedLessonId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    setError('')
    try {
      await createAssignedLessonNote({
        assigned_lesson_id: assignedLessonId,
        author_id: authorId,
        body: body.trim(),
        visibility,
      })
      setBody('')
      setVisibility('private')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save note')
    } finally {
      setSaving(false)
    }
  }

  const isOwn = (note: AssignedLessonNote) => note.author_id === authorId
  const isTeacherAuthor = (note: AssignedLessonNote) => note.author_id === teacherId

  return (
    <section className="lesson-assigned-notes studio-card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
      <h3 className="studio-heading" style={{ marginTop: 0, fontSize: '1.05rem' }}>
        Lesson notes
      </h3>
      <p className="studio-subtext" style={{ marginBottom: '1rem' }}>
        {authorRole === 'teacher'
          ? 'Notes for this student on this lesson. Other students cannot see them. Mark shared when the student should read a note.'
          : 'Your notes for this lesson. Private notes stay with you; shared notes are visible to your teacher.'}
      </p>

      {loading ? (
        <p className="studio-subtext">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="studio-subtext">No notes yet.</p>
      ) : (
        <ul className="lesson-assigned-notes__list">
          {notes.map((note) => (
            <li key={note.id} className="lesson-assigned-notes__item">
              <div className="lesson-assigned-notes__meta">
                <span>
                  {isOwn(note)
                    ? 'You'
                    : isTeacherAuthor(note)
                      ? 'Teacher'
                      : 'Student'}
                </span>
                <span className="lesson-assigned-notes__badge">{visibilityLabel(note.visibility, isTeacherAuthor(note) ? 'teacher' : 'student')}</span>
                <time dateTime={note.created_at}>{new Date(note.created_at).toLocaleString()}</time>
              </div>
              <p className="lesson-assigned-notes__body">{note.body}</p>
              {isOwn(note) ? (
                <div className="lesson-assigned-notes__actions">
                  {note.visibility === 'private' ? (
                    <button
                      type="button"
                      className="lesson-builder__btn lesson-builder__btn--ghost"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      onClick={async () => {
                        await updateAssignedLessonNote(note.id, { visibility: 'shared' })
                        load()
                      }}
                    >
                      Share with {authorRole === 'teacher' ? 'student' : 'teacher'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="lesson-builder__btn lesson-builder__btn--ghost"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--lb-danger, #e57373)' }}
                    onClick={async () => {
                      if (!confirm('Delete this note?')) return
                      await deleteAssignedLessonNote(note.id)
                      load()
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="lesson-assigned-notes__form">
        <label className="studio-label">New note</label>
        <textarea
          className="studio-input"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={authorRole === 'teacher' ? 'Session takeaway, homework, focus for next time…' : 'Practice reflections, questions for Mark…'}
        />
        <div className="lesson-assigned-notes__form-row">
          <label className="lesson-assigned-notes__visibility">
            <input
              type="radio"
              name="note-visibility"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
            />
            {authorRole === 'teacher' ? 'Private (only you)' : 'Private'}
          </label>
          <label className="lesson-assigned-notes__visibility">
            <input
              type="radio"
              name="note-visibility"
              checked={visibility === 'shared'}
              onChange={() => setVisibility('shared')}
            />
            {authorRole === 'teacher' ? 'Shared with student' : 'Shared with teacher'}
          </label>
          <button type="submit" className="lesson-builder__btn lesson-builder__btn--primary" disabled={saving || !body.trim()}>
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
        {error ? <p className="studio-subtext" style={{ color: '#e57373' }}>{error}</p> : null}
      </form>
    </section>
  )
}
