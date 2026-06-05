import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { getDefaultPathForRole } from '../lib/permissions'
import { getLoginPathForPathname } from '../lib/login-portal'
import AuthProgressScreen from '../components/AuthProgressScreen'
import { STUDIO_BRAND_FULL } from '../lib/studio-brand'

/** PWA start_url — opens the right portal after install */
export default function StudioAppEntry() {
  const navigate = useNavigate()
  const { user, userRole, authReady } = useAuthStore()

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      navigate(getLoginPathForPathname('/student/home'), { replace: true })
      return
    }
    navigate(getDefaultPathForRole(userRole) || '/student/home', { replace: true })
  }, [authReady, user, userRole, navigate])

  const message = !authReady
    ? user
      ? 'Signing you in…'
      : 'Checking your session…'
    : 'Opening your studio…'

  return (
    <AuthProgressScreen
      message={message}
      subtitle={STUDIO_BRAND_FULL}
    />
  )
}
