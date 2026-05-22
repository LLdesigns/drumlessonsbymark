import { useEffect, useState } from 'react'
import {
  dismissInstallPrompt,
  getInstallPlatform,
  isIOS,
  isMobileDevice,
  isStandalonePwa,
  wasInstallPromptDismissed,
} from '../../lib/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIosSteps, setShowIosSteps] = useState(false)

  useEffect(() => {
    if (!isMobileDevice() || isStandalonePwa() || wasInstallPromptDismissed()) return

    const platform = getInstallPlatform()
    if (platform === 'ios') {
      const t = window.setTimeout(() => setVisible(true), 2500)
      return () => clearTimeout(t)
    }

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (!visible) return null

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIosSteps(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
    setVisible(false)
    setShowIosSteps(false)
  }

  return (
    <div className="studio-pwa-banner" role="region" aria-label="Install app">
      <div className="studio-pwa-banner__inner">
        <div className="studio-pwa-banner__icon" aria-hidden="true">
          <i className="bi bi-phone" />
        </div>
        <div className="studio-pwa-banner__text">
          <strong>Add Mark&apos;s Studio to your home screen</strong>
          <p>Faster access and lesson notifications — like a private studio app.</p>
          {showIosSteps ? (
            <ol className="studio-pwa-banner__steps">
              <li>Tap the <strong>Share</strong> button in Safari</li>
              <li>Choose <strong>Add to Home Screen</strong></li>
              <li>Open the app from your home screen anytime</li>
            </ol>
          ) : null}
        </div>
        <div className="studio-pwa-banner__actions">
          {!showIosSteps ? (
            <button type="button" className="studio-btn studio-btn--primary" onClick={handleInstall}>
              {isIOS() ? 'How to install' : 'Install'}
            </button>
          ) : null}
          <button type="button" className="studio-btn studio-btn--ghost" onClick={handleDismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
