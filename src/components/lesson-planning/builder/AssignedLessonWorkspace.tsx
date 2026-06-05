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
import { displayName, fetchProfileByUserId } from '../../../lib/studio-service'
import { useAuthStore } from '../../../store/auth'
import {
  autoLayoutBentoBlocks,
  layoutForBentoCell,
  nextBentoPlacement,
  prepareBlocksForSave,
  readStoredCanvasView,
  writeStoredCanvasView,
  type CanvasViewMode,
} from '../../../lib/lesson-builder-canvas-layout'
import LessonBuilderCanvas from './LessonBuilderCanvas'
import LessonBuilderHelp from './LessonBuilderHelp'
import LessonBuilderInspector, { type AssignedDetails } from './LessonBuilderInspector'
import StudentPreviewOverlay from './StudentPreviewOverlay'
import LessonAssignedNotesPanel from '../LessonAssignedNotesPanel'
import LessonBuilderDrawerBackdrop from './LessonBuilderDrawerBackdrop'
import LessonBuilderPanelHead from './LessonBuilderPanelHead'
import { useLessonBuilderDrawers } from '../../../hooks/useLessonBuilderDrawers'
import '../../../lib/lesson-builder.css'

interface AssignedLessonWorkspaceProps {
  assignedId: string
}

export default function AssignedLessonWorkspace({ assignedId }: AssignedLessonWorkspaceProps) {
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()

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
  const [studentPreviewOpen, setStudentPreviewOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const {
    sidebarOpen,
    inspectorOpen,
    isMobile,
    anyOpen,
    closeAll,
    openSidebar,
    openInspector,
  } = useLessonBuilderDrawers()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lessonTeacherId, setLessonTeacherId] = useState<string | null>(null)
  const [canvasViewMode, setCanvasViewMode] = useState<CanvasViewMode>(() =>
    readStoredCanvasView(assignedId)
  )

  const lessonStudentsUrl = templateId
    ? `/studio/lesson-planning/lesson/${templateId}?tab=students`
    : '/studio/lesson-planning'

  const markDirty = useCallback(() => setDirty(true), [])

  useEffect(() => {
    setCanvasViewMode(readStoredCanvasView(assignedId))
  }, [assignedId])

  const handleCanvasViewModeChange = useCallback(
    (mode: CanvasViewMode) => {
      setCanvasViewMode(mode)
      writeStoredCanvasView(assignedId, mode)
    },
    [assignedId]
  )

  useEffect(() => {
    if (!assignedId || !user?.id) return
    fetchAssignedLesson(assignedId).then(async (lesson) => {
        if (!lesson) {
          navigate('/studio/lesson-planning')
          return
        }
        setTemplateId(lesson.template_id ?? null)
        setLessonTeacherId(lesson.teacher_id)
        const student = await fetchProfileByUserId(lesson.student_id)
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
      })
      .catch(() => {
        navigate('/studio/lesson-planning')
      })
  }, [assignedId, user?.id, navigate])

  const selectBlock = (blockId: string) => {
    setSelectedBlockId(blockId)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(blockId)
      return next
    })
    if (isMobile) openInspector()
  }

  const addBlock = (
    type: LessonBlockType,
    atIndex?: number,
    bentoPlacement?: { gridCol: number; gridRow: number }
  ) => {
    const meta = getBlockMeta(type)
    let content = defaultBlockContent(type, meta?.label) as LessonBlockContent
    if (canvasViewMode === 'bento') {
      const placement = bentoPlacement
        ? layoutForBentoCell(type, bentoPlacement.gridCol, bentoPlacement.gridRow)
        : nextBentoPlacement(blocks, type)
      content = {
        ...(content as object),
        canvasLayout: placement,
      } as LessonBlockContent
    }
    const newBlock: EditableBlock = {
      id: crypto.randomUUID(),
      block_type: type,
      content,
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
    if (canvasViewMode === 'bento') {
      next = autoLayoutBentoBlocks(next)
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
      const blocksToSave = prepareBlocksForSave(blocks, canvasViewMode)
      await saveAssignedLessonBlocks(
        assignedId,
        blocksToSave.map((b, i) => ({ block_type: b.block_type, content: b.content, sort_order: i }))
      )
      setBlocks(blocksToSave)
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

  if (studentPreviewOpen) {
    const instructions = assigned.customStudentInstructions || studentInstructions
    const targetBpm = assigned.targetBpm === '' ? null : Number(assigned.targetBpm)
    return (
      <StudentPreviewOverlay
        title={title}
        lessonGoal={lessonGoal}
        shortDescription={shortDescription}
        studentInstructions={instructions}
        practiceAssignment={practiceAssignment}
        dueDate={assigned.dueDate || null}
        targetBpm={Number.isFinite(targetBpm) ? targetBpm : null}
        status={assigned.status}
        category={category}
        skillLevel={skillLevel}
        estimatedDurationMinutes={duration}
        authorName={displayName(userProfile) || 'Mark'}
        blocks={blocks}
        assignedLessonId={assignedId}
        studentName={assigned.studentName}
        layoutMode={canvasViewMode}
        onExit={() => setStudentPreviewOpen(false)}
      />
    )
  }

  return (
    <div className="lesson-builder">
      <header className="lesson-builder__header lesson-builder__header--two-col">
        <div className="lesson-builder__header-left">
          <Link to={lessonStudentsUrl} className="lesson-builder__back" title="Back">
            <i className="bi bi-arrow-left" />
          </Link>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={openSidebar} title="Blocks">
            <i className="bi bi-list" />
          </button>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={openInspector} title="Details">
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
          <button type="button" className="lesson-builder__btn lesson-builder__btn--preview" onClick={() => setStudentPreviewOpen(true)}>
            <i className="bi bi-eye" /> Student preview
          </button>
          <button type="button" className="lesson-builder__btn" title="Help & documentation" onClick={() => setHelpOpen(true)}>
            <i className="bi bi-question-circle" /> Help
          </button>
        </div>
      </header>

      {saveError ? (
        <div style={{ padding: '0 1.5rem' }}>
          <LessonPlanningSchemaBanner message={saveError} />
        </div>
      ) : null}

      <div className="lesson-builder__body">
        <LessonBuilderDrawerBackdrop visible={isMobile && anyOpen} onClose={closeAll} />
        <aside className={`lesson-builder__sidebar ${sidebarOpen ? 'lesson-builder__sidebar--open' : ''}`}>
          {isMobile ? <LessonBuilderPanelHead title="Lesson blocks" onClose={closeAll} /> : null}
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
                    selectBlock(block.id)
                    document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    if (isMobile) closeAll()
                  }}
                >
                  <span className="lesson-builder__outline-num">{i + 1}</span>
                  <i className={`bi ${meta?.icon ?? 'bi-square'} lesson-builder__outline-icon`} />
                  <span className="lesson-builder__outline-text">{getBlockTitle(block)}</span>
                </div>
              )
            })}
          </div>
        </aside>

        <div className="lesson-builder__editor-zone">
        <LessonBuilderCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          collapsedIds={collapsedIds}
          dragIndex={dragIndex}
          viewMode={canvasViewMode}
          onViewModeChange={handleCanvasViewModeChange}
          userId={user?.id}
          emptyTitle="Customize this student's lesson"
          emptyDescription="Click a block in the toolbar to add it, or drag one into your lesson flow. Changes here won't affect your library template."
          onSelectBlock={selectBlock}
          onToggleCollapse={(blockId) => {
            setCollapsedIds((prev) => {
              const next = new Set(prev)
              if (next.has(blockId)) next.delete(blockId)
              else next.add(blockId)
              return next
            })
          }}
          onAddBlock={addBlock}
          onUpdateBlockContent={updateBlockContent}
          onDuplicateBlock={(index) => {
            const dup = duplicateBlock(blocks[index])
            if (canvasViewMode === 'bento') {
              const content = { ...(dup.content as object) } as Record<string, unknown>
              delete content.canvasLayout
              dup.content = content as LessonBlockContent
            }
            let next = [...blocks]
            next.splice(index + 1, 0, dup)
            next = next.map((b, i) => ({ ...b, sort_order: i }))
            if (canvasViewMode === 'bento') next = autoLayoutBentoBlocks(next)
            setBlocks(next)
            markDirty()
          }}
          onDeleteBlock={(blockId) => {
            setBlocks(blocks.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, sort_order: i })))
            if (selectedBlockId === blockId) setSelectedBlockId(null)
            markDirty()
          }}
          onBlocksChange={setBlocks}
          onDragIndexChange={setDragIndex}
          onClearSelection={() => setSelectedBlockId(null)}
          onDirty={markDirty}
        />

        <LessonBuilderInspector
          open={inspectorOpen}
          onClose={isMobile ? closeAll : undefined}
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

      {helpOpen ? <LessonBuilderHelp onClose={() => setHelpOpen(false)} initialPageId="assigned-editor" /> : null}
    </div>
  )
}
