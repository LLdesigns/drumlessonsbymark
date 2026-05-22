import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioAvatar from '../../../components/studio/StudioAvatar'
import { useAuthStore } from '../../../store/auth'
import {
  displayName,
  fetchLessonNotes,
  fetchPracticeAssignments,
  fetchScheduledLessons,
  fetchStudioMessages,
  fetchTeacherStudents,
  profileFirstName,
} from '../../../lib/studio-service'
import type { LessonNote, PracticeAssignment, ScheduledLesson, StudioMessage, StudioStudent } from '../../../types/studio'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatSkill(level?: string | null) {
  if (!level) return null
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export default function MarkDashboard() {
  const { user, userRole, userProfile } = useAuthStore()
  const [todayLessons, setTodayLessons] = useState<ScheduledLesson[]>([])
  const [weekLessons, setWeekLessons] = useState<ScheduledLesson[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [practiceUpdates, setPracticeUpdates] = useState<PracticeAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const studentMap = useMemo(() => {
    const m = new Map<string, StudioStudent>()
    students.forEach((s) => m.set(s.user_id, s))
    return m
  }, [students])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [allLessons, s, m, n, p] = await Promise.all([
          fetchScheduledLessons(user.id, 'teacher'),
          fetchTeacherStudents(user.id, userRole),
          fetchStudioMessages(user.id),
          fetchLessonNotes(user.id, 'teacher', 6),
          fetchPracticeAssignments(user.id, 'teacher'),
        ])
        const now = new Date()
        const todayStr = now.toDateString()
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const upcoming = allLessons.filter(
          (l) => l.status !== 'cancelled' && new Date(l.starts_at) >= now
        )
        setTodayLessons(
          upcoming.filter((l) => new Date(l.starts_at).toDateString() === todayStr)
        )
        setWeekLessons(
          upcoming
            .filter((l) => {
              const d = new Date(l.starts_at)
              return d > now && d <= weekEnd
            })
            .slice(0, 6)
        )
        setStudents(s)
        setMessages(
          [...m]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)
        )
        setNotes(n)
        setPracticeUpdates(p.filter((a) => a.status === 'active').slice(0, 4))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, userRole])

  const firstName = profileFirstName(userProfile, user?.email)

  if (loading) {
    return (
      <MarkStudioLayout>
        <div className="studio-page-intro">
          <h1 className="studio-page-intro__title">Welcome back, {firstName} 🤘</h1>
          <p className="studio-page-intro__sub">Loading your studio…</p>
        </div>
      </MarkStudioLayout>
    )
  }

  return (
    <MarkStudioLayout>
      <div className="studio-page-intro">
        <div className="studio-page-intro__row">
          <div>
            <h1 className="studio-page-intro__title">Welcome back, {firstName} 🤘</h1>
            <p className="studio-page-intro__sub">Here&apos;s what&apos;s happening in your studio today.</p>
          </div>
          <Link to="/studio/lesson-notes" className="studio-btn studio-btn--outline">
            <i className="bi bi-plus-lg" /> New Note
          </Link>
        </div>
      </div>

      <div className="studio-dash-grid studio-dash-grid--mark">
        <section className="studio-card">
          <h3 className="studio-card__title">Today&apos;s Lessons</h3>
          {todayLessons.length === 0 ? (
            <p className="studio-journal">No lessons on the calendar for today.</p>
          ) : (
            todayLessons.map((lesson) => {
              const student = studentMap.get(lesson.student_id)
              return (
                <div key={lesson.id} className="studio-row">
                  <StudioAvatar profile={student} />
                  <div className="studio-row__body">
                    <p className="studio-row__title">{displayName(student)}</p>
                    <p className="studio-row__meta">
                      {formatSkill(student?.studio_profile?.skill_level) ?? 'Student'}
                      {' · '}
                      {lesson.duration_minutes} min
                    </p>
                  </div>
                  <span className="studio-row__time">
                    {new Date(lesson.starts_at).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )
            })
          )}
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Upcoming This Week</h3>
          {weekLessons.length === 0 ? (
            <p className="studio-subtext">Nothing else scheduled this week.</p>
          ) : (
            weekLessons.map((lesson) => {
              const student = studentMap.get(lesson.student_id)
              const d = new Date(lesson.starts_at)
              return (
                <div key={lesson.id} className="studio-row">
                  <div className="studio-row__body">
                    <p className="studio-row__title">
                      {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="studio-row__meta">{displayName(student)}</p>
                  </div>
                </div>
              )
            })
          )}
          <Link to="/studio/schedule" className="studio-card__link" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Full schedule →
          </Link>
        </section>
      </div>

      <div className="studio-dash-grid studio-dash-grid--mark-bottom">
        <section className="studio-card">
          <h3 className="studio-card__title">Recent Messages</h3>
          {messages.length === 0 ? (
            <p className="studio-subtext">No messages yet.</p>
          ) : (
            messages.map((m) => {
              const otherId = m.sender_id === user?.id ? m.recipient_id : m.sender_id
              const other = studentMap.get(otherId)
              return (
                <div key={m.id} className="studio-row">
                  <StudioAvatar profile={other} />
                  <div className="studio-row__body">
                    <p className="studio-row__title">{displayName(other)}</p>
                    <p className="studio-row__meta">
                      {m.body.slice(0, 60)}
                      {m.body.length > 60 ? '…' : ''}
                    </p>
                  </div>
                  <span className="studio-row__time">{relativeTime(m.created_at)}</span>
                </div>
              )
            })
          )}
          <Link to="/studio/messages" className="studio-card__link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            All messages →
          </Link>
        </section>

        <section className="studio-card">
          <h3 className="studio-card__title">Practice Updates</h3>
          {practiceUpdates.length === 0 ? (
            <p className="studio-subtext">Student practice activity will show up here.</p>
          ) : (
            practiceUpdates.map((a) => {
              const student = studentMap.get(a.student_id)
              return (
                <div key={a.id} className="studio-row">
                  <StudioAvatar profile={student} />
                  <div className="studio-row__body">
                    <p className="studio-row__title">{displayName(student)}</p>
                    <p className="studio-row__meta">Active assignment: {a.title}</p>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </div>

      <section className="studio-card studio-dash-full">
        <h3 className="studio-card__title">Recent Lesson Notes</h3>
        {notes.length === 0 ? (
          <p className="studio-journal">After your next lesson, capture what you worked on.</p>
        ) : (
          notes.map((n) => {
            const student = studentMap.get(n.student_id)
            return (
              <div key={n.id} className="studio-row">
                <div className="studio-row__body">
                  <p className="studio-row__title">
                    {displayName(student)} — {n.title}
                  </p>
                  <p className="studio-row__meta">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {n.summary ? ` · ${n.summary.slice(0, 90)}${n.summary.length > 90 ? '…' : ''}` : ''}
                  </p>
                </div>
                <Link to="/studio/lesson-notes" className="studio-card__link">
                  View
                </Link>
              </div>
            )
          })
        )}
      </section>
    </MarkStudioLayout>
  )
}
