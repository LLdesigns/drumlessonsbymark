import type { EditableBlock } from './lesson-builder-utils'
import type { LessonBlockContent, LessonBlockType } from '../types/lesson-planning'

export type CanvasViewMode = 'stack' | 'bento'

export type BlockColSpan = 3 | 4 | 6 | 8 | 12

export interface BlockCanvasLayout {
  gridCol: number
  gridRow: number
  colSpan: BlockColSpan
  rowSpan?: 1 | 2
}

export type GridPlacementStyle = {
  gridColumn: string
  gridRow: string
}

const GRID_COLUMNS = 12

export const CANVAS_VIEW_STORAGE_KEY = 'lesson-builder-canvas-view-v1'

export function canvasViewStorageKey(templateId?: string): string {
  return `${CANVAS_VIEW_STORAGE_KEY}:${templateId ?? 'new'}`
}

export function readStoredCanvasView(templateId?: string): CanvasViewMode {
  if (typeof localStorage === 'undefined') return 'stack'
  const raw = localStorage.getItem(canvasViewStorageKey(templateId))
  return raw === 'bento' ? 'bento' : 'stack'
}

export function writeStoredCanvasView(templateId: string | undefined, mode: CanvasViewMode) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(canvasViewStorageKey(templateId), mode)
}

export function defaultColSpan(blockType: LessonBlockType): BlockColSpan {
  switch (blockType) {
    case 'video':
    case 'notation':
    case 'sequencer':
    case 'notation_image':
      return 8
    case 'text':
    case 'checklist':
      return 6
    case 'tempo':
    case 'rudiment':
    case 'audio':
    case 'resource_link':
      return 4
    default:
      return 6
  }
}

function readLayoutFromContent(content: LessonBlockContent): BlockCanvasLayout | null {
  const raw = (content as unknown as Record<string, unknown>).canvasLayout
  if (!raw || typeof raw !== 'object') return null
  const layout = raw as BlockCanvasLayout
  if (
    typeof layout.gridCol === 'number' &&
    typeof layout.gridRow === 'number' &&
    typeof layout.colSpan === 'number'
  ) {
    const colSpan = clampColSpan(layout.colSpan)
    const gridCol = Math.min(Math.max(1, layout.gridCol), GRID_COLUMNS - colSpan + 1)
    return {
      gridCol,
      gridRow: Math.max(1, layout.gridRow),
      colSpan,
      rowSpan: layout.rowSpan === 2 ? 2 : 1,
    }
  }
  return null
}

export function clampColSpan(span: number): BlockColSpan {
  if (span >= 12) return 12
  if (span >= 8) return 8
  if (span >= 6) return 6
  if (span >= 4) return 4
  return 3
}

export function nextColSpan(span: BlockColSpan): BlockColSpan {
  const order: BlockColSpan[] = [4, 6, 8, 12]
  const idx = order.indexOf(span)
  return order[(idx + 1) % order.length] ?? 6
}

/** Advance flow cursor to the slot after a placed block. */
function advanceFlowCursor(layout: BlockCanvasLayout): { col: number; row: number } {
  const nextCol = layout.gridCol + layout.colSpan
  if (nextCol > GRID_COLUMNS) {
    return { col: 1, row: layout.gridRow + (layout.rowSpan ?? 1) }
  }
  return { col: nextCol, row: layout.gridRow }
}

/**
 * Resolve grid position for every block in order.
 * Stored layouts are kept; blocks without layout flow after prior blocks without overlapping.
 */
export function computeLayoutPositions(blocks: EditableBlock[]): BlockCanvasLayout[] {
  let col = 1
  let row = 1
  const layouts: BlockCanvasLayout[] = []

  for (const block of blocks) {
    const existing = readLayoutFromContent(block.content)
    if (existing) {
      layouts.push(existing)
      const next = advanceFlowCursor(existing)
      col = next.col
      row = next.row
      continue
    }

    const colSpan = defaultColSpan(block.block_type)
    if (col + colSpan - 1 > GRID_COLUMNS) {
      row += 1
      col = 1
    }
    const layout: BlockCanvasLayout = { gridCol: col, gridRow: row, colSpan, rowSpan: 1 }
    layouts.push(layout)
    col += colSpan
    if (col > GRID_COLUMNS) {
      row += 1
      col = 1
    }
  }

  return layouts
}

export function computeFlowLayout(blocks: EditableBlock[], index: number): BlockCanvasLayout {
  return computeLayoutPositions(blocks)[index] ?? { gridCol: 1, gridRow: 1, colSpan: 6, rowSpan: 1 }
}

export function getCanvasLayout(blocks: EditableBlock[], index: number): BlockCanvasLayout {
  const stored = readLayoutFromContent(blocks[index].content)
  if (stored) return stored
  return computeFlowLayout(blocks, index)
}

/** Next open slot when appending a block in bento flow order. */
export function nextBentoPlacement(
  blocks: EditableBlock[],
  blockType: LessonBlockType
): BlockCanvasLayout {
  let col = 1
  let row = 1
  if (blocks.length > 0) {
    const positions = computeLayoutPositions(blocks)
    const last = positions[positions.length - 1]
    const next = advanceFlowCursor(last)
    col = next.col
    row = next.row
  }
  const colSpan = defaultColSpan(blockType)
  if (col + colSpan - 1 > GRID_COLUMNS) {
    row += 1
    col = 1
  }
  return { gridCol: col, gridRow: row, colSpan, rowSpan: 1 }
}

