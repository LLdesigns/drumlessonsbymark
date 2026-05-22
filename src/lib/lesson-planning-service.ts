import { supabase } from './supabase'
import type {
  AssignedLesson,
  AssignedLessonBlock,
  AssignedLessonStatus,
  LessonBlockContent,
  LessonBlockType,
  LessonSessionNote,
  LessonTemplate,
  LessonTemplateBlock,
  PracticeTaskCompletion,
  StudentPracticeNote,
  AssignedLessonNote,
  AssignedLessonNoteVisibility,
} from '../types/lesson-planning'

export function isLessonPlanningSchemaMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  const msg = error.message ?? ''
  return /does not exist|could not find the table|schema cache/i.test(msg)
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return isLessonPlanningSchemaMissing(error)
}

/** User-facing message for save/load failures */
export function formatLessonPlanningError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { code?: string; message?: string }
    if (isLessonPlanningSchemaMissing(e)) {
      return 'Lesson planning tables are not set up in Supabase. Run supabase/sql/LESSON_PLANNING_RUN_IN_SUPABASE.sql in the SQL Editor (see file header for prerequisites).'
    }
    return e.message ?? 'Something went wrong'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong saving the lesson'
}

const SCHEMA_CACHE_KEY = 'lesson_planning_schema_ok_v1'

export async function checkLessonPlanningSchema(options?: {
  force?: boolean
}): Promise<{ ok: boolean; message?: string }> {
  if (!options?.force && typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem(SCHEMA_CACHE_KEY) === '1') {
      return { ok: true }
    }
  }

  const { error } = await supabase.from('lesson_templates').select('id').limit(1)
  if (isLessonPlanningSchemaMissing(error)) {
    sessionStorage.removeItem(SCHEMA_CACHE_KEY)
    return {
      ok: false,
      message:
        'Lesson planning database tables are missing. Run supabase/sql/LESSON_PLANNING_RUN_IN_SUPABASE.sql in your Supabase SQL Editor.',
    }
  }
  if (error) return { ok: false, message: error.message }
  sessionStorage.setItem(SCHEMA_CACHE_KEY, '1')
  return { ok: true }
}

function normalizeSessionNote(note: LessonSessionNote): LessonSessionNote {
  return {
    ...note,
    resource_links: Array.isArray(note.resource_links) ? note.resource_links : [],
  }
}

// ——— Lesson Templates ———

export async function fetchLessonTemplates(
  teacherId: string,
  options?: { status?: 'active' | 'archived' | 'all'; search?: string; category?: string }
): Promise<LessonTemplate[]> {
  let query = supabase
    .from('lesson_templates')
    .select('*, assigned_lessons(status)')
    .eq('teacher_id', teacherId)
    .order('updated_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options?.category) query = query.eq('category', options.category)
  if (options?.search) query = query.ilike('title', `%${options.search}%`)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error

  type Row = LessonTemplate & {
    assigned_lessons?: { status: AssignedLessonStatus }[] | null
  }

  return ((data ?? []) as Row[]).map((row) => {
    const { assigned_lessons, ...t } = row
    const active = (assigned_lessons ?? []).filter((a) => a.status !== 'archived')
    return {
      ...(t as LessonTemplate),
      assigned_count: active.length,
      completed_count: active.filter((a) => a.status === 'completed').length,
    }
  })
}

function sortByOrder<T extends { sort_order: number }>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => a.sort_order - b.sort_order)
}

export async function fetchLessonTemplate(id: string): Promise<LessonTemplate | null> {
  const { data, error } = await supabase
    .from('lesson_templates')
    .select('*, lesson_template_blocks(*)')
    .eq('id', id)
    .maybeSingle()
  if (isMissingTableError(error)) throw new Error(formatLessonPlanningError(error))
  if (error) throw error
  if (!data) return null

  const row = data as LessonTemplate & { lesson_template_blocks?: LessonTemplateBlock[] }
  const { lesson_template_blocks, ...template } = row
  return {
    ...(template as LessonTemplate),
    blocks: sortByOrder(lesson_template_blocks ?? []),
  }
}

