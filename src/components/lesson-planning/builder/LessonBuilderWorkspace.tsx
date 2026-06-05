import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { LessonPageTab } from '../../../types/lesson-planning'
import LessonStudentsPanel from './LessonStudentsPanel'
import type { UserProfile, UserRole } from '../../../types/user'
import {
  defaultBlockContent,
  skillLevelLabel,
} from '../../../lib/lesson-planning-constants'
import {
  autoLayoutBentoBlocks,
  layoutForBentoCell,
  nextBentoPlacement,
  prepareBlocksForSave,
  readStoredCanvasView,
  writeStoredCanvasView,
  type CanvasViewMode,
} from '../../../lib/lesson-builder-canvas-layout'
import {
  BUILDER_ONBOARDING_KEY,
  duplicateBlock,
  getBlockMeta,
  getBlockTitle,
  reorderBlocks,
  type EditableBlock,
} from '../../../lib/lesson-builder-utils'
import type { LessonStarterTemplate } from '../../../lib/lesson-starter-templates'
import type { LessonBlockContent, LessonBlockType, LessonTemplateSkillLevel } from '../../../types/lesson-planning'
import LessonPlanningSchemaBanner from '../LessonPlanningSchemaBanner'
import LessonBuilderDrawerBackdrop from './LessonBuilderDrawerBackdrop'
import LessonBuilderPanelHead from './LessonBuilderPanelHead'
import { useLessonBuilderDrawers } from '../../../hooks/useLessonBuilderDrawers'
import { displayName } from '../../../lib/studio-service'
import {
  createLessonTemplate,
  fetchLessonTemplate,
  formatLessonPlanningError,
  saveTemplateBlocks,
  updateLessonTemplate,
} from '../../../lib/lesson-planning-service'
import LessonBuilderHelp from './LessonBuilderHelp'
import LessonBuilderOnboardingPrompt from './LessonBuilderOnboardingPrompt'
import LessonBuilderCanvas from './LessonBuilderCanvas'
import LessonBuilderInspector from './LessonBuilderInspector'
import LessonJsonImportExport from './LessonJsonImportExport'
import StudentPreviewOverlay from './StudentPreviewOverlay'
import type { LessonImportResult } from '../../../lib/lesson-import-export'
import '../../../lib/lesson-builder.css'

interface LessonBuilderWorkspaceProps {
  templateId?: string
  isNew: boolean
  userId: string
  userProfile?: UserProfile | null
  userRole?: UserRole | null
  pageTab?: LessonPageTab
  onPageTabChange?: (tab: LessonPageTab) => void
}

