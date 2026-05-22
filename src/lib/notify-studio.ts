import { dispatchNotification } from './notification-service'
import { displayName } from './studio-service'
import type { UserProfile } from '../types/user'
import type { NotificationType } from '../types/notifications'

export async function notifyMessageReceived(
  recipientId: string,
  senderProfile: UserProfile | null | undefined,
  messagePreview: string,
  portal: 'student' | 'studio'
) {
  const name = displayName(senderProfile)
  const preview = messagePreview.length > 80 ? `${messagePreview.slice(0, 77)}…` : messagePreview

  await dispatchNotification({
    recipientId,
    actorId: senderProfile?.user_id,
    type: 'message_received',
    title: `${name} sent you a message`,
    body: preview,
    actionUrl: portal === 'student' ? '/student/messages' : '/studio/messages',
    metadata: { sender_id: senderProfile?.user_id },
  })
}

export async function notifyAssignmentAdded(
  studentId: string,
  teacherName: string,
  assignmentTitle: string
) {
  await dispatchNotification({
    recipientId: studentId,
    type: 'assignment_added',
    title: 'New practice assignment',
    body: `${teacherName} shared: ${assignmentTitle}`,
    actionUrl: '/student/practice',
    metadata: { assignment_title: assignmentTitle },
  })
}

export async function notifyLessonNoteAdded(
  studentId: string,
  teacherName: string,
  noteTitle: string
) {
  await dispatchNotification({
    recipientId: studentId,
    type: 'lesson_note_added',
    title: 'New lesson note',
    body: `${teacherName} added notes for "${noteTitle}"`,
    actionUrl: '/student/home',
    metadata: { note_title: noteTitle },
  })
}

export async function notifyScheduleChanged(
  recipientId: string,
  title: string,
  body: string,
  portal: 'student' | 'studio'
) {
  await dispatchNotification({
    recipientId,
    type: 'schedule_changed',
    title,
    body,
    actionUrl: portal === 'student' ? '/student/schedule' : '/studio/schedule',
  })
}

export async function notifyLessonReminder(
  recipientId: string,
  lessonTimeLabel: string,
  portal: 'student' | 'studio'
) {
  await dispatchNotification({
    recipientId,
    type: 'lesson_reminder',
    title: 'Lesson reminder',
    body: lessonTimeLabel,
    actionUrl: portal === 'student' ? '/student/schedule' : '/studio/schedule',
  })
}

export async function notifyGeneric(
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  actionUrl?: string
) {
  await dispatchNotification({ recipientId, type, title, body, actionUrl })
}

export async function notifyLessonAssigned(
  studentId: string,
  teacherName: string,
  lessonTitle: string,
  assignedLessonId?: string
) {
  await dispatchNotification({
    recipientId: studentId,
    type: 'lesson_assigned',
    title: 'New lesson assigned',
    body: `${teacherName} assigned a new lesson: ${lessonTitle}`,
    actionUrl: assignedLessonId ? `/student/lessons/${assignedLessonId}` : '/student/lessons',
    metadata: { lesson_title: lessonTitle },
  })
}

export async function notifySessionNoteAdded(
  studentId: string,
  teacherName: string,
  lessonDate: string
) {
  await dispatchNotification({
    recipientId: studentId,
    type: 'session_note_added',
    title: 'Session notes ready',
    body: `New session notes are ready from your last lesson with ${teacherName}.`,
    actionUrl: '/student/lessons',
    metadata: { lesson_date: lessonDate },
  })
}

export async function notifyPracticeTaskCompleted(
  teacherId: string,
  studentName: string,
  taskLabel: string,
  lessonTitle: string
) {
  await dispatchNotification({
    recipientId: teacherId,
    type: 'practice_task_completed',
    title: 'Practice task completed',
    body: `${studentName} completed "${taskLabel}" on ${lessonTitle}`,
    actionUrl: '/studio/lesson-planning',
    metadata: { task_label: taskLabel, lesson_title: lessonTitle },
  })
}

export async function notifyPracticeNoteAdded(
  teacherId: string,
  studentName: string,
  lessonTitle: string
) {
  await dispatchNotification({
    recipientId: teacherId,
    type: 'practice_note_added',
    title: 'Practice note from student',
    body: `${studentName} left a practice note on "${lessonTitle}"`,
    actionUrl: '/studio/lesson-planning',
    metadata: { lesson_title: lessonTitle },
  })
}

export async function notifyPracticeMediaUploaded(
  teacherId: string,
  studentName: string,
  lessonTitle: string
) {
  await dispatchNotification({
    recipientId: teacherId,
    type: 'practice_upload',
    title: 'Practice media uploaded',
    body: `${studentName} uploaded practice media for "${lessonTitle}"`,
    actionUrl: '/studio/lesson-planning',
    metadata: { lesson_title: lessonTitle },
  })
}
