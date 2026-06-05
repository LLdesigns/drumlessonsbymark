import type { AssignedLesson, StudentActivityEvent, StudioActivityEventName } from '../types/lesson-planning'

export interface ActivityFeedItem {
  id: string
  occurredAt: string
  icon: string
  label: string
  detail?: string
  lessonId?: string | null
  lessonTitle?: string
}

const EVENT_ICONS: Record<StudioActivityEventName, string> = {
  lesson_opened: 'bi-journal-text',
  lesson_completed: 'bi-check-circle',
  checklist_item_completed: 'bi-check2-square',
  checklist_item_unchecked: 'bi-square',
  block_viewed: 'bi-eye',
  block_played: 'bi-play-circle',
  notation_playback_started: 'bi-music-note-beamed',
  practice_media_uploaded: 'bi-mic',
}

function props(event: StudentActivityEvent): Record<string, unknown> {
  return (event.properties && typeof event.properties === 'object' ? event.properties : {}) as Record<
    string,
    unknown
  >
}

export function formatActivityEvent(
  event: StudentActivityEvent,
  lessonTitleById: Map<string, string>
): ActivityFeedItem {
  const p = props(event)
  const lessonTitle =
    (typeof p.lesson_title === 'string' ? p.lesson_title : null) ??
    (event.assigned_lesson_id ? lessonTitleById.get(event.assigned_lesson_id) : undefined)

  let label = 'Practice activity'
  let detail: string | undefined

  switch (event.event_name) {
    case 'lesson_opened':
      label = 'Opened lesson'
      detail = lessonTitle
      break
    case 'lesson_completed':
      label = 'Marked lesson complete'
      detail = lessonTitle
      break
    case 'checklist_item_completed':
      label = p.auto ? 'Task auto-completed' : 'Completed practice task'
      detail = typeof p.task_label === 'string' ? p.task_label : undefined
      break
    case 'checklist_item_unchecked':
      label = 'Unchecked task'
      detail = typeof p.task_label === 'string' ? p.task_label : undefined
      break
    case 'block_viewed':
      label = 'Engaged with lesson content'
      detail = lessonTitle
      break
    case 'block_played':
      label = 'Played lesson content'
      detail = lessonTitle
      break
    case 'notation_playback_started':
      label = 'Played sequencer groove'
      detail = lessonTitle
      break
    case 'practice_media_uploaded':
      label = 'Uploaded practice recording'
      detail =
        typeof p.file_name === 'string'
          ? p.file_name
          : lessonTitle
      break
    default:
      break
  }

  return {
    id: event.id,
    occurredAt: event.occurred_at,
    icon: EVENT_ICONS[event.event_name] ?? 'bi-activity',
    label,
    detail,
    lessonId: event.assigned_lesson_id,
    lessonTitle,
  }
}

export function buildLessonTitleMap(lessons: AssignedLesson[]): Map<string, string> {
  return new Map(lessons.map((l) => [l.id, l.title]))
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Consecutive practice days ending today or yesterday (if nothing yet today). */
export function computePracticeStreakFromDates(practiceDates: Set<string>): number {
  if (practiceDates.size === 0) return 0

  const cursor = new Date()
  const todayKey = toLocalDateKey(cursor)

  if (!practiceDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (practiceDates.has(toLocalDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function practiceDatesFromEvents(events: StudentActivityEvent[]): Set<string> {
  const dates = new Set<string>()
  for (const e of events) {
    dates.add(toLocalDateKey(new Date(e.occurred_at)))
  }
  return dates
}
