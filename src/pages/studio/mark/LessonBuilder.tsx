import { lazy, Suspense } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../../store/auth'
import type { LessonPageTab } from '../../../types/lesson-planning'

const LessonBuilderWorkspace = lazy(
  () => import('../../../components/lesson-planning/builder/LessonBuilderWorkspace')
)

function LessonBuilderFallback() {
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
        <div className="lesson-builder__loading-shimmer lesson-builder__loading-shimmer--short" />
      </div>
    </div>
  )
}

/**
 * Full-viewport lesson page — content builder + students who completed / are assigned.
 */
export default function LessonPage() {
  const { templateId } = useParams<{ templateId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, userProfile, userRole } = useAuthStore()
  const isNew = !templateId || templateId === 'new'
  const pageTab = (searchParams.get('tab') as LessonPageTab) || 'content'

  const setPageTab = (tab: LessonPageTab) => {
    if (tab === 'content') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  if (!user?.id) {
    return null
  }

  return (
    <Suspense fallback={<LessonBuilderFallback />}>
      <LessonBuilderWorkspace
        templateId={isNew ? undefined : templateId}
        isNew={isNew}
        userId={user.id}
        userProfile={userProfile}
        userRole={userRole}
        pageTab={pageTab}
        onPageTabChange={setPageTab}
      />
    </Suspense>
  )
}

/** Legacy URL — redirects to lesson page */
export function LegacyLessonBuilderRedirect() {
  const { templateId } = useParams<{ templateId: string }>()
  return <Navigate to={`/studio/lesson-planning/lesson/${templateId}`} replace />
}