export async function fetchTemplateBlocks(templateId: string): Promise<LessonTemplateBlock[]> {
  const { data, error } = await supabase
    .from('lesson_template_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as LessonTemplateBlock[]
}

export async function createLessonTemplate(
  template: Omit<LessonTemplate, 'id' | 'created_at' | 'updated_at' | 'blocks' | 'assigned_count'>
): Promise<LessonTemplate> {
  const { data, error } = await supabase.from('lesson_templates').insert(template).select().single()
  if (error) throw error
  return data as LessonTemplate
}

export async function updateLessonTemplate(id: string, updates: Partial<LessonTemplate>) {
  const { blocks, assigned_count, ...rest } = updates as LessonTemplate
  const { data, error } = await supabase.from('lesson_templates').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data as LessonTemplate
}

export async function duplicateLessonTemplate(teacherId: string, templateId: string): Promise<LessonTemplate> {
  const original = await fetchLessonTemplate(templateId)
  if (!original) throw new Error('Template not found')

  const copy = await createLessonTemplate({
    teacher_id: teacherId,
    title: `${original.title} (copy)`,
    short_description: original.short_description,
    category: original.category,
    skill_level: original.skill_level,
    estimated_duration_minutes: original.estimated_duration_minutes,
    lesson_goal: original.lesson_goal,
    teacher_notes: original.teacher_notes,
    student_instructions: original.student_instructions,
    practice_assignment: original.practice_assignment,
    status: 'active',
  })

  const blocks = original.blocks ?? []
  if (blocks.length > 0) {
    await saveTemplateBlocks(
      copy.id,
      blocks.map((b, i) => ({
        block_type: b.block_type,
        content: b.content,
        sort_order: i,
      }))
    )
  }
  return (await fetchLessonTemplate(copy.id))!
}

export async function archiveLessonTemplate(id: string) {
  return updateLessonTemplate(id, { status: 'archived' })
}

export async function saveTemplateBlocks(
  templateId: string,
  blocks: { block_type: LessonBlockType; content: LessonBlockContent; sort_order: number }[]
) {
  await supabase.from('lesson_template_blocks').delete().eq('template_id', templateId)
  if (blocks.length === 0) return

  const rows = blocks.map((b) => ({
    template_id: templateId,
    block_type: b.block_type,
    content: b.content,
    sort_order: b.sort_order,
  }))
  const { error } = await supabase.from('lesson_template_blocks').insert(rows)
  if (error) throw error
}

// ——— Assigned Lessons ———

export async function fetchAssignedLessonsForTemplate(
  teacherId: string,
  templateId: string
): Promise<AssignedLesson[]> {
  const { data, error } = await supabase
    .from('assigned_lessons')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('template_id', templateId)
    .order('assigned_at', { ascending: false })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as AssignedLesson[]
}

export async function fetchAssignedLessons(
  userId: string,
  role: 'teacher' | 'student',
  options?: { studentId?: string; status?: AssignedLessonStatus | 'all'; templateId?: string }
): Promise<AssignedLesson[]> {
  let query = supabase.from('assigned_lessons').select('*').order('assigned_at', { ascending: false })

  query = role === 'teacher' ? query.eq('teacher_id', userId) : query.eq('student_id', userId)
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.templateId) query = query.eq('template_id', options.templateId)
  if (options?.status && options.status !== 'all') query = query.eq('status', options.status)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as AssignedLesson[]
}

export async function fetchAssignedLesson(id: string): Promise<AssignedLesson | null> {
  const { data, error } = await supabase
    .from('assigned_lessons')
    .select('*, assigned_lesson_blocks(*)')
    .eq('id', id)
    .maybeSingle()
  if (isMissingTableError(error)) return null
  if (error) throw error
  if (!data) return null

  const row = data as AssignedLesson & { assigned_lesson_blocks?: AssignedLessonBlock[] }
  const { assigned_lesson_blocks, ...lesson } = row
  return {
    ...(lesson as AssignedLesson),
    blocks: sortByOrder(assigned_lesson_blocks ?? []),
  }
}

export async function fetchAssignedLessonBlocks(lessonId: string): Promise<AssignedLessonBlock[]> {
  const { data, error } = await supabase
    .from('assigned_lesson_blocks')
    .select('*')
    .eq('assigned_lesson_id', lessonId)
    .order('sort_order', { ascending: true })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as AssignedLessonBlock[]
}

export async function attachTemplateToStudents(
  teacherId: string,
  templateId: string,
  studentIds: string[],
  customizations?: {
    custom_student_instructions?: string
    due_date?: string | null
  }
): Promise<AssignedLesson[]> {
  const template = await fetchLessonTemplate(templateId)
  if (!template) throw new Error('Template not found')

  const results: AssignedLesson[] = []

  for (const studentId of studentIds) {
    const assigned = await createAssignedLessonFromTemplate(teacherId, studentId, template, customizations)
    results.push(assigned)
  }
  return results
}

