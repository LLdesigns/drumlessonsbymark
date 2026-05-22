import type { UserProfile } from './user'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro'
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
export type MessageType = 'chat' | 'reminder' | 'encouragement' | 'lesson_note' | 'link'
export type MilestoneType = 'lesson' | 'song' | 'rudiment' | 'streak' | 'custom'

export interface StudentProfile {
  student_id: string
  teacher_id: string
  age?: number | null
  skill_level?: SkillLevel | null
  favorite_music?: string | null
  goals?: string | null
  private_notes?: string | null
  practice_streak?: number
  created_at: string
  updated_at: string
  profile?: UserProfile
}

export interface ScheduledLesson {
  id: string
  teacher_id: string
  student_id: string
  starts_at: string
  duration_minutes: number
  status: LessonStatus
  location?: string | null
  is_recurring: boolean
  recurrence_rule?: string | null
  notes?: string | null
  cancelled_at?: string | null
  rescheduled_from_id?: string | null
  created_at: string
  updated_at: string
  student?: UserProfile
}

export interface LessonNote {
  id: string
  teacher_id: string
  student_id: string
  scheduled_lesson_id?: string | null
  title: string
  summary?: string | null
  practice_focus?: string | null
  songs: string[]
  rudiments: string[]
  resource_links: { label: string; url: string }[]
  visible_to_student: boolean
  created_at: string
  updated_at: string
  student?: UserProfile
}

export interface PracticeAssignment {
  id: string
  teacher_id: string
  student_id: string
  lesson_note_id?: string | null
  title: string
  description?: string | null
  songs: string[]
  rudiments: string[]
  video_url?: string | null
  due_date?: string | null
  status: 'active' | 'completed' | 'archived'
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface StudioMessage {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  message_type: MessageType
  link_url?: string | null
  read_at?: string | null
  created_at: string
  sender?: UserProfile
  recipient?: UserProfile
}

export interface StudentMilestone {
  id: string
  student_id: string
  teacher_id: string
  title: string
  description?: string | null
  milestone_type: MilestoneType
  achieved_at: string
  created_at: string
}

export interface StudioStudent extends UserProfile {
  studio_profile?: StudentProfile | null
}
