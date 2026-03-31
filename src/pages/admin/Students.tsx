import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import type { UserProfile } from '../../types/user'

interface StudentWithEnrollments extends UserProfile {
  enrollmentCount?: number
}

const Students = () => {
  const [students, setStudents] = useState<StudentWithEnrollments[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      // Fetch users with student role
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student')

      if (rolesError) throw rolesError

      const studentIds = rolesData?.map(r => r.user_id) || []

      if (studentIds.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch enrollment counts
      const { data: enrollmentsData } = await supabase
        .from('student_course_enrollments')
        .select('student_id')
        .in('student_id', studentIds)

      // Count enrollments per student
      const enrollmentCounts = new Map<string, number>()
      enrollmentsData?.forEach(enrollment => {
        const count = enrollmentCounts.get(enrollment.student_id) || 0
        enrollmentCounts.set(enrollment.student_id, count + 1)
      })

      // Combine data
      const studentsWithData = (profilesData || []).map(profile => ({
        ...profile,
        role: 'student' as const,
        enrollmentCount: enrollmentCounts.get(profile.user_id) || 0
      }))

      setStudents(studentsWithData)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (student.first_name?.toLowerCase().includes(searchLower) || false) ||
      (student.last_name?.toLowerCase().includes(searchLower) || false) ||
      (student.display_name?.toLowerCase().includes(searchLower) || false) ||
      (student.email?.toLowerCase().includes(searchLower) || false)
    )
  })

  return (
    <AdminLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1 1 300px',
              padding: 'var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-base)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-base)'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading students...
          </div>
        ) : (
          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'var(--color-bg-tertiary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Enrollments
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: 'var(--space-8)',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {searchTerm ? 'No students found matching your search' : 'No students found'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.user_id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td style={{ padding: 'var(--space-4)' }}>
                        {student.first_name || student.display_name || 'N/A'} {student.last_name || ''}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {student.email || 'N/A'}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-base)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          background: (student.active !== false) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: (student.active !== false) ? '#22c55e' : '#ef4444'
                        }}>
                          {(student.active !== false) ? 'Active' : 'Inactive'}
                        </span>
                        {student.must_change_password && (
                          <span style={{
                            marginLeft: 'var(--space-2)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-warning)'
                          }}>
                            <i className="bi bi-lock-fill" />
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-base)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6'
                        }}>
                          {student.enrollmentCount || 0} course{(student.enrollmentCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Students

