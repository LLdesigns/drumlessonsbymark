import { useQuery } from '@tanstack/react-query'
import { fetchLessonTemplates } from '../lib/lesson-planning-service'

export interface LessonTemplatesFilters {
  search?: string
  category?: string
}

export function lessonTemplatesQueryKey(userId: string, filters: LessonTemplatesFilters) {
  return ['lesson-templates', userId, filters.search ?? '', filters.category ?? ''] as const
}

export function useLessonTemplates(userId: string | undefined, filters: LessonTemplatesFilters) {
  return useQuery({
    queryKey: lessonTemplatesQueryKey(userId ?? '', filters),
    queryFn: () =>
      fetchLessonTemplates(userId!, {
        status: 'active',
        search: filters.search || undefined,
        category: filters.category || undefined,
      }),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
