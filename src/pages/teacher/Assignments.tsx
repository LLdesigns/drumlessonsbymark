import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import TeacherLayout from '../../components/layout/TeacherLayout'
import { TextField, Button, Card, Select } from '../../components/ui'
import type { Assignment } from '../../types/content'
import type { UserProfile } from '../../types/user'

const Assignments = () => {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    student_ids: [] as string[]
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (user) {
      fetchAssignments()
      fetchCourses()
      fetchStudents()
    }
  }, [user])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('teacher_id', user?.id)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data: relationsData } = await supabase
        .from('teacher_students')
        .select('student_id')
        .eq('teacher_id', user?.id)

      const studentIds = relationsData?.map(r => r.student_id) || []

      if (studentIds.length === 0) {
        setStudents([])
        return
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds)
        .order('first_name, last_name')

      setStudents(profilesData || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      // Create assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: formData.title,
          description: formData.description || null,
          teacher_id: user?.id,
          course_id: formData.course_id || null,
          due_date: formData.due_date || null
        })
        .select()
        .single()

      if (assignmentError) throw assignmentError

      // Create student_assignments for each selected student
      if (formData.student_ids.length > 0 && assignmentData) {
        const studentAssignments = formData.student_ids.map(studentId => ({
          assignment_id: assignmentData.id,
          student_id: studentId
        }))

        const { error: studentAssignmentsError } = await supabase
          .from('student_assignments')
          .insert(studentAssignments)

        if (studentAssignmentsError) throw studentAssignmentsError
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        course_id: '',
        due_date: '',
        student_ids: []
      })
      setShowCreateForm(false)
      
      // Refresh assignments
      await fetchAssignments()
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      setFormError(error.message || 'Failed to create assignment. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <TeacherLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2 style={{ margin: 0 }}>Assignments ({assignments.length})</h2>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="primary"
          >
            {showCreateForm ? 'Cancel' : '+ Create Assignment'}
          </Button>
        </div>

        {showCreateForm && (
          <Card
            padding="lg"
            variant="elevated"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
              Create New Assignment
            </h3>
            <form onSubmit={handleCreateAssignment}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
                style={{ marginBottom: 'var(--space-4)' }}
              />
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                style={{ marginBottom: 'var(--space-4)' }}
              />

              <Select
                label="Course (Optional)"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                options={[
                  { value: '', label: 'No specific course' },
                  ...courses.map((course) => ({ value: course.id, label: course.title }))
                ]}
                style={{ marginBottom: 'var(--space-4)' }}
              />

              <TextField
                label="Due Date (Optional)"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                fullWidth
                style={{ marginBottom: 'var(--space-4)' }}
              />

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Assign To Students (Select multiple)
                </label>
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-base)',
                  padding: 'var(--space-2)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {students.map(student => (
                    <label key={student.user_id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-2)',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.student_ids.includes(student.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              student_ids: [...formData.student_ids, student.user_id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              student_ids: formData.student_ids.filter(id => id !== student.user_id)
                            })
                          }
                        }}
                        style={{ marginRight: 'var(--space-2)' }}
                      />
                      {student.first_name || student.display_name || 'N/A'} {student.last_name || ''}
                      {student.email && (
                        <span style={{
                          marginLeft: 'var(--space-2)',
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-xs)'
                        }}>
                          ({student.email})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
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
                disabled={formLoading || formData.student_ids.length === 0}
              >
                Create Assignment
              </Button>
            </form>
          </Card>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <Card padding="lg" variant="elevated">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-4)' }}>
                <i className="bi bi-clipboard-check" style={{ fontSize: 'var(--font-size-4xl)' }} />
              </div>
              <h3 style={{ marginTop: 0 }}>No assignments yet</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Create your first assignment for your students
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                padding="lg"
                variant="elevated"
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--space-2)'
                }}>
                  <h3 style={{ margin: 0, flex: 1 }}>
                    {assignment.title}
                  </h3>
                  {assignment.due_date && (
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {assignment.description && (
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    {assignment.description}
                  </p>
                )}
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)'
                }}>
                  Created {new Date(assignment.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

export default Assignments

