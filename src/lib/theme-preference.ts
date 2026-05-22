import { supabase } from './supabase'
import { theme } from './theme'

export type ThemeMode = 'dark' | 'light'
export type ThemePreference = ThemeMode | 'system'

const STORAGE_KEY = 'theme'
const STORAGE_PREF_KEY = 'theme_preference'

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system'
}

export function resolveThemeMode(preference: ThemePreference): ThemeMode {
  if (preference === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }
  return preference
}

export function applyThemeMode(mode: ThemeMode): void {
  theme.setTheme(mode)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.style.colorScheme = mode
  }
}

export function readLocalThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  const pref = localStorage.getItem(STORAGE_PREF_KEY)
  return isThemePreference(pref) ? pref : null
}

export function readLocalThemeMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null
  const mode = localStorage.getItem(STORAGE_KEY)
  return mode === 'dark' || mode === 'light' ? mode : null
}

export function persistLocalTheme(preference: ThemePreference, mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_PREF_KEY, preference)
  localStorage.setItem(STORAGE_KEY, mode)
}

export async function fetchProfileThemePreference(userId: string): Promise<ThemePreference | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('theme_preference')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('theme_preference')) {
      return null
    }
    throw error
  }

  const pref = data?.theme_preference
  return isThemePreference(pref) ? pref : null
}

export async function saveProfileThemePreference(
  userId: string,
  preference: ThemePreference
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: preference })
    .eq('user_id', userId)

  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('theme_preference')) {
      console.warn('theme_preference column missing — run migration 20250523000000_profile_theme_preference.sql')
      return
    }
    throw error
  }
}

export function subscribeSystemTheme(onChange: (mode: ThemeMode) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => onChange(mq.matches ? 'dark' : 'light')
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
