import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../../store/auth'

const AssignedLessonWorkspace = lazy(
  () => import('../../../components/lesson-planning/builder/AssignedLessonWorkspace')
)

function AssignedLessonFallback() {
  return (
    <div className="lesson-builder lesson-builder--loading">
      <header className="lesson-builder__header lesson-builder__header--two-col">
        <div className="lesson-builder__header-left">
          <span className="lesson-builder__back" aria-hidden />
          <div className="lesson-builder__title-wrap">
            <h1 className="lesson-builder__title">Loading lesson…</h1>
          </div>
        </div>
      </header>
      <div className="lesson-builder__loading-body">
        <div className="lesson-builder__loading-shimmer" />
      </div>
    </div>
  )
}

export default function AssignedLessonEdit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()

  if (!id || !user?.id) return null

  return (
    <Suspense fallback={<AssignedLessonFallback />}>
      <AssignedLessonWorkspace assignedId={id} />
    </Suspense>
  )
}
