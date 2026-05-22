import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import LessonBuilderWorkspace from '../../../components/lesson-planning/builder/LessonBuilderWorkspace'
import { useAuthStore } from '../../../store/auth'
import type { LessonPageTab } from '../../../types/lesson-planning'

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
    <LessonBuilderWorkspace
      templateId={isNew ? undefined : templateId}
      isNew={isNew}
      userId={user.id}
      userProfile={userProfile}
      userRole={userRole}
      pageTab={pageTab}
      onPageTabChange={setPageTab}
    />
  )
}

/** Legacy URL — redirects to lesson page */
export function LegacyLessonBuilderRedirect() {
  const { templateId } = useParams<{ templateId: string }>()
  return <Navigate to={`/studio/lesson-planning/lesson/${templateId}`} replace />
}
