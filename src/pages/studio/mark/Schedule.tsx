import { useEffect, useState } from 'react'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import StudioScheduleView from '../../../components/studio/StudioScheduleView'
import { useAuthStore } from '../../../store/auth'
import {
  createScheduledLesson,
  displayName,
  fetchScheduledLessons,
  fetchTeacherStudents,
  profileFirstName,
  updateScheduledLesson,
} from '../../../lib/studio-service'
import { notifyScheduleChanged } from '../../../lib/notify-studio'
import type { ScheduledLesson, StudioStudent } from '../../../types/studio'

export default function MarkSchedule() {
  const { user, userRole, userProfile } = useAuthStore()
  const [lessons, setLessons] = useState<ScheduledLesson[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    starts_at: '',
    duration_minutes: 60,
    location: '',
    is_recurring: false,
    recurrence_rule: '',
  })
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    if (!user?.id) return
    const [l, s] = await Promise.all([
      fetchScheduledLessons(user.id, 'teacher'),
      fetchTeacherStudents(user.id, userRole),
    ])
    setLessons(l)
    setStudents(s)
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [user?.id])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !form.student_id || !form.starts_at) return
    await createScheduledLesson({
      teacher_id: user.id,
      student_id: form.student_id,
      starts_at: new Date(form.starts_at).toISOString(),
      duration_minutes: form.duration_minutes,
      status: 'scheduled',
      location: form.location || null,
      is_recurring: form.is_recurring,
      recurrence_rule: form.is_recurring ? form.recurrence_rule || 'weekly' : null,
      notes: null,
      cancelled_at: null,
      rescheduled_from_id: null,
    })
    const timeLabel = new Date(form.starts_at).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    await notifyScheduleChanged(
      form.student_id,
      'New lesson scheduled',
      `${displayName(userProfile) || profileFirstName(userProfile, user?.email)} scheduled a lesson for ${timeLabel}.`,
      'student'
    )
    setShowForm(false)
    setForm({
      student_id: '',
      starts_at: '',
      duration_minutes: 60,
      location: '',
      is_recurring: false,
      recurrence_rule: '',
    })
    reload()
  }

  const handleCancel = async (id: string) => {
    const lesson = lessons.find((l) => l.id === id)
    await updateScheduledLesson(id, { status: 'cancelled', cancelled_at: new Date().toISOString() })
    if (lesson) {
      await notifyScheduleChanged(
        lesson.student_id,
        'Lesson cancelled',
        `Your lesson on ${new Date(lesson.starts_at).toLocaleString()} was cancelled.`,
        'student'
      )
    }
    reload()
  }

  const handleReschedule = async (id: string, newStartsAtIso: string) => {
    const lesson = lessons.find((l) => l.id === id)
    await updateScheduledLesson(id, {
      starts_at: newStartsAtIso,
      status: 'rescheduled',
    })
    if (lesson) {
      const timeLabel = new Date(newStartsAtIso).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
      await notifyScheduleChanged(
        lesson.student_id,
        'Lesson rescheduled',
        `Your lesson was moved to ${timeLabel}.`,
        'student'
      )
    }
    reload()
  }

  const handleComplete = async (id: string) => {
    await updateScheduledLesson(id, { status: 'completed' })
    reload()
  }

  const handleScheduleDay = (startsAtLocal: string) => {
    setForm((f) => ({ ...f, starts_at: startsAtLocal }))
    setShowForm(true)
  }

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title="Schedule"
        subtitle="Tap a day to schedule, or a lesson to view details — calendar and list views."
        action={
          <button type="button" className="studio-btn studio-btn--primary" onClick={() => setShowForm(!showForm)}>
            <i className="bi bi-plus-lg" /> New lesson
          </button>
        }
      />

      {showForm ? (
        <form className="studio-card studio-schedule-create" onSubmit={handleCreate} style={{ marginBottom: '1.25rem' }}>
          <div className="studio-grid-2">
            <label>
              <span className="studio-label">Student</span>
              <select
                className="studio-select"
                required
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              >
                <option value="">Choose student</option>
                {students.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {displayName(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="studio-label">Date & time</span>
              <input
                className="studio-input"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </label>
            <label>
              <span className="studio-label">Duration (minutes)</span>
              <input
                className="studio-input"
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              />
            </label>
            <label>
              <span className="studio-label">Location</span>
              <input
                className="studio-input"
                placeholder="Studio, online, etc."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
            />
            <span className="studio-subtext">Recurring lesson</span>
          </label>
          {form.is_recurring ? (
            <input
              className="studio-input"
              style={{ marginTop: '0.5rem' }}
              placeholder="e.g. weekly on Tuesdays"
              value={form.recurrence_rule}
              onChange={(e) => setForm({ ...form, recurrence_rule: e.target.value })}
            />
          ) : null}
          <div className="studio-form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="studio-btn studio-btn--primary">
              Save lesson
            </button>
            <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <StudioScheduleView
        lessons={lessons}
        loading={loading}
        variant="teacher"
        getLessonLabel={(lesson) => ({
          lesson,
          primary: displayName(students.find((s) => s.user_id === lesson.student_id)),
        })}
        onScheduleDay={handleScheduleDay}
        onCancelLesson={handleCancel}
        onRescheduleLesson={handleReschedule}
        onCompleteLesson={handleComplete}
        emptyHint="Your calendar is open — click a day to add a lesson."
      />
    </MarkStudioLayout>
  )
}
