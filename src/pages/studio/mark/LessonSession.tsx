import { useParams, useSearchParams } from 'react-router-dom'
import LessonSessionWorkspace from '../../../components/lesson-planning/builder/LessonSessionWorkspace'

export default function LessonSession() {
  const { scheduledId } = useParams<{ scheduledId?: string }>()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('student')
  const from = searchParams.get('from')
  const teachLessonId = searchParams.get('teach')

  return (
    <LessonSessionWorkspace
      scheduledId={scheduledId}
      initialStudentId={studentId}
      returnToStudentProfile={from === 'student' && !!studentId}
      initialTeachLessonId={teachLessonId}
    />
  )
}