async function createAssignedLessonFromTemplate(
  teacherId: string,
  studentId: string,
  template: LessonTemplate,
  customizations?: { custom_student_instructions?: string; due_date?: string | null }
): Promise<AssignedLesson> {
  const { data, error } = await supabase
    .from('assigned_lessons')
    .insert({
      teacher_id: teacherId,
      student_id: studentId,
      template_id: template.id,
      title: template.title,
      short_description: template.short_description,
      category: template.category,
      skill_level: template.skill_level,
      estimated_duration_minutes: template.estimated_duration_minutes,
      lesson_goal: template.lesson_goal,
      teacher_notes: template.teacher_notes,
      student_instructions: template.student_instructions,
      practice_assignment: template.practice_assignment,
      custom_student_instructions: customizations?.custom_student_instructions ?? null,
      due_date: customizations?.due_date ?? null,
      status: 'not_started',
    })
    .select()
    .single()
  if (error) throw error

  const blocks = template.blocks ?? []
  if (blocks.length > 0) {
    const rows = blocks.map((b, i) => ({
      assigned_lesson_id: data.id,
      source_block_id: b.id,
      sort_order: i,
      block_type: b.block_type,
      content: b.content,
    }))
    const { error: blocksError } = await supabase.from('assigned_lesson_blocks').insert(rows)
    if (blocksError) throw blocksError
  }

  return (await fetchAssignedLesson(data.id))!
}

export async function updateAssignedLesson(id: string, updates: Partial<AssignedLesson>) {
  const { blocks, student, template, ...rest } = updates as AssignedLesson
  const { data, error } = await supabase.from('assigned_lessons').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data as AssignedLesson
}

export async function saveAssignedLessonBlocks(
  lessonId: string,
  blocks: { block_type: LessonBlockType; content: LessonBlockContent; sort_order: number; source_block_id?: string }[]
) {
  await supabase.from('assigned_lesson_blocks').delete().eq('assigned_lesson_id', lessonId)
  if (blocks.length === 0) return

  const rows = blocks.map((b) => ({
    assigned_lesson_id: lessonId,
    source_block_id: b.source_block_id ?? null,
    block_type: b.block_type,
    content: b.content,
    sort_order: b.sort_order,
  }))
  const { error } = await supabase.from('assigned_lesson_blocks').insert(rows)
  if (error) throw error
}

export async function markAssignedLessonComplete(id: string) {
  return updateAssignedLesson(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
}

// ——— Session Notes ———

export async function fetchSessionNotes(
  teacherId: string,
  options?: { studentId?: string; limit?: number }
): Promise<LessonSessionNote[]> {
  let query = supabase
    .from('lesson_session_notes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('lesson_date', { ascending: false })

  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []).map(normalizeSessionNote)
}

export async function fetchStudentSessionNotes(studentId: string): Promise<LessonSessionNote[]> {
  const { data, error } = await supabase
    .from('lesson_session_notes')
    .select(
      'id, student_id, lesson_date, student_summary, homework_assigned, next_lesson_focus, resource_links, created_at, updated_at, teacher_id, assigned_lesson_id, scheduled_lesson_id'
    )
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []).map(normalizeSessionNote)
}

export async function createSessionNote(
  note: Omit<LessonSessionNote, 'id' | 'created_at' | 'updated_at' | 'student' | 'assigned_lesson'>
) {
  const { data, error } = await supabase.from('lesson_session_notes').insert(note).select().single()
  if (error) throw error
  return normalizeSessionNote(data as LessonSessionNote)
}

