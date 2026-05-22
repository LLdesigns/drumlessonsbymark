import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/themeStore'
import { getToken } from '../lib/theme'
import type { ThemePreference } from '../lib/theme-preference'

/**
 * Theme hook — syncs with Supabase profile when logged in.
 */
export function useTheme() {
  const { user } = useAuthStore()
  const { preference, resolved, ready, setPreference, toggleMode, init } = useThemeStore()

  useEffect(() => {
    if (!ready) init()
  }, [ready, init])

  return {
    theme: resolved,
    preference,
    setTheme: (mode: 'dark' | 'light') => setPreference(mode, user?.id ?? null),
    setPreference: (pref: ThemePreference) => setPreference(pref, user?.id ?? null),
    toggleTheme: () => toggleMode(user?.id ?? null),
    tokens: {
      colors: {
        brand: {
          primary: () => getToken('--color-brand-primary'),
          primaryHover: () => getToken('--color-brand-primary-hover'),
          primaryActive: () => getToken('--color-brand-primary-active'),
          secondary: () => getToken('--color-brand-secondary'),
          tertiary: () => getToken('--color-brand-tertiary'),
        },
        background: {
          primary: () => getToken('--color-bg-primary'),
          secondary: () => getToken('--color-bg-secondary'),
          tertiary: () => getToken('--color-bg-tertiary'),
          overlay: () => getToken('--color-bg-overlay'),
          input: () => getToken('--color-bg-input'),
          inputError: () => getToken('--color-bg-input-error'),
        },
        text: {
          primary: () => getToken('--color-text-primary'),
          secondary: () => getToken('--color-text-secondary'),
          tertiary: () => getToken('--color-text-tertiary'),
          onPrimary: () => getToken('--color-text-on-primary'),
          onDark: () => getToken('--color-text-on-dark'),
        },
        border: {
          default: () => getToken('--color-border-default'),
          focus: () => getToken('--color-border-focus'),
          error: () => getToken('--color-border-error'),
          primary: () => getToken('--color-border-primary'),
        },
        semantic: {
          success: () => getToken('--color-success'),
          successLight: () => getToken('--color-success-light'),
          warning: () => getToken('--color-warning'),
          warningLight: () => getToken('--color-warning-light'),
          error: () => getToken('--color-error'),
          errorLight: () => getToken('--color-error-light'),
          info: () => getToken('--color-info'),
          infoLight: () => getToken('--color-info-light'),
        },
      },
    },
  }
}
