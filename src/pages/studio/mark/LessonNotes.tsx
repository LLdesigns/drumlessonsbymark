import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import { fetchTeacherAssignedLessonNotes } from '../../../lib/lesson-planning-service'
import { displayName, fetchLessonNotes, fetchTeacherStudents } from '../../../lib/studio-service'
import type { AssignedLessonNote } from '../../../types/lesson-planning'
import type { LessonNote, StudioStudent } from '../../../types/studio'

type LessonNoteRow = AssignedLessonNote & {
  assigned_lesson?: { id: string; title: string; student_id: string }
}

export default function MarkLessonNotes() {
  const { user, userRole } = useAuthStore()
  const [lessonNotes, setLessonNotes] = useState<LessonNoteRow[]>([])
  const [legacyNotes, setLegacyNotes] = useState<LessonNote[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [filterStudentId, setFilterStudentId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      fetchTeacherAssignedLessonNotes(user.id, { limit: 80 }),
      fetchLessonNotes(user.id, 'teacher', 20),
      fetchTeacherStudents(user.id, userRole),
    ])
      .then(([assigned, legacy, sList]) => {
        setLessonNotes(assigned)
        setLegacyNotes(legacy)
        setStudents(sList)
      })
      .finally(() => setLoading(false))
  }, [user?.id, userRole])

  const studentMap = useMemo(() => new Map(students.map((s) => [s.user_id, s])), [students])

  const filtered = useMemo(() => {
    if (!filterStudentId) return lessonNotes
    return lessonNotes.filter((n) => n.assigned_lesson?.student_id === filterStudentId)
  }, [lessonNotes, filterStudentId])

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title="Lesson notes"
        subtitle="Notes live on each assigned lesson — private to you or shared with that student. Open a lesson from Lesson Planning to add notes."
        action={
          <Link to="/studio/lesson-planning" className="studio-btn studio-btn--primary">
            <i className="bi bi-journal-text" /> Lesson library
          </Link>
        }
      />

      <div className="studio-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <label className="studio-label">Filter by student</label>
        <select
          className="studio-select"
          value={filterStudentId}
          onChange={(e) => setFilterStudentId(e.target.value)}
          style={{ maxWidth: 320 }}
        >
          <option value="">All students</option>
          {students.map((s) => (
            <option key={s.user_id} value={s.user_id}>
              {displayName(s)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="studio-subtext">Loading notes…</p>
      ) : filtered.length === 0 ? (
        <div className="studio-card studio-empty">
          <p className="studio-journal" style={{ margin: 0 }}>
            No lesson-level notes yet. Assign a lesson to a student, open it from the Students tab, and add notes there.
          </p>
          <Link to="/studio/lesson-planning" className="studio-btn studio-btn--primary" style={{ marginTop: '1rem' }}>
            Go to lesson planning
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((note) => {
            const student = note.assigned_lesson?.student_id
              ? studentMap.get(note.assigned_lesson.student_id)
              : undefined
            const lessonTitle = note.assigned_lesson?.title ?? 'Lesson'
            const lessonId = note.assigned_lesson?.id
            return (
              <article key={note.id} className="studio-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    {lessonId ? (
                      <Link
                        to={`/studio/lesson-planning/assigned/${lessonId}`}
                        className="studio-heading"
                        style={{ fontSize: '1.05rem', textDecoration: 'none' }}
                      >
                        {lessonTitle}
                      </Link>
                    ) : (
                      <h3 className="studio-heading" style={{ fontSize: '1.05rem' }}>
                        {lessonTitle}
                      </h3>
                    )}
                    <p className="studio-subtext" style={{ margin: '0.25rem 0 0' }}>
                      {displayName(student)} · {note.author_id === user?.id ? 'You' : 'Student'} ·{' '}
                      {note.visibility === 'shared' ? 'Shared' : 'Private'}
                    </p>
                  </div>
                  <span className="studio-subtext">{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="studio-subtext" style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {note.body}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {legacyNotes.length > 0 ? (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 className="studio-heading" style={{ fontSize: '1.1rem' }}>Earlier studio notes (legacy)</h2>
          <p className="studio-subtext" style={{ marginBottom: '1rem' }}>
            These were created on the old Lesson Notes page. New notes should be added on each assigned lesson.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {legacyNotes.map((note) => (
              <article key={note.id} className="studio-card" style={{ opacity: 0.9 }}>
                <h3 className="studio-heading" style={{ fontSize: '1rem' }}>
                  {note.title}
                </h3>
                {note.summary ? <p className="studio-subtext">{note.summary}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </MarkStudioLayout>
  )
}
