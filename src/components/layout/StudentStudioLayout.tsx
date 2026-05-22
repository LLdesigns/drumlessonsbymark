import type { ReactNode } from 'react'
import StudioShell, { type StudioNavItem } from '../studio/StudioShell'
import { useAuthStore } from '../../store/auth'
import { roleDisplayLabel } from '../../lib/studio-service'

const studentNav: StudioNavItem[] = [
  { path: '/student/home', label: 'Home', icon: 'bi-house' },
  { path: '/student/lessons', label: 'Lessons', icon: 'bi-journal-richtext' },
  { path: '/student/practice', label: 'Practice', icon: 'bi-music-note-beamed' },
  { path: '/student/messages', label: 'Messages', icon: 'bi-chat-dots' },
  { path: '/student/schedule', label: 'Schedule', icon: 'bi-calendar-week' },
  { path: '/student/progress', label: 'Progress', icon: 'bi-graph-up-arrow' },
]

interface StudentStudioLayoutProps {
  children: ReactNode
}

export default function StudentStudioLayout({ children }: StudentStudioLayoutProps) {
  const { userRole } = useAuthStore()
  return (
    <StudioShell variant="student" navItems={studentNav} profileRoleLabel={roleDisplayLabel(userRole)}>
      {children}
    </StudioShell>
  )
}
