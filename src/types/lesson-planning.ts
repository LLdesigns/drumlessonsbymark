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

/** Who created the student's copy of a library lesson */
export type LessonEnrollmentSource = 'teacher' | 'student'

export type LessonBlockType =
  | 'text'
  | 'notation_image'
  | 'sequencer'
  | 'notation'
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

export type DrumVoiceId =
  | 'crash'
  | 'ride'
  | 'hihat'
  | 'snare'
  | 'tom'
  | 'tom_14'
  | 'tom_16'
  | 'kick'

/** true = normal hit; accent/open/ghost are snare/hihat variants */
export type DrumHit = true | 'accent' | 'open' | 'ghost'

export type DrumStep = Partial<Record<DrumVoiceId, DrumHit>>

export interface DrumNotationMeasure {
  id: string
  steps: DrumStep[]
}

export interface DrumNotationBlockContent {
  /** Beats per measure (usually 4) */
  beats_per_measure: number
  /** Subdivisions per beat: 2 = eighths, 4 = sixteenths */
  steps_per_beat: 2 | 4
  measures: DrumNotationMeasure[]
  caption?: string
  /** Playback tempo for groove preview (default 90) */
  playback_bpm?: number
  /** Repeat groove playback until stopped (default true) */
  playback_loop?: boolean
  /** Click track during playback (default true) */
  playback_metronome?: boolean
  /** Count-in bars before groove starts, 0–2 (default 1) */
  playback_count_in?: 0 | 1 | 2
}

/** Student practice tempo as a percentage of the teacher BPM */
export type DrumPracticeSpeed = 50 | 75 | 90 | 100

export const DRUM_PRACTICE_SPEEDS: DrumPracticeSpeed[] = [50, 75, 90, 100]

export type MusicNotationInstrument = 'piano' | 'guitar' | 'bass' | 'drums' | 'voice'

export type MusicNotationTimeSignature = '4/4' | '3/4' | '6/8'

export type MusicNotationKeySignature = 'C' | 'G' | 'D' | 'A' | 'E' | 'F' | 'Bb' | 'Eb'

export type MusicNotationClef = 'treble' | 'bass' | 'percussion'

export type MusicNotationDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export type MusicNotationPitch = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4' | 'C5'

export type MusicNotationDrumVoice = 'kick' | 'snare' | 'hihat' | 'tom' | 'crash' | 'ride'

export interface MusicNotationNote {
  id: string
  type: 'note' | 'rest'
  pitch?: MusicNotationPitch
  voice?: MusicNotationDrumVoice
  duration: MusicNotationDuration
  /** 1-based beat position within the measure (quarter-note units in 4/4) */
  startBeat: number
}

export interface MusicNotationMeasure {
  id: string
  notes: MusicNotationNote[]
}

export interface MusicNotationTrack {
  id: string
  name: string
  instrument: MusicNotationInstrument
  clef: MusicNotationClef
  measures: MusicNotationMeasure[]
}

export interface MusicNotationData {
  version: 1
  tracks: MusicNotationTrack[]
  /** Measures per staff row before wrapping to the next system (editor layout). */
  measuresPerSystem?: number
}

/** Student practice tempo as a percentage of the teacher BPM */
export type MusicPracticeSpeed = 50 | 75 | 100

export const MUSIC_PRACTICE_SPEEDS: MusicPracticeSpeed[] = [50, 75, 100]

export interface MusicNotationBlockContent {
  title?: string
  instrument: MusicNotationInstrument
  tempo: number
  timeSignature: MusicNotationTimeSignature
  keySignature: MusicNotationKeySignature
  caption?: string
  notationData: MusicNotationData
  /** Repeat playback until stopped (default false for student) */
  playback_loop?: boolean
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
  /** Block in this lesson this task relates to (template or assigned block id) */
  linked_block_id?: string
  /** Auto-check when linked block progress is recorded */
  auto_complete?: boolean
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
  | DrumNotationBlockContent
  | MusicNotationBlockContent
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
  enrollment_source?: LessonEnrollmentSource
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

export type BlockProgressKind = 'viewed' | 'played' | 'completed'

export interface StudentBlockProgress {
  id: string
  assigned_lesson_id: string
  block_id: string
  student_id: string
  progress_kind: BlockProgressKind
  payload?: Record<string, unknown>
  completed_at: string
}

export type StudioActivityEventName =
  | 'lesson_opened'
  | 'lesson_completed'
  | 'checklist_item_completed'
  | 'checklist_item_unchecked'
  | 'block_viewed'
  | 'block_played'
  | 'notation_playback_started'
  | 'practice_media_uploaded'

export interface StudentActivityEvent {
  id: string
  student_id: string
  assigned_lesson_id?: string | null
  block_id?: string | null
  item_id?: string | null
  event_name: StudioActivityEventName
  properties?: Record<string, unknown>
  occurred_at: string
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
