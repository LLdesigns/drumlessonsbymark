import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { defaultBlockContent, skillLevelLabel } from '../../../lib/lesson-planning-constants'
import {
  duplicateBlock,
  getBlockMeta,
  getBlockTitle,
  reorderBlocks,
  type EditableBlock,
} from '../../../lib/lesson-builder-utils'
import type { LessonBlockContent, LessonBlockType, LessonTemplateSkillLevel } from '../../../types/lesson-planning'
import LessonPlanningSchemaBanner from '../LessonPlanningSchemaBanner'
import {
  fetchAssignedLesson,
  formatLessonPlanningError,
  saveAssignedLessonBlocks,
  updateAssignedLesson,
} from '../../../lib/lesson-planning-service'
import { displayName, fetchTeacherStudents } from '../../../lib/studio-service'
import { useAuthStore } from '../../../store/auth'
import BlockPickerModal from './BlockPickerModal'
import CanvasBlockCard from './CanvasBlockCard'
import LessonBuilderInspector, { type AssignedDetails } from './LessonBuilderInspector'
import TeachModeView from './TeachModeView'
import LessonAssignedNotesPanel from '../LessonAssignedNotesPanel'
import '../../../lib/lesson-builder.css'

interface AssignedLessonWorkspaceProps {
  assignedId: string
}

