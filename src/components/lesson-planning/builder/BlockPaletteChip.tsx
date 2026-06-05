import { useRef } from 'react'
import { setBlockTypeDragData } from '../../../lib/lesson-builder-dnd'
import type { LessonBlockType } from '../../../types/lesson-planning'

interface BlockPaletteChipProps {
  type: LessonBlockType
  label: string
  icon: string
  description?: string
  variant?: 'toolbar' | 'canvas'
  onAdd: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export default function BlockPaletteChip({
  type,
  label,
  icon,
  description,
  variant = 'toolbar',
  onAdd,
  onDragStart,
  onDragEnd,
}: BlockPaletteChipProps) {
  const didDragRef = useRef(false)
  const title = description
    ? `${label} — ${description}. Click to add, drag to insert.`
    : `${label} — click to add at end, drag to insert`

  return (
    <button
      type="button"
      className={`block-palette-chip block-palette-chip--${variant}`}
      title={title}
      aria-label={title}
      draggable
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false
          return
        }
        onAdd()
      }}
      onDragStart={(e) => {
        didDragRef.current = true
        setBlockTypeDragData(e.dataTransfer, type)
        onDragStart?.()
      }}
      onDragEnd={() => {
        onDragEnd?.()
        window.setTimeout(() => {
          didDragRef.current = false
        }, 0)
      }}
    >
      <i className={`bi ${icon}`} aria-hidden />
      <span className="block-palette-chip__label">{label}</span>
    </button>
  )
}
