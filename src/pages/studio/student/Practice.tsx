import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import { useAuthStore } from '../../../store/auth'
import {
  completePracticeAssignment,
  displayName,
  fetchLessonNotes,
  fetchPracticeAssignments,
  getStudentTeacherId,
} from '../../../lib/studio-service'
import { notifyGeneric } from '../../../lib/notify-studio'
import type { LessonNote, PracticeAssignment } from '../../../types/studio'
import '../../../lib/lesson-planning.css'

export default function StudentPractice() {
  const { user, userProfile } = useAuthStore()
  const [assignments, setAssignments] = useState<PracticeAssignment[]>([])
  const [notes, setNotes] = useState<LessonNote[]>([])

  const reload = async () => {
    if (!user?.id) return
    const [a, n] = await Promise.all([
      fetchPracticeAssignments(user.id, 'student'),
      fetchLessonNotes(user.id, 'student'),
    ])
    setAssignments(a)
    setNotes(n)
  }

  useEffect(() => {
    reload()
  }, [user?.id])

  const handleComplete = async (id: string) => {
    const assignment = assignments.find((a) => a.id === id)
    await completePracticeAssignment(id)
    const teacherId = await getStudentTeacherId(user!.id)
    if (teacherId && assignment) {
      const name = displayName(userProfile)
      await notifyGeneric(
        teacherId,
        'assignment_completed',
        `${name} finished practice`,
        `"${assignment.title}" is marked complete.`,
        '/studio/students'
      )
    }
    reload()
  }

  const active = assignments.filter((a) => a.status === 'active')
  const done = assignments.filter((a) => a.status === 'completed')

  return (
    <StudentStudioLayout>
      <div className="lp-hub">
        <header className="lp-page-header">
          <div>
            <h1>Practice</h1>
            <p>Assignments, songs, rudiments, and notes from Mark.</p>
          </div>
          <Link to="/student/lessons" className="lp-btn lp-btn--primary">
            <i className="bi bi-journal-richtext" /> My lessons
          </Link>
        </header>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-accent)', marginBottom: '1rem' }}>
          Active assignments
        </h2>
        {active.length === 0 ? (
          <div className="lp-empty lp-card">
            <p style={{ margin: 0 }}>Nothing due right now — check My Lessons or revisit notes below.</p>
          </div>
        ) : (
          active.map((a) => (
            <article key={a.id} className="lp-card" style={{ marginBottom: '1rem' }}>
              <h4 className="studio-heading" style={{ fontSize: '1.1rem' }}>
                {a.title}
              </h4>
              {a.description ? <p className="studio-subtext">{a.description}</p> : null}
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {a.songs?.map((s) => (
                  <span key={s} className="studio-badge">
                    🎵 {s}
                  </span>
                ))}
                {a.rudiments?.map((r) => (
                  <span key={r} className="studio-badge">
                    🥁 {r}
                  </span>
                ))}
              </div>
              {a.video_url ? (
                <a href={a.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--studio-accent)', display: 'block', marginTop: '0.5rem' }}>
                  Watch practice video →
                </a>
              ) : null}
              <button
                type="button"
                className="studio-btn studio-btn--primary"
                style={{ marginTop: '0.85rem' }}
                onClick={() => handleComplete(a.id)}
              >
                Mark complete
              </button>
            </article>
          ))
        )}
      </section>

      {done.length > 0 ? (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
            Completed
          </h3>
          {done.map((a) => (
            <p key={a.id} className="studio-subtext">
              ✓ {a.title}
            </p>
          ))}
        </section>
      ) : null}

      <section>
        <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-accent)', marginBottom: '1rem' }}>
          Lesson notes from Mark
        </h2>
        {notes.length === 0 ? (
          <p style={{ color: 'var(--lp-muted)' }}>Notes from lessons will appear here.</p>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="lp-card" style={{ marginBottom: '1rem' }}>
              <h4>{note.title}</h4>
              {note.summary ? <p className="studio-subtext">{note.summary}</p> : null}
              {note.resource_links?.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--studio-accent)', display: 'block', marginTop: '0.35rem' }}
                >
                  {link.label || link.url}
                </a>
              ))}
            </article>
          ))
        )}
      </section>
      </div>
    </StudentStudioLayout>
  )
}
