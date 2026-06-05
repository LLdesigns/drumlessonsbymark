import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import { supabase } from '../../../lib/supabase'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import {
  fetchAssignedLessonsWithBlocks,
  fetchTaskCompletionsForStudent,
  fetchTeacherStudentActivity,
} from '../../../lib/lesson-planning-service'
import { computeLessonTaskProgress } from '../../../lib/practice-task-utils'
import StudentActivityFeed from '../../../components/lesson-planning/StudentActivityFeed'
import type { PracticeTaskCompletion } from '../../../types/lesson-planning'
import type { StudentActivityEvent } from '../../../types/lesson-planning'
import {
  displayName,
  fetchLessonNotes,
  fetchPracticeAssignments,
  fetchScheduledLessons,
  fetchTeacherStudentRelation,
  setTeacherStudentArchived,
  SKILL_LEVELS,
  upsertStudentProfile,
} from '../../../lib/studio-service'
import type { AssignedLesson } from '../../../types/lesson-planning'
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
  const [assignedLessons, setAssignedLessons] = useState<AssignedLesson[]>([])
  const [taskCompletions, setTaskCompletions] = useState<PracticeTaskCompletion[]>([])
  const [activityEvents, setActivityEvents] = useState<StudentActivityEvent[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [relationStatus, setRelationStatus] = useState<'active' | 'archived'>('active')
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    if (!studentId || !user?.id) return

    const load = async () => {
      setLoading(true)
      const [pRes, spRes, rel, allLessons, allNotes, allAssignments, assigned, completions, activity] =
        await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', studentId).single(),
        supabase.from('student_profiles').select('*').eq('student_id', studentId).maybeSingle(),
        fetchTeacherStudentRelation(user.id, studentId),
        fetchScheduledLessons(user.id, 'teacher'),
        fetchLessonNotes(user.id, 'teacher'),
        fetchPracticeAssignments(user.id, 'teacher'),
        fetchAssignedLessonsWithBlocks(user.id, studentId),
        fetchTaskCompletionsForStudent(user.id, studentId),
        fetchTeacherStudentActivity(user.id, studentId, 40),
      ])

      setProfile(pRes.data ?? null)
      setRelationStatus(rel?.status ?? 'active')
      if (spRes.data) setStudioProfile(spRes.data)
      setLessons(allLessons.filter((l) => l.student_id === studentId))
      setNotes(allNotes.filter((n) => n.student_id === studentId))
      setAssignments(allAssignments.filter((a) => a.student_id === studentId))
      setAssignedLessons(assigned.sort((a, b) => a.title.localeCompare(b.title)))
      setTaskCompletions(completions)
      setActivityEvents(activity)
      setLoading(false)
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

  const studentName = profile ? displayName(profile) : 'Student'
  const sessionLogUrl = `/studio/lesson-planning/session/new?student=${studentId}&from=student`
  const isArchived = relationStatus === 'archived'

  const handleArchiveToggle = async () => {
    if (!user?.id || !studentId) return
    const archive = !isArchived
    if (
      !window.confirm(
        archive
          ? 'Archive this student? They are removed from your active roster but can still sign in.'
          : 'Restore this student to your active roster?'
      )
    ) {
      return
    }
    setArchiving(true)
    try {
      await setTeacherStudentArchived(user.id, studentId, archive)
      setRelationStatus(archive ? 'archived' : 'active')
    } catch (e) {
      console.error(e)
      window.alert('Could not update archive status. Run TEACHER_STUDENTS_ARCHIVE.sql in Supabase if needed.')
    } finally {
      setArchiving(false)
    }
  }

  if (loading || !profile) {
    return (
      <MarkStudioLayout>
        <p className="studio-subtext">{loading ? 'Loading student…' : 'Student not found.'}</p>
      </MarkStudioLayout>
    )
  }

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title={studentName}
        subtitle="Lessons they're working on (assigned or self-started) and teaching notes"
        action={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="studio-btn studio-btn--secondary"
              disabled={archiving}
              onClick={handleArchiveToggle}
            >
              <i className={`bi ${isArchived ? 'bi-arrow-counterclockwise' : 'bi-archive'}`} />
              {isArchived ? 'Restore' : 'Archive'}
            </button>
            <Link to="/studio/students" className="studio-btn studio-btn--ghost">
              ← Students
            </Link>
          </div>
        }
      />

      {isArchived ? (
        <p
          className="studio-subtext"
          style={{
            marginBottom: '1rem',
            padding: '0.65rem 1rem',
            borderRadius: 8,
            background: 'rgba(255, 193, 7, 0.12)',
            border: '1px solid rgba(255, 193, 7, 0.35)',
          }}
        >
          <i className="bi bi-archive" /> This student is archived — hidden from your active list. Restore them to
          assign new lessons from the library.
        </p>
      ) : null}

      <div className="studio-student-profile">
        <section className="studio-card studio-student-profile__lessons">
          <div className="studio-student-profile__lessons-head">
            <div>
              <h2 className="studio-student-profile__section-title">Lessons in progress</h2>
              <p className="studio-subtext">
                Assigned by you or started by {studentName} from your library. Recommend lessons via
                messages; they pick what to work on.
              </p>
            </div>
            <Link to="/studio/lesson-planning" className="studio-btn studio-btn--primary">
              <i className="bi bi-plus-lg" /> Assign lesson
            </Link>
          </div>

          {assignedLessons.length === 0 ? (
            <div className="studio-student-lesson-empty">
              <p>No lessons assigned yet.</p>
              <Link to="/studio/lesson-planning" className="studio-btn studio-btn--outline">
                Go to lesson library
              </Link>
            </div>
          ) : (
            <ul className="studio-student-lesson-list">
              {assignedLessons.map((lesson) => {
                const lessonCompletions = taskCompletions.filter((c) => c.assigned_lesson_id === lesson.id)
                const taskProgress = computeLessonTaskProgress(lesson.blocks ?? [], lessonCompletions)
                return (
                <li key={lesson.id} className="studio-student-lesson-item">
                  <div className="studio-student-lesson-item__main">
                    <p className="studio-student-lesson-item__title">{lesson.title}</p>
                    <p className="studio-subtext">
                      {statusLabel(lesson.status)}
                      {lesson.enrollment_source === 'student' ? ' · Self-started' : ' · Assigned by you'}
                      {lesson.due_date
                        ? ` · Due ${new Date(lesson.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        : ''}
                      {taskProgress.total > 0
                        ? ` · Tasks ${taskProgress.done}/${taskProgress.total}`
                        : lessonCompletions.length > 0
                          ? ` · ${lessonCompletions.length} task${lessonCompletions.length === 1 ? '' : 's'} done`
                          : ''}
                    </p>
                  </div>
                  <div className="studio-student-lesson-item__actions">
                    <Link
                      to={`/studio/lesson-planning/assigned/${lesson.id}`}
                      className="studio-btn studio-btn--outline studio-btn--sm"
                    >
                      Open
                    </Link>
                    <Link
                      to={`${sessionLogUrl}&preview=${lesson.id}`}
                      className="studio-btn studio-btn--sm"
                    >
                      <i className="bi bi-eye" /> Preview
                    </Link>
                  </div>
                </li>
              )})}
            </ul>
          )}

          <p className="studio-student-profile__session-hint">
            <Link to={sessionLogUrl}>Log session notes</Link> after a lesson (what you covered, homework,
            next focus).
          </p>
        </section>

        <section className="studio-card studio-student-profile__activity">
          <h2 className="studio-student-profile__section-title">Recent practice activity</h2>
          <p className="studio-subtext" style={{ marginTop: 0 }}>
            Logged when {studentName} opens lessons, completes tasks, watches videos, uses the sequencer, or uploads
            recordings.
          </p>
          <StudentActivityFeed events={activityEvents} lessons={assignedLessons} />
        </section>

        <details className="studio-card studio-student-profile__accordion">
          <summary>Student profile & private notes</summary>
          <div className="studio-student-profile__accordion-body">
            <div className="studio-form-stack">
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
          </div>
        </details>

        <div className="studio-student-detail-grid">
          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md">Calendar</h3>
            {lessons.length === 0 ? (
              <p className="studio-subtext">No scheduled lessons yet.</p>
            ) : (
              <ul className="studio-student-mini-list">
                {lessons.slice(0, 6).map((l) => (
                  <li key={l.id}>
                    {new Date(l.starts_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    — {l.status}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/studio/schedule" className="studio-card__link">
              Schedule →
            </Link>
          </section>

          {notes.length > 0 ? (
            <section className="studio-card">
              <h3 className="studio-heading studio-heading--md">Older notes (legacy)</h3>
              <ul className="studio-student-mini-list">
                {notes.slice(0, 4).map((n) => (
                  <li key={n.id}>{n.title}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md">Practice assignments</h3>
            {assignments.length === 0 ? (
              <p className="studio-subtext">None yet.</p>
            ) : (
              <div className="studio-student-badges">
                {assignments.map((a) => (
                  <span key={a.id} className="studio-badge">
                    {a.title} ({a.status})
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MarkStudioLayout>
  )
}
