import { supabase } from './supabase'
import { computePracticeStreakFromDates, practiceDatesFromEvents } from './activity-feed'
import type { StudioActivityEventName } from '../types/lesson-planning'
export interface TrackStudioEventParams {
  studentId: string
  eventName: StudioActivityEventName
  assignedLessonId?: string | null
  blockId?: string | null
  itemId?: string | null
  properties?: Record<string, unknown>
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || error.message?.includes('does not exist') === true
}

export async function trackStudioEvent(params: TrackStudioEventParams): Promise<void> {
  const { error } = await supabase.from('student_activity_events').insert({
    student_id: params.studentId,
    assigned_lesson_id: params.assignedLessonId ?? null,
    block_id: params.blockId ?? null,
    item_id: params.itemId ?? null,
    event_name: params.eventName,
    properties: params.properties ?? {},
    occurred_at: new Date().toISOString(),
  })

  if (isMissingTableError(error)) return
  if (error) {
    console.warn('[studio-analytics] Failed to track event', params.eventName, error.message)
    return
  }

  void syncPracticeStreak(params.studentId)
}

async function syncPracticeStreak(studentId: string): Promise<void> {
  const { data: events, error: fetchError } = await supabase
    .from('student_activity_events')
    .select('occurred_at')
    .eq('student_id', studentId)
    .order('occurred_at', { ascending: false })
    .limit(120)

  if (fetchError || !events?.length) return

  const dates = practiceDatesFromEvents(
    events.map((e, i) => ({
      id: String(i),
      student_id: studentId,
      event_name: 'lesson_opened' as StudioActivityEventName,
      occurred_at: e.occurred_at,
    }))
  )
  const streak = computePracticeStreakFromDates(dates)

  await supabase.from('student_profiles').update({ practice_streak: streak }).eq('student_id', studentId)
}
