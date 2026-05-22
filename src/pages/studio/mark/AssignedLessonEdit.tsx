import { useParams } from 'react-router-dom'
import AssignedLessonWorkspace from '../../../components/lesson-planning/builder/AssignedLessonWorkspace'
import { useAuthStore } from '../../../store/auth'

export default function AssignedLessonEdit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()

  if (!id || !user?.id) return null

  return <AssignedLessonWorkspace assignedId={id} />
}
