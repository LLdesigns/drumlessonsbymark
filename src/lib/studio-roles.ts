import type { UserRole } from '../types/user'

/** Roles that use Mark's drum studio (instructor / staff side) */
export const MARK_STUDIO_ROLES: UserRole[] = ['teacher', 'admin', 'author', 'employee']

/** Roles that use the student portal */
export const STUDENT_PORTAL_ROLES: UserRole[] = ['student']

/** Legacy Play It Pro platform roles — redirected away from /admin, /learn, /play */
export const LEGACY_PLATFORM_ROLES: UserRole[] = ['admin', 'author', 'employee']

export function canAccessMarkStudio(userRole: UserRole | null | undefined): boolean {
  if (!userRole) return false
  return MARK_STUDIO_ROLES.includes(userRole)
}

export function usesLegacyPlatformRoutes(userRole: UserRole | null | undefined): boolean {
  if (!userRole) return false
  return LEGACY_PLATFORM_ROLES.includes(userRole) || userRole === 'author'
}
