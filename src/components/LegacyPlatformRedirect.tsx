import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { getDefaultPathForRole } from '../lib/permissions'
import { getLoginPathForPortal } from '../lib/login-portal'

/**
 * Sends users away from legacy Play It Pro routes (/admin, /learn, /play)
 * into Mark's studio or the student portal.
 */
export default function LegacyPlatformRedirect() {
  const { userRole, authReady, user } = useAuthStore()

  if (!authReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#12100e',
          color: '#f5f0e8',
        }}
      >
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to={getLoginPathForPortal('studio')} replace />
  }

  return <Navigate to={getDefaultPathForRole(userRole) || '/'} replace />
}
