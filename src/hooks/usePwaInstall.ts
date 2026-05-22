import { useEffect } from 'react'
import {
  initPwaInstallController,
  runDeferredInstallPrompt,
  shouldOfferInstallInMenu,
} from '../lib/pwa-install-controller'
import { isIOS, isStandalonePwa } from '../lib/pwa'

export function usePwaInstall() {
  useEffect(() => {
    initPwaInstallController()
  }, [])

  const isInstalled = isStandalonePwa()
  const showInstallOption = !isInstalled && shouldOfferInstallInMenu()

  const install = async (): Promise<'ios' | 'accepted' | 'dismissed' | 'unavailable'> => {
    if (isIOS()) return 'ios'
    const outcome = await runDeferredInstallPrompt()
    return outcome
  }

  return {
    isInstalled,
    showInstallOption,
    isIOS: isIOS(),
    install,
  }
}
