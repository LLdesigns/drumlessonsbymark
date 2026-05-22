import type { ReactNode } from 'react'
import StudioShell, { type StudioNavItem } from '../studio/StudioShell'
import { useAuthStore } from '../../store/auth'
import { roleDisplayLabel } from '../../lib/studio-service'

const markNav: StudioNavItem[] = [
  { path: '/studio/dashboard', label: 'Dashboard', icon: 'bi-grid' },
  { path: '/studio/students', label: 'Students', icon: 'bi-people' },
  { path: '/studio/lesson-planning', label: 'Lesson Library', icon: 'bi-journal-richtext' },
  { path: '/studio/schedule', label: 'Schedule', icon: 'bi-calendar-week' },
  { path: '/studio/messages', label: 'Messages', icon: 'bi-chat-dots' },
  { path: '/studio/lesson-notes', label: 'Lesson Notes', icon: 'bi-journal-text' },
]

interface MarkStudioLayoutProps {
  children: ReactNode
}

export default function MarkStudioLayout({ children }: MarkStudioLayoutProps) {
  const { userRole } = useAuthStore()
  return (
    <StudioShell variant="teacher" navItems={markNav} profileRoleLabel={roleDisplayLabel(userRole)}>
      {children}
    </StudioShell>
  )
}
