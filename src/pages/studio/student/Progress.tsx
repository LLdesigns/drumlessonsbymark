import { useEffect, useState } from 'react'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import { supabase } from '../../../lib/supabase'
import {
  fetchPracticeAssignments,
  fetchStudentMilestones,
} from '../../../lib/studio-service'
import type { PracticeAssignment, StudentMilestone, StudentProfile } from '../../../types/studio'

export default function StudentProgress() {
  const { user } = useAuthStore()
  const [milestones, setMilestones] = useState<StudentMilestone[]>([])
  const [assignments, setAssignments] = useState<PracticeAssignment[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [m, a] = await Promise.all([
        fetchStudentMilestones(user.id),
        fetchPracticeAssignments(user.id, 'student'),
      ])
      setMilestones(m)
      setAssignments(a)

      const { data: sp } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()
      setProfile(sp)
    }
    load()
  }, [user?.id])

  const completedSongs = assignments
    .filter((a) => a.status === 'completed')
    .flatMap((a) => a.songs ?? [])
    .filter((s, i, arr) => arr.indexOf(s) === i)

  const streak = profile?.practice_streak ?? 0

  return (
    <StudentStudioLayout>
      <StudioPageHeader
        title="Progress"
        subtitle="A quiet look at how far you've come — no gimmicks, just real milestones."
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
          <p className="studio-label">Completed assignments</p>
          <p className="studio-heading" style={{ fontSize: '2rem' }}>
            {assignments.filter((a) => a.status === 'completed').length}
          </p>
        </div>
        <div className="studio-card">
          <p className="studio-label">Songs learned</p>
          <p className="studio-heading" style={{ fontSize: '2rem' }}>
            {completedSongs.length}
          </p>
        </div>
      </div>

      <section className="studio-card" style={{ marginBottom: '1rem' }}>
        <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '1rem' }}>
          Milestones
        </h3>
        {milestones.length === 0 ? (
          <p className="studio-journal">
            Your journey is just getting started — milestones will show up as you grow.
          </p>
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

      {completedSongs.length > 0 ? (
        <section className="studio-card">
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
            Songs you&apos;ve worked through
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {completedSongs.map((song) => (
              <span key={song} className="studio-badge">
                🎵 {song}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </StudentStudioLayout>
  )
}
