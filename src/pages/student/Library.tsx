import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import StudentLayout from '../../components/layout/StudentLayout'
import { Card } from '../../components/ui'
import type { StudentCourseEnrollment, Course } from '../../types/content'

const Library = () => {
  const { user } = useAuthStore()
  const [enrollments, setEnrollments] = useState<(StudentCourseEnrollment & { course?: Course })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEnrollments()
    }
  }, [user])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StudentLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-6)' }}>
          My Courses ({enrollments.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading courses...
          </div>
        ) : enrollments.length === 0 ? (
          <Card padding="lg" variant="elevated">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-4)' }}>
                <i className="bi bi-book" style={{ fontSize: 'var(--font-size-4xl)' }} />
              </div>
              <h3 style={{ marginTop: 0 }}>No enrolled courses</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Your teacher will enroll you in courses soon.
              </p>
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            {enrollments.map((enrollment) => {
              const course = enrollment.course
              if (!course) return null

              return (
                <Card
                  key={enrollment.id}
                  padding="lg"
                  variant="elevated"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'var(--transition-base)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Link
                    to={`/student/courses/${course.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {course.thumbnail_url && (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        background: `url(${course.thumbnail_url}) center/cover`,
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-4)'
                      }} />
                    )}
                    <h3 style={{
                      margin: 0,
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      {course.title}
                    </h3>
                    {course.description && (
                      <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        margin: 'var(--space-2) 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {course.description}
                      </p>
                    )}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      <span>
                        Progress: {enrollment.progress_percentage}%
                      </span>
                      <span>
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}

export default Library

