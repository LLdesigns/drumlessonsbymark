/** PWA install & device detection — no auto-install; user gesture only */

export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'unknown'

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function getInstallPlatform(): InstallPlatform {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) return 'desktop'
  return isMobileDevice() ? 'unknown' : 'desktop'
}

/** Installed to home screen / standalone display mode */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

const INSTALL_DISMISS_KEY = 'studio_pwa_install_dismissed'
const INSTALL_DISMISS_DAYS = 14

export function wasInstallPromptDismissed(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_KEY)
    if (!raw) return false
    const dismissedAt = parseInt(raw, 10)
    return Date.now() - dismissedAt < INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString())
}

const NOTIFY_PROMPT_KEY = 'studio_notify_prompt_state'

export type NotifyPromptState = 'pending' | 'asked' | 'granted' | 'denied' | 'dismissed'

export function getNotifyPromptState(): NotifyPromptState {
  return (localStorage.getItem(NOTIFY_PROMPT_KEY) as NotifyPromptState) || 'pending'
}

export function setNotifyPromptState(state: NotifyPromptState): void {
  localStorage.setItem(NOTIFY_PROMPT_KEY, state)
}

const NOTIFY_CONTEXT_KEY = 'studio_notify_context_seen'

/** User has used messaging — OK to ask for notification permission */
export function markMessagingActivity(): void {
  localStorage.setItem(NOTIFY_CONTEXT_KEY, '1')
}

export function hasMessagingActivity(): boolean {
  return localStorage.getItem(NOTIFY_CONTEXT_KEY) === '1'
}
