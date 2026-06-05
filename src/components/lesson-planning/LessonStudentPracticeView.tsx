import { useMemo, type CSSProperties } from 'react'
import LessonBlockRenderer from './LessonBlockRenderer'
import {
  autoLayoutBentoBlocks,
  bentoGridExtent,
  getCanvasLayout,
  gridPlacementStyle,
  inferLayoutModeFromBlocks,
  type CanvasViewMode,
} from '../../lib/lesson-builder-canvas-layout'
import { getBlockMeta, getBlockTitle, type EditableBlock } from '../../lib/lesson-builder-utils'
import { computeLessonTaskProgress } from '../../lib/practice-task-utils'
import { skillLevelLabel, statusLabel } from '../../lib/lesson-planning-constants'
import { STUDIO_BRAND_FULL } from '../../lib/studio-brand'
import type {
  AssignedLessonBlock,
  AssignedLessonStatus,
  BlockProgressKind,
  LessonTemplateBlock,
  LessonTemplateSkillLevel,
  PracticeTaskCompletion,
  StudentBlockProgress,
} from '../../types/lesson-planning'

export type StudentPracticeBlock = LessonTemplateBlock | AssignedLessonBlock

export interface LessonStudentPracticeViewProps {
  title: string
  lessonGoal?: string | null
  shortDescription?: string | null
  studentInstructions?: string | null
  practiceAssignment?: string | null
  dueDate?: string | null
  targetBpm?: number | null
  status?: AssignedLessonStatus | null
  category?: string | null
  skillLevel?: LessonTemplateSkillLevel | null
  estimatedDurationMinutes?: number | null
  authorName?: string | null
  courseName?: string | null
  blocks: StudentPracticeBlock[]
  completions?: PracticeTaskCompletion[]
  blockProgress?: StudentBlockProgress[]
  readOnly?: boolean
  onToggleTask?: (blockId: string, itemId: string, completed: boolean) => void
  onScrollToBlock?: (blockId: string) => void
  onBlockProgress?: (blockId: string, kind: BlockProgressKind, payload?: Record<string, unknown>) => void
  togglingTaskId?: string | null
  showStatus?: boolean
  previewMode?: boolean
  /** Builder preview can pass the active canvas mode; student portal infers from saved block layouts. */
  layoutMode?: CanvasViewMode
}

function authorInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'M'
}

