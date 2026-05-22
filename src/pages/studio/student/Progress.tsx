import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import {
  fetchAssignedLessons,
  fetchStudentTaskCompletions,
} from '../../../lib/lesson-planning-service'
import { useAuthStore } from '../../../store/auth'
import { supabase } from '../../../lib/supabase'
import { fetchStudentMilestones } from '../../../lib/studio-service'
import type { AssignedLesson } from '../../../types/lesson-planning'
import type { StudentMilestone, StudentProfile } from '../../../types/studio'

export default function StudentProgress() {
  const { user } = useAuthStore()
  const [milestones, setMilestones] = useState<StudentMilestone[]>([])
  const [lessons, setLessons] = useState<AssignedLesson[]>([])
  const [taskCount, setTaskCount] = useState(0)
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [m, assigned, completions] = await Promise.all([
        fetchStudentMilestones(user.id),
        fetchAssignedLessons(user.id, 'student'),
        fetchStudentTaskCompletions(user.id),
      ])
      setMilestones(m)
      setLessons(assigned)
      setTaskCount(completions.length)

      const { data: sp } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()
      setProfile(sp)
    }
    load()
  }, [user?.id])

  const completed = lessons.filter((l) => l.status === 'completed')
  const inProgress = lessons.filter((l) => l.status !== 'completed' && l.status !== 'archived')
  const selfStarted = lessons.filter((l) => l.enrollment_source === 'student')

  const streak = profile?.practice_streak ?? 0

  const categoriesWorked = useMemo(() => {
    const cats = new Set<string>()
    lessons.forEach((l) => {
      if (l.category) cats.add(l.category)
    })
    return [...cats]
  }, [lessons])

  return (
    <StudentStudioLayout>
      <StudioPageHeader
        title="Progress"
        subtitle="Lessons you've started, tasks you've checked off, and milestones along the way."
      />

      <div className="studio-grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="studio-card studio-card--accent">
          <p className="studio-label">Practice streak</p>
          <p className="studio-heading" style={{ fontSize: '2rem', color: 'var(--studio-accent)' }}>
            {streak}
          </p>
          <p className="studio-subtext">days</p>
        </div>
        <div className="studio-card">
          <p className="studio-label">Lessons completed</p>
          <p className="studio-heading" style={{ fontSize: '2rem' }}>
            {completed.length}
          </p>
        </div>
        <div className="studio-card">
          <p className="studio-label">Practice tasks done</p>
          <p className="studio-heading" style={{ fontSize: '2rem' }}>
            {taskCount}
          </p>
        </div>
      </div>

      <section className="studio-card" style={{ marginBottom: '1rem' }}>
        <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '1rem' }}>
          Lessons you&apos;re working on
        </h3>
        {inProgress.length === 0 ? (
          <p className="studio-journal">
            No active lessons yet.{' '}
            <Link to="/student/lessons?tab=library" style={{ color: 'var(--studio-accent)' }}>
              Browse the lesson library
            </Link>
            .
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {inProgress.map((l) => (
              <li
                key={l.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--studio-border)',
                }}
              >
                <Link to={`/student/lessons/${l.id}`} style={{ color: 'var(--studio-text)', fontWeight: 600 }}>
                  {l.title}
                </Link>
                <p className="studio-subtext" style={{ marginTop: '0.25rem' }}>
                  {statusLabel(l.status)}
                  {l.enrollment_source === 'student' ? ' · Self-started' : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {completed.length > 0 ? (
        <section className="studio-card" style={{ marginBottom: '1rem' }}>
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
            Completed lessons
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {completed.map((l) => (
              <li key={l.id} style={{ marginBottom: '0.35rem' }}>
                <Link to={`/student/lessons/${l.id}`} className="studio-subtext">
                  ✓ {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selfStarted.length > 0 ? (
        <section className="studio-card" style={{ marginBottom: '1rem' }}>
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
            Self-started from library
          </h3>
          <p className="studio-subtext" style={{ marginBottom: '0.75rem' }}>
            {selfStarted.length} lesson{selfStarted.length === 1 ? '' : 's'} you chose to work on.
          </p>
        </section>
      ) : null}

      {categoriesWorked.length > 0 ? (
        <section className="studio-card" style={{ marginBottom: '1rem' }}>
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
            Topics you&apos;ve explored
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categoriesWorked.map((cat) => (
              <span key={cat} className="studio-badge">
                {cat}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="studio-card">
        <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '1rem' }}>
          Milestones
        </h3>
        {milestones.length === 0 ? (
          <p className="studio-journal">Milestones will show up as you grow — keep practicing!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {milestones.map((m) => (
              <li
                key={m.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--studio-border)',
                }}
              >
                <strong>{m.title}</strong>
                {m.description ? <p className="studio-subtext">{m.description}</p> : null}
                <span className="studio-badge" style={{ marginTop: '0.35rem' }}>
                  {m.milestone_type}
                </span>
                <p className="studio-subtext" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {new Date(m.achieved_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </StudentStudioLayout>
  )
}
