import type { UserRole } from '../types/user'

/**
 * Check if the current user has admin role
 */
export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === 'admin'
}

/**
 * Check if the current user has teacher role
 */
export function isTeacher(userRole: UserRole | null | undefined): boolean {
  return userRole === 'teacher'
}

/**
 * Check if the current user has student role
 */
export function isStudent(userRole: UserRole | null | undefined): boolean {
  return userRole === 'student'
}

/**
 * Check if the current user has employee role
 */
export function isEmployee(userRole: UserRole | null | undefined): boolean {
  return userRole === 'employee'
}

/**
 * Check if the user has one of the specified roles
 */
export function hasRole(
  userRole: UserRole | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

/**
 * Check if user can access admin resources
 */
export function canAccessAdmin(userRole: UserRole | null | undefined): boolean {
  return isAdmin(userRole)
}

/**
 * Check if user can access song management (admin or employee)
 */
export function canAccessSongManagement(userRole: UserRole | null | undefined): boolean {
  return isAdmin(userRole) || isEmployee(userRole)
}

/**
 * Check if user can manage a specific song
 * Employees can only manage their own songs
 * Admins can manage all songs
 */
export function canManageSong(
  userRole: UserRole | null | undefined,
  songCreatedBy: string,
  currentUserId: string
): boolean {
  if (isAdmin(userRole)) return true
  if (isEmployee(userRole) && currentUserId === songCreatedBy) return true
  return false
}

/**
 * Check if user can access teacher resources
 */
export function canAccessTeacher(userRole: UserRole | null | undefined): boolean {
  return isAdmin(userRole) || isTeacher(userRole)
}

/**
 * Check if user can access student resources
 */
export function canAccessStudent(userRole: UserRole | null | undefined): boolean {
  return isAdmin(userRole) || isStudent(userRole)
}

/**
 * Check if user can manage a specific teacher's resources
 * Teachers can only manage their own resources
 * Admins can manage all resources
 */
export function canManageTeacherResources(
  userRole: UserRole | null | undefined,
  resourceTeacherId: string,
  currentUserId: string
): boolean {
  if (isAdmin(userRole)) return true
  if (isTeacher(userRole) && currentUserId === resourceTeacherId) return true
  return false
}

/**
 * Check if user can manage a specific student
 * Teachers can manage their own students
 * Admins can manage all students
 */
export function canManageStudent(
  userRole: UserRole | null | undefined,
  studentTeacherId: string,
  currentUserId: string
): boolean {
  if (isAdmin(userRole)) return true
  if (isTeacher(userRole) && currentUserId === studentTeacherId) return true
  return false
}

/**
 * Get the default redirect path based on user role
 */
export function getDefaultPathForRole(userRole: UserRole | null | undefined): string {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard'
    case 'employee':
      return '/admin/songs' // Play Studio
    case 'teacher':
      return '/teacher/library'
    case 'student':
      return '/student/library'
    default:
      return '/login'
  }
}

