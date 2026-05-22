import type { UserRole } from '../types/user'
import { canAccessMarkStudio } from './studio-roles'
import { isStudent } from './permissions'

/** Which sign-in tab the user chose (not the DB role name). */
export type LoginPortal = 'student' | 'studio'

export const LOGIN_PORTAL_CONFIG: Record<
  LoginPortal,
  {
    tabLabel: string
    subtitle: string
    allowedRoles: UserRole[]
    alternatePortal: LoginPortal
  }
> = {
  student: {
    tabLabel: 'Student',
    subtitle: 'Sign in to view practice, messages, and your lesson schedule.',
    allowedRoles: ['student'],
    alternatePortal: 'studio',
  },
  studio: {
    tabLabel: 'Studio',
    subtitle: 'Sign in to manage students, lessons, and studio messages.',
    allowedRoles: ['teacher', 'admin', 'author', 'employee'],
    alternatePortal: 'student',
  },
}

export function parseLoginPortal(value: string | null | undefined): LoginPortal {
  return value === 'studio' ? 'studio' : 'student'
}

export function getLoginPathForPortal(portal: LoginPortal): string {
  return `/login?portal=${portal}`
}

export function getLoginPathForRole(userRole: UserRole | null | undefined): string {
  if (canAccessMarkStudio(userRole)) return getLoginPathForPortal('studio')
  if (isStudent(userRole)) return getLoginPathForPortal('student')
  return '/login'
}

/** Pick the right login tab when an unauthenticated user hits a protected route. */
export function getLoginPathForPathname(pathname: string): string {
  if (pathname.startsWith('/studio')) return getLoginPathForPortal('studio')
  if (pathname.startsWith('/student')) return getLoginPathForPortal('student')
  return '/login'
}

export function roleMatchesLoginPortal(
  userRole: UserRole | null | undefined,
  portal: LoginPortal
): boolean {
  if (!userRole) return false
  return LOGIN_PORTAL_CONFIG[portal].allowedRoles.includes(userRole)
}

export function getWrongPortalMessage(
  userRole: UserRole | null | undefined,
  portal: LoginPortal
): string {
  const other = LOGIN_PORTAL_CONFIG[portal].alternatePortal
  const otherTab = LOGIN_PORTAL_CONFIG[other].tabLabel
  if (canAccessMarkStudio(userRole)) {
    return `This account uses the ${otherTab} tab. Switch tabs and sign in again.`
  }
  if (isStudent(userRole)) {
    return `This is a student account. Use the ${otherTab} tab instead.`
  }
  return `This account cannot sign in on the ${LOGIN_PORTAL_CONFIG[portal].tabLabel} tab. Try the ${otherTab} tab.`
}
