import { defaultBlockContent, newChecklistItem } from './lesson-planning-constants'
import type { EditableBlock } from './lesson-builder-utils'
import type { LessonTemplateSkillLevel } from '../types/lesson-planning'

export interface LessonStarterTemplate {
  id: string
  name: string
  icon: string
  description: string
  title: string
  category: string
  skill_level: LessonTemplateSkillLevel
  duration: number
  lesson_goal: string
  blocks: () => EditableBlock[]
}

function block(type: EditableBlock['block_type'], displayTitle: string, extra: Record<string, unknown> = {}): EditableBlock {
  return {
    id: crypto.randomUUID(),
    block_type: type,
    content: { ...defaultBlockContent(type), displayTitle, ...extra } as EditableBlock['content'],
    sort_order: 0,
  }
}

export const LESSON_STARTER_TEMPLATES: LessonStarterTemplate[] = [
  {
    id: 'groove',
    name: 'Groove Lesson',
    icon: 'bi-disc',
    description: 'Rock, funk, or pop groove with demo and tempo goals',
    title: 'Beginner Rock Groove',
    category: 'Grooves',
    skill_level: 'beginner',
    duration: 30,
    lesson_goal: 'Play a steady rock groove with consistent hi-hat and kick pattern.',
    blocks: () => [
      { ...block('text', 'Lesson overview', { body: 'Today we focus on a basic rock groove. Keep the hi-hat steady and lock in with the metronome.' }), sort_order: 0 },
      { ...block('video', 'Groove demonstration', { title: 'Groove demonstration' }), sort_order: 1 },
      { ...block('notation_image', 'Basic rock groove', { caption: 'Basic rock groove' }), sort_order: 2 },
      { ...block('tempo', 'Tempo goals', { starting_bpm: 60, target_bpm: 90, notes: 'Clean timing before speed.' }), sort_order: 3 },
      { ...block('checklist', 'Practice tasks', { items: [newChecklistItem('Play groove at 70 BPM for 5 min'), newChecklistItem('Watch demo video'), newChecklistItem('Record yourself once')] }), sort_order: 4 },
    ],
  },
  {
    id: 'rudiment',
    name: 'Rudiment Lesson',
    icon: 'bi-lightning-charge',
    description: 'Sticking patterns, tempo building, and focused practice',
    title: 'Paradiddle Development',
    category: 'Rudiments',
    skill_level: 'intermediate',
    duration: 25,
    lesson_goal: 'Clean paradiddles with even strokes and controlled accents.',
    blocks: () => [
      { ...block('text', 'Lesson focus', { body: 'We build paradiddle control — start slow, stay relaxed, aim for even sound.' }), sort_order: 0 },
      { ...block('rudiment', 'Paradiddle', { name: 'Paradiddle', sticking_pattern: 'R L R R · L R L L', tempo_goal: 100 }), sort_order: 1 },
      { ...block('tempo', 'Tempo progression', { starting_bpm: 60, target_bpm: 110 }), sort_order: 2 },
      { ...block('checklist', 'Weekly practice', { items: [newChecklistItem('Paradiddles 4 days this week'), newChecklistItem('Use a metronome every session')] }), sort_order: 3 },
    ],
  },
  {
    id: 'song',
    name: 'Song Breakdown',
    icon: 'bi-music-note-list',
    description: 'Sections, fills, and play-along resources',
    title: 'Song Section Breakdown',
    category: 'Songs',
    skill_level: 'intermediate',
    duration: 45,
    lesson_goal: 'Learn the verse and chorus grooves and connect the transitions.',
    blocks: () => [
      { ...block('text', 'Song intro', { body: 'Break the song into sections. Master each part before full play-through.' }), sort_order: 0 },
      { ...block('video', 'Section demo', { title: 'Verse groove demo' }), sort_order: 1 },
      { ...block('notation_image', 'Verse chart', { caption: 'Verse notation' }), sort_order: 2 },
      { ...block('resource_link', 'Play-along track', { label: 'Drumless / play-along', url: '' }), sort_order: 3 },
      { ...block('checklist', 'Practice plan', { items: [newChecklistItem('Learn verse groove'), newChecklistItem('Learn chorus groove'), newChecklistItem('Connect transitions')] }), sort_order: 4 },
    ],
  },
  {
    id: 'technique',
    name: 'Technique Lesson',
    icon: 'bi-hand-index',
    description: 'Grip, posture, motion, and focused exercises',
    title: 'Wrist & Grip Technique',
    category: 'Technique',
    skill_level: 'beginner',
    duration: 30,
    lesson_goal: 'Relaxed grip and efficient wrist motion for controlled strokes.',
    blocks: () => [
      { ...block('text', 'Technique focus', { body: 'Keep wrists relaxed. Let the stick rebound — don’t choke the sound.' }), sort_order: 0 },
      { ...block('video', 'Technique demo', { title: 'Grip & wrist motion' }), sort_order: 1 },
      { ...block('checklist', 'Practice reminders', { items: [newChecklistItem('Mirror check posture'), newChecklistItem('5 min slow singles daily')] }), sort_order: 2 },
    ],
  },
  {
    id: 'beginner',
    name: 'Beginner Lesson',
    icon: 'bi-stars',
    description: 'Simple structure for first-time or early students',
    title: 'First Lesson — Getting Started',
    category: 'Technique',
    skill_level: 'beginner',
    duration: 30,
    lesson_goal: 'Comfortable setup, basic stroke, and first groove pattern.',
    blocks: () => [
      { ...block('text', 'Welcome', { body: 'Welcome to the kit! Today: setup, stick grip, and your first pattern.' }), sort_order: 0 },
      { ...block('video', 'Setup & grip', { title: 'Drum setup & grip' }), sort_order: 1 },
      { ...block('tempo', 'Starting tempo', { starting_bpm: 50, target_bpm: 70 }), sort_order: 2 },
      { ...block('checklist', 'This week', { items: [newChecklistItem('Practice 10 min daily'), newChecklistItem('Review setup video')] }), sort_order: 3 },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    icon: 'bi-plus-square',
    description: 'Start from scratch with an empty lesson',
    title: 'Untitled Lesson',
    category: 'Technique',
    skill_level: 'beginner',
    duration: 30,
    lesson_goal: '',
    blocks: () => [],
  },
]
