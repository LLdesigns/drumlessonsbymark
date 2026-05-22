import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/themeStore'

/** Initializes theme from storage, then syncs with profile when auth loads. */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, authReady } = useAuthStore()
  const { init, hydrateFromProfile, ready } = useThemeStore()

  useEffect(() => {
    init()
  }, [init])

  const profileThemePref = userProfile?.theme_preference

  useEffect(() => {
    if (!ready || !authReady) return
    hydrateFromProfile(user?.id ?? null, profileThemePref ?? null)
  }, [user?.id, profileThemePref, authReady, ready, hydrateFromProfile])

  return <>{children}</>
}
