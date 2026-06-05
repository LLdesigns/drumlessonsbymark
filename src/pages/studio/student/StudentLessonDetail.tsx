import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import LessonStudentPracticeView from '../../../components/lesson-planning/LessonStudentPracticeView'
import LessonAssignedNotesPanel from '../../../components/lesson-planning/LessonAssignedNotesPanel'
import {
  fetchAssignedLesson,
  addStudentPracticeNote,
  fetchBlockProgress,
  fetchTaskCompletions,
  markAssignedLessonComplete,
  markAssignedLessonNeedsReview,
  toggleTaskCompletion,
  updateAssignedLesson,
  upsertBlockProgress,
} from '../../../lib/lesson-planning-service'
import { uploadStudioMedia } from '../../../lib/studio-media-service'
import { displayName, getStudentTeacherId } from '../../../lib/studio-service'
import {
  notifyPracticeMediaUploaded,
  notifyPracticeTaskCompleted,
} from '../../../lib/notify-studio'
import {
  computeLessonTaskProgress,
  findAutoCompleteTasksForBlock,
  findRecordTasksForLesson,
} from '../../../lib/practice-task-utils'
import { trackStudioEvent } from '../../../lib/studio-analytics'
import { useAuthStore } from '../../../store/auth'
import type {
  AssignedLesson,
  BlockProgressKind,
  PracticeTaskCompletion,
  StudentBlockProgress,
} from '../../../types/lesson-planning'
import type { ChecklistBlockContent } from '../../../types/lesson-planning'
import '../../../lib/lesson-planning.css'

