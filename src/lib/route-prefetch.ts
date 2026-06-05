type RouteLoader = () => Promise<unknown>

const prefetched = new Set<string>()

const ROUTE_LOADERS: { prefix: string; load: RouteLoader }[] = [
  { prefix: '/studio/dashboard', load: () => import('../pages/studio/mark/Dashboard') },
  { prefix: '/studio/students', load: () => import('../pages/studio/mark/Students') },
  { prefix: '/studio/schedule', load: () => import('../pages/studio/mark/Schedule') },
  { prefix: '/studio/messages', load: () => import('../pages/studio/mark/Messages') },
  { prefix: '/studio/lesson-planning/lesson', load: () => import('../pages/studio/mark/LessonBuilder') },
  { prefix: '/studio/lesson-planning/assigned', load: () => import('../pages/studio/mark/AssignedLessonEdit') },
  { prefix: '/studio/lesson-planning/session', load: () => import('../pages/studio/mark/LessonSession') },
  { prefix: '/studio/lesson-planning', load: () => import('../pages/studio/mark/LessonPlanning') },
  { prefix: '/student/home', load: () => import('../pages/studio/student/Home') },
  { prefix: '/student/lessons', load: () => import('../pages/studio/student/StudentLessons') },
  { prefix: '/student/messages', load: () => import('../pages/studio/student/Messages') },
  { prefix: '/student/schedule', load: () => import('../pages/studio/student/Schedule') },
  { prefix: '/student/progress', load: () => import('../pages/studio/student/Progress') },
  { prefix: '/login', load: () => import('../pages/Login') },
  { prefix: '/app', load: () => import('../pages/StudioAppEntry') },
]

function loaderKey(prefix: string): string {
  return prefix
}

/** Prefetch a route's JS chunk (sidebar hover / focus). Safe to call repeatedly. */
export function prefetchRoute(pathname: string) {
  const match = ROUTE_LOADERS.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  )
  if (!match) return

  const key = loaderKey(match.prefix)
  if (prefetched.has(key)) return
  prefetched.add(key)
  void match.load()
}