export default function AssignedLessonWorkspace({ assignedId }: AssignedLessonWorkspaceProps) {
  const navigate = useNavigate()
  const { user, userRole } = useAuthStore()

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [category, setCategory] = useState('Grooves')
  const [skillLevel, setSkillLevel] = useState<LessonTemplateSkillLevel>('beginner')
  const [duration, setDuration] = useState(30)
  const [lessonGoal, setLessonGoal] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [studentInstructions, setStudentInstructions] = useState('')
  const [practiceAssignment, setPracticeAssignment] = useState('')
  const [assigned, setAssigned] = useState<AssignedDetails>({
    customStudentInstructions: '',
    customTeacherNotes: '',
    targetBpm: '',
    currentBpm: '',
    status: 'not_started',
    dueDate: '',
    studentName: '',
  })
  const [blocks, setBlocks] = useState<EditableBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [teachMode, setTeachMode] = useState(false)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 901px)').matches : true
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lessonTeacherId, setLessonTeacherId] = useState<string | null>(null)

  const lessonStudentsUrl = templateId
    ? `/studio/lesson-planning/lesson/${templateId}?tab=students`
    : '/studio/lesson-planning'

  const markDirty = useCallback(() => setDirty(true), [])

  useEffect(() => {
    if (!assignedId || !user?.id) return
    Promise.all([fetchAssignedLesson(assignedId), fetchTeacherStudents(user.id, userRole)]).then(
      ([lesson, students]) => {
        if (!lesson) {
          navigate('/studio/lesson-planning')
          return
        }
        setTemplateId(lesson.template_id ?? null)
        setLessonTeacherId(lesson.teacher_id)
        const student = students.find((s) => s.user_id === lesson.student_id)
        setTitle(lesson.title)
        setShortDescription(lesson.short_description ?? '')
        setCategory(lesson.category ?? 'Technique')
        setSkillLevel((lesson.skill_level ?? 'beginner') as 'beginner')
        setDuration(lesson.estimated_duration_minutes ?? 30)
        setLessonGoal(lesson.lesson_goal ?? '')
        setTeacherNotes(lesson.teacher_notes ?? '')
        setStudentInstructions(lesson.student_instructions ?? '')
        setPracticeAssignment(lesson.practice_assignment ?? '')
        setAssigned({
          customStudentInstructions: lesson.custom_student_instructions ?? '',
          customTeacherNotes: lesson.custom_teacher_notes ?? lesson.teacher_notes ?? '',
          targetBpm: lesson.target_bpm ?? '',
          currentBpm: lesson.current_bpm ?? '',
          status: lesson.status,
          dueDate: lesson.due_date ? lesson.due_date.slice(0, 10) : '',
          studentName: displayName(student),
        })
        setBlocks(
          (lesson.blocks ?? []).map((b, i) => ({
            id: b.id,
            block_type: b.block_type,
            content: b.content,
            sort_order: i,
          }))
        )
        setLoading(false)
      }
    )
  }, [assignedId, user?.id, userRole, navigate])

  const selectBlock = (blockId: string) => {
    setSelectedBlockId(blockId)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(blockId)
      return next
    })
  }

  const addBlock = (type: LessonBlockType, atIndex?: number) => {
    const meta = getBlockMeta(type)
    const newBlock: EditableBlock = {
      id: crypto.randomUUID(),
      block_type: type,
      content: defaultBlockContent(type, meta?.label) as LessonBlockContent,
      sort_order: blocks.length,
    }
    let next: EditableBlock[]
    if (atIndex != null) {
      next = [...blocks]
      next.splice(atIndex, 0, newBlock)
      next = next.map((b, i) => ({ ...b, sort_order: i }))
    } else {
      next = [...blocks, newBlock]
    }
    setBlocks(next)
    setSelectedBlockId(newBlock.id)
    markDirty()
  }

  const updateBlockContent = (index: number, content: LessonBlockContent) => {
    const next = [...blocks]
    next[index] = { ...next[index], content }
    setBlocks(next)
    markDirty()
  }

  const handleSave = async () => {
    if (!user?.id) return
    if (!title.trim()) {
      setSaveError('Add a lesson title before saving.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await updateAssignedLesson(assignedId, {
        title: title.trim(),
        short_description: shortDescription || null,
        category,
        skill_level: skillLevel as 'beginner' | 'intermediate' | 'advanced',
        estimated_duration_minutes: duration,
        lesson_goal: lessonGoal || null,
        teacher_notes: teacherNotes || null,
        student_instructions: studentInstructions || null,
        practice_assignment: practiceAssignment || null,
        custom_student_instructions: assigned.customStudentInstructions || null,
        custom_teacher_notes: assigned.customTeacherNotes || null,
        target_bpm: assigned.targetBpm === '' ? null : Number(assigned.targetBpm),
        current_bpm: assigned.currentBpm === '' ? null : Number(assigned.currentBpm),
        status: assigned.status,
        due_date: assigned.dueDate ? new Date(assigned.dueDate).toISOString() : null,
      })
      await saveAssignedLessonBlocks(
        assignedId,
        blocks.map((b, i) => ({ block_type: b.block_type, content: b.content, sort_order: i }))
      )
      setDirty(false)
    } catch (err) {
      setSaveError(formatLessonPlanningError(err))
    } finally {
      setSaving(false)
    }
  }

  const metaLine = [assigned.studentName, skillLevelLabel(skillLevel as 'beginner'), category].filter(Boolean).join(' · ')

  if (loading) {
    return (
      <div className="lesson-builder" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--lb-muted)' }}>Loading lesson…</p>
      </div>
    )
  }

  if (teachMode) {
    return <TeachModeView title={title} blocks={blocks} onExit={() => setTeachMode(false)} />
  }

  return (
    <div className="lesson-builder">
      <header className="lesson-builder__header lesson-builder__header--two-col">
        <div className="lesson-builder__header-left">
          <Link to={lessonStudentsUrl} className="lesson-builder__back" title="Back">
            <i className="bi bi-arrow-left" />
          </Link>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={() => setInspectorOpen(true)}>
            <i className="bi bi-sliders" />
          </button>
          <div className="lesson-builder__title-wrap">
            <h1 className="lesson-builder__title">{title}</h1>
            <p className="lesson-builder__meta">{metaLine}</p>
          </div>
        </div>
        <div className="lesson-builder__header-right">
          <div className="lesson-builder__save-group">
            <span className={`lesson-builder__save-status ${dirty ? 'lesson-builder__save-status--dirty' : ''}`}>
              {saving ? 'Saving…' : dirty ? 'Unsaved changes' : <><i className="bi bi-check-circle-fill" /> Saved</>}
            </span>
            <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <button type="button" className="lesson-builder__btn lesson-builder__btn--teach" onClick={() => setTeachMode(true)}>
            <i className="bi bi-bullseye" /> Teach Mode
          </button>
        </div>
      </header>

      {saveError ? (
        <div style={{ padding: '0 1.5rem' }}>
          <LessonPlanningSchemaBanner message={saveError} />
        </div>
      ) : null}

      <div className="lesson-builder__body">
        <aside className={`lesson-builder__sidebar ${sidebarOpen ? 'lesson-builder__sidebar--open' : ''}`}>
          <div className="lesson-builder__sidebar-head">
            <span className="lesson-builder__badge" style={{ background: 'rgba(109, 212, 160, 0.2)', color: '#6dd4a0' }}>Assigned</span>
            <p className="lesson-builder__sidebar-title">{assigned.studentName}</p>
          </div>
          <p className="lesson-builder__outline-label">Lesson blocks</p>
          <div className="lesson-builder__outline">
            {blocks.map((block, i) => {
              const meta = getBlockMeta(block.block_type)
              return (
                <div
                  key={block.id}
                  className={`lesson-builder__outline-item ${selectedBlockId === block.id ? 'lesson-builder__outline-item--active' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex != null) {
                      setBlocks(reorderBlocks(blocks, dragIndex, i))
                      setDragIndex(null)
                      markDirty()
                    }
                  }}
                  onClick={() => {
                    setSelectedBlockId(block.id)
                    document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                >
                  <span className="lesson-builder__outline-num">{i + 1}</span>
                  <i className={`bi ${meta?.icon ?? 'bi-square'} lesson-builder__outline-icon`} />
                  <span className="lesson-builder__outline-text">{getBlockTitle(block)}</span>
                </div>
              )
            })}
          </div>
          <button type="button" className="lesson-builder__add-block" onClick={() => setShowBlockPicker(true)}>
            <i className="bi bi-plus-lg" /> Add block
          </button>
        </aside>

        <main className="lesson-builder__canvas-wrap">
          <div
            className="lesson-builder__canvas"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBlockId(null)
            }}
          >
            {blocks.length === 0 ? (
              <div className="lesson-builder__canvas-empty">
                <h3>Customize this student&apos;s lesson</h3>
                <p>Add or edit blocks — changes here won&apos;t affect your library template.</p>
                <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" onClick={() => setShowBlockPicker(true)}>
                  <i className="bi bi-plus-lg" /> Add block
                </button>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div key={block.id} id={`block-${block.id}`}>
                  <div className="canvas-insert">
                    <button type="button" onClick={() => { setInsertAtIndex(index); setShowBlockPicker(true) }}>+ Insert block</button>
                  </div>
                  <CanvasBlockCard
                    block={block}
                    index={index}
                    selected={selectedBlockId === block.id}
                    collapsed={collapsedIds.has(block.id)}
                    previewMode={false}
                    userId={user?.id}
                    onContentUpdate={(content) => updateBlockContent(index, content)}
                    onSelect={() => selectBlock(block.id)}
                    onToggleCollapse={() => {
                      setCollapsedIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(block.id)) next.delete(block.id)
                        else next.add(block.id)
                        return next
                      })
                    }}
                    onDuplicate={() => {
                      const dup = duplicateBlock(block)
                      const next = [...blocks]
                      next.splice(index + 1, 0, dup)
                      setBlocks(next.map((b, i) => ({ ...b, sort_order: i })))
                      markDirty()
                    }}
                    onDelete={() => {
                      setBlocks(blocks.filter((b) => b.id !== block.id).map((b, i) => ({ ...b, sort_order: i })))
                      if (selectedBlockId === block.id) setSelectedBlockId(null)
                      markDirty()
                    }}
                    onDragStart={setDragIndex}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(toIndex) => {
                      if (dragIndex != null) {
                        setBlocks(reorderBlocks(blocks, dragIndex, toIndex))
                        setDragIndex(null)
                        markDirty()
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </main>

        <LessonBuilderInspector
          open={inspectorOpen}
          variant="assigned"
          hideTags
          assignedDetails={assigned}
          onAssignedChange={(patch) => {
            setAssigned((a) => ({ ...a, ...patch }))
            markDirty()
          }}
          details={{
            title,
            shortDescription,
            category,
            skillLevel: skillLevel as 'beginner',
            duration,
            lessonGoal,
            tags: [],
            teacherNotes,
            studentInstructions,
            practiceAssignment,
          }}
          onDetailsChange={(patch) => {
            if (patch.title !== undefined) setTitle(patch.title)
            if (patch.shortDescription !== undefined) setShortDescription(patch.shortDescription)
            if (patch.lessonGoal !== undefined) setLessonGoal(patch.lessonGoal)
            if (patch.studentInstructions !== undefined) setStudentInstructions(patch.studentInstructions)
            markDirty()
          }}
          onAddTag={() => {}}
          onRemoveTag={() => {}}
        />
      </div>

      {user?.id && lessonTeacherId ? (
        <div className="lesson-builder__notes-wrap">
          <LessonAssignedNotesPanel
            assignedLessonId={assignedId}
            authorId={user.id}
            authorRole="teacher"
            teacherId={lessonTeacherId}
          />
        </div>
      ) : null}

      {showBlockPicker ? (
        <BlockPickerModal onPick={(type) => addBlock(type, insertAtIndex ?? undefined)} onClose={() => { setShowBlockPicker(false); setInsertAtIndex(null) }} />
      ) : null}
    </div>
  )
}
