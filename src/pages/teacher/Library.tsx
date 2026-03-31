import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import TeacherLayout from '../../components/layout/TeacherLayout'
import { Button, Card } from '../../components/ui'
import type { Course } from '../../types/content'

const Library = () => {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
      published: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
      archived: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
    }
    const style = colors[status as keyof typeof colors] || colors.draft
    return style
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
          <h2 style={{ margin: 0 }}>My Courses ({courses.length})</h2>
          <Link to="/teacher/courses/new">
            <Button variant="primary">
              + Create Course
            </Button>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <Card padding="lg" variant="elevated">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-4)' }}>
                <i className="bi bi-book" style={{ fontSize: 'var(--font-size-4xl)' }} />
              </div>
              <h3 style={{ marginTop: 0 }}>No courses yet</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
                Create your first course to start building your content library
              </p>
              <Link to="/teacher/courses/new">
                <Button variant="primary">
                  Create Your First Course
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            {courses.map((course) => {
              const statusStyle = getStatusBadge(course.status)
              return (
                <Card
                  key={course.id}
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
                    to={`/teacher/courses/${course.id}`}
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
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-2)'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-semibold)',
                        flex: 1
                      }}>
                        {course.title}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        marginLeft: 'var(--space-2)',
                        textTransform: 'capitalize'
                      }}>
                        {course.status}
                      </span>
                    </div>
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
                        Created {new Date(course.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

export default Library

