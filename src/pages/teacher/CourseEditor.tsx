import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import TeacherLayout from '../../components/layout/TeacherLayout'
import { TextField, Button, Card, Textarea } from '../../components/ui'
import VideoUpload from '../../components/VideoUpload'
import type { Course, CourseLesson, StudentCourseEnrollment } from '../../types/content'
import type { UserProfile } from '../../types/user'

const CourseEditor = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isNew = courseId === 'new'

  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    status: 'draft',
    thumbnail_url: ''
  })
  const [lessons, setLessons] = useState<Partial<CourseLesson>[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<UserProfile[]>([])
  const [enrollments, setEnrollments] = useState<StudentCourseEnrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  useEffect(() => {
    if (!isNew && courseId) {
      fetchCourse()
      fetchStudents()
      fetchEnrollments()
    }
  }, [courseId, isNew])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('teacher_id', user?.id)
        .single()

      if (courseError) throw courseError
      setCourse(courseData || {})

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])
    } catch (error: any) {
      console.error('Error fetching course:', error)
      setError(error.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      // Fetch students linked to this teacher via teacher_students junction
      const { data: relationsData, error: relationsError } = await supabase
        .from('teacher_students')
        .select('student_id')
        .eq('teacher_id', user?.id)

      if (relationsError) throw relationsError

      const studentIds = relationsData?.map(r => r.student_id) || []

      if (studentIds.length === 0) {
        setStudents([])
        return
      }

      // Fetch profiles for these students
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds)
        .order('first_name, last_name', { ascending: true })

      if (profilesError) throw profilesError
      setStudents(profilesData || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchEnrollments = async () => {
    if (!courseId || isNew) return
    
    try {
      setLoadingEnrollments(true)
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select(`
          *,
          profiles:student_id (
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('course_id', courseId)

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const handleEnrollStudent = async (studentId: string) => {
    if (!courseId || isNew) return

    try {
      const { error } = await supabase
        .from('student_course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'active'
        })

      if (error) throw error
      await fetchEnrollments()
    } catch (error: any) {
      console.error('Error enrolling student:', error)
      alert(error.message || 'Failed to enroll student')
    }
  }

  const handleUnenrollStudent = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('student_course_enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchEnrollments()
    } catch (error: any) {
      console.error('Error unenrolling student:', error)
      alert(error.message || 'Failed to unenroll student')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      // Validate
      if (!course.title) {
        setError('Course title is required')
        return
      }

      let savedCourseId = courseId

      // Create or update course
      if (isNew) {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: course.title,
            description: course.description || null,
            teacher_id: user?.id,
            status: course.status || 'draft',
            thumbnail_url: course.thumbnail_url || null
          })
          .select()
          .single()

        if (courseError) throw courseError
        savedCourseId = courseData.id
      } else {
        const { error: courseError } = await supabase
          .from('courses')
          .update({
            title: course.title,
            description: course.description || null,
            status: course.status,
            thumbnail_url: course.thumbnail_url || null
          })
          .eq('id', courseId)
          .eq('teacher_id', user?.id)

        if (courseError) throw courseError
      }

      // Save lessons
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]
        if (!lesson.title) continue

        if (lesson.id) {
          // Update existing lesson
          const { error: lessonError } = await supabase
            .from('course_lessons')
            .update({
              title: lesson.title,
              description: lesson.description || null,
              video_url: lesson.video_url || null,
              video_storage_path: lesson.video_storage_path || null,
              order_index: i
            })
            .eq('id', lesson.id)

          if (lessonError) throw lessonError
        } else {
          // Create new lesson
          const { error: lessonError } = await supabase
            .from('course_lessons')
            .insert({
              course_id: savedCourseId,
              title: lesson.title,
              description: lesson.description || null,
              video_url: lesson.video_url || null,
              video_storage_path: lesson.video_storage_path || null,
              order_index: i
            })

          if (lessonError) throw lessonError
        }
      }

      // Navigate back to library
      navigate('/teacher/library')
    } catch (error: any) {
      console.error('Error saving course:', error)
      setError(error.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const addLesson = () => {
    setLessons([...lessons, {
      title: '',
      description: '',
      video_url: '',
      order_index: lessons.length
    }])
  }

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index).map((lesson, i) => ({
      ...lesson,
      order_index: i
    })))
  }

  const updateLesson = (index: number, field: keyof CourseLesson, value: any) => {
    const updatedLessons = [...lessons]
    updatedLessons[index] = { ...updatedLessons[index], [field]: value }
    setLessons(updatedLessons)
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          Loading course...
        </div>
      </TeacherLayout>
    )
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
          <h2 style={{ margin: 0 }}>
            {isNew ? 'Create New Course' : 'Edit Course'}
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button
              onClick={() => navigate('/teacher/library')}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-base)',
            padding: 'var(--space-3)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-6)'
          }}>
            {error}
          </div>
        )}

        <Card padding="lg" variant="elevated" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Course Details</h3>
          
          <TextField
            label="Course Title *"
            value={course.title || ''}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            required
            fullWidth
            style={{ marginBottom: 'var(--space-4)' }}
          />

          <Textarea
            label="Description"
            value={course.description || ''}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
            fullWidth
            rows={4}
            style={{ marginBottom: 'var(--space-4)' }}
          />

          <TextField
            label="Thumbnail URL"
            value={course.thumbnail_url || ''}
            onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
            placeholder="https://..."
            fullWidth
            style={{ marginBottom: 'var(--space-4)' }}
          />

          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Status
            </label>
            <select
              value={course.status || 'draft'}
              onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
              style={{
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                width: '200px'
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </Card>

        <Card padding="lg" variant="elevated">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)'
          }}>
            <h3 style={{ margin: 0 }}>Lessons ({lessons.length})</h3>
            <Button onClick={addLesson} variant="primary">
              + Add Lesson
            </Button>
          </div>

          {lessons.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              color: 'var(--color-text-secondary)'
            }}>
              No lessons yet. Click "Add Lesson" to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {lessons.map((lesson, index) => (
                <Card
                  key={index}
                  padding="md"
                  variant="outlined"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 'var(--space-4)',
                    right: 'var(--space-4)',
                    display: 'flex',
                    gap: 'var(--space-2)',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      Lesson {index + 1}
                    </span>
                    {lessons.length > 1 && (
                      <button
                        onClick={() => removeLesson(index)}
                        style={{
                          background: 'var(--color-error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-base)',
                          padding: 'var(--space-1) var(--space-2)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <TextField
                    label="Lesson Title *"
                    value={lesson.title || ''}
                    onChange={(e) => updateLesson(index, 'title', e.target.value)}
                    required
                    fullWidth
                    style={{ marginBottom: 'var(--space-4)' }}
                  />

                  <Textarea
                    label="Description"
                    value={lesson.description || ''}
                    onChange={(e) => updateLesson(index, 'description', e.target.value)}
                    fullWidth
                    rows={3}
                    style={{ marginBottom: 'var(--space-4)' }}
                  />

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: 'var(--space-2)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}>
                        Video Upload
                      </label>
                      <VideoUpload
                        onUploadComplete={(path) => updateLesson(index, 'video_storage_path', path)}
                        currentPath={lesson.video_storage_path || undefined}
                      />
                    </div>
                    <TextField
                      label="Or Video URL"
                      value={lesson.video_url || ''}
                      onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                      placeholder="https://..."
                      fullWidth
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Student Enrollment Section - Only show for existing courses */}
        {!isNew && courseId && (
          <Card padding="lg" variant="elevated" style={{ marginTop: 'var(--space-6)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)'
            }}>
              <h3 style={{ margin: 0 }}>Enrolled Students ({enrollments.length})</h3>
            </div>

            {loadingEnrollments ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                Loading enrollments...
              </div>
            ) : (
              <>
                {/* Add Student Dropdown */}
                {students.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      Enroll a Student
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const studentId = e.target.value
                        if (studentId) {
                          handleEnrollStudent(studentId)
                          e.target.value = ''
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-base)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-base)'
                      }}
                    >
                      <option value="">Select a student to enroll...</option>
                      {students
                        .filter(student => 
                          !enrollments.some(e => e.student_id === student.user_id)
                        )
                        .map(student => (
                          <option key={student.user_id} value={student.user_id}>
                            {student.first_name} {student.last_name} ({student.email})
                          </option>
                        ))}
                    </select>
                    {students.filter(student => 
                      !enrollments.some(e => e.student_id === student.user_id)
                    ).length === 0 && (
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                      }}>
                        All your students are enrolled in this course.
                      </p>
                    )}
                  </div>
                )}

                {/* Enrolled Students List */}
                {enrollments.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-8)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    No students enrolled yet. Select a student above to enroll them.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    {enrollments.map((enrollment) => {
                      const student = (enrollment as any).profiles
                      return (
                        <Card
                          key={enrollment.id}
                          padding="md"
                          variant="outlined"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--color-bg-secondary)'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--space-1)'
                            }}>
                              {student?.first_name} {student?.last_name}
                            </div>
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)'
                            }}>
                              {student?.email}
                            </div>
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)',
                              marginTop: 'var(--space-2)'
                            }}>
                              Progress: {enrollment.progress_percentage || 0}%
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnenrollStudent(enrollment.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--color-error)',
                              color: 'var(--color-error)',
                              borderRadius: 'var(--radius-base)',
                              padding: 'var(--space-2) var(--space-3)',
                              cursor: 'pointer',
                              fontSize: 'var(--font-size-xs)',
                              marginLeft: 'var(--space-2)'
                            }}
                          >
                            Remove
                          </button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </TeacherLayout>
  )
}

export default CourseEditor

