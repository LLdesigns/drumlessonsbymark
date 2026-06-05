import { LESSON_BLOCK_TYPES } from '../../../lib/lesson-planning-constants'
import { LESSON_STARTER_TEMPLATES, type LessonStarterTemplate } from '../../../lib/lesson-starter-templates'
import type { LessonBlockType } from '../../../types/lesson-planning'
import BlockPaletteChip from './BlockPaletteChip'

interface LessonCanvasEmptyStateProps {
  title?: string
  description?: string
  isDropTarget?: boolean
  showStarters?: boolean
  onAddBlock: (type: LessonBlockType) => void
  onApplyStarter?: (starter: LessonStarterTemplate) => void
  onPaletteDragStart?: () => void
  onPaletteDragEnd?: () => void
}

const STARTER_TEMPLATES = LESSON_STARTER_TEMPLATES.filter((t) => t.id !== 'blank')

export default function LessonCanvasEmptyState({
  title = 'Start building your lesson',
  description = 'Pick a block below or drag one from the toolbar into this canvas.',
  isDropTarget = false,
  showStarters = false,
  onAddBlock,
  onApplyStarter,
  onPaletteDragStart,
  onPaletteDragEnd,
}: LessonCanvasEmptyStateProps) {
  return (
    <div className={`canvas-empty${isDropTarget ? ' canvas-empty--drop-target' : ''}`}>
      <div className="canvas-empty__intro">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="canvas-empty__blocks" role="group" aria-label="Add a block">
        {LESSON_BLOCK_TYPES.map((bt) => (
          <BlockPaletteChip
            key={bt.type}
            type={bt.type}
            label={bt.label}
            icon={bt.icon}
            description={bt.description}
            variant="canvas"
            onAdd={() => onAddBlock(bt.type)}
            onDragStart={onPaletteDragStart}
            onDragEnd={onPaletteDragEnd}
          />
        ))}
      </div>

      {showStarters && onApplyStarter ? (
        <div className="canvas-empty__starters">
          <p className="canvas-empty__starters-label">Or start from a template</p>
          <div className="canvas-empty__starter-grid">
            {STARTER_TEMPLATES.map((starter) => (
              <button
                key={starter.id}
                type="button"
                className="canvas-empty__starter-card"
                onClick={() => onApplyStarter(starter)}
              >
                <i className={`bi ${starter.icon}`} aria-hidden />
                <strong>{starter.name}</strong>
                <span>{starter.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
