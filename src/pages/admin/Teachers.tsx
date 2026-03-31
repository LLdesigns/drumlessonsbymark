import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import AdminLayout from '../../components/layout/AdminLayout'
import { TextField, Button, Card } from '../../components/ui'
import { sendWelcomeEmail } from '../../lib/email'
import { createUserAccount } from '../../lib/admin-service'
import type { UserProfile } from '../../types/user'

interface TeacherWithProfile extends UserProfile {
  teacher?: {
    id: string
    status: string
    bio?: string | null
    specialization?: string | null
  }
}

const Teachers = () => {
  const { userProfile } = useAuthStore()
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      // Fetch users with teacher role
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher')

      if (rolesError) throw rolesError

      const teacherIds = rolesData?.map(r => r.user_id) || []

      if (teacherIds.length === 0) {
        setTeachers([])
        setLoading(false)
        return
      }

      // Fetch profiles and teacher records
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', teacherIds)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .in('user_id', teacherIds)

      if (teachersError) throw teachersError

      // Combine data
      const teachersWithData = (profilesData || []).map(profile => ({
        ...profile,
        role: 'teacher' as const,
        teacher: teachersData?.find(t => t.user_id === profile.user_id)
      }))

      setTeachers(teachersWithData)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setGeneratedPassword(null)

    try {
      // Create user account using admin service
      const { temporaryPassword } = await createUserAccount({
        email: formData.email,
        firstName: formData.first_name,
        lastName: formData.last_name,
        role: 'teacher',
        createdBy: userProfile?.user_id || null
      })

      // Try to send welcome email (non-blocking)
      sendWelcomeEmail(formData.email, formData.first_name, temporaryPassword, 'teacher').catch(
        err => console.warn('Failed to send welcome email:', err)
      )

      // Show password modal
      setGeneratedPassword(temporaryPassword)
      setShowPasswordModal(true)
      setShowAddForm(false)
      
      // Reset form
      setFormData({ first_name: '', last_name: '', email: '' })
      
      // Refresh teachers list
      await fetchTeachers()
    } catch (error: any) {
      console.error('Error adding teacher:', error)
      setFormError(error.message || 'Failed to add teacher. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const copyPasswordToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword)
        // Show a subtle notification instead of alert
        const button = document.getElementById('copy-password-btn')
        if (button) {
          const originalText = button.textContent
          button.textContent = '✓ Copied!'
          button.style.background = '#22c55e'
          setTimeout(() => {
            button.textContent = originalText
            button.style.background = 'var(--color-brand-primary)'
          }, 2000)
        }
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = generatedPassword
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          alert('Password copied to clipboard!')
        } catch (err) {
          alert('Failed to copy. Please select and copy manually.')
        }
        document.body.removeChild(textArea)
      }
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2 style={{ margin: 0 }}>Teachers ({teachers.length})</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="primary"
          >
            {showAddForm ? 'Cancel' : '+ Add Teacher'}
          </Button>
        </div>

        {showAddForm && (
          <Card
            padding="lg"
            variant="elevated"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
              Add New Teacher
            </h3>
            <form onSubmit={handleAddTeacher}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-4)'
              }}>
                <TextField
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              {formError && (
                <div style={{
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--radius-base)',
                  padding: 'var(--space-3)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={formLoading}
                disabled={formLoading}
              >
                Create Teacher Account
              </Button>
            </form>
          </Card>
        )}

        {showPasswordModal && generatedPassword && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card
              padding="lg"
              variant="elevated"
              style={{
                maxWidth: '500px',
                width: '90%',
                background: 'var(--color-bg-primary)'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                Teacher Account Created
              </h3>
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                A temporary password has been generated for this teacher. Please share this password securely.
              </p>
              
              <div style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Temporary Password:
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  wordBreak: 'break-all'
                }}>
                  {generatedPassword}
                </div>
                <button
                  id="copy-password-btn"
                  onClick={copyPasswordToClipboard}
                  style={{
                    position: 'absolute',
                    top: 'var(--space-4)',
                    right: 'var(--space-4)',
                    background: 'var(--color-brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-base)',
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    transition: 'var(--transition-base)'
                  }}
                >
                  📋 Copy
                </button>
              </div>

              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid var(--color-warning)',
                borderRadius: 'var(--radius-base)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-warning)'
              }}>
                ⚠️ This password will only be shown once. The teacher will be required to change it on first login.
              </div>

              <Button
                onClick={() => {
                  setShowPasswordModal(false)
                  setGeneratedPassword(null)
                }}
                variant="primary"
                fullWidth
              >
                Close
              </Button>
            </Card>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading teachers...
          </div>
        ) : (
          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            {teachers.length === 0 ? (
              <div style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                No teachers found. Add your first teacher above.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: 'var(--color-bg-tertiary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Email
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr
                      key={teacher.user_id}
                      style={{
                        borderBottom: '1px solid var(--color-border)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td style={{ padding: 'var(--space-4)' }}>
                        {teacher.first_name || teacher.display_name || 'N/A'} {teacher.last_name || ''}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {teacher.email || 'N/A'}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-base)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          background: teacher.teacher?.status === 'active' 
                            ? 'rgba(34, 197, 94, 0.1)' 
                            : 'rgba(239, 68, 68, 0.1)',
                          color: teacher.teacher?.status === 'active' 
                            ? '#22c55e' 
                            : '#ef4444'
                        }}>
                          {teacher.teacher?.status || 'active'}
                        </span>
                        {teacher.must_change_password && (
                          <span style={{
                            marginLeft: 'var(--space-2)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-warning)'
                          }}>
                            <i className="bi bi-lock-fill" />
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Teachers