export default function LessonBuilderWorkspace({
  templateId,
  isNew,
  userId,
  userProfile,
  userRole,
  pageTab = 'content',
  onPageTabChange,
}: LessonBuilderWorkspaceProps) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('Untitled Lesson')
  const [shortDescription, setShortDescription] = useState('')
  const [category, setCategory] = useState('Grooves')
  const [skillLevel, setSkillLevel] = useState<LessonTemplateSkillLevel>('beginner')
  const [duration, setDuration] = useState(30)
  const [lessonGoal, setLessonGoal] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [studentInstructions, setStudentInstructions] = useState('')
  const [practiceAssignment, setPracticeAssignment] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [blocks, setBlocks] = useState<EditableBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [studentPreviewOpen, setStudentPreviewOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpFirstVisit, setHelpFirstVisit] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
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
  const [localTemplateId, setLocalTemplateId] = useState<string | undefined>(templateId)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [canvasViewMode, setCanvasViewMode] = useState<CanvasViewMode>(() =>
    readStoredCanvasView(templateId)
  )

  const effectiveTemplateId = localTemplateId

  const markDirty = useCallback(() => setDirty(true), [])

  useEffect(() => {
    setLocalTemplateId(templateId)
  }, [templateId])

  useEffect(() => {
    setCanvasViewMode(readStoredCanvasView(effectiveTemplateId))
  }, [effectiveTemplateId])

  const handleCanvasViewModeChange = useCallback(
    (mode: CanvasViewMode) => {
      setCanvasViewMode(mode)
      writeStoredCanvasView(effectiveTemplateId, mode)
    },
    [effectiveTemplateId]
  )

  useEffect(() => {
    if (!localStorage.getItem(BUILDER_ONBOARDING_KEY)) {
      setOnboardingOpen(true)
    }
  }, [])

  useEffect(() => {
    if (isNew || !templateId) {
      setLoading(false)
      return
    }
    setLoadError(null)
    fetchLessonTemplate(templateId)
      .then((t) => {
      if (!t) {
        navigate('/studio/lesson-planning')
        return
      }
      setTitle(t.title)
      setShortDescription(t.short_description ?? '')
      setCategory(t.category)
      setSkillLevel(t.skill_level)
      setDuration(t.estimated_duration_minutes ?? 30)
      setLessonGoal(t.lesson_goal ?? '')
      setTeacherNotes(t.teacher_notes ?? '')
      setStudentInstructions(t.student_instructions ?? '')
      setPracticeAssignment(t.practice_assignment ?? '')
      setBlocks(
        (t.blocks ?? []).map((b, i) => ({
          id: b.id,
          block_type: b.block_type,
          content: b.content,
          sort_order: i,
        }))
      )
      setLoading(false)
      setDirty(false)
    })
      .catch((err) => {
        setLoadError(formatLessonPlanningError(err))
        setLoading(false)
      })
  }, [templateId, isNew, navigate])

  const selectBlock = (blockId: string) => {
    setSelectedBlockId(blockId)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(blockId)
      return next
    })
    if (isMobile) openInspector()
  }

  const applyStarter = (starter: LessonStarterTemplate) => {
    setTitle(starter.title)
    setCategory(starter.category)
    setSkillLevel(starter.skill_level)
    setDuration(starter.duration)
    setLessonGoal(starter.lesson_goal)
    setBlocks(starter.blocks().map((b, i) => ({ ...b, sort_order: i })))
    markDirty()
  }

  const applyLessonImport = useCallback(
    (result: LessonImportResult) => {
      const { lesson } = result
      setTitle(lesson.title)
      setShortDescription(lesson.short_description ?? '')
      setCategory(lesson.category ?? 'Grooves')
      setSkillLevel(lesson.skill_level ?? 'beginner')
      setDuration(lesson.estimated_duration_minutes ?? 30)
      setLessonGoal(lesson.lesson_goal ?? '')
      setTeacherNotes(lesson.teacher_notes ?? '')
      setStudentInstructions(lesson.student_instructions ?? '')
      setPracticeAssignment(lesson.practice_assignment ?? '')
      setTags(lesson.tags ?? [])
      setBlocks(result.blocks)
      setSelectedBlockId(result.blocks[0]?.id ?? null)
      setCollapsedIds(new Set())
      handleCanvasViewModeChange(result.canvasViewMode)
      writeStoredCanvasView(effectiveTemplateId, result.canvasViewMode)
      markDirty()
    },
    [effectiveTemplateId, handleCanvasViewModeChange, markDirty]
  )

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
    if (!title.trim()) {
      setSaveError('Add a lesson title before saving.')
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaveNotice(null)
    try {
      let id = effectiveTemplateId
      const payload = {
        title: title.trim(),
        short_description: shortDescription || null,
        category,
        skill_level: skillLevel,
        estimated_duration_minutes: duration,
        lesson_goal: lessonGoal || null,
        teacher_notes: teacherNotes || null,
        student_instructions: studentInstructions || null,
        practice_assignment: practiceAssignment || null,
      }
      if (!id) {
        const created = await createLessonTemplate({ teacher_id: userId, ...payload, status: 'active' })
        id = created.id
        setLocalTemplateId(id)
      } else {
        await updateLessonTemplate(id, payload)
      }
      const blocksToSave = prepareBlocksForSave(blocks, canvasViewMode)
      await saveTemplateBlocks(
        id,
        blocksToSave.map((b, i) => ({ block_type: b.block_type, content: b.content, sort_order: i }))
      )
      setBlocks(blocksToSave)
      setDirty(false)
      setSaveNotice('Lesson saved')
      window.setTimeout(() => setSaveNotice(null), 4000)
      if (isNew && !templateId) {
        navigate(`/studio/lesson-planning/lesson/${id}`, { replace: true })
      }
    } catch (err) {
      setSaveError(formatLessonPlanningError(err))
    } finally {
      setSaving(false)
    }
  }

  const metaLine = [
    skillLevelLabel(skillLevel),
    category,
    `${duration} min`,
  ].join(' · ')

  const savedId = effectiveTemplateId ?? null
  const showStudents = pageTab === 'students'
  const studentsTabDisabled = !savedId

  if (loading) {
    return (
      <div className="lesson-builder lesson-builder--loading">
        <header className="lesson-builder__header">
          <div className="lesson-builder__header-left">
            <Link to="/studio/lesson-planning" className="lesson-builder__back" title="Back to library">
              <i className="bi bi-arrow-left" />
            </Link>
            <div className="lesson-builder__title-wrap">
              <h1 className="lesson-builder__title">Loading lesson…</h1>
            </div>
          </div>
        </header>
        <div className="lesson-builder__loading-body">
          <div className="lesson-builder__loading-shimmer" />
          <div className="lesson-builder__loading-shimmer lesson-builder__loading-shimmer--short" />
        </div>
      </div>
    )
  }

  if (studentPreviewOpen) {
    return (
      <StudentPreviewOverlay
        title={title}
        lessonGoal={lessonGoal}
        shortDescription={shortDescription}
        studentInstructions={studentInstructions}
        practiceAssignment={practiceAssignment}
        category={category}
        skillLevel={skillLevel}
        estimatedDurationMinutes={duration}
        authorName={displayName(userProfile) || 'Mark'}
        blocks={blocks}
        layoutMode={canvasViewMode}
        onExit={() => setStudentPreviewOpen(false)}
      />
    )
  }

  return (
    <div className="lesson-builder">
      <header className="lesson-builder__header">
        <div className="lesson-builder__header-left">
          <Link to="/studio/lesson-planning" className="lesson-builder__back" title="Back to library">
            <i className="bi bi-arrow-left" />
          </Link>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={openSidebar} title="Blocks">
            <i className="bi bi-list" />
          </button>
          <button type="button" className="lesson-builder__mobile-toggle lesson-builder__btn" onClick={openInspector} title="Details">
            <i className="bi bi-sliders" />
          </button>
          <div className="lesson-builder__title-wrap">
            <h1 className="lesson-builder__title">{title || 'Untitled lesson'}</h1>
            <p className="lesson-builder__meta">{metaLine}</p>
          </div>
        </div>

        <nav
          className="lesson-builder__header-center lesson-page-tabs lesson-page-tabs--center"
          aria-label="Lesson sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={pageTab === 'content'}
            onClick={() => onPageTabChange?.('content')}
          >
            <i className="bi bi-layout-text-window" /> Content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pageTab === 'students'}
            disabled={studentsTabDisabled}
            title={studentsTabDisabled ? 'Save the lesson first to manage students' : undefined}
            onClick={() => !studentsTabDisabled && onPageTabChange?.('students')}
          >
            <i className="bi bi-people" /> Students
          </button>
        </nav>

        <div className="lesson-builder__header-right">
          {!showStudents && userRole === 'admin' ? (
            <LessonJsonImportExport
              exportInput={{
                title,
                shortDescription,
                category,
                skillLevel,
                duration,
                lessonGoal,
                teacherNotes,
                studentInstructions,
                practiceAssignment,
                tags,
                canvasViewMode,
                blocks,
              }}
              hasExistingContent={Boolean(title.trim() && title !== 'Untitled Lesson') || blocks.length > 0}
              onImport={applyLessonImport}
            />
          ) : null}
          <div className="lesson-builder__save-group">
            <span className={`lesson-builder__save-status ${dirty ? 'lesson-builder__save-status--dirty' : ''}`}>
              {saving ? (
                <>Saving…</>
              ) : saveNotice ? (
                <>
                  <i className="bi bi-check-circle-fill" /> {saveNotice}
                </>
              ) : dirty ? (
                <>Unsaved changes</>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill" /> Saved
                </>
              )}
            </span>
            <button
              type="button"
              className="lesson-builder__btn lesson-builder__btn--primary"
              disabled={saving || !title.trim()}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save Lesson'}
            </button>
          </div>
          {!showStudents ? (
            <button type="button" className="lesson-builder__btn lesson-builder__btn--preview" onClick={() => setStudentPreviewOpen(true)}>
              <i className="bi bi-eye" /> Student preview
            </button>
          ) : null}
          <button
            type="button"
            className="lesson-builder__btn"
            title="Help & documentation"
            onClick={() => {
              setHelpFirstVisit(false)
              setHelpOpen(true)
            }}
          >
            <i className="bi bi-question-circle" /> Help
          </button>
        </div>
      </header>

      {saveError ? (
        <div style={{ padding: '0 1.5rem' }}>
          <LessonPlanningSchemaBanner message={saveError} />
        </div>
      ) : null}
      {loadError ? (
        <div style={{ padding: '1.5rem' }}>
          <LessonPlanningSchemaBanner message={loadError} />
        </div>
      ) : null}

      {showStudents && savedId ? (
        <div className="lesson-builder__students-view">
          <LessonStudentsPanel
            templateId={savedId}
            teacherId={userId}
            teacherProfile={userProfile}
            userRole={userRole}
            template={{ id: savedId, title }}
          />
        </div>
      ) : showStudents ? (
        <div className="lesson-builder__students-view">
          <div className="lesson-builder__canvas-empty">
            <h3>Save your lesson first</h3>
            <p>Students can be assigned after the lesson is saved to your library.</p>
            <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" onClick={() => onPageTabChange?.('content')}>
              Back to content
            </button>
          </div>
        </div>
      ) : (
      <div className="lesson-builder__body">
        <LessonBuilderDrawerBackdrop visible={isMobile && anyOpen} onClose={closeAll} />
        <aside className={`lesson-builder__sidebar ${sidebarOpen ? 'lesson-builder__sidebar--open' : ''}`}>
          {isMobile ? <LessonBuilderPanelHead title="Lesson blocks" onClose={closeAll} /> : null}
          <div className="lesson-builder__sidebar-head">
            <span className="lesson-builder__badge">Template</span>
            <p className="lesson-builder__sidebar-title">{title.slice(0, 28)}{title.length > 28 ? '…' : ''}</p>
          </div>
          <p className="lesson-builder__outline-label">Lesson blocks</p>
          <div className="lesson-builder__outline">
            {blocks.map((block, i) => {
              const meta = getBlockMeta(block.block_type)
              return (
                <div
                  key={block.id}
                  className={`lesson-builder__outline-item ${selectedBlockId === block.id ? 'lesson-builder__outline-item--active' : ''} ${dragIndex === i ? 'lesson-builder__outline-item--dragging' : ''}`}
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
          userId={userId}
          showStarters
          onApplyStarter={applyStarter}
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
          details={{
            title,
            shortDescription,
            category,
            skillLevel,
            duration,
            lessonGoal,
            tags,
            teacherNotes,
            studentInstructions,
            practiceAssignment,
          }}
          onDetailsChange={(patch) => {
            if (patch.title !== undefined) setTitle(patch.title)
            if (patch.shortDescription !== undefined) setShortDescription(patch.shortDescription)
            if (patch.category !== undefined) setCategory(patch.category)
            if (patch.skillLevel !== undefined) setSkillLevel(patch.skillLevel)
            if (patch.duration !== undefined) setDuration(patch.duration)
            if (patch.lessonGoal !== undefined) setLessonGoal(patch.lessonGoal)
            if (patch.teacherNotes !== undefined) setTeacherNotes(patch.teacherNotes)
            if (patch.studentInstructions !== undefined) setStudentInstructions(patch.studentInstructions)
            if (patch.practiceAssignment !== undefined) setPracticeAssignment(patch.practiceAssignment)
            if (patch.tags !== undefined) setTags(patch.tags)
            markDirty()
          }}
          onAddTag={(tag) => {
            if (!tags.includes(tag)) setTags([...tags, tag])
            markDirty()
          }}
          onRemoveTag={(tag) => {
            setTags(tags.filter((t) => t !== tag))
            markDirty()
          }}
        />
        </div>
      </div>
      )}

      {onboardingOpen ? (
        <LessonBuilderOnboardingPrompt
          hasBlocks={blocks.length > 0}
          onDismiss={() => {
            localStorage.setItem(BUILDER_ONBOARDING_KEY, '1')
            setOnboardingOpen(false)
          }}
          onOpenGuide={() => {
            localStorage.setItem(BUILDER_ONBOARDING_KEY, '1')
            setOnboardingOpen(false)
            setHelpFirstVisit(true)
            setHelpOpen(true)
          }}
        />
      ) : null}

      {helpOpen ? (
        <LessonBuilderHelp
          onClose={() => {
            setHelpOpen(false)
            setHelpFirstVisit(false)
          }}
          isFirstVisit={helpFirstVisit}
          initialPageId={helpFirstVisit ? 'welcome' : undefined}
        />
      ) : null}
    </div>
  )
}
