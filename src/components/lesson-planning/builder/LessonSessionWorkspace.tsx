import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LessonBlockRenderer from '../LessonBlockRenderer'
import { useAuthStore } from '../../../store/auth'
import {
  createSessionNote,
  fetchAssignedLesson,
  fetchAssignedLessons,
  fetchSessionNotes,
} from '../../../lib/lesson-planning-service'
import {
  displayName,
  fetchScheduledLessons,
  formatLessonTime,
  fetchTeacherStudents,
  profileFirstName,
} from '../../../lib/studio-service'
import { notifySessionNoteAdded } from '../../../lib/notify-studio'
import type { AssignedLesson, LessonSessionNote } from '../../../types/lesson-planning'
import type { ScheduledLesson, StudioStudent } from '../../../types/studio'
import '../../../lib/lesson-builder.css'
import '../../../lib/lesson-planning.css'

type SessionMobileTab = 'lessons' | 'notes' | 'student'

interface LessonSessionWorkspaceProps {
  scheduledId?: string
  initialStudentId?: string | null
  returnToStudentProfile?: boolean
  initialTeachLessonId?: string | null
}

export default function LessonSessionWorkspace({
  scheduledId,
  initialStudentId,
  returnToStudentProfile,
  initialTeachLessonId,
}: LessonSessionWorkspaceProps) {
  const navigate = useNavigate()
  const { user, userRole, userProfile } = useAuthStore()

  const [scheduled, setScheduled] = useState<ScheduledLesson | null>(null)
  const [student, setStudent] = useState<StudioStudent | null>(null)
  const [assignedLessons, setAssignedLessons] = useState<AssignedLesson[]>([])
  const [recentNotes, setRecentNotes] = useState<LessonSessionNote[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId ?? '')
  const [noteForm, setNoteForm] = useState({
    assigned_lesson_id: '',
    what_covered: '',
    what_improved: '',
    what_needs_work: '',
    teacher_private_notes: '',
    student_summary: '',
    homework_assigned: '',
    next_lesson_focus: '',
  })
  const [todayFocus, setTodayFocus] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(!!initialStudentId)
  const [teachLessonId, setTeachLessonId] = useState<string | null>(initialTeachLessonId ?? null)
  const [teachLessonFull, setTeachLessonFull] = useState<AssignedLesson | null>(null)
  const [loadingTeach, setLoadingTeach] = useState(false)
  const [mobileTab, setMobileTab] = useState<SessionMobileTab>('lessons')

  const backHref = returnToStudentProfile && selectedStudentId
    ? `/studio/students/${selectedStudentId}`
    : '/studio/lesson-planning'

  useEffect(() => {
    if (!user?.id) return
    fetchTeacherStudents(user.id, userRole).then((sList) => {
      setStudents(sList)
      if (scheduledId && scheduledId !== 'new') {
        fetchScheduledLessons(user.id, 'teacher').then((lessons) => {
          const match = lessons.find((l) => l.id === scheduledId)
          if (match) {
            setScheduled(match)
            setSelectedStudentId(match.student_id)
            setStudent(sList.find((s) => s.user_id === match.student_id) ?? null)
          }
        })
      } else if (initialStudentId) {
        setSelectedStudentId(initialStudentId)
        setStudent(sList.find((s) => s.user_id === initialStudentId) ?? null)
      }
    })
  }, [user?.id, userRole, scheduledId, initialStudentId])

  useEffect(() => {
    if (!user?.id || !selectedStudentId) {
      setLoadingLessons(false)
      return
    }
    setLoadingLessons(true)
    Promise.all([
      fetchAssignedLessons(user.id, 'teacher', { studentId: selectedStudentId }),
      fetchSessionNotes(user.id, { studentId: selectedStudentId, limit: 5 }),
    ])
      .then(([a, n]) => {
        setAssignedLessons(a.filter((l) => l.status !== 'archived' && l.status !== 'completed'))
        setRecentNotes(n)
      })
      .finally(() => setLoadingLessons(false))
  }, [user?.id, selectedStudentId])

  useEffect(() => {
    if (initialTeachLessonId && assignedLessons.some((l) => l.id === initialTeachLessonId)) {
      setTeachLessonId(initialTeachLessonId)
    }
  }, [initialTeachLessonId, assignedLessons])

  useEffect(() => {
    if (!teachLessonId) {
      setTeachLessonFull(null)
      return
    }
    const cached = assignedLessons.find((l) => l.id === teachLessonId)
    if (cached?.blocks?.length) {
      setTeachLessonFull(cached)
      return
    }
    setLoadingTeach(true)
    fetchAssignedLesson(teachLessonId)
      .then((full) => setTeachLessonFull(full))
      .finally(() => setLoadingTeach(false))
  }, [teachLessonId, assignedLessons])

  const handleSaveSessionNote = async () => {
    if (!user?.id || !selectedStudentId) return
    setSaving(true)
    try {
      await createSessionNote({
        teacher_id: user.id,
        student_id: selectedStudentId,
        assigned_lesson_id: noteForm.assigned_lesson_id || null,
        scheduled_lesson_id: scheduled?.id ?? null,
        lesson_date: new Date().toISOString().slice(0, 10),
        what_covered: noteForm.what_covered || null,
        what_improved: noteForm.what_improved || null,
        what_needs_work: noteForm.what_needs_work || null,
        teacher_private_notes: noteForm.teacher_private_notes || null,
        student_summary: noteForm.student_summary || null,
        homework_assigned: noteForm.homework_assigned || null,
        next_lesson_focus: noteForm.next_lesson_focus || null,
        resource_links: [],
      })
      const teacherLabel = displayName(userProfile) || profileFirstName(userProfile, user?.email)
      if (noteForm.student_summary || noteForm.homework_assigned) {
        await notifySessionNoteAdded(selectedStudentId, teacherLabel, new Date().toLocaleDateString())
      }
      navigate(backHref)
    } finally {
      setSaving(false)
    }
  }

  const teachLesson = teachLessonFull ?? assignedLessons.find((l) => l.id === teachLessonId)

  if (teachLessonId) {
    return (
      <div className="teach-mode">
        <header className="teach-mode__header">
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--lb-muted)', textTransform: 'uppercase' }}>
              Teach mode
            </p>
            <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.15rem' }}>{teachLesson?.title ?? 'Lesson'}</h1>
          </div>
          <button type="button" className="lesson-builder__btn" onClick={() => setTeachLessonId(null)}>
            <i className="bi bi-x-lg" /> Back
          </button>
        </header>
        <div className="teach-mode__content">
          {loadingTeach ? (
            <p className="lp-session-loading">Loading lesson…</p>
          ) : teachLesson ? (
            (teachLesson.blocks ?? []).map((block) => (
              <section key={block.id} className="teach-mode__block">
                <LessonBlockRenderer block={block} mode="teacher" />
              </section>
            ))
          ) : (
            <p className="lp-session-loading">Lesson not found.</p>
          )}
        </div>
      </div>
    )
  }

  const sessionNotesPanel = (
    <aside className="lp-session-panel lp-session-panel--notes">
      <h3>Session notes</h3>
      <p className="lp-session-panel__hint">Save what you covered today — students can see the summary and homework.</p>
      <div className="lesson-builder__field">
        <label>Related lesson</label>
        <select value={noteForm.assigned_lesson_id} onChange={(e) => setNoteForm({ ...noteForm, assigned_lesson_id: e.target.value })}>
          <option value="">None</option>
          {assignedLessons.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>
      <div className="lesson-builder__field">
        <label>Covered</label>
        <textarea rows={2} value={noteForm.what_covered} onChange={(e) => setNoteForm({ ...noteForm, what_covered: e.target.value })} />
      </div>
      <div className="lesson-builder__field">
        <label>Improved</label>
        <textarea rows={2} value={noteForm.what_improved} onChange={(e) => setNoteForm({ ...noteForm, what_improved: e.target.value })} />
      </div>
      <div className="lesson-builder__field">
        <label>Needs work</label>
        <textarea rows={2} value={noteForm.what_needs_work} onChange={(e) => setNoteForm({ ...noteForm, what_needs_work: e.target.value })} />
      </div>
      <div className="lesson-builder__field">
        <label>Student summary</label>
        <textarea rows={2} value={noteForm.student_summary} onChange={(e) => setNoteForm({ ...noteForm, student_summary: e.target.value })} />
      </div>
      <div className="lesson-builder__field">
        <label>Homework</label>
        <textarea rows={2} value={noteForm.homework_assigned} onChange={(e) => setNoteForm({ ...noteForm, homework_assigned: e.target.value })} />
      </div>
      <div className="lesson-builder__field">
        <label>Next focus</label>
        <textarea rows={2} value={noteForm.next_lesson_focus} onChange={(e) => setNoteForm({ ...noteForm, next_lesson_focus: e.target.value })} />
      </div>
      <details style={{ marginBottom: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--lb-muted)' }}>Private notes</summary>
        <div className="lesson-builder__field" style={{ marginTop: '0.5rem' }}>
          <textarea rows={2} value={noteForm.teacher_private_notes} onChange={(e) => setNoteForm({ ...noteForm, teacher_private_notes: e.target.value })} />
        </div>
      </details>
      <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" style={{ width: '100%' }} disabled={saving} onClick={handleSaveSessionNote}>
        {saving ? 'Saving…' : 'Save session notes'}
      </button>
    </aside>
  )

  const studentPanel = (
    <aside className="lp-session-panel lp-session-panel--student">
      <h3>Student</h3>
      {student ? (
        <>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem' }}>{displayName(student)}</p>
          {student.studio_profile?.skill_level ? <span className="lp-badge" style={{ marginTop: '0.5rem' }}>{student.studio_profile.skill_level}</span> : null}
          {student.studio_profile?.goals ? <p style={{ fontSize: '0.85rem', color: 'var(--lb-muted)', marginTop: '0.5rem' }}>{student.studio_profile.goals}</p> : null}
        </>
      ) : null}
      {recentNotes[0] ? (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--lb-border)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--lb-muted)', margin: '0 0 0.35rem' }}>Last session</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--lb-muted)' }}>{new Date(recentNotes[0].lesson_date).toLocaleDateString()}</p>
          {recentNotes[0].next_lesson_focus ? <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>{recentNotes[0].next_lesson_focus}</p> : null}
        </div>
      ) : null}
      {returnToStudentProfile && selectedStudentId ? (
        <Link to={`/studio/students/${selectedStudentId}`} className="lesson-builder__btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          <i className="bi bi-person" /> Student profile
        </Link>
      ) : null}
    </aside>
  )

  const lessonsPanel = (
    <main className="lp-session-canvas">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="lp-session-panel" style={{ marginBottom: '1rem' }}>
          <h3>Today&apos;s focus</h3>
          <textarea
            className="lesson-builder__field"
            style={{ width: '100%', minHeight: 72, padding: '0.65rem', borderRadius: 8, border: '1px solid var(--lb-border)', background: 'var(--lb-bg)', color: 'var(--lb-text)', fontFamily: 'inherit' }}
            value={todayFocus}
            onChange={(e) => setTodayFocus(e.target.value)}
            placeholder="What are you teaching today?"
          />
        </div>

        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lb-accent)', marginBottom: '0.75rem' }}>
          Assigned lessons
        </h3>
        {loadingLessons ? (
          <p className="lp-session-loading">Loading lessons…</p>
        ) : assignedLessons.length === 0 ? (
          <div className="lp-empty" style={{ padding: '1.5rem' }}>
            <p style={{ margin: 0 }}>No active lessons — assign one from your library.</p>
            <Link to="/studio/lesson-planning" className="lesson-builder__btn" style={{ marginTop: '0.75rem' }}>
              Lesson library
            </Link>
          </div>
        ) : (
          assignedLessons.map((a) => (
            <details key={a.id} className="lp-session-lesson-card" open={assignedLessons.length === 1}>
              <summary>{a.title}</summary>
              <div className="lp-session-lesson-card__body">
                {(a.blocks ?? []).slice(0, 3).map((b) => (
                  <LessonBlockRenderer key={b.id} block={b} mode="teacher" />
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" className="lesson-builder__btn lesson-builder__btn--teach" onClick={() => setTeachLessonId(a.id)}>
                    <i className="bi bi-bullseye" /> Teach this
                  </button>
                  <Link to={`/studio/lesson-planning/assigned/${a.id}`} className="lesson-builder__btn">
                    Customize
                  </Link>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </main>
  )

  return (
    <div className="lesson-session-workspace">
      <header className="lesson-builder__header">
        <div className="lesson-builder__header-left">
          <Link to={backHref} className="lesson-builder__back">
            <i className="bi bi-arrow-left" />
          </Link>
          <div className="lesson-builder__title-wrap">
            <h1 className="lesson-builder__title">Lesson log</h1>
            <p className="lesson-builder__meta">
              {student ? displayName(student) : 'Select a student'}
              {scheduled ? ` · ${formatLessonTime(scheduled.starts_at)}` : ''}
              {selectedStudentId && !scheduled ? ' · Teach & save session notes' : ''}
            </p>
          </div>
        </div>
        <div className="lesson-builder__header-actions">
          <Link to="/studio/schedule" className="lesson-builder__btn">
            <i className="bi bi-calendar-week" /> Schedule
          </Link>
        </div>
      </header>

      {!selectedStudentId ? (
        <div className="lesson-builder__canvas-wrap">
          <div className="lesson-builder__canvas" style={{ maxWidth: 480 }}>
            <div className="lesson-builder__canvas-empty">
              <h3>Who are you teaching?</h3>
              <p>Pick a student to open their assigned lessons and log session notes.</p>
              <div className="lesson-builder__field" style={{ textAlign: 'left', marginTop: '1rem' }}>
                <label>Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    const sid = e.target.value
                    setSelectedStudentId(sid)
                    setStudent(students.find((s) => s.user_id === sid) ?? null)
                  }}
                >
                  <option value="">Choose student</option>
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>{displayName(s)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <nav className="lp-session-mobile-tabs" aria-label="Session sections">
            <button
              type="button"
              className={`lp-session-mobile-tabs__btn${mobileTab === 'lessons' ? ' is-active' : ''}`}
              onClick={() => setMobileTab('lessons')}
            >
              Lessons
            </button>
            <button
              type="button"
              className={`lp-session-mobile-tabs__btn${mobileTab === 'notes' ? ' is-active' : ''}`}
              onClick={() => setMobileTab('notes')}
            >
              Notes
            </button>
            <button
              type="button"
              className={`lp-session-mobile-tabs__btn${mobileTab === 'student' ? ' is-active' : ''}`}
              onClick={() => setMobileTab('student')}
            >
              Student
            </button>
          </nav>

          <div className={`lesson-builder__body lp-session-body lp-session-body--${mobileTab}`}>
            <div className="lp-session-panel-slot lp-session-panel-slot--student">{studentPanel}</div>
            <div className="lp-session-panel-slot lp-session-panel-slot--lessons">{lessonsPanel}</div>
            <div className="lp-session-panel-slot lp-session-panel-slot--notes">{sessionNotesPanel}</div>
          </div>
        </>
      )}
    </div>
  )
}
