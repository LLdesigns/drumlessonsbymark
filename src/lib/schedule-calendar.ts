import type { ScheduledLesson } from '../types/studio'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export { WEEKDAYS }

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Default lesson time when clicking an empty day (5:00 PM local). */
export function toDatetimeLocalValue(d: Date, hour = 17, minute = 0): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

/** 6 rows × 7 cols starting Sunday */
export function getCalendarWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const gridStart = new Date(first)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const weeks: Date[][] = []
  let cursor = new Date(gridStart)

  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function groupLessonsByDay(lessons: ScheduledLesson[]): Map<string, ScheduledLesson[]> {
  const map = new Map<string, ScheduledLesson[]>()
  for (const lesson of lessons) {
    const key = toDateKey(new Date(lesson.starts_at))
    const list = map.get(key) ?? []
    list.push(lesson)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }
  return map
}

export function formatLessonTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatLessonDateLong(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function lessonStatusClass(status: ScheduledLesson['status']): string {
  switch (status) {
    case 'cancelled':
      return 'studio-schedule-lesson--cancelled'
    case 'completed':
      return 'studio-schedule-lesson--completed'
    case 'rescheduled':
      return 'studio-schedule-lesson--rescheduled'
    default:
      return ''
  }
}
