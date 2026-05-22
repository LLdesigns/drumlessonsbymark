import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import { LessonMetaBadges } from '../../../components/lesson-planning/LessonBlockRenderer'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import {
  fetchAssignedLessons,
  fetchStudentSessionNotes,
  fetchStudentTaskCompletions,
  fetchTeacherLessonLibraryForStudent,
  findActiveAssignedLessonForTemplate,
  studentEnrollInLesson,
} from '../../../lib/lesson-planning-service'
import { notifyStudentStartedLesson } from '../../../lib/notify-studio'
import { displayName, fetchLessonNotes, fetchPracticeAssignments } from '../../../lib/studio-service'
import type { PracticeTaskCompletion } from '../../../types/lesson-planning'
import { useAuthStore } from '../../../store/auth'
import type { AssignedLesson, LessonSessionNote, LessonTemplate } from '../../../types/lesson-planning'
import type { LessonNote, PracticeAssignment } from '../../../types/studio'
import '../../../lib/lesson-planning.css'

type LessonsTab = 'active' | 'library'

export default function StudentLessons() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') === 'library' ? 'library' : 'active') as LessonsTab

  const [library, setLibrary] = useState<LessonTemplate[]>([])
  const [myLessons, setMyLessons] = useState<AssignedLesson[]>([])
  const [sessionNotes, setSessionNotes] = useState<LessonSessionNote[]>([])
  const [taskCompletions, setTaskCompletions] = useState<PracticeTaskCompletion[]>([])
  const [legacyAssignments, setLegacyAssignments] = useState<PracticeAssignment[]>([])
  const [legacyNotes, setLegacyNotes] = useState<LessonNote[]>([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const [lib, lessons, notes, completions, legacyA, legacyN] = await Promise.all([
      fetchTeacherLessonLibraryForStudent(user.id),
      fetchAssignedLessons(user.id, 'student'),
      fetchStudentSessionNotes(user.id),
      fetchStudentTaskCompletions(user.id),
      fetchPracticeAssignments(user.id, 'student'),
      fetchLessonNotes(user.id, 'student'),
    ])
    setLibrary(lib)
    setMyLessons(lessons)
    setSessionNotes(notes)
    setTaskCompletions(completions)
    setLegacyAssignments(legacyA.filter((a) => a.status === 'active'))
    setLegacyNotes(legacyN)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    reload()
  }, [reload])

  const setTab = (next: LessonsTab) => {
    setSearchParams(next === 'library' ? { tab: 'library' } : {}, { replace: true })
  }

  const tasksDoneForLesson = (lessonId: string) =>
    taskCompletions.filter((c) => c.assigned_lesson_id === lessonId).length

  const active = myLessons.filter((l) => l.status !== 'completed' && l.status !== 'archived')
  const completed = myLessons.filter((l) => l.status === 'completed')

  const libraryWithStatus = useMemo(
    () =>
      library.map((t) => ({
        template: t,
        activeLesson: findActiveAssignedLessonForTemplate(myLessons, t.id),
      })),
    [library, myLessons]
  )

  const handleStartLesson = async (templateId: string) => {
    if (!user?.id) return
    setStartingId(templateId)
    setStartError(null)
    try {
      const { lesson, created } = await studentEnrollInLesson(user.id, templateId)
      if (created) {
        const teacherId = lesson.teacher_id
        const name = displayName(userProfile)
        await notifyStudentStartedLesson(teacherId, name, lesson.title, lesson.id)
      }
      await reload()
      navigate(`/student/lessons/${lesson.id}`)
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start lesson')
    } finally {
      setStartingId(null)
    }
  }

  return (
    <StudentStudioLayout>
      <div className="lp-hub">
        <header className="lp-page-header">
          <div>
            <h1>Lessons</h1>
            <p>
              Browse Mark&apos;s full lesson library and work at your own pace. He can recommend lessons
              over messages — you choose what to open.
            </p>
          </div>
        </header>

        <nav className="lp-lessons-tabs" aria-label="Lesson views">
          <button
            type="button"
            className={`lp-lessons-tabs__btn${tab === 'active' ? ' is-active' : ''}`}
            onClick={() => setTab('active')}
          >
            My lessons
            {active.length > 0 ? <span className="lp-lessons-tabs__count">{active.length}</span> : null}
          </button>
          <button
            type="button"
            className={`lp-lessons-tabs__btn${tab === 'library' ? ' is-active' : ''}`}
            onClick={() => setTab('library')}
          >
            All lessons
            {library.length > 0 ? <span className="lp-lessons-tabs__count">{library.length}</span> : null}
          </button>
        </nav>

        {startError ? (
          <p className="lp-lessons-error" role="alert">
            {startError}
          </p>
        ) : null}

        {loading ? (
          <p className="lp-session-loading">Loading lessons…</p>
        ) : tab === 'library' ? (
          <section>
            {library.length === 0 ? (
              <div className="lp-empty lp-card">
                <div className="lp-empty__icon">
                  <i className="bi bi-journal-richtext" />
                </div>
                <h3>No lessons in the library yet</h3>
                <p>Mark will add lessons to the library soon. Check back or message him for guidance.</p>
                <Link to="/student/messages" className="lp-btn lp-btn--primary">
                  Message Mark
                </Link>
              </div>
            ) : (
              <div className="lp-card-grid">
                {libraryWithStatus.map(({ template, activeLesson }) => (
                  <article key={template.id} className="lp-card">
                    <h3 className="lp-card__title">{template.title}</h3>
                    {template.short_description ? (
                      <p className="lp-card__meta">{template.short_description}</p>
                    ) : null}
                    <LessonMetaBadges
                      category={template.category}
                      skillLevel={template.skill_level}
                      duration={template.estimated_duration_minutes}
                    />
                    {activeLesson ? (
                      <>
                        <p className="lp-card__meta">
                          <span className={`lp-badge lp-badge--status-${activeLesson.status}`}>
                            {statusLabel(activeLesson.status)}
                          </span>
                          {' · In progress'}
                        </p>
                        <Link
                          to={`/student/lessons/${activeLesson.id}`}
                          className="lp-btn lp-btn--primary"
                          style={{ marginTop: '0.75rem' }}
                        >
                          Continue lesson →
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="lp-btn lp-btn--primary"
                        style={{ marginTop: '0.75rem' }}
                        disabled={startingId === template.id}
                        onClick={() => handleStartLesson(template.id)}
                      >
                        {startingId === template.id ? 'Starting…' : 'Start lesson'}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section style={{ marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--lp-accent)',
                  marginBottom: '1rem',
                }}
              >
                In progress
              </h2>
              {active.length === 0 ? (
                <div className="lp-empty lp-card">
                  <div className="lp-empty__icon">
                    <i className="bi bi-music-note-beamed" />
                  </div>
                  <h3>No lessons in progress</h3>
                  <p>Pick a lesson from the full library to start practicing.</p>
                  <button type="button" className="lp-btn lp-btn--primary" onClick={() => setTab('library')}>
                    Browse all lessons
                  </button>
                </div>
              ) : (
                <div className="lp-card-grid">
                  {active.map((lesson) => (
                    <Link key={lesson.id} to={`/student/lessons/${lesson.id}`} className="lp-card lp-card--interactive">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h3 className="lp-card__title">{lesson.title}</h3>
                        <span className={`lp-badge lp-badge--status-${lesson.status}`}>
                          {statusLabel(lesson.status)}
                        </span>
                      </div>
                      {lesson.enrollment_source === 'student' ? (
                        <span className="lp-badge" style={{ marginBottom: '0.35rem' }}>
                          Self-started
                        </span>
                      ) : null}
                      {(lesson.custom_student_instructions || lesson.student_instructions) ? (
                        <p className="lp-card__meta">
                          {(lesson.custom_student_instructions || lesson.student_instructions)?.slice(0, 100)}
                          {(lesson.custom_student_instructions || lesson.student_instructions || '').length > 100
                            ? '…'
                            : ''}
                        </p>
                      ) : null}
                      <LessonMetaBadges
                        category={lesson.category}
                        skillLevel={lesson.skill_level}
                        duration={lesson.estimated_duration_minutes}
                      />
                      {lesson.due_date ? (
                        <p className="lp-card__meta">
                          Due {new Date(lesson.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      ) : null}
                      {tasksDoneForLesson(lesson.id) > 0 ? (
                        <p className="lp-card__tasks-done">
                          <i className="bi bi-check-circle-fill" aria-hidden="true" />{' '}
                          {tasksDoneForLesson(lesson.id)} task
                          {tasksDoneForLesson(lesson.id) === 1 ? '' : 's'} checked off
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
                <h2
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--lp-muted)',
                    marginBottom: '0.75rem',
                  }}
                >
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

            <section style={{ marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--lp-accent)',
                  marginBottom: '1rem',
                }}
              >
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
                        <p className="lp-card__meta" style={{ marginTop: '0.5rem' }}>
                          <strong>Practice:</strong> {note.homework_assigned}
                        </p>
                      ) : null}
                      {note.next_lesson_focus ? (
                        <p className="lp-card__meta">
                          <strong>Next focus:</strong> {note.next_lesson_focus}
                        </p>
                      ) : null}
                    </article>
                  ))
              )}
            </section>

            {(legacyAssignments.length > 0 || legacyNotes.length > 0) && (
              <section className="lp-legacy-practice">
                <h2
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--lp-muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Older practice items
                </h2>
                <p style={{ color: 'var(--lp-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  These are from the earlier practice system. New work lives in lessons above.
                </p>
                {legacyAssignments.map((a) => (
                  <article key={a.id} className="lp-card" style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.35rem' }}>{a.title}</h4>
                    {a.description ? <p className="lp-card__meta">{a.description}</p> : null}
                  </article>
                ))}
                {legacyNotes.map((note) => (
                  <article key={note.id} className="lp-card" style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.35rem' }}>{note.title}</h4>
                    {note.summary ? <p className="lp-card__meta">{note.summary}</p> : null}
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </StudentStudioLayout>
  )
}
