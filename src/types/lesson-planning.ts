import type { UserProfile } from './user'

export type LessonPageTab = 'content' | 'students'

export type LessonTemplateSkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type LessonTemplateStatus = 'active' | 'archived'
export type AssignedLessonStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_review'
  | 'completed'
  | 'archived'

export type LessonBlockType =
  | 'text'
  | 'notation_image'
  | 'video'
  | 'audio'
  | 'tempo'
  | 'rudiment'
  | 'checklist'
  | 'resource_link'

export interface TextBlockContent {
  /** Plain text or simple HTML from the rich text editor */
  body: string
}

export interface NotationImageBlockContent {
  url: string
  caption?: string
}

export interface VideoBlockContent {
  url: string
  source: 'upload' | 'youtube' | 'vimeo' | 'link'
  title?: string
}

export interface AudioBlockContent {
  url: string
  title?: string
}

export interface TempoBlockContent {
  /** BPM at the start of this lesson section */
  starting_bpm?: number
  /** Student progress — usually set by student, not in builder */
  current_bpm?: number
  /** Target BPM to reach by end of practice */
  target_bpm?: number
  notes?: string
  /** Minutes to spend at each tempo step (optional) */
  minutes_per_step?: number
}

export type StickingHand = 'R' | 'L' | 'K'

export interface RudimentBlockContent {
  name: string
  /** Space-separated R L K — kept for display & legacy */
  sticking_pattern: string
  /** Structured sticking for the visual builder */
  sticking_hands?: StickingHand[]
  notes?: string
  tempo_goal?: number
}

export type ChecklistTaskType = 'practice' | 'watch' | 'listen' | 'record' | 'read' | 'custom'

export interface ChecklistItem {
  id: string
  label: string
  hint?: string
  task_type?: ChecklistTaskType
}

export interface ChecklistBlockContent {
  items: ChecklistItem[]
  /** Shown above the task list for students */
  instructions?: string
}

export interface ResourceLinkBlockContent {
  label: string
  url: string
  link_type?: string
}

export type LessonBlockContent =
  | TextBlockContent
  | NotationImageBlockContent
  | VideoBlockContent
  | AudioBlockContent
  | TempoBlockContent
  | RudimentBlockContent
  | ChecklistBlockContent
  | ResourceLinkBlockContent

export interface LessonTemplate {
  id: string
  teacher_id: string
  title: string
  short_description?: string | null
  category: string
  skill_level: LessonTemplateSkillLevel
  estimated_duration_minutes?: number | null
  lesson_goal?: string | null
  teacher_notes?: string | null
  student_instructions?: string | null
  practice_assignment?: string | null
  status: LessonTemplateStatus
  created_at: string
  updated_at: string
  blocks?: LessonTemplateBlock[]
  assigned_count?: number
  completed_count?: number
}

export interface LessonTemplateBlock {
  id: string
  template_id: string
  sort_order: number
  block_type: LessonBlockType
  content: LessonBlockContent
  created_at: string
  updated_at: string
}

export interface AssignedLesson {
  id: string
  teacher_id: string
  student_id: string
  template_id?: string | null
  title: string
  short_description?: string | null
  category?: string | null
  skill_level?: LessonTemplateSkillLevel | null
  estimated_duration_minutes?: number | null
  lesson_goal?: string | null
  teacher_notes?: string | null
  student_instructions?: string | null
  practice_assignment?: string | null
  custom_student_instructions?: string | null
  custom_teacher_notes?: string | null
  target_bpm?: number | null
  current_bpm?: number | null
  student_progress_notes?: string | null
  assigned_at: string
  due_date?: string | null
  status: AssignedLessonStatus
  completed_at?: string | null
  created_at: string
  updated_at: string
  blocks?: AssignedLessonBlock[]
  student?: UserProfile
  template?: Pick<LessonTemplate, 'id' | 'title'> | null
}

export interface AssignedLessonBlock {
  id: string
  assigned_lesson_id: string
  source_block_id?: string | null
  sort_order: number
  block_type: LessonBlockType
  content: LessonBlockContent
  created_at: string
  updated_at: string
}

export interface LessonSessionNote {
  id: string
  teacher_id: string
  student_id: string
  assigned_lesson_id?: string | null
  scheduled_lesson_id?: string | null
  lesson_date: string
  what_covered?: string | null
  what_improved?: string | null
  what_needs_work?: string | null
  teacher_private_notes?: string | null
  student_summary?: string | null
  homework_assigned?: string | null
  next_lesson_focus?: string | null
  resource_links: { label: string; url: string }[]
  created_at: string
  updated_at: string
  student?: UserProfile
  assigned_lesson?: Pick<AssignedLesson, 'id' | 'title'> | null
}

export interface PracticeTaskCompletion {
  id: string
  assigned_lesson_id: string
  block_id: string
  item_id: string
  student_id: string
  completed_at: string
  practice_note?: string | null
  media_url?: string | null
}

export interface StudentPracticeNote {
  id: string
  assigned_lesson_id: string
  student_id: string
  block_id?: string | null
  body: string
  media_url?: string | null
  created_at: string
}

export type AssignedLessonNoteVisibility = 'private' | 'shared'

export interface AssignedLessonNote {
  id: string
  assigned_lesson_id: string
  author_id: string
  body: string
  visibility: AssignedLessonNoteVisibility
  created_at: string
  updated_at: string
}
