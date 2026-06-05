import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { UserRole } from '../types/user'
import { getDefaultPathForRole } from '../lib/permissions'
import { getLoginPathForPathname, getLoginPathForRole } from '../lib/login-portal'
import AuthProgressScreen from './AuthProgressScreen'
import { STUDIO_BRAND_FULL } from '../lib/studio-brand'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  requirePasswordChange?: boolean
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requirePasswordChange = false
}: ProtectedRouteProps) {
  const location = useLocation()
  const { user, userRole, mustChangePassword, authReady } = useAuthStore()

  // Full-screen auth UI only on first app load — never when switching studio pages
  if (!authReady) {
    return (
      <AuthProgressScreen
        message="Checking your session…"
        subtitle={STUDIO_BRAND_FULL}
      />
    )
  }

  if (!user) {
    const returnTo = location.pathname + location.search
    return <Navigate to={getLoginPathForPathname(location.pathname, returnTo)} replace />
  }

  // If password change is required, redirect to change password page
  // unless we're already on that page (to avoid redirect loop)
  if (requirePasswordChange && mustChangePassword) {
    const currentPath = window.location.pathname
    if (currentPath !== '/change-password') {
      return <Navigate to="/change-password" replace />
    }
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role, or login
      const redirectPath = getDefaultPathForRole(userRole) || getLoginPathForRole(userRole)
      return <Navigate to={redirectPath} replace />
    }
  }

  return <>{children}</>
}