export default function LessonStudentPracticeView({
  title,
  lessonGoal,
  shortDescription,
  studentInstructions,
  practiceAssignment,
  dueDate,
  targetBpm,
  status,
  category,
  skillLevel,
  estimatedDurationMinutes,
  authorName,
  courseName,
  blocks,
  completions = [],
  blockProgress = [],
  readOnly = false,
  onToggleTask,
  onScrollToBlock,
  onBlockProgress,
  togglingTaskId = null,
  showStatus = true,
  previewMode = false,
  layoutMode,
}: LessonStudentPracticeViewProps) {
  const effectiveLayoutMode = layoutMode ?? inferLayoutModeFromBlocks(blocks)
  const isBento = effectiveLayoutMode === 'bento'

  const layoutBlocks = useMemo(() => {
    if (!isBento) return blocks
    return autoLayoutBentoBlocks(blocks as EditableBlock[]) as StudentPracticeBlock[]
  }, [blocks, isBento])

  const bentoRowCount = useMemo(
    () => (isBento ? bentoGridExtent(layoutBlocks as EditableBlock[]) : 0),
    [isBento, layoutBlocks]
  )

  const taskProgress = useMemo(
    () => computeLessonTaskProgress(blocks, completions),
    [blocks, completions]
  )

  const instructor = authorName?.trim() || 'Mark'
  const program = courseName?.trim() || STUDIO_BRAND_FULL
  const metaParts = [
    category,
    skillLevel ? skillLevelLabel(skillLevel) : null,
    estimatedDurationMinutes ? `${estimatedDurationMinutes} min` : null,
  ].filter(Boolean)

  const hasHeroContent = dueDate || studentInstructions || practiceAssignment || targetBpm

  const renderPracticeBlock = (
    block: StudentPracticeBlock,
    index: number,
    gridStyle?: CSSProperties
  ) => {
    const meta = getBlockMeta(block.block_type)
    const blockTitle = getBlockTitle({
      id: block.id,
      block_type: block.block_type,
      content: block.content,
      sort_order: block.sort_order,
    })
    return (
      <article
        key={block.id}
        id={`lesson-block-${block.id}`}
        className={`lp-practice-block lp-practice-block--${block.block_type}${isBento ? ' lp-practice-block--bento' : ''}`}
        style={gridStyle}
      >
        <header className="lp-practice-block__head">
          {!isBento ? <span className="lp-practice-block__step">{index + 1}</span> : null}
          <div>
            <p className="lp-practice-block__label">
              <i className={`bi ${meta?.icon ?? 'bi-square'}`} />
              {meta?.label ?? block.block_type}
            </p>
            {blockTitle && blockTitle !== meta?.label ? (
              <h3 className="lp-practice-block__title">{blockTitle}</h3>
            ) : null}
          </div>
        </header>
        <div className="lp-practice-block__body">
          <LessonBlockRenderer
            block={block}
            mode="student"
            readOnly={readOnly}
            completions={completions}
            blockProgress={blockProgress}
            allBlocks={blocks}
            onToggleTask={onToggleTask}
            onScrollToBlock={onScrollToBlock}
            onBlockProgress={onBlockProgress}
            togglingTaskId={togglingTaskId}
          />
        </div>
      </article>
    )
  }

  return (
    <div className="lp-student-lesson">
      {previewMode ? (
        <p className="lp-student-lesson__preview-note" role="status">
          <i className="bi bi-eye" /> Preview mode — this matches what students see in their lesson portal.
        </p>
      ) : null}

      <section className="lp-lesson-meta">
        <div className="lp-lesson-meta__author">
          <span className="lp-lesson-meta__avatar" aria-hidden>
            {authorInitial(instructor)}
          </span>
          <div>
            <p className="lp-lesson-meta__program">{program}</p>
            <p className="lp-lesson-meta__author-name">
              with <strong>{instructor}</strong>
            </p>
          </div>
        </div>
        {metaParts.length > 0 ? (
          <ul className="lp-lesson-meta__tags">
            {metaParts.map((part) => (
              <li key={part}>{part}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <header className="lp-page-header lp-student-lesson__header">
        <div>
          <h1>{title}</h1>
          {shortDescription || lessonGoal ? (
            <p className="lp-student-lesson__summary">{shortDescription || lessonGoal}</p>
          ) : null}
        </div>
        {showStatus && status ? (
          <span className={`lp-badge lp-badge--status-${status}`}>{statusLabel(status)}</span>
        ) : null}
      </header>

      {taskProgress.total > 0 ? (
        <div className="lp-task-progress" aria-live="polite">
          <div className="lp-task-progress__head">
            <span>Practice tasks</span>
            <strong>
              {taskProgress.done} / {taskProgress.total}
            </strong>
          </div>
          <div
            className="lp-task-progress__bar"
            role="progressbar"
            aria-valuenow={taskProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${taskProgress.percent}%` }} />
          </div>
          {status === 'needs_review' ? (
            <p className="lp-task-progress__note">All tasks done — {instructor} is reviewing your work.</p>
          ) : taskProgress.done === taskProgress.total ? (
            <p className="lp-task-progress__note">
              All tasks complete. Mark lesson complete when you are ready.
            </p>
          ) : null}
        </div>
      ) : null}

      {hasHeroContent ? (
        <div className="lp-practice-hero">
          {dueDate ? (
            <p className="lp-practice-hero__due">
              <i className="bi bi-calendar-event" /> Due{' '}
              {new Date(dueDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          ) : null}
          {studentInstructions ? (
            <div className="lp-practice-hero__instructions">
              <p className="lp-practice-hero__eyebrow">How to work through this lesson</p>
              <p>{studentInstructions}</p>
            </div>
          ) : null}
          {practiceAssignment ? (
            <div className="lp-practice-hero__goal">
              <p className="lp-practice-hero__eyebrow">Practice goal</p>
              <p>{practiceAssignment}</p>
            </div>
          ) : null}
          {targetBpm ? (
            <p className="lp-practice-hero__tempo">
              <i className="bi bi-speedometer2" /> Target tempo: <strong>{targetBpm} BPM</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {blocks.length === 0 ? (
        <div className="lp-empty lp-card">
          <p style={{ margin: 0 }}>Lesson content coming soon.</p>
        </div>
      ) : isBento ? (
        <div className="lp-student-lesson__blocks lp-student-lesson__blocks--bento">
          <h2 className="lp-student-lesson__blocks-title">Lesson content</h2>
          <div
            className="lp-student-bento-grid"
            style={{ gridTemplateRows: `repeat(${bentoRowCount}, minmax(120px, auto))` }}
          >
            {layoutBlocks.map((block, index) =>
              renderPracticeBlock(
                block,
                index,
                gridPlacementStyle(getCanvasLayout(layoutBlocks as EditableBlock[], index))
              )
            )}
          </div>
        </div>
      ) : (
        <div className="lp-student-lesson__blocks">
          <h2 className="lp-student-lesson__blocks-title">Lesson steps</h2>
          {blocks.map((block, index) => renderPracticeBlock(block, index))}
        </div>
      )}
    </div>
  )
}
