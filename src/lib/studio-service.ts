import { supabase } from './supabase'
import type {
  LessonNote,
  PracticeAssignment,
  ScheduledLesson,
  SkillLevel,
  StudentMilestone,
  StudentProfile,
  StudioMessage,
  StudioStudent,
} from '../types/studio'
import type { UserProfile, UserRole } from '../types/user'

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || error.message?.includes('does not exist') === true
}

export async function fetchProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (isMissingTableError(error)) return null
  if (error) throw error
  return (data as UserProfile) ?? null
}

export type TeacherStudentListFilter = 'active' | 'archived'

export async function fetchTeacherStudents(
  teacherId: string,
  userRole?: UserRole | null,
  options?: { filter?: TeacherStudentListFilter }
): Promise<StudioStudent[]> {
  const filter = options?.filter ?? 'active'
  type RelationRow = { student_id: string; status: string; archived_at: string | null }
  let relations: RelationRow[] = []

  if (userRole === 'admin') {
    if (filter === 'archived') {
      const { data, error } = await supabase
        .from('teacher_students')
        .select('student_id, status, archived_at')
        .eq('teacher_id', teacherId)
        .eq('status', 'archived')

      if (error) throw error
      relations = (data ?? []) as RelationRow[]
    } else {
      const { data: roleRows, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student')

      if (rolesError) throw rolesError
      const allIds = roleRows?.map((r) => r.user_id) ?? []

      const { data: archivedRels, error: archError } = await supabase
        .from('teacher_students')
        .select('student_id, status, archived_at')
        .eq('teacher_id', teacherId)
        .eq('status', 'archived')

      if (archError) throw archError
      const archivedIds = new Set((archivedRels ?? []).map((r) => r.student_id))

      const { data: activeRels } = await supabase
        .from('teacher_students')
        .select('student_id, status, archived_at')
        .eq('teacher_id', teacherId)
        .eq('status', 'active')

      const activeRelMap = new Map(
        ((activeRels ?? []) as RelationRow[]).map((r) => [r.student_id, r])
      )

      relations = allIds
        .filter((id) => !archivedIds.has(id))
        .map((id) => activeRelMap.get(id) ?? { student_id: id, status: 'active', archived_at: null })
    }
  } else {
    let query = supabase
      .from('teacher_students')
      .select('student_id, status, archived_at')
      .eq('teacher_id', teacherId)

    query = filter === 'archived' ? query.eq('status', 'archived') : query.eq('status', 'active')

    const { data, error } = await query
    if (error) throw error
    relations = (data ?? []) as RelationRow[]
  }

  const studentIds = relations.map((r) => r.student_id)
  if (studentIds.length === 0) return []

  const relationByStudent = new Map(relations.map((r) => [r.student_id, r]))

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', studentIds)
    .order('first_name', { ascending: true })

  if (profileError) throw profileError

  let studioProfilesQuery = supabase.from('student_profiles').select('*').in('student_id', studentIds)

  if (userRole !== 'admin') {
    studioProfilesQuery = studioProfilesQuery.eq('teacher_id', teacherId)
  }

  const { data: studioProfiles } = await studioProfilesQuery

  return (profiles ?? []).map((profile) => {
    const rel = relationByStudent.get(profile.user_id)
    return {
      ...profile,
      studio_profile:
        studioProfiles?.find(
          (sp) =>
            sp.student_id === profile.user_id &&
            (userRole === 'admin' || sp.teacher_id === teacherId)
        ) ?? null,
      teacher_relation: rel
        ? {
            status: rel.status === 'archived' ? 'archived' : 'active',
            archived_at: rel.archived_at,
          }
        : { status: 'active' as const, archived_at: null },
    }
  })
}

export async function setTeacherStudentArchived(
  teacherId: string,
  studentId: string,
  archived: boolean
): Promise<void> {
  const { error } = await supabase
    .from('teacher_students')
    .update({
      status: archived ? 'archived' : 'active',
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)

  if (error) throw error
}

export async function fetchTeacherStudentRelation(
  teacherId: string,
  studentId: string
): Promise<{ status: 'active' | 'archived'; archived_at: string | null } | null> {
  const { data, error } = await supabase
    .from('teacher_students')
    .select('status, archived_at')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    status: data.status === 'archived' ? 'archived' : 'active',
    archived_at: data.archived_at,
  }
}

export async function upsertStudentProfile(
  teacherId: string,
  studentId: string,
  fields: Partial<Omit<StudentProfile, 'student_id' | 'teacher_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('student_profiles')
    .upsert({ student_id: studentId, teacher_id: teacherId, ...fields }, { onConflict: 'student_id' })
    .select()
    .single()

  if (error) throw error
  return data as StudentProfile
}

export async function fetchUpcomingLessons(
  userId: string,
  role: 'teacher' | 'student',
  limit = 10
): Promise<ScheduledLesson[]> {
  let query = supabase
    .from('scheduled_lessons')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true })
    .limit(limit)

  query = role === 'teacher' ? query.eq('teacher_id', userId) : query.eq('student_id', userId)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as ScheduledLesson[]
}

