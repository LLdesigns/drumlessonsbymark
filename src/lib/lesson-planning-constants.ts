import type { AssignedLessonStatus, LessonBlockType, LessonTemplateSkillLevel } from '../types/lesson-planning'

export const LESSON_CATEGORIES = [
  'Rudiments',
  'Grooves',
  'Fills',
  'Songs',
  'Technique',
  'Reading Music',
  'Timing / Metronome',
  'Independence',
  'Ear Training',
  'Drum Setup',
  'Performance Prep',
] as const

export const LESSON_SKILL_LEVELS: { value: LessonTemplateSkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const ASSIGNED_LESSON_STATUSES: { value: AssignedLessonStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export const LESSON_BLOCK_TYPES: {
  type: LessonBlockType
  label: string
  icon: string
  description: string
}[] = [
  { type: 'text', label: 'Text', icon: 'bi-text-paragraph', description: 'Instructions and teaching notes' },
  {
    type: 'notation_image',
    label: 'Notation Image',
    icon: 'bi-file-earmark-music',
    description: 'Upload drum notation or sheet music',
  },
  { type: 'video', label: 'Video', icon: 'bi-camera-video', description: 'Demo videos or embeds' },
  { type: 'audio', label: 'Audio', icon: 'bi-music-note-beamed', description: 'Play-along or practice tracks' },
  { type: 'tempo', label: 'Tempo / BPM', icon: 'bi-speedometer2', description: 'BPM goals for this lesson' },
  { type: 'rudiment', label: 'Rudiment', icon: 'bi-lightning-charge', description: 'Sticking patterns and rudiments' },
  { type: 'checklist', label: 'Practice Tasks', icon: 'bi-check2-square', description: 'Homework checklist for student' },
  { type: 'resource_link', label: 'Resource Link', icon: 'bi-link-45deg', description: 'External links and references' },
]

export function statusLabel(status: AssignedLessonStatus): string {
  return ASSIGNED_LESSON_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function skillLevelLabel(level: LessonTemplateSkillLevel): string {
  return LESSON_SKILL_LEVELS.find((s) => s.value === level)?.label ?? level
}

export function newChecklistItem(
  label = '',
  taskType: 'practice' | 'watch' | 'listen' | 'record' | 'read' | 'custom' = 'practice'
): { id: string; label: string; task_type: typeof taskType } {
  return { id: crypto.randomUUID(), label, task_type: taskType }
}

export function defaultBlockContent(type: LessonBlockType, displayTitle?: string): Record<string, unknown> {
  const base = { displayTitle: displayTitle ?? '' }
  switch (type) {
    case 'text':
      return { ...base, body: '' }
    case 'notation_image':
      return { ...base, url: '', caption: '' }
    case 'video':
      return { ...base, url: '', source: 'link', title: displayTitle ?? '' }
    case 'audio':
      return { ...base, url: '', title: displayTitle ?? '' }
    case 'tempo':
      return { ...base, starting_bpm: 60, target_bpm: 90, notes: '', minutes_per_step: 3 }
    case 'rudiment':
      return { ...base, name: displayTitle ?? '', sticking_pattern: '', sticking_hands: [], notes: '', tempo_goal: 80 }
    case 'checklist':
      return {
        ...base,
        instructions: '',
        items: [{ ...newChecklistItem('Practice with metronome'), task_type: 'practice' as const }],
      }
    case 'resource_link':
      return { ...base, label: displayTitle ?? '', url: '', link_type: 'link' }
    default:
      return base
  }
}

export function detectVideoSource(url: string): 'youtube' | 'vimeo' | 'link' {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube'
  if (/vimeo\.com/i.test(url)) return 'vimeo'
  return 'link'
}

export function embedVideoUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/i)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}
