import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import { useAuthStore } from '../../../store/auth'
import {
  fetchLessonNotes,
  fetchPracticeAssignments,
  fetchStudentMilestones,
  fetchStudioMessages,
  fetchUpcomingLessons,
  profileFirstName,
} from '../../../lib/studio-service'
import type { LessonNote, PracticeAssignment, ScheduledLesson, StudioMessage } from '../../../types/studio'

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
  const [assignments, setAssignments] = useState<PracticeAssignment[]>([])
  const [recentNotes, setRecentNotes] = useState<LessonNote[]>([])
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [milestoneCount, setMilestoneCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [lessons, practice, notes, msgs, milestones] = await Promise.all([
        fetchUpcomingLessons(user.id, 'student', 1),
        fetchPracticeAssignments(user.id, 'student'),
        fetchLessonNotes(user.id, 'student', 2),
        fetchStudioMessages(user.id),
        fetchStudentMilestones(user.id),
      ])
      setNextLesson(lessons[0] ?? null)
      setAssignments(practice.filter((a) => a.status === 'active').slice(0, 4))
      setCompletedCount(practice.filter((a) => a.status === 'completed').length)
      setRecentNotes(notes)
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

  const songsLearned = useMemo(() => {
    const songs = new Set<string>()
    assignments.forEach((a) => a.songs?.forEach((s) => songs.add(s)))
    return songs.size
  }, [assignments])

  const progressPct = assignments.length
    ? Math.round((completedCount / (completedCount + assignments.length)) * 100) || 12
    : milestoneCount > 0
      ? 72
      : 24

  const feedbackQuote = recentNotes[0]?.summary || recentNotes[0]?.practice_focus

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
        <p className="studio-page-intro__sub">Let&apos;s keep building your groove.</p>
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
          <h3 className="studio-card__title">Practice This Week</h3>
          {assignments.length === 0 ? (
            <p className="studio-subtext">You&apos;re all caught up — nice work!</p>
          ) : (
            assignments.map((a, i) => (
              <div key={a.id} style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to="/student/practice" style={{ color: 'var(--studio-text)', fontWeight: 600, textDecoration: 'none' }}>
                    {a.title}
                  </Link>
                  <span className="studio-subtext">{Math.min(i + 3, 5)}/5 days</span>
                </div>
                <div className="studio-practice-bar">
                  <div
                    className="studio-practice-bar__fill"
                    style={{ width: `${((i + 3) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Recent Feedback</h3>
          {feedbackQuote ? (
            <>
              <p className="studio-handquote">&ldquo;{feedbackQuote}&rdquo;</p>
              <cite className="studio-handquote" style={{ marginTop: '0.75rem' }}>
                — Mark
              </cite>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <div className="studio-avatar">M</div>
                <span className="studio-subtext">Mark Proctor</span>
              </div>
            </>
          ) : (
            <p className="studio-journal">Mark will share feedback after your next lesson.</p>
          )}
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Messages</h3>
          {messages.length === 0 ? (
            <p className="studio-subtext">No messages from Mark yet.</p>
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
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div
              className="studio-progress-ring"
              style={{ '--pct': progressPct } as React.CSSProperties}
            >
              <span>{progressPct}%</span>
            </div>
            <dl className="studio-progress-stats">
              <dt>Songs learned</dt>
              <dd>{songsLearned}</dd>
              <dt>Lessons done</dt>
              <dd>{milestoneCount || completedCount}</dd>
              <dt>Assignments</dt>
              <dd>{completedCount} completed</dd>
              <dt>Active practice</dt>
              <dd>{assignments.length}</dd>
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
