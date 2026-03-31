import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import type { Course } from '../../types/content'

interface CourseWithDetails extends Course {
  teacher_name?: string
  lesson_count?: number
  enrollment_count?: number
}

const Courses = () => {
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      if (!coursesData || coursesData.length === 0) {
        setCourses([])
        setLoading(false)
        return
      }

      // Fetch teacher profiles
      const teacherIds = [...new Set(coursesData.map(c => c.teacher_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', teacherIds)

      // Fetch lesson counts
      const courseIds = coursesData.map(c => c.id)
      const { data: lessonsData } = await supabase
        .from('course_lessons')
        .select('course_id')
        .in('course_id', courseIds)

      const lessonCounts = new Map<string, number>()
      lessonsData?.forEach(lesson => {
        const count = lessonCounts.get(lesson.course_id) || 0
        lessonCounts.set(lesson.course_id, count + 1)
      })

      // Fetch enrollment counts
      const { data: enrollmentsData } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .in('course_id', courseIds)

      const enrollmentCounts = new Map<string, number>()
      enrollmentsData?.forEach(enrollment => {
        const count = enrollmentCounts.get(enrollment.course_id) || 0
        enrollmentCounts.set(enrollment.course_id, count + 1)
      })

      // Combine data
      const coursesWithDetails = coursesData.map(course => {
        const teacher = profilesData?.find(p => p.user_id === course.teacher_id)
        return {
          ...course,
          teacher_name: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : 'Unknown',
          lesson_count: lessonCounts.get(course.id) || 0,
          enrollment_count: enrollmentCounts.get(course.id) || 0
        }
      })

      setCourses(coursesWithDetails)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (course.title?.toLowerCase().includes(searchLower) || false) ||
      (course.description?.toLowerCase().includes(searchLower) || false) ||
      (course.teacher_name?.toLowerCase().includes(searchLower) || false)
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', text: 'Published' }
      case 'draft':
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', text: 'Draft' }
      case 'archived':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Archived' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', text: status }
    }
  }

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
            placeholder="Search courses..."
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: 'var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-base)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-base)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading courses...
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
                    Title
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Teacher
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
                    Lessons
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
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: 'var(--space-8)',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {searchTerm ? 'No courses found matching your search' : 'No courses found'}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => {
                    const statusBadge = getStatusBadgeColor(course.status)
                    return (
                      <tr
                        key={course.id}
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
                          <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                            {course.title}
                          </div>
                          {course.description && (
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)',
                              marginTop: 'var(--space-1)'
                            }}>
                              {course.description.length > 60 
                                ? `${course.description.substring(0, 60)}...` 
                                : course.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {course.teacher_name || 'Unknown'}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-base)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: statusBadge.bg,
                            color: statusBadge.color
                          }}>
                            {statusBadge.text}
                          </span>
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
                            {course.lesson_count || 0} lesson{(course.lesson_count || 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-base)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e'
                          }}>
                            {course.enrollment_count || 0} student{(course.enrollment_count || 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{
                          padding: 'var(--space-4)',
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          {new Date(course.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Courses

