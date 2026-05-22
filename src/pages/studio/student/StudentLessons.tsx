import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import { LessonMetaBadges } from '../../../components/lesson-planning/LessonBlockRenderer'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import {
  fetchAssignedLessons,
  fetchStudentSessionNotes,
  fetchStudentTaskCompletions,
} from '../../../lib/lesson-planning-service'
import type { PracticeTaskCompletion } from '../../../types/lesson-planning'
import { useAuthStore } from '../../../store/auth'
import type { AssignedLesson, LessonSessionNote } from '../../../types/lesson-planning'
import '../../../lib/lesson-planning.css'

export default function StudentLessons() {
  const { user } = useAuthStore()
  const [lessons, setLessons] = useState<AssignedLesson[]>([])
  const [sessionNotes, setSessionNotes] = useState<LessonSessionNote[]>([])
  const [taskCompletions, setTaskCompletions] = useState<PracticeTaskCompletion[]>([])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      fetchAssignedLessons(user.id, 'student'),
      fetchStudentSessionNotes(user.id),
      fetchStudentTaskCompletions(user.id),
    ]).then(([l, n, c]) => {
      setLessons(l)
      setSessionNotes(n)
      setTaskCompletions(c)
    })
  }, [user?.id])

  const tasksDoneForLesson = (lessonId: string) =>
    taskCompletions.filter((c) => c.assigned_lesson_id === lessonId).length

  const active = lessons.filter((l) => l.status !== 'completed' && l.status !== 'archived')
  const completed = lessons.filter((l) => l.status === 'completed')

  return (
    <StudentStudioLayout>
      <div className="lp-hub">
        <header className="lp-page-header">
          <div>
            <h1>My Lessons</h1>
            <p>Practice materials, assignments, and notes from Mark.</p>
          </div>
        </header>

        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-accent)', marginBottom: '1rem' }}>
            Current lessons
          </h2>
          {active.length === 0 ? (
            <div className="lp-empty lp-card">
              <div className="lp-empty__icon"><i className="bi bi-music-note-beamed" /></div>
              <h3>No practice assigned yet</h3>
              <p>Mark will assign lessons here when you have work to do between sessions.</p>
            </div>
          ) : (
            <div className="lp-card-grid">
              {active.map((lesson) => (
                <Link key={lesson.id} to={`/student/lessons/${lesson.id}`} className="lp-card lp-card--interactive">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h3 className="lp-card__title">{lesson.title}</h3>
                    <span className={`lp-badge lp-badge--status-${lesson.status}`}>{statusLabel(lesson.status)}</span>
                  </div>
                  {(lesson.custom_student_instructions || lesson.student_instructions) ? (
                    <p className="lp-card__meta">
                      {(lesson.custom_student_instructions || lesson.student_instructions)?.slice(0, 100)}
                      {(lesson.custom_student_instructions || lesson.student_instructions || '').length > 100 ? '…' : ''}
                    </p>
                  ) : null}
                  <LessonMetaBadges category={lesson.category} skillLevel={lesson.skill_level} duration={lesson.estimated_duration_minutes} />
                  {lesson.due_date ? <p className="lp-card__meta">Due {new Date(lesson.due_date).toLocaleDateString()}</p> : null}
                  {tasksDoneForLesson(lesson.id) > 0 ? (
                    <p className="lp-card__tasks-done">
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />{' '}
                      {tasksDoneForLesson(lesson.id)} task{tasksDoneForLesson(lesson.id) === 1 ? '' : 's'} checked off
                    </p>
                  ) : null}
                  <span style={{ color: 'var(--lp-accent)', marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    Open lesson →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {completed.length > 0 ? (
          <section style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-muted)', marginBottom: '0.75rem' }}>
              Completed
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {completed.map((l) => (
                <Link key={l.id} to={`/student/lessons/${l.id}`} className="lp-btn lp-btn--ghost" style={{ justifyContent: 'flex-start' }}>
                  ✓ {l.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-accent)', marginBottom: '1rem' }}>
            Notes from Mark
          </h2>
          {sessionNotes.filter((n) => n.student_summary || n.homework_assigned).length === 0 ? (
            <p style={{ color: 'var(--lp-muted)', fontSize: '0.9rem' }}>Session notes will appear here after lessons.</p>
          ) : (
            sessionNotes
              .filter((n) => n.student_summary || n.homework_assigned)
              .map((note) => (
                <article key={note.id} className="lp-card" style={{ marginBottom: '1rem' }}>
                  <span className="lp-badge">{new Date(note.lesson_date).toLocaleDateString()}</span>
                  {note.student_summary ? <p style={{ marginTop: '0.65rem', lineHeight: 1.5 }}>{note.student_summary}</p> : null}
                  {note.homework_assigned ? (
                    <p className="lp-card__meta" style={{ marginTop: '0.5rem' }}><strong>Practice:</strong> {note.homework_assigned}</p>
                  ) : null}
                  {note.next_lesson_focus ? (
                    <p className="lp-card__meta"><strong>Next focus:</strong> {note.next_lesson_focus}</p>
                  ) : null}
                </article>
              ))
          )}
        </section>
      </div>
    </StudentStudioLayout>
  )
}