export function autoLayoutBentoBlocks(blocks: EditableBlock[]): EditableBlock[] {
  const positions = computeLayoutPositions(blocks)
  return blocks.map((block, index) => {
    if (readLayoutFromContent(block.content)) return block
    return patchBlockLayout(block, positions[index])
  })
}

export function patchBlockLayout(block: EditableBlock, layout: BlockCanvasLayout): EditableBlock {
  return {
    ...block,
    content: {
      ...(block.content as object),
      canvasLayout: layout,
    } as LessonBlockContent,
  }
}

export function layoutForBentoCell(
  blockType: LessonBlockType,
  targetCol: number,
  targetRow: number
): BlockCanvasLayout {
  const colSpan = defaultColSpan(blockType)
  const gridCol = Math.max(1, Math.min(targetCol, GRID_COLUMNS - colSpan + 1))
  return { gridCol, gridRow: Math.max(1, targetRow), colSpan, rowSpan: 1 }
}

export function bentoEmptyDropCells(
  blocks: EditableBlock[],
  rowCount: number
): { col: number; row: number }[] {
  const occupied = new Set<string>()
  blocks.forEach((_, index) => {
    const layout = getCanvasLayout(blocks, index)
    for (let r = layout.gridRow; r < layout.gridRow + (layout.rowSpan ?? 1); r++) {
      for (let c = layout.gridCol; c < layout.gridCol + layout.colSpan; c++) {
        occupied.add(`${c}:${r}`)
      }
    }
  })
  const cells: { col: number; row: number }[] = []
  for (let row = 1; row <= rowCount; row++) {
    for (let col = 1; col <= 12; col += 3) {
      if (!occupied.has(`${col}:${row}`)) cells.push({ col, row })
    }
  }
  return cells.slice(0, 32)
}

export function swapBentoLayouts(
  blocks: EditableBlock[],
  fromIndex: number,
  toIndex: number
): EditableBlock[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return blocks
  const fromLayout = getCanvasLayout(blocks, fromIndex)
  const toLayout = getCanvasLayout(blocks, toIndex)
  return blocks.map((block, i) => {
    if (i === fromIndex) return patchBlockLayout(block, toLayout)
    if (i === toIndex) return patchBlockLayout(block, fromLayout)
    return block
  })
}

export function resizeBlockColSpan(blocks: EditableBlock[], index: number): EditableBlock[] {
  const layout = getCanvasLayout(blocks, index)
  const colSpan = nextColSpan(layout.colSpan)
  let gridCol = layout.gridCol
  if (gridCol + colSpan - 1 > GRID_COLUMNS) {
    gridCol = Math.max(1, GRID_COLUMNS - colSpan + 1)
  }
  return blocks.map((block, i) =>
    i === index ? patchBlockLayout(block, { ...layout, colSpan, gridCol }) : block
  )
}

export function moveBentoBlockToCell(
  blocks: EditableBlock[],
  blockIndex: number,
  targetCol: number,
  targetRow: number
): EditableBlock[] {
  const layout = getCanvasLayout(blocks, blockIndex)
  const colSpan = Math.min(layout.colSpan, GRID_COLUMNS - targetCol + 1) as BlockColSpan
  const gridCol = Math.max(1, Math.min(targetCol, GRID_COLUMNS - colSpan + 1))
  return blocks.map((block, i) =>
    i === blockIndex
      ? patchBlockLayout(block, { ...layout, gridCol, gridRow: Math.max(1, targetRow), colSpan })
      : block
  )
}

export function bentoGridExtent(blocks: EditableBlock[]): number {
  let maxRow = 4
  blocks.forEach((_, index) => {
    const layout = getCanvasLayout(blocks, index)
    maxRow = Math.max(maxRow, layout.gridRow + (layout.rowSpan ?? 1))
  })
  return maxRow + 1
}

export function gridPlacementStyle(layout: BlockCanvasLayout): GridPlacementStyle {
  return {
    gridColumn: `${layout.gridCol} / span ${layout.colSpan}`,
    gridRow: `${layout.gridRow} / span ${layout.rowSpan ?? 1}`,
  }
}

export function blockHasCanvasLayout(content: LessonBlockContent): boolean {
  return readLayoutFromContent(content) !== null
}

/** Infer student layout from saved block content (bento layouts are persisted on each block). */
export function inferLayoutModeFromBlocks(
  blocks: { content: LessonBlockContent }[]
): CanvasViewMode {
  return blocks.some((b) => blockHasCanvasLayout(b.content)) ? 'bento' : 'stack'
}

export function stripCanvasLayouts<T extends { content: LessonBlockContent }>(blocks: T[]): T[] {
  return blocks.map((block) => {
    const content = { ...(block.content as object) } as Record<string, unknown>
    delete content.canvasLayout
    return { ...block, content: content as LessonBlockContent }
  })
}

/** Normalize blocks before save so student view matches the active builder layout mode. */
export function prepareBlocksForSave<T extends EditableBlock>(
  blocks: T[],
  mode: CanvasViewMode
): T[] {
  if (mode === 'bento') return autoLayoutBentoBlocks(blocks) as T[]
  return stripCanvasLayouts(blocks)
}