export default function StudentLessonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  const [lesson, setLesson] = useState<AssignedLesson | null>(null)
  const [completions, setCompletions] = useState<PracticeTaskCompletion[]>([])
  const [blockProgress, setBlockProgress] = useState<StudentBlockProgress[]>([])
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const openedRef = useRef(false)

  const reload = async () => {
    if (!id || !user?.id) return
    const [l, c, p] = await Promise.all([
      fetchAssignedLesson(id),
      fetchTaskCompletions(id),
      fetchBlockProgress(id),
    ])
    if (!l || l.student_id !== user.id) {
      navigate('/student/lessons')
      return
    }
    setLesson(l)
    setCompletions(c)
    setBlockProgress(p)
    if (l.status === 'not_started') {
      void updateAssignedLesson(id, { status: 'in_progress' })
    }
  }

  useEffect(() => {
    reload()
  }, [id, user?.id])

  useEffect(() => {
    if (!id || !user?.id || !lesson || openedRef.current) return
    openedRef.current = true
    void trackStudioEvent({
      studentId: user.id,
      eventName: 'lesson_opened',
      assignedLessonId: id,
      properties: { lesson_title: lesson.title, status: lesson.status },
    })
  }, [id, user?.id, lesson])

  const scrollToBlock = useCallback((blockId: string) => {
    document.getElementById(`lesson-block-${blockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const maybeMarkNeedsReview = useCallback(
    async (nextCompletions: PracticeTaskCompletion[]) => {
      if (!id || !lesson?.blocks?.length) return
      const progress = computeLessonTaskProgress(lesson.blocks, nextCompletions)
      if (progress.total > 0 && progress.done === progress.total && lesson.status !== 'completed' && lesson.status !== 'needs_review') {
        await markAssignedLessonNeedsReview(id)
        setLesson((prev) => (prev ? { ...prev, status: 'needs_review' } : prev))
      }
    },
    [id, lesson]
  )

  const completeTask = useCallback(
    async (
      blockId: string,
      itemId: string,
      options?: { auto?: boolean; skipNotify?: boolean }
    ) => {
      if (!id || !user?.id || !lesson) return false

      const block = lesson.blocks?.find((b) => b.id === blockId)
      const items = (block?.content as ChecklistBlockContent)?.items ?? []
      const item = items.find((i) => i.id === itemId)
      if (!item) return false

      if (completions.some((c) => c.block_id === blockId && c.item_id === itemId)) return true

      await toggleTaskCompletion({
        assigned_lesson_id: id,
        block_id: blockId,
        item_id: itemId,
        student_id: user.id,
        completed: true,
      })

      await trackStudioEvent({
        studentId: user.id,
        eventName: 'checklist_item_completed',
        assignedLessonId: id,
        blockId,
        itemId,
        properties: {
          task_label: item.label,
          lesson_title: lesson.title,
          auto: options?.auto ?? false,
          task_type: item.task_type,
        },
      })

      if (!options?.skipNotify) {
        const teacherId = await getStudentTeacherId(user.id)
        if (teacherId) {
          await notifyPracticeTaskCompleted(
            teacherId,
            displayName(userProfile),
            item.label,
            lesson.title,
            { assigned_lesson_id: id, block_id: blockId, item_id: itemId, auto: options?.auto }
          )
        }
      }

      const c = await fetchTaskCompletions(id)
      setCompletions(c)
      await maybeMarkNeedsReview(c)
      return true
    },
    [id, user?.id, lesson, completions, userProfile, maybeMarkNeedsReview]
  )

  const handleToggleTask = async (blockId: string, itemId: string, completed: boolean) => {
    if (!id || !user?.id || !lesson) return
    const taskKey = `${blockId}:${itemId}`
    const block = lesson.blocks?.find((b) => b.id === blockId)
    const items = (block?.content as ChecklistBlockContent)?.items ?? []
    const item = items.find((i) => i.id === itemId)

    const previous = completions
    setTogglingTaskId(taskKey)
    setCompletions((prev) => {
      if (!completed) {
        return prev.filter(
          (c) => !(c.block_id === blockId && c.item_id === itemId && c.assigned_lesson_id === id)
        )
      }
      if (prev.some((c) => c.block_id === blockId && c.item_id === itemId)) return prev
      return [
        ...prev,
        {
          id: `optimistic-${taskKey}`,
          assigned_lesson_id: id,
          block_id: blockId,
          item_id: itemId,
          student_id: user.id,
          completed_at: new Date().toISOString(),
          practice_note: null,
          media_url: null,
        },
      ]
    })

    try {
      await toggleTaskCompletion({
        assigned_lesson_id: id,
        block_id: blockId,
        item_id: itemId,
        student_id: user.id,
        completed,
      })

      await trackStudioEvent({
        studentId: user.id,
        eventName: completed ? 'checklist_item_completed' : 'checklist_item_unchecked',
        assignedLessonId: id,
        blockId,
        itemId,
        properties: { task_label: item?.label, lesson_title: lesson.title },
      })

      if (completed && item) {
        const teacherId = await getStudentTeacherId(user.id)
        if (teacherId) {
          await notifyPracticeTaskCompleted(
            teacherId,
            displayName(userProfile),
            item.label,
            lesson.title,
            { assigned_lesson_id: id, block_id: blockId, item_id: itemId }
          )
        }
      }

      const c = await fetchTaskCompletions(id)
      setCompletions(c)
      if (completed) await maybeMarkNeedsReview(c)
    } catch {
      setCompletions(previous)
    } finally {
      setTogglingTaskId(null)
    }
  }

  const handleBlockProgress = useCallback(
    async (blockId: string, kind: BlockProgressKind, payload?: Record<string, unknown>) => {
      if (!id || !user?.id || !lesson?.blocks?.length) return

      const already = blockProgress.some(
        (p) => p.block_id === blockId && p.student_id === user.id && p.progress_kind === kind
      )
      if (already) return

      const row = await upsertBlockProgress({
        assigned_lesson_id: id,
        block_id: blockId,
        student_id: user.id,
        progress_kind: kind,
        payload,
      })

      const eventName =
        kind === 'played'
          ? payload?.source === 'notation_playback'
            ? 'notation_playback_started'
            : 'block_played'
          : 'block_viewed'

      await trackStudioEvent({
        studentId: user.id,
        eventName,
        assignedLessonId: id,
        blockId,
        properties: payload ?? {},
      })

      const nextProgress = row
        ? [...blockProgress.filter((p) => !(p.block_id === blockId && p.progress_kind === kind)), row]
        : [
            ...blockProgress,
            {
              id: `local-${blockId}-${kind}`,
              assigned_lesson_id: id,
              block_id: blockId,
              student_id: user.id,
              progress_kind: kind,
              payload,
              completed_at: new Date().toISOString(),
            },
          ]
      setBlockProgress(nextProgress)

      const autoTasks = findAutoCompleteTasksForBlock(
        lesson.blocks,
        blockId,
        nextProgress,
        completions
      )
      for (const { checklistBlockId, item } of autoTasks) {
        await completeTask(checklistBlockId, item.id, { auto: true })
      }
    },
    [id, user?.id, lesson, blockProgress, completions, completeTask]
  )

  const handleMediaUpload = async (file: File) => {
    if (!user?.id || !id || !lesson) return
    setUploading(true)
    try {
      const url = await uploadStudioMedia(user.id, file, 'practice')
      await addStudentPracticeNote({
        assigned_lesson_id: id,
        student_id: user.id,
        body: `Uploaded practice media: ${file.name}`,
        media_url: url,
      })
      await trackStudioEvent({
        studentId: user.id,
        eventName: 'practice_media_uploaded',
        assignedLessonId: id,
        properties: { file_name: file.name, lesson_title: lesson.title },
      })
      const teacherId = await getStudentTeacherId(user.id)
      if (teacherId) {
        await notifyPracticeMediaUploaded(teacherId, displayName(userProfile), lesson.title)
      }

      const recordTasks = findRecordTasksForLesson(lesson.blocks ?? [], completions)
      for (const { checklistBlockId, item } of recordTasks) {
        await completeTask(checklistBlockId, item.id, { auto: true })
      }
    } finally {
      setUploading(false)
    }
  }

  if (!lesson) {
    return (
      <StudentStudioLayout>
        <p style={{ color: 'var(--lp-muted)' }}>Loading lesson…</p>
      </StudentStudioLayout>
    )
  }

  const instructions = lesson.custom_student_instructions || lesson.student_instructions

  return (
    <StudentStudioLayout>
      <div className="lp-hub lp-practice-flow">
        <Link to="/student/lessons" className="lp-btn lp-btn--ghost lp-btn--sm" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
          <i className="bi bi-arrow-left" /> All lessons
        </Link>

        <LessonStudentPracticeView
          title={lesson.title}
          lessonGoal={lesson.lesson_goal}
          shortDescription={lesson.short_description}
          studentInstructions={instructions}
          practiceAssignment={lesson.practice_assignment}
          dueDate={lesson.due_date}
          targetBpm={lesson.target_bpm}
          status={lesson.status}
          category={lesson.category}
          skillLevel={lesson.skill_level ?? undefined}
          estimatedDurationMinutes={lesson.estimated_duration_minutes ?? undefined}
          authorName="Mark"
          blocks={lesson.blocks ?? []}
          completions={completions}
          blockProgress={blockProgress}
          onToggleTask={handleToggleTask}
          onScrollToBlock={scrollToBlock}
          onBlockProgress={handleBlockProgress}
          togglingTaskId={togglingTaskId}
        />

        {user?.id ? (
          <LessonAssignedNotesPanel
            assignedLessonId={lesson.id}
            authorId={user.id}
            authorRole="student"
            teacherId={lesson.teacher_id}
          />
        ) : null}

        {lesson.status !== 'completed' ? (
          <article className="lp-practice-block">
            <p className="lp-practice-block__label">Done with this lesson?</p>
            <button
              type="button"
              className="lp-btn lp-btn--primary"
              disabled={completing}
              onClick={async () => {
                if (!id || !user?.id) return
                setCompleting(true)
                try {
                  await markAssignedLessonComplete(id)
                  await trackStudioEvent({
                    studentId: user.id,
                    eventName: 'lesson_completed',
                    assignedLessonId: id,
                    properties: { lesson_title: lesson.title },
                  })
                  await reload()
                } finally {
                  setCompleting(false)
                }
              }}
            >
              {completing ? 'Saving…' : 'Mark lesson complete'}
            </button>
          </article>
        ) : null}

        <article className="lp-practice-block">
          <p className="lp-practice-block__label">Practice media</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="lp-btn" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading…' : 'Upload practice media'}
              <input
                type="file"
                accept="audio/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleMediaUpload(file)
                }}
                disabled={uploading}
              />
            </label>
            <Link to="/student/messages" className="lp-btn">
              <i className="bi bi-chat-dots" /> Message Mark
            </Link>
          </div>
        </article>
      </div>
    </StudentStudioLayout>
  )
}
