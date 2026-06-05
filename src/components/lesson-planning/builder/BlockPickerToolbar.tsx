import { LESSON_BLOCK_TYPES } from '../../../lib/lesson-planning-constants'
import type { LessonBlockType } from '../../../types/lesson-planning'
import BlockPaletteChip from './BlockPaletteChip'

interface BlockPickerToolbarProps {
  onAddBlock: (type: LessonBlockType) => void
  onPaletteDragStart?: () => void
  onPaletteDragEnd?: () => void
}

export default function BlockPickerToolbar({
  onAddBlock,
  onPaletteDragStart,
  onPaletteDragEnd,
}: BlockPickerToolbarProps) {
  return (
    <div className="block-picker-toolbar" role="toolbar" aria-label="Add lesson blocks">
      <div className="block-picker-toolbar__items">
        {LESSON_BLOCK_TYPES.map((bt) => (
          <BlockPaletteChip
            key={bt.type}
            type={bt.type}
            label={bt.label}
            icon={bt.icon}
            description={bt.description}
            variant="toolbar"
            onAdd={() => onAddBlock(bt.type)}
            onDragStart={onPaletteDragStart}
            onDragEnd={onPaletteDragEnd}
          />
        ))}
      </div>
    </div>
  )
}
