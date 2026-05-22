import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import PwaInstallBanner from './PwaInstallBanner'
import NotificationPermissionPrompt from './NotificationPermissionPrompt'

interface StudioPortalChromeProps {
  children: ReactNode
  portal: 'student' | 'studio'
}

/** PWA install + notification prompts for authenticated studio routes only */
export default function StudioPortalChrome({ children, portal: _portal }: StudioPortalChromeProps) {
  const location = useLocation()
  const onMessages = location.pathname.includes('/messages')

  return (
    <>
      {children}
      <PwaInstallBanner />
      <NotificationPermissionPrompt onMessagesPage={onMessages} />
    </>
  )
}
