import { 
  LayoutDashboard, 
  MousePointer, 
  Square, 
  Badge, 
  Type, 
  SquareStack, 
  ChevronDown, 
  BarChart3, 
  Bell, 
  Palette, 
  Move
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: any
}

export const designSystemNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'buttons', label: 'Buttons', icon: MousePointer },
  { id: 'cards', label: 'Cards', icon: Square },
  { id: 'badges', label: 'Badges', icon: Badge },
  { id: 'inputs', label: 'Inputs', icon: Type },
  { id: 'modals', label: 'Modals', icon: SquareStack },
  { id: 'accordions', label: 'Accordions', icon: ChevronDown },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'toasts', label: 'Toasts', icon: Bell },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Move },
  { id: 'colors', label: 'Colors', icon: Palette }
]