export async function fetchScheduledLessons(
  userId: string,
  role: 'teacher' | 'student'
): Promise<ScheduledLesson[]> {
  let query = supabase
    .from('scheduled_lessons')
    .select('*')
    .order('starts_at', { ascending: true })

  query = role === 'teacher' ? query.eq('teacher_id', userId) : query.eq('student_id', userId)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as ScheduledLesson[]
}

export async function createScheduledLesson(
  lesson: Omit<ScheduledLesson, 'id' | 'created_at' | 'updated_at' | 'student'>
) {
  const { data, error } = await supabase.from('scheduled_lessons').insert(lesson).select().single()
  if (error) throw error
  return data as ScheduledLesson
}

export async function updateScheduledLesson(id: string, updates: Partial<ScheduledLesson>) {
  const { data, error } = await supabase
    .from('scheduled_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ScheduledLesson
}

export async function fetchLessonNotes(
  userId: string,
  role: 'teacher' | 'student',
  limit?: number
): Promise<LessonNote[]> {
  let query = supabase
    .from('lesson_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (role === 'teacher') {
    query = query.eq('teacher_id', userId)
  } else {
    query = query.eq('student_id', userId).eq('visible_to_student', true)
  }

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []).map(normalizeLessonNote)
}

export function normalizeLessonNote(note: LessonNote): LessonNote {
  return {
    ...note,
    songs: note.songs ?? [],
    rudiments: note.rudiments ?? [],
    resource_links: Array.isArray(note.resource_links) ? note.resource_links : [],
  }
}

export async function createLessonNote(
  note: Omit<LessonNote, 'id' | 'created_at' | 'updated_at' | 'student'>
) {
  const { data, error } = await supabase.from('lesson_notes').insert(note).select().single()
  if (error) throw error
  return normalizeLessonNote(data as LessonNote)
}

export async function fetchPracticeAssignments(
  userId: string,
  role: 'teacher' | 'student'
): Promise<PracticeAssignment[]> {
  let query = supabase.from('practice_assignments').select('*').order('created_at', { ascending: false })

  query = role === 'teacher' ? query.eq('teacher_id', userId) : query.eq('student_id', userId)

  const { data, error } = await query
  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as PracticeAssignment[]
}

export async function createPracticeAssignment(
  assignment: Omit<PracticeAssignment, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase.from('practice_assignments').insert(assignment).select().single()
  if (error) throw error
  return data as PracticeAssignment
}

export async function completePracticeAssignment(id: string) {
  const { data, error } = await supabase
    .from('practice_assignments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PracticeAssignment
}

export async function fetchStudioMessages(userId: string): Promise<StudioMessage[]> {
  const { data, error } = await supabase
    .from('studio_messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true })

  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as StudioMessage[]
}

export async function sendStudioMessage(message: {
  sender_id: string
  recipient_id: string
  body: string
  message_type?: StudioMessage['message_type']
  link_url?: string | null
}) {
  const { data, error } = await supabase.from('studio_messages').insert(message).select().single()
  if (error) throw error
  return data as StudioMessage
}

export async function markMessageRead(messageId: string) {
  await supabase
    .from('studio_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
}

export async function fetchStudentMilestones(studentId: string): Promise<StudentMilestone[]> {
  const { data, error } = await supabase
    .from('student_milestones')
    .select('*')
    .eq('student_id', studentId)
    .order('achieved_at', { ascending: false })

  if (isMissingTableError(error)) return []
  if (error) throw error
  return (data ?? []) as StudentMilestone[]
}

export function isWebsiteInquiryMessage(message: StudioMessage): boolean {
  return Boolean(message.is_website_inquiry)
}

export function websiteInquiryLabel(message: StudioMessage): string {
  return message.guest_name?.trim() || 'Website visitor'
}

export async function getStudentTeacherId(studentId: string): Promise<string | null> {
  const { data } = await supabase
    .from('teacher_students')
    .select('teacher_id')
    .eq('student_id', studentId)
    .limit(1)
    .maybeSingle()
  return data?.teacher_id ?? null
}

export function displayName(profile?: UserProfile | null): string {
  if (!profile) return 'Student'
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  return name || profile.display_name || profile.email || 'Student'
}

/** First name for greetings — from public.profiles (then display_name, email). */
export function profileFirstName(
  profile?: UserProfile | null,
  authEmail?: string | null
): string {
  if (profile?.first_name?.trim()) return profile.first_name.trim()
  if (profile?.display_name?.trim()) {
    const word = profile.display_name.trim().split(/\s+/)[0]
    if (word) return word
  }
  const email = profile?.email?.trim() || authEmail?.trim()
  if (email) {
    const local = email.split('@')[0]
    if (local) return local.charAt(0).toUpperCase() + local.slice(1)
  }
  return 'there'
}

/** Human label for public.user_roles.role */
export function roleDisplayLabel(role?: UserRole | null): string {
  if (!role) return 'Studio'
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    author: 'Author',
    employee: 'Staff',
  }
  return labels[role] ?? role
}

export function formatLessonTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' },
]
