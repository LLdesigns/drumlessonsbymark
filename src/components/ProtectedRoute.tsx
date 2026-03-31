import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { UserRole } from '../types/user'
import { getDefaultPathForRole } from '../lib/permissions'

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
  const { user, userRole, mustChangePassword, loading, session } = useAuthStore()

  // Only show loading on initial auth check (when we have no session info yet)
  // Once authenticated, don't show loading when navigating between routes
  const isInitialLoad = loading && !session && !user
  
  if (isInitialLoad) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Still loading but have session - wait for user profile to load
  if (loading && session && !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}>
        <div>Restoring session...</div>
      </div>
    )
  }

  // Only redirect if loading is complete AND there's no user
  // This prevents redirecting while session is being restored
  if (!loading && !user) {
    return <Navigate to="/" replace />
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
      const redirectPath = getDefaultPathForRole(userRole) || '/login'
      return <Navigate to={redirectPath} replace />
    }
  }

  return <>{children}</>
}

