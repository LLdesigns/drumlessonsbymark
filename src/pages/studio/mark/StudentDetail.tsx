import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import { supabase } from '../../../lib/supabase'
import {
  displayName,
  fetchLessonNotes,
  fetchPracticeAssignments,
  fetchScheduledLessons,
  SKILL_LEVELS,
  upsertStudentProfile,
} from '../../../lib/studio-service'
import type { LessonNote, PracticeAssignment, ScheduledLesson, SkillLevel, StudentProfile } from '../../../types/studio'
import type { UserProfile } from '../../../types/user'
import '../../../lib/lesson-planning.css'

export default function MarkStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [studioProfile, setStudioProfile] = useState<Partial<StudentProfile>>({})
  const [lessons, setLessons] = useState<ScheduledLesson[]>([])
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [assignments, setAssignments] = useState<PracticeAssignment[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!studentId || !user?.id) return

    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', studentId).single()
      setProfile(p)

      const { data: sp } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle()

      if (sp) setStudioProfile(sp)

      const allLessons = await fetchScheduledLessons(user.id, 'teacher')
      setLessons(allLessons.filter((l) => l.student_id === studentId))

      const allNotes = await fetchLessonNotes(user.id, 'teacher')
      setNotes(allNotes.filter((n) => n.student_id === studentId))

      const allAssignments = await fetchPracticeAssignments(user.id, 'teacher')
      setAssignments(allAssignments.filter((a) => a.student_id === studentId))
    }

    load()
  }, [studentId, user?.id])

  const handleSave = async () => {
    if (!user?.id || !studentId) return
    setSaving(true)
    setSaved(false)
    try {
      const savedProfile = await upsertStudentProfile(user.id, studentId, studioProfile)
      setStudioProfile(savedProfile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <MarkStudioLayout>
        <p className="studio-subtext">Loading student...</p>
      </MarkStudioLayout>
    )
  }

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title={displayName(profile)}
        subtitle="Teaching notebook"
        action={
          <Link to="/studio/students" className="studio-btn studio-btn--ghost">
            ← Back
          </Link>
        }
      />

      <div className="studio-grid-2">
        <section className="studio-card">
          <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '1rem' }}>
            Student profile
          </h3>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <label>
              <span className="studio-label">Age</span>
              <input
                className="studio-input"
                type="number"
                value={studioProfile.age ?? ''}
                onChange={(e) =>
                  setStudioProfile({ ...studioProfile, age: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
            <label>
              <span className="studio-label">Skill level</span>
              <select
                className="studio-select"
                value={studioProfile.skill_level ?? ''}
                onChange={(e) =>
                  setStudioProfile({
                    ...studioProfile,
                    skill_level: (e.target.value as SkillLevel) || null,
                  })
                }
              >
                <option value="">Select level</option>
                {SKILL_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="studio-label">Favorite music / bands</span>
              <input
                className="studio-input"
                value={studioProfile.favorite_music ?? ''}
                onChange={(e) => setStudioProfile({ ...studioProfile, favorite_music: e.target.value })}
              />
            </label>
            <label>
              <span className="studio-label">Goals</span>
              <textarea
                className="studio-textarea"
                value={studioProfile.goals ?? ''}
                onChange={(e) => setStudioProfile({ ...studioProfile, goals: e.target.value })}
              />
            </label>
            <label>
              <span className="studio-label">Private notes (only you see these)</span>
              <textarea
                className="studio-textarea"
                value={studioProfile.private_notes ?? ''}
                onChange={(e) => setStudioProfile({ ...studioProfile, private_notes: e.target.value })}
              />
            </label>
            <button type="button" className="studio-btn studio-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
            </button>
          </div>
        </section>

        <div className="studio-student-detail-grid">
          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
              Lesson history
            </h3>
            {lessons.length === 0 ? (
              <p className="studio-subtext">No lessons scheduled yet.</p>
            ) : (
              lessons.slice(0, 6).map((l) => (
                <p key={l.id} className="studio-subtext" style={{ marginBottom: '0.35rem' }}>
                  {new Date(l.starts_at).toLocaleDateString()} — {l.status}
                </p>
              ))
            )}
          </section>

          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
              Lesson notes
            </h3>
            {notes.length === 0 ? (
              <p className="studio-subtext">No notes yet.</p>
            ) : (
              notes.slice(0, 4).map((n) => (
                <p key={n.id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{n.title}</strong>
                </p>
              ))
            )}
            <Link
              to="/studio/lesson-planning"
              style={{ color: 'var(--studio-accent)', fontSize: '0.85rem' }}
            >
              Assign from library →
            </Link>
          </section>

          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
              Lesson plans
            </h3>
            <p className="studio-subtext" style={{ marginBottom: '0.5rem' }}>
              Assign and customize lessons for {displayName(profile)}.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/studio/lesson-planning" className="lp-btn lp-btn--sm">
                Lesson library
              </Link>
              <Link to={`/studio/lesson-planning/session/new?student=${studentId}`} className="lp-btn lp-btn--primary lp-btn--sm">
                <i className="bi bi-bullseye" /> Session
              </Link>
            </div>
          </section>

          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
              Assignments
            </h3>
            {assignments.length === 0 ? (
              <p className="studio-subtext">No practice assignments yet.</p>
            ) : (
              assignments.map((a) => (
                <span key={a.id} className="studio-badge" style={{ marginRight: '0.5rem', marginBottom: '0.35rem' }}>
                  {a.title} ({a.status})
                </span>
              ))
            )}
          </section>
        </div>
      </div>
    </MarkStudioLayout>
  )
}
