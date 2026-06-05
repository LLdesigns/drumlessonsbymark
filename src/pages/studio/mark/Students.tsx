import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import AddStudentModal from '../../../components/studio/AddStudentModal'
import AddTeacherModal from '../../../components/studio/AddTeacherModal'
import { useAuthStore } from '../../../store/auth'
import {
  displayName,
  fetchTeacherStudents,
  setTeacherStudentArchived,
  type TeacherStudentListFilter,
} from '../../../lib/studio-service'
import type { StudioStudent } from '../../../types/studio'

export default function MarkStudents() {
  const { user, userRole } = useAuthStore()
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [listFilter, setListFilter] = useState<TeacherStudentListFilter>('active')
  const [addOpen, setAddOpen] = useState(false)
  const [addTeacherOpen, setAddTeacherOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const isAdmin = userRole === 'admin'
  const showArchived = listFilter === 'archived'

  const loadStudents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const list = await fetchTeacherStudents(user.id, userRole, { filter: listFilter })
      setStudents(list)
    } finally {
      setLoading(false)
    }
  }, [user?.id, userRole, listFilter])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const handleArchiveToggle = async (studentId: string, archive: boolean) => {
    if (!user?.id) return
    const label = archive ? 'archive' : 'restore'
    if (!window.confirm(archive ? 'Archive this student? They stay off your active roster but can still sign in.' : 'Restore this student to your active roster?')) {
      return
    }
    setBusyId(studentId)
    try {
      await setTeacherStudentArchived(user.id, studentId, archive)
      await loadStudents()
    } catch (e) {
      console.error(e)
      window.alert(`Could not ${label} student. If this is new, run TEACHER_STUDENTS_ARCHIVE.sql in Supabase.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title="Students"
        subtitle="Your teaching notebook — add students, track goals, and open their studio profile."
        action={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {isAdmin ? (
              <button
                type="button"
                className="studio-btn studio-btn--secondary"
                onClick={() => setAddTeacherOpen(true)}
              >
                <i className="bi bi-person-badge" /> Add teacher
              </button>
            ) : null}
            <button
              type="button"
              className="studio-btn studio-btn--primary"
              onClick={() => setAddOpen(true)}
            >
              <i className="bi bi-person-plus" /> Add student
            </button>
          </div>
        }
      />

      <p className="studio-subtext" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
        Signed in as <strong>{user?.email}</strong>
        {userRole ? (
          <>
            {' '}
            · app role: <strong>{userRole}</strong>
          </>
        ) : (
          <>
            {' '}
            · <span style={{ color: '#e57373' }}>
              app could not read your role (check profiles row matches this auth user id). Sign out and back in after
              fixing SQL.
            </span>
          </>
        )}
        {isAdmin ? (
          <>
            {' '}
            — use <strong>Add teacher</strong> for Mark&apos;s studio login; <strong>Add student</strong> for drum students
            only.
          </>
        ) : userRole === 'teacher' ? (
          <> — use <strong>Add student</strong> for new students. Only admins can add teachers.</>
        ) : null}
      </p>

      <div
        className="studio-segmented"
        role="tablist"
        aria-label="Student list"
        style={{ marginBottom: '1.25rem', display: 'inline-flex', gap: '0.25rem' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={listFilter === 'active'}
          className={`studio-btn studio-btn--sm ${listFilter === 'active' ? 'studio-btn--primary' : 'studio-btn--ghost'}`}
          onClick={() => setListFilter('active')}
        >
          Active
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={listFilter === 'archived'}
          className={`studio-btn studio-btn--sm ${listFilter === 'archived' ? 'studio-btn--primary' : 'studio-btn--ghost'}`}
          onClick={() => setListFilter('archived')}
        >
          Archived
        </button>
      </div>

      {loading ? (
        <p className="studio-subtext">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="studio-card studio-empty" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <i
            className={`bi ${showArchived ? 'bi-archive' : 'bi-people'}`}
            style={{ fontSize: '2.5rem', color: 'var(--studio-accent)', marginBottom: '1rem' }}
            aria-hidden
          />
          <p className="studio-journal" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            {showArchived
              ? 'No archived students. Archived students are hidden from your active roster but keep their account and lesson history.'
              : 'No students yet. Add your first student to start scheduling lessons and sharing practice.'}
          </p>
          {!showArchived ? (
            <button type="button" className="studio-btn studio-btn--primary" onClick={() => setAddOpen(true)}>
              <i className="bi bi-person-plus" /> Add your first student
            </button>
          ) : null}
        </div>
      ) : (
        <div
          className="studio-card-grid"
        >
          {students.map((student) => (
            <article key={student.user_id} className="studio-card" style={{ height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 1 }}>
                {showArchived ? (
                  <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--sm"
                    disabled={busyId === student.user_id}
                    onClick={() => handleArchiveToggle(student.user_id, false)}
                  >
                    <i className="bi bi-arrow-counterclockwise" /> Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--sm"
                    disabled={busyId === student.user_id}
                    title="Archive student"
                    onClick={() => handleArchiveToggle(student.user_id, true)}
                  >
                    <i className="bi bi-archive" />
                  </button>
                )}
              </div>
              <Link
                to={`/studio/students/${student.user_id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingRight: '2.5rem' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--studio-accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i
                        className="bi bi-person-fill"
                        style={{ fontSize: '1.5rem', color: 'var(--studio-accent)' }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="studio-heading" style={{ fontSize: '1.1rem' }}>
                      {displayName(student)}
                    </h3>
                    {student.email ? (
                      <p className="studio-subtext" style={{ fontSize: '0.78rem' }}>
                        {student.email}
                      </p>
                    ) : null}
                    {student.studio_profile?.skill_level ? (
                      <span className="studio-badge">{student.studio_profile.skill_level}</span>
                    ) : (
                      <span className="studio-subtext">Profile not filled in</span>
                    )}
                  </div>
                </div>
                {student.studio_profile?.goals ? (
                  <p className="studio-subtext" style={{ marginTop: '0.85rem' }}>
                    {student.studio_profile.goals.slice(0, 100)}
                    {student.studio_profile.goals.length > 100 ? '…' : ''}
                  </p>
                ) : null}
                {student.studio_profile?.favorite_music ? (
                  <p className="studio-journal" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    ♫ {student.studio_profile.favorite_music}
                  </p>
                ) : null}
              </Link>
            </article>
          ))}
        </div>
      )}

      {user?.id ? (
        <>
          <AddStudentModal
            isOpen={addOpen}
            onClose={() => setAddOpen(false)}
            teacherId={user.id}
            createdBy={user.id}
            onSuccess={loadStudents}
          />
          {isAdmin ? (
            <AddTeacherModal
              isOpen={addTeacherOpen}
              onClose={() => setAddTeacherOpen(false)}
              createdBy={user.id}
            />
          ) : null}
        </>
      ) : null}
    </MarkStudioLayout>
  )
}
