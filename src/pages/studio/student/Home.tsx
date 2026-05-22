import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import { useAuthStore } from '../../../store/auth'
import {
  fetchAssignedLessons,
  fetchStudentSessionNotes,
  fetchStudentTaskCompletions,
} from '../../../lib/lesson-planning-service'
import {
  fetchStudioMessages,
  fetchStudentMilestones,
  fetchUpcomingLessons,
  profileFirstName,
} from '../../../lib/studio-service'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import type { AssignedLesson, LessonSessionNote } from '../../../types/lesson-planning'
import type { ScheduledLesson, StudioMessage } from '../../../types/studio'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StudentHome() {
  const { user, userProfile } = useAuthStore()
  const [nextLesson, setNextLesson] = useState<ScheduledLesson | null>(null)
  const [activeLessons, setActiveLessons] = useState<AssignedLesson[]>([])
  const [sessionNotes, setSessionNotes] = useState<LessonSessionNote[]>([])
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [taskCount, setTaskCount] = useState(0)
  const [completedLessonCount, setCompletedLessonCount] = useState(0)
  const [milestoneCount, setMilestoneCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [lessons, scheduled, notes, msgs, milestones, completions] = await Promise.all([
        fetchAssignedLessons(user.id, 'student'),
        fetchUpcomingLessons(user.id, 'student', 1),
        fetchStudentSessionNotes(user.id),
        fetchStudioMessages(user.id),
        fetchStudentMilestones(user.id),
        fetchStudentTaskCompletions(user.id),
      ])
      setNextLesson(scheduled[0] ?? null)
      setActiveLessons(
        lessons.filter((l) => l.status !== 'completed' && l.status !== 'archived').slice(0, 4)
      )
      setCompletedLessonCount(lessons.filter((l) => l.status === 'completed').length)
      setSessionNotes(notes.filter((n) => n.student_summary || n.homework_assigned).slice(0, 1))
      setTaskCount(completions.length)
      setMilestoneCount(milestones.length)
      const incoming = msgs.filter((m) => m.recipient_id === user.id)
      setMessages(
        [...incoming]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
      )
    }
    load()
  }, [user?.id])

  const firstName = profileFirstName(userProfile, user?.email)

  const progressPct = useMemo(() => {
    const total = activeLessons.length + completedLessonCount
    if (total === 0) return milestoneCount > 0 ? 40 : 12
    return Math.round((completedLessonCount / total) * 100) || 15
  }, [activeLessons.length, completedLessonCount, milestoneCount])

  const feedbackQuote = sessionNotes[0]?.student_summary || sessionNotes[0]?.homework_assigned

  const lessonDate = nextLesson
    ? new Date(nextLesson.starts_at).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null
  const lessonTime = nextLesson
    ? new Date(nextLesson.starts_at).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <StudentStudioLayout>
      <div className="studio-page-intro">
        <h1 className="studio-page-intro__title">Hey {firstName}! 👋</h1>
        <p className="studio-page-intro__sub">Pick a lesson from the library and keep building your groove.</p>
      </div>

      <div className="studio-student-hero">
        <section className="studio-card">
          <h3 className="studio-card__title">Next Lesson</h3>
          {nextLesson ? (
            <>
              <p className="studio-heading" style={{ fontSize: '1.35rem', color: 'var(--studio-accent)' }}>
                {lessonDate}
              </p>
              <p className="studio-subtext" style={{ marginTop: '0.35rem' }}>
                {lessonTime} · {nextLesson.duration_minutes} minutes
              </p>
            </>
          ) : (
            <p className="studio-journal">No lesson scheduled yet — Mark will get you on the calendar soon.</p>
          )}
          <Link to="/student/schedule" className="studio-btn studio-btn--primary" style={{ marginTop: '1rem' }}>
            View Full Schedule
          </Link>
        </section>
        <div className="studio-hero-img" aria-hidden="true" />
      </div>

      <div className="studio-student-grid">
        <section className="studio-card">
          <h3 className="studio-card__title">Lessons in progress</h3>
          {activeLessons.length === 0 ? (
            <>
              <p className="studio-subtext">Browse Mark&apos;s full lesson library and start one when you&apos;re ready.</p>
              <Link to="/student/lessons?tab=library" className="studio-btn studio-btn--primary" style={{ marginTop: '0.75rem' }}>
                Browse all lessons
              </Link>
            </>
          ) : (
            activeLessons.map((a) => (
              <div key={a.id} style={{ marginBottom: '0.85rem' }}>
                <Link
                  to={`/student/lessons/${a.id}`}
                  style={{ color: 'var(--studio-text)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {a.title}
                </Link>
                <p className="studio-subtext" style={{ marginTop: '0.2rem' }}>
                  {statusLabel(a.status)}
                </p>
              </div>
            ))
          )}
          <Link to="/student/lessons" className="studio-card__link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            All lessons →
          </Link>
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Recent Feedback</h3>
          {feedbackQuote ? (
            <>
              <p className="studio-handquote">&ldquo;{feedbackQuote}&rdquo;</p>
              <cite className="studio-handquote" style={{ marginTop: '0.75rem' }}>
                — Mark
              </cite>
            </>
          ) : (
            <p className="studio-journal">Session notes from Mark will show up here after lessons.</p>
          )}
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Messages</h3>
          {messages.length === 0 ? (
            <p className="studio-subtext">Message Mark for lesson recommendations.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="studio-row">
                <div className="studio-avatar">M</div>
                <div className="studio-row__body">
                  <p className="studio-row__title">Mark</p>
                  <p className="studio-row__meta">
                    {m.body.slice(0, 50)}
                    {m.body.length > 50 ? '…' : ''}
                  </p>
                </div>
                <span className="studio-row__time">{relativeTime(m.created_at)}</span>
              </div>
            ))
          )}
          <Link to="/student/messages" className="studio-card__link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            Open messages →
          </Link>
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Your Progress</h3>
          <div className="studio-handquote-row" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div className="studio-progress-ring" style={{ '--pct': progressPct } as React.CSSProperties}>
              <span>{progressPct}%</span>
            </div>
            <dl className="studio-progress-stats">
              <dt>Lessons completed</dt>
              <dd>{completedLessonCount}</dd>
              <dt>Tasks checked off</dt>
              <dd>{taskCount}</dd>
              <dt>In progress</dt>
              <dd>{activeLessons.length}</dd>
              <dt>Milestones</dt>
              <dd>{milestoneCount}</dd>
            </dl>
          </div>
          <Link to="/student/progress" className="studio-card__link" style={{ marginTop: '1rem', display: 'inline-block' }}>
            See all progress →
          </Link>
        </section>
      </div>

      <section className="studio-card studio-motivation">
        <div>
          <p className="studio-handquote" style={{ fontSize: '1.5rem' }}>
            Keep it up! Every session behind the kit builds muscle memory and confidence.
          </p>
        </div>
        <img src="/markDrumming.png" alt="" className="studio-motivation__img" />
      </section>
    </StudentStudioLayout>
  )
}
