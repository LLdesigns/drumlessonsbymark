import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import StudentLayout from '../../components/layout/StudentLayout'
import { Button, Card } from '../../components/ui'
import type { Course, CourseLesson } from '../../types/content'

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<CourseLesson[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (courseId && user) {
      fetchCourse()
      fetchLessons()
      fetchCompletions()
    }
  }, [courseId, user])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      navigate('/student/library')
    }
  }

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setLessons(data || [])
      
      // Select first lesson by default
      if (data && data.length > 0) {
        const firstLesson = data[0]
        setSelectedLesson(firstLesson)
        // Load video URL
        if (firstLesson.video_storage_path) {
          const { data: urlData } = supabase.storage
            .from('course-videos')
            .getPublicUrl(firstLesson.video_storage_path)
          setVideoUrl(urlData.publicUrl)
        } else if (firstLesson.video_url) {
          setVideoUrl(firstLesson.video_url)
        }
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('student_id', user?.id)

      if (error) throw error
      
      const completedIds = new Set(data?.map(c => c.lesson_id) || [])
      setCompletedLessons(completedIds)
    } catch (error) {
      console.error('Error fetching completions:', error)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      // Check if already completed
      if (completedLessons.has(lessonId)) return

      const { error } = await supabase
        .from('lesson_completions')
        .insert({
          student_id: user?.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString()
        })

      if (error) throw error

      setCompletedLessons(new Set([...completedLessons, lessonId]))

      // Update enrollment progress
      if (lessons.length > 0) {
        const updatedCompletedLessons = new Set([...completedLessons, lessonId])
        const progress = Math.round((updatedCompletedLessons.size / lessons.length) * 100)
        
        await supabase
          .from('student_course_enrollments')
          .update({
            progress_percentage: progress,
            last_accessed_at: new Date().toISOString()
          })
          .eq('student_id', user?.id)
          .eq('course_id', courseId)
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          Loading course...
        </div>
      </StudentLayout>
    )
  }

  if (!course) {
    return (
      <StudentLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          Course not found
        </div>
      </StudentLayout>
    )
  }

  const progressPercentage = lessons.length > 0
    ? Math.round((completedLessons.size / lessons.length) * 100)
    : 0

  return (
    <StudentLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => navigate('/student/library')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-brand-primary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
            padding: 0
          }}
        >
          ← Back to Library
        </button>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ margin: '0 0 var(--space-2) 0' }}>{course.title}</h1>
          {course.description && (
            <p style={{
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              {course.description}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <Card padding="md" variant="outlined" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-2)'
          }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              Course Progress
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {completedLessons.size} / {lessons.length} lessons completed
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-base)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: 'var(--color-brand-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-brand-primary)'
          }}>
            {progressPercentage}%
          </div>
        </Card>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 'var(--space-6)'
        }}>
          {/* Lessons sidebar */}
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Lessons</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id)
                const isSelected = selectedLesson?.id === lesson.id
                
                return (
                  <button
                    key={lesson.id}
                    onClick={async () => {
                      setSelectedLesson(lesson)
                      // Load video URL when lesson is selected
                      if (lesson.video_storage_path) {
                        const { data: urlData } = supabase.storage
                          .from('course-videos')
                          .getPublicUrl(lesson.video_storage_path)
                        setVideoUrl(urlData.publicUrl)
                      } else if (lesson.video_url) {
                        setVideoUrl(lesson.video_url)
                      } else {
                        setVideoUrl('')
                      }
                    }}
                    style={{
                      padding: 'var(--space-3)',
                      background: isSelected ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                      border: isSelected ? '2px solid var(--color-brand-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-base)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition-base)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-bg-secondary)'
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-1)'
                    }}>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}>
                        Lesson {index + 1}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: 'var(--font-size-lg)' }}>✓</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      {lesson.title}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lesson content */}
          <div>
            {selectedLesson ? (
              <Card padding="lg" variant="elevated">
                <h2 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
                  {selectedLesson.title}
                </h2>
                
                {selectedLesson.description && (
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-6)'
                  }}>
                    {selectedLesson.description}
                  </p>
                )}

                {/* Video player */}
                {videoUrl && (
                  <div style={{
                    marginBottom: 'var(--space-6)',
                    background: '#000',
                    borderRadius: 'var(--radius-base)',
                    overflow: 'hidden'
                  }}>
                    <video
                      controls
                      style={{
                        width: '100%',
                        maxHeight: '500px'
                      }}
                      src={videoUrl}
                    />
                  </div>
                )}

                {!videoUrl && (
                  <div style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-base)',
                    marginBottom: 'var(--space-6)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    No video available for this lesson
                  </div>
                )}

                {/* Mark complete button */}
                {!completedLessons.has(selectedLesson.id) && (
                  <Button
                    onClick={() => markLessonComplete(selectedLesson.id)}
                    variant="primary"
                  >
                    Mark as Complete
                  </Button>
                )}

                {completedLessons.has(selectedLesson.id) && (
                  <div style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid #22c55e',
                    borderRadius: 'var(--radius-base)',
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}>
                    ✓ Lesson completed
                  </div>
                )}
              </Card>
            ) : (
              <Card padding="lg" variant="elevated">
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Select a lesson to begin
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default CourseView

