import { useEffect, useState } from 'react'
import LessonStudentPracticeView, { type StudentPracticeBlock } from '../LessonStudentPracticeView'
import { fetchTaskCompletions } from '../../../lib/lesson-planning-service'
import { STUDIO_BRAND_FULL } from '../../../lib/studio-brand'
import type {
  AssignedLessonStatus,
  LessonTemplateSkillLevel,
  PracticeTaskCompletion,
} from '../../../types/lesson-planning'
import type { CanvasViewMode } from '../../../lib/lesson-builder-canvas-layout'
import type { EditableBlock } from '../../../lib/lesson-builder-utils'
import '../../../lib/lesson-planning.css'

export interface StudentPreviewOverlayProps {
  onExit: () => void
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
  blocks: EditableBlock[] | StudentPracticeBlock[]
  assignedLessonId?: string | null
  studentName?: string | null
  layoutMode?: CanvasViewMode
}

function toPracticeBlocks(blocks: EditableBlock[] | StudentPracticeBlock[]): StudentPracticeBlock[] {
  return blocks.map((block) => ({
    id: block.id,
    template_id: block.id,
    sort_order: block.sort_order,
    block_type: block.block_type,
    content: block.content,
    created_at: '',
    updated_at: '',
  }))
}

export default function StudentPreviewOverlay({
  onExit,
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
  assignedLessonId,
  studentName,
  layoutMode,
}: StudentPreviewOverlayProps) {
  const [completions, setCompletions] = useState<PracticeTaskCompletion[]>([])

  useEffect(() => {
    if (!assignedLessonId) {
      setCompletions([])
      return
    }
    fetchTaskCompletions(assignedLessonId).then(setCompletions).catch(() => setCompletions([]))
  }, [assignedLessonId])

  const practiceBlocks = toPracticeBlocks(blocks)
  const subtitle = studentName ? `Preview — ${studentName}'s view` : 'Preview — student view'

  return (
    <div className="student-preview">
      <header className="student-preview__header">
        <p className="student-preview__eyebrow">{subtitle}</p>
        <button type="button" className="lesson-builder__btn" onClick={onExit}>
          <i className="bi bi-x-lg" /> Exit preview
        </button>
      </header>

      <div className="student-preview__content">
        <div className="student-preview__frame studio-app studio-app--student">
          <div className="student-preview__student-chrome">
            <span className="student-preview__breadcrumb">
              <i className="bi bi-journal-richtext" /> Lessons
              <i className="bi bi-chevron-right" aria-hidden />
              <span>{title}</span>
            </span>
            <span className="student-preview__portal-label">{STUDIO_BRAND_FULL}</span>
          </div>

          <div className="lp-hub lp-practice-flow">
            <LessonStudentPracticeView
              title={title}
              lessonGoal={lessonGoal}
              shortDescription={shortDescription}
              studentInstructions={studentInstructions}
              practiceAssignment={practiceAssignment}
              dueDate={dueDate}
              targetBpm={targetBpm}
              status={status}
              category={category}
              skillLevel={skillLevel}
              estimatedDurationMinutes={estimatedDurationMinutes}
              authorName={authorName}
              courseName={courseName}
              blocks={practiceBlocks}
              completions={completions}
              readOnly
              showStatus={!!status}
              previewMode
              layoutMode={layoutMode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
