import type { LessonBlockType } from '../types/lesson-planning'

export const BLOCK_TYPE_DRAG_MIME = 'application/x-lesson-block-type'

export function setBlockTypeDragData(dataTransfer: DataTransfer, type: LessonBlockType) {
  dataTransfer.setData(BLOCK_TYPE_DRAG_MIME, type)
  dataTransfer.effectAllowed = 'copy'
}

export function getBlockTypeFromDragEvent(event: React.DragEvent): LessonBlockType | null {
  const type = event.dataTransfer.getData(BLOCK_TYPE_DRAG_MIME)
  return type ? (type as LessonBlockType) : null
}

export function isBlockTypeDrag(event: React.DragEvent): boolean {
  return event.dataTransfer.types.includes(BLOCK_TYPE_DRAG_MIME)
}
