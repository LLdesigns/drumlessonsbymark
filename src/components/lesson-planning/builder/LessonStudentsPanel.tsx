import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AttachLessonModal from '../AttachLessonModal'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import { fetchAssignedLessonsForTemplate, updateAssignedLesson } from '../../../lib/lesson-planning-service'
import { displayName, fetchTeacherStudents } from '../../../lib/studio-service'
import type { AssignedLesson, LessonTemplate } from '../../../types/lesson-planning'
import type { StudioStudent } from '../../../types/studio'
import type { UserProfile, UserRole } from '../../../types/user'

type StudentFilter = 'all' | 'active' | 'completed'

interface LessonStudentsPanelProps {
  templateId: string
  teacherId: string
  teacherProfile: UserProfile | null | undefined
  userRole?: UserRole | null
  template: Pick<LessonTemplate, 'id' | 'title'>
}

export default function LessonStudentsPanel({
  templateId,
  teacherId,
  teacherProfile,
  userRole,
  template,
}: LessonStudentsPanelProps) {
  const navigate = useNavigate()
  const [assigned, setAssigned] = useState<AssignedLesson[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [filter, setFilter] = useState<StudentFilter>('all')
  const [showAttach, setShowAttach] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [rows, sList] = await Promise.all([
      fetchAssignedLessonsForTemplate(teacherId, templateId),
      fetchTeacherStudents(teacherId, userRole),
    ])
    setAssigned(rows)
    setStudents(sList)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [templateId, teacherId])

  const studentMap = useMemo(() => new Map(students.map((s) => [s.user_id, s])), [students])

  const filtered = useMemo(() => {
    if (filter === 'completed') return assigned.filter((a) => a.status === 'completed')
    if (filter === 'active') return assigned.filter((a) => a.status !== 'completed' && a.status !== 'archived')
    return assigned.filter((a) => a.status !== 'archived')
  }, [assigned, filter])

  const stats = useMemo(() => {
    const active = assigned.filter((a) => a.status !== 'archived' && a.status !== 'completed')
    const completed = assigned.filter((a) => a.status === 'completed')
    return { assigned: assigned.filter((a) => a.status !== 'archived').length, active: active.length, completed: completed.length }
  }, [assigned])

  if (loading) {
    return <p style={{ color: 'var(--lb-muted)', padding: '2rem' }}>Loading students…</p>
  }

  return (
    <div className="lesson-students-panel">
      <div className="lesson-students-panel__stats">
        <div className="lesson-students-stat">
          <strong>{stats.assigned}</strong>
          <span>Assigned</span>
        </div>
        <div className="lesson-students-stat">
          <strong>{stats.active}</strong>
          <span>In progress</span>
        </div>
        <div className="lesson-students-stat lesson-students-stat--highlight">
          <strong>{stats.completed}</strong>
          <span>Completed</span>
        </div>
      </div>

      <div className="lesson-students-panel__toolbar">
        <div className="lesson-page-tabs" role="tablist">
          {(
            [
              ['all', 'All'],
              ['active', 'In progress'],
              ['completed', 'Completed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" onClick={() => setShowAttach(true)}>
          <i className="bi bi-person-plus" /> Assign students
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="lesson-builder__canvas-empty" style={{ marginTop: '1rem' }}>
          <h3>
            {filter === 'completed' ? 'No completions yet' : 'No students assigned'}
          </h3>
          <p>
            {filter === 'completed'
              ? 'When students finish this lesson, they will show up here.'
              : 'Assign this lesson to students so they can practice between sessions.'}
          </p>
          {filter !== 'completed' ? (
            <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" onClick={() => setShowAttach(true)}>
              Assign students
            </button>
          ) : null}
        </div>
      ) : (
        <div className="lesson-students-table-wrap">
          <table className="lesson-students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Due</th>
                <th>Completed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const student = studentMap.get(row.student_id)
                return (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/studio/students/${row.student_id}`} className="lesson-students-table__name">
                        {displayName(student)}
                      </Link>
                    </td>
                    <td>
                      <span className={`lp-badge lp-badge--status-${row.status}`}>{statusLabel(row.status)}</span>
                    </td>
                    <td>{new Date(row.assigned_at).toLocaleDateString()}</td>
                    <td>{row.due_date ? new Date(row.due_date).toLocaleDateString() : '—'}</td>
                    <td>{row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="lesson-students-table__actions">
                        <button
                          type="button"
                          className="lesson-builder__btn lesson-builder__btn--ghost"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/studio/lesson-planning/assigned/${row.id}`)}
                        >
                          Customize
                        </button>
                        <select
                          value={row.status}
                          onChange={async (e) => {
                            const status = e.target.value as AssignedLesson['status']
                            await updateAssignedLesson(row.id, {
                              status,
                              completed_at: status === 'completed' ? new Date().toISOString() : null,
                            })
                            load()
                          }}
                          style={{
                            padding: '0.25rem 0.4rem',
                            fontSize: '0.75rem',
                            borderRadius: 6,
                            border: '1px solid var(--lb-border)',
                            background: 'var(--lb-bg)',
                            color: 'var(--lb-text)',
                          }}
                        >
                          <option value="not_started">Not started</option>
                          <option value="in_progress">In progress</option>
                          <option value="needs_review">Needs review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAttach ? (
        <AttachLessonModal
          template={template as LessonTemplate}
          students={students}
          teacherId={teacherId}
          teacherProfile={teacherProfile}
          onClose={() => setShowAttach(false)}
          onAttached={load}
        />
      ) : null}
    </div>
  )
}
