import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import LessonBlockRenderer from '../../../components/lesson-planning/LessonBlockRenderer'
import LessonAssignedNotesPanel from '../../../components/lesson-planning/LessonAssignedNotesPanel'
import { getBlockMeta, getBlockTitle } from '../../../lib/lesson-builder-utils'
import { statusLabel } from '../../../lib/lesson-planning-constants'
import {
  fetchAssignedLesson,
  addStudentPracticeNote,
  fetchTaskCompletions,
  toggleTaskCompletion,
  updateAssignedLesson,
} from '../../../lib/lesson-planning-service'
import { uploadStudioMedia } from '../../../lib/studio-media-service'
import { displayName, getStudentTeacherId } from '../../../lib/studio-service'
import {
  notifyPracticeMediaUploaded,
  notifyPracticeTaskCompleted,
} from '../../../lib/notify-studio'
import { useAuthStore } from '../../../store/auth'
import type { AssignedLesson, PracticeTaskCompletion } from '../../../types/lesson-planning'
import type { ChecklistBlockContent } from '../../../types/lesson-planning'
import '../../../lib/lesson-planning.css'

export default function StudentLessonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  const [lesson, setLesson] = useState<AssignedLesson | null>(null)
  const [completions, setCompletions] = useState<PracticeTaskCompletion[]>([])
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const reload = async () => {
    if (!id) return
    const l = await fetchAssignedLesson(id)
    if (!l || l.student_id !== user?.id) {
      navigate('/student/lessons')
      return
    }
    setLesson(l)
    const c = await fetchTaskCompletions(id)
    setCompletions(c)
    if (l.status === 'not_started') {
      await updateAssignedLesson(id, { status: 'in_progress' })
    }
  }

  useEffect(() => {
    reload()
  }, [id, user?.id])

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

      if (completed && item) {
        const teacherId = await getStudentTeacherId(user.id)
        if (teacherId) {
          await notifyPracticeTaskCompleted(teacherId, displayName(userProfile), item.label, lesson.title)
        }
      }
      const c = await fetchTaskCompletions(id)
      setCompletions(c)
    } catch {
      setCompletions(previous)
    } finally {
      setTogglingTaskId(null)
    }
  }

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
      const teacherId = await getStudentTeacherId(user.id)
      if (teacherId) {
        await notifyPracticeMediaUploaded(teacherId, displayName(userProfile), lesson.title)
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
        <header className="lp-page-header">
          <div>
            <Link to="/student/lessons" className="lp-btn lp-btn--ghost lp-btn--sm" style={{ marginBottom: '0.5rem' }}>
              <i className="bi bi-arrow-left" /> All lessons
            </Link>
            <h1>{lesson.title}</h1>
            {lesson.lesson_goal ? <p>{lesson.lesson_goal}</p> : null}
          </div>
          <span className={`lp-badge lp-badge--status-${lesson.status}`}>{statusLabel(lesson.status)}</span>
        </header>

        <div className="lp-practice-hero">
          {lesson.due_date ? <p className="lp-card__meta" style={{ margin: '0 0 0.5rem' }}>Due {new Date(lesson.due_date).toLocaleDateString()}</p> : null}
          {instructions ? <p style={{ margin: 0, lineHeight: 1.55 }}>{instructions}</p> : null}
          {lesson.practice_assignment ? (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(167, 139, 250, 0.2)' }}>
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--lp-accent)', margin: '0 0 0.35rem' }}>Practice goal</p>
              <p style={{ margin: 0 }}>{lesson.practice_assignment}</p>
            </div>
          ) : null}
          {lesson.target_bpm ? <p className="lp-card__meta" style={{ marginTop: '0.75rem', marginBottom: 0 }}>Target tempo: {lesson.target_bpm} BPM</p> : null}
        </div>

        {(lesson.blocks ?? []).length === 0 ? (
          <div className="lp-empty lp-card">
            <p style={{ margin: 0 }}>Lesson content coming soon.</p>
          </div>
        ) : (
          (lesson.blocks ?? []).map((block) => {
            const meta = getBlockMeta(block.block_type)
            return (
              <article key={block.id} className="lp-practice-block">
                <p className="lp-practice-block__label">
                  <i className={`bi ${meta?.icon ?? 'bi-square'}`} style={{ marginRight: '0.35rem' }} />
                  {getBlockTitle({ id: block.id, block_type: block.block_type, content: block.content, sort_order: block.sort_order })}
                </p>
                <LessonBlockRenderer
                  block={block}
                  mode="student"
                  completions={completions}
                  onToggleTask={handleToggleTask}
                  togglingTaskId={togglingTaskId}
                />
              </article>
            )
          })
        )}

        {user?.id ? (
          <LessonAssignedNotesPanel
            assignedLessonId={lesson.id}
            authorId={user.id}
            authorRole="student"
            teacherId={lesson.teacher_id}
          />
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
