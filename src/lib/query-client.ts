import { QueryClient } from '@tanstack/react-query'

/** Shared React Query defaults — reduce redundant network calls on navigation. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
