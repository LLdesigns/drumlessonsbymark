import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import AddStudentModal from '../../../components/studio/AddStudentModal'
import AddTeacherModal from '../../../components/studio/AddTeacherModal'
import { useAuthStore } from '../../../store/auth'
import { displayName, fetchTeacherStudents } from '../../../lib/studio-service'
import type { StudioStudent } from '../../../types/studio'

export default function MarkStudents() {
  const { user, userRole } = useAuthStore()
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addTeacherOpen, setAddTeacherOpen] = useState(false)
  const isAdmin = userRole === 'admin'

  const loadStudents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const list = await fetchTeacherStudents(user.id, userRole)
      setStudents(list)
    } finally {
      setLoading(false)
    }
  }, [user?.id, userRole])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

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

      {loading ? (
        <p className="studio-subtext">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="studio-card studio-empty" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <i
            className="bi bi-people"
            style={{ fontSize: '2.5rem', color: 'var(--studio-accent)', marginBottom: '1rem' }}
            aria-hidden
          />
          <p className="studio-journal" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            No students yet. Add your first student to start scheduling lessons and sharing practice.
          </p>
          <button type="button" className="studio-btn studio-btn--primary" onClick={() => setAddOpen(true)}>
            <i className="bi bi-person-plus" /> Add your first student
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {students.map((student) => (
            <Link
              key={student.user_id}
              to={`/studio/students/${student.user_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article className="studio-card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
              </article>
            </Link>
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
