import { isIOS, isMobileDevice } from './pwa'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let listenerInit = false
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach((cb) => cb())
}

export function initPwaInstallController() {
  if (listenerInit || typeof window === 'undefined') return
  listenerInit = true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function subscribePwaInstall(onChange: () => void): () => void {
  initPwaInstallController()
  subscribers.add(onChange)
  onChange()
  return () => subscribers.delete(onChange)
}

export function hasDeferredInstallPrompt(): boolean {
  return deferredPrompt !== null
}

export async function runDeferredInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  const prompt = deferredPrompt
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  deferredPrompt = null
  notify()
  return outcome
}

/** Show install action when not already running as an installed PWA */
export function shouldOfferInstallInMenu(): boolean {
  if (typeof window === 'undefined') return false
  if (isIOS() || isMobileDevice()) return true
  return hasDeferredInstallPrompt()
}