export async function updateSessionNote(id: string, updates: Partial<LessonSessionNote>) {
  const { data, error } = await supabase
    .from('lesson_session_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeSessionNote(data as LessonSessionNote)
}

// ——— Student practice interactions ———

export async function fetchTaskCompletions(assignedLessonId: string): Promise<PracticeTaskCompletion[]> {
  const { data, error } = await supabase
    .from('practice_task_completions')
    .select('*')
    .eq('assigned_lesson_id', assignedLessonId)
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as PracticeTaskCompletion[]
}

export async function fetchStudentTaskCompletions(studentId: string): Promise<PracticeTaskCompletion[]> {
  const { data, error } = await supabase
    .from('practice_task_completions')
    .select('*')
    .eq('student_id', studentId)
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as PracticeTaskCompletion[]
}

export async function toggleTaskCompletion(params: {
  assigned_lesson_id: string
  block_id: string
  item_id: string
  student_id: string
  completed: boolean
  practice_note?: string
}) {
  if (!params.completed) {
    await supabase
      .from('practice_task_completions')
      .delete()
      .eq('assigned_lesson_id', params.assigned_lesson_id)
      .eq('block_id', params.block_id)
      .eq('item_id', params.item_id)
      .eq('student_id', params.student_id)
    return
  }

  const { error } = await supabase.from('practice_task_completions').upsert(
    {
      assigned_lesson_id: params.assigned_lesson_id,
      block_id: params.block_id,
      item_id: params.item_id,
      student_id: params.student_id,
      practice_note: params.practice_note ?? null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'assigned_lesson_id,block_id,item_id,student_id' }
  )
  if (error) throw error
}

export async function addStudentPracticeNote(note: {
  assigned_lesson_id: string
  student_id: string
  block_id?: string | null
  body: string
  media_url?: string | null
}): Promise<StudentPracticeNote> {
  const { data, error } = await supabase.from('student_practice_notes').insert(note).select().single()
  if (error) throw error
  return data as StudentPracticeNote
}

export async function fetchStudentPracticeNotes(assignedLessonId: string): Promise<StudentPracticeNote[]> {
  const { data, error } = await supabase
    .from('student_practice_notes')
    .select('*')
    .eq('assigned_lesson_id', assignedLessonId)
    .order('created_at', { ascending: false })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as StudentPracticeNote[]
}

// ——— Assigned lesson notes (per student, private or shared) ———

export async function fetchAssignedLessonNotes(assignedLessonId: string): Promise<AssignedLessonNote[]> {
  const { data, error } = await supabase
    .from('assigned_lesson_notes')
    .select('*')
    .eq('assigned_lesson_id', assignedLessonId)
    .order('created_at', { ascending: false })
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as AssignedLessonNote[]
}

export async function fetchTeacherAssignedLessonNotes(
  teacherId: string,
  options?: { studentId?: string; limit?: number }
): Promise<(AssignedLessonNote & { assigned_lesson?: Pick<AssignedLesson, 'id' | 'title' | 'student_id'> })[]> {
  let query = supabase
    .from('assigned_lesson_notes')
    .select('*, assigned_lesson:assigned_lessons!assigned_lesson_id(id, title, student_id, teacher_id)')
    .order('created_at', { ascending: false })

  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error

  const rows = (data ?? []) as Array<
    AssignedLessonNote & { assigned_lesson?: AssignedLesson | AssignedLesson[] | null }
  >
  const filtered = rows.filter((row) => {
    const lesson = Array.isArray(row.assigned_lesson) ? row.assigned_lesson[0] : row.assigned_lesson
    if (!lesson || lesson.teacher_id !== teacherId) return false
    if (options?.studentId && lesson.student_id !== options.studentId) return false
    return true
  })

  return filtered.map((row) => {
    const lesson = Array.isArray(row.assigned_lesson) ? row.assigned_lesson[0] : row.assigned_lesson
    const { assigned_lesson: _al, ...note } = row
    return {
      ...note,
      assigned_lesson: lesson ? { id: lesson.id, title: lesson.title, student_id: lesson.student_id } : undefined,
    }
  })
}

export async function createAssignedLessonNote(params: {
  assigned_lesson_id: string
  author_id: string
  body: string
  visibility: AssignedLessonNoteVisibility
}): Promise<AssignedLessonNote> {
  const { data, error } = await supabase
    .from('assigned_lesson_notes')
    .insert({
      assigned_lesson_id: params.assigned_lesson_id,
      author_id: params.author_id,
      body: params.body.trim(),
      visibility: params.visibility,
    })
    .select()
    .single()
  if (error) throw error
  return data as AssignedLessonNote
}

export async function updateAssignedLessonNote(
  id: string,
  updates: { body?: string; visibility?: AssignedLessonNoteVisibility }
): Promise<AssignedLessonNote> {
  const { data, error } = await supabase
    .from('assigned_lesson_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as AssignedLessonNote
}

export async function deleteAssignedLessonNote(id: string) {
  const { error } = await supabase.from('assigned_lesson_notes').delete().eq('id', id)
  if (error) throw error
}
