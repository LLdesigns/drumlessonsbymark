import { create } from 'zustand'
import { useAuthStore } from './auth'
import {
  applyThemeMode,
  fetchProfileThemePreference,
  persistLocalTheme,
  readLocalThemeMode,
  readLocalThemePreference,
  resolveThemeMode,
  saveProfileThemePreference,
  subscribeSystemTheme,
  type ThemeMode,
  type ThemePreference,
  isThemePreference,
} from '../lib/theme-preference'

let systemUnsubscribe: (() => void) | null = null

function clearSystemListener() {
  if (systemUnsubscribe) {
    systemUnsubscribe()
    systemUnsubscribe = null
  }
}

function bindSystemListener(
  preference: ThemePreference,
  setResolved: (mode: ThemeMode) => void
) {
  clearSystemListener()
  if (preference !== 'system') return

  systemUnsubscribe = subscribeSystemTheme((mode) => {
    applyThemeMode(mode)
    persistLocalTheme('system', mode)
    setResolved(mode)
  })
}

function applyPreference(preference: ThemePreference): ThemeMode {
  const mode = resolveThemeMode(preference)
  applyThemeMode(mode)
  persistLocalTheme(preference, mode)
  return mode
}

interface ThemeState {
  preference: ThemePreference
  resolved: ThemeMode
  ready: boolean
  init: () => void
  hydrateFromProfile: (userId: string | null, profilePreference?: string | null) => Promise<void>
  setPreference: (preference: ThemePreference, userId?: string | null) => Promise<void>
  toggleMode: (userId?: string | null) => Promise<void>
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'dark',
  resolved: 'dark',
  ready: false,

  init: () => {
    const localPref = readLocalThemePreference()
    const localMode = readLocalThemeMode()
    const preference: ThemePreference = localPref ?? localMode ?? 'dark'
    const resolved = applyPreference(preference)
    set({ preference, resolved, ready: true })
    bindSystemListener(preference, (mode) => set({ resolved: mode }))
  },

  hydrateFromProfile: async (userId, profilePreference) => {
    let preference: ThemePreference = 'dark'

    if (isThemePreference(profilePreference)) {
      preference = profilePreference
    } else if (userId) {
      try {
        const remote = await fetchProfileThemePreference(userId)
        if (remote) preference = remote
      } catch {
        const local = readLocalThemePreference()
        if (local) preference = local
      }
    } else {
      const local = readLocalThemePreference()
      if (local) preference = local
    }

    const resolved = applyPreference(preference)
    set({ preference, resolved, ready: true })
    bindSystemListener(preference, (mode) => set({ resolved: mode }))
  },

  setPreference: async (preference, userId) => {
    const resolved = applyPreference(preference)
    set({ preference, resolved })
    bindSystemListener(preference, (mode) => set({ resolved: mode }))

    if (userId) {
      try {
        await saveProfileThemePreference(userId, preference)
        const profile = useAuthStore.getState().userProfile
        if (profile) {
          useAuthStore.setState({
            userProfile: { ...profile, theme_preference: preference },
          })
        }
      } catch (e) {
        console.error('Failed to save theme preference', e)
      }
    }
  },

  toggleMode: async (userId) => {
    const next: ThemeMode = get().resolved === 'dark' ? 'light' : 'dark'
    await get().setPreference(next, userId)
  },
}))
