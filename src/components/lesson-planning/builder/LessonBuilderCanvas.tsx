import { useMemo, useState } from 'react'
import {
  autoLayoutBentoBlocks,
  bentoEmptyDropCells,
  bentoGridExtent,
  getCanvasLayout,
  gridPlacementStyle,
  moveBentoBlockToCell,
  resizeBlockColSpan,
  swapBentoLayouts,
  type CanvasViewMode,
} from '../../../lib/lesson-builder-canvas-layout'
import { reorderBlocks, type EditableBlock } from '../../../lib/lesson-builder-utils'
import { getBlockTypeFromDragEvent, isBlockTypeDrag } from '../../../lib/lesson-builder-dnd'
import type { LessonBlockContent, LessonBlockType } from '../../../types/lesson-planning'
import type { LessonStarterTemplate } from '../../../lib/lesson-starter-templates'
import BlockPickerToolbar from './BlockPickerToolbar'
import CanvasBlockCard from './CanvasBlockCard'
import CanvasDropZone from './CanvasDropZone'
import CanvasViewToggle from './CanvasViewToggle'
import LessonCanvasEmptyState from './LessonCanvasEmptyState'

interface LessonBuilderCanvasProps {
  blocks: EditableBlock[]
  selectedBlockId: string | null
  collapsedIds: Set<string>
  dragIndex: number | null
  viewMode: CanvasViewMode
  userId?: string
  emptyTitle?: string
  emptyDescription?: string
  showStarters?: boolean
  onApplyStarter?: (starter: LessonStarterTemplate) => void
  onViewModeChange: (mode: CanvasViewMode) => void
  onSelectBlock: (id: string) => void
  onToggleCollapse: (id: string) => void
  onAddBlock: (type: LessonBlockType, atIndex?: number, bentoPlacement?: { gridCol: number; gridRow: number }) => void
  onUpdateBlockContent: (index: number, content: LessonBlockContent) => void
  onDuplicateBlock: (index: number) => void
  onDeleteBlock: (blockId: string) => void
  onBlocksChange: (blocks: EditableBlock[]) => void
  onDragIndexChange: (index: number | null) => void
  onClearSelection: () => void
  onDirty: () => void
}

export default function LessonBuilderCanvas({
  blocks,
  selectedBlockId,
  collapsedIds,
  dragIndex,
  viewMode,
  userId,
  emptyTitle,
  emptyDescription,
  showStarters = false,
  onApplyStarter,
  onViewModeChange,
  onSelectBlock,
  onToggleCollapse,
  onAddBlock,
  onUpdateBlockContent,
  onDuplicateBlock,
  onDeleteBlock,
  onBlocksChange,
  onDragIndexChange,
  onClearSelection,
  onDirty,
}: LessonBuilderCanvasProps) {
  const [paletteDragging, setPaletteDragging] = useState(false)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null)
  const [hoverBlockIndex, setHoverBlockIndex] = useState<number | null>(null)

  const showDropZones = paletteDragging || dragIndex != null
  const bentoBlocks = useMemo(
    () => (viewMode === 'bento' ? autoLayoutBentoBlocks(blocks) : blocks),
    [blocks, viewMode]
  )
  const displayBlocks = viewMode === 'bento' ? bentoBlocks : blocks
  const rowCount = useMemo(
    () => (viewMode === 'bento' ? bentoGridExtent(bentoBlocks) : 0),
    [bentoBlocks, viewMode]
  )

  const handleViewModeChange = (mode: CanvasViewMode) => {
    if (mode === 'bento' && blocks.length > 0) {
      onBlocksChange(autoLayoutBentoBlocks(blocks))
      onDirty()
    }
    onViewModeChange(mode)
  }

  const handleDragOver = (event: React.DragEvent, index: number) => {
    if (isBlockTypeDrag(event) || dragIndex != null) {
      event.preventDefault()
      event.dataTransfer.dropEffect = isBlockTypeDrag(event) ? 'copy' : 'move'
      setDropTargetIndex(index)
    }
  }

  const handleDrop = (event: React.DragEvent, atIndex: number) => {
    event.preventDefault()
    const blockType = getBlockTypeFromDragEvent(event)
    if (blockType) {
      onAddBlock(blockType, atIndex)
    } else if (dragIndex != null) {
      onBlocksChange(reorderBlocks(blocks, dragIndex, atIndex))
      onDragIndexChange(null)
      onDirty()
    }
    setDropTargetIndex(null)
    setPaletteDragging(false)
  }

  const handleBentoBlockDrop = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault()
    event.stopPropagation()
    if (isBlockTypeDrag(event)) return
    if (dragIndex != null) {
      onBlocksChange(swapBentoLayouts(displayBlocks, dragIndex, targetIndex))
      onDragIndexChange(null)
      onDirty()
    }
    setHoverBlockIndex(null)
  }

  const handleCellDrop = (event: React.DragEvent, col: number, row: number) => {
    event.preventDefault()
    event.stopPropagation()
    const blockType = getBlockTypeFromDragEvent(event)
    if (blockType) {
      onAddBlock(blockType, undefined, { gridCol: col, gridRow: row })
      endDrag()
      return
    }
    if (dragIndex != null) {
      onBlocksChange(moveBentoBlockToCell(displayBlocks, dragIndex, col, row))
      onDragIndexChange(null)
      onDirty()
    }
    setHoverCell(null)
  }

  const endDrag = () => {
    setPaletteDragging(false)
    setDropTargetIndex(null)
    setHoverCell(null)
    setHoverBlockIndex(null)
    onDragIndexChange(null)
  }

  const emptyCells = useMemo(() => {
    if (viewMode !== 'bento' || (!paletteDragging && dragIndex == null)) return []
    return bentoEmptyDropCells(displayBlocks, rowCount)
  }, [displayBlocks, dragIndex, paletteDragging, rowCount, viewMode])

  const clearIfBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClearSelection()
  }

  return (
    <main className={`lesson-builder__canvas-wrap${viewMode === 'bento' ? ' lesson-builder__canvas-wrap--bento' : ''}`}>
      <div className="lesson-builder__canvas-chrome">
        <CanvasViewToggle mode={viewMode} onChange={handleViewModeChange} />
        <p className="lesson-builder__canvas-chrome-hint">
          {viewMode === 'bento'
            ? 'Drag to rearrange · use the width icon to resize'
            : 'Drag the grip to reorder'}
        </p>
      </div>

      <div
        className={`lesson-builder__canvas-scroll lesson-builder__scroll${showDropZones ? ' lesson-builder__canvas--dragging' : ''}`}
        onDragEnd={endDrag}
      >
        <div className="lesson-builder__canvas-inner" onClick={clearIfBackdrop}>
      {viewMode === 'stack' ? (
        <div
          className={`lesson-builder__canvas lesson-builder__canvas--wide${showDropZones ? ' lesson-builder__canvas--dragging' : ''}`}
          onClick={clearIfBackdrop}
        >
          {blocks.length === 0 ? (
            <div
              className="lesson-builder__canvas-empty-wrap"
              onClick={clearIfBackdrop}
              onDragOver={(e) => handleDragOver(e, 0)}
              onDrop={(e) => handleDrop(e, 0)}
            >
              <LessonCanvasEmptyState
                title={emptyTitle}
                description={emptyDescription}
                isDropTarget={dropTargetIndex === 0 || paletteDragging}
                showStarters={showStarters}
                onAddBlock={(type) => onAddBlock(type, 0)}
                onApplyStarter={onApplyStarter}
                onPaletteDragStart={() => setPaletteDragging(true)}
                onPaletteDragEnd={endDrag}
              />
            </div>
          ) : (
            blocks.map((block, index) => (
              <div key={block.id} id={`block-${block.id}`} className="lesson-builder__stack-slot">
                <CanvasDropZone
                  index={index}
                  active={dropTargetIndex === index}
                  visible={showDropZones}
                  onDragEnter={setDropTargetIndex}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
                <CanvasBlockCard
                  block={block}
                  index={index}
                  selected={selectedBlockId === block.id}
                  collapsed={collapsedIds.has(block.id)}
                  previewMode={false}
                  userId={userId}
                  siblingBlocks={blocks}
                  onContentUpdate={(content) => onUpdateBlockContent(index, content)}
                  onSelect={() => onSelectBlock(block.id)}
                  onToggleCollapse={() => onToggleCollapse(block.id)}
                  onDuplicate={() => onDuplicateBlock(index)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onDragStart={onDragIndexChange}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            ))
          )}
          {blocks.length > 0 ? (
            <CanvasDropZone
              index={blocks.length}
              active={dropTargetIndex === blocks.length}
              visible={showDropZones}
              onDragEnter={setDropTargetIndex}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ) : null}
        </div>
      ) : (
        <div
          className="lesson-builder__bento-canvas"
          onClick={clearIfBackdrop}
          onDragOver={(e) => {
            if (isBlockTypeDrag(e)) e.preventDefault()
          }}
          onDrop={(e) => {
            e.preventDefault()
            const blockType = getBlockTypeFromDragEvent(e)
            if (blockType) {
              onAddBlock(blockType)
            }
            endDrag()
          }}
        >
          {blocks.length === 0 ? (
            <LessonCanvasEmptyState
              title={emptyTitle}
              description={emptyDescription}
              isDropTarget={paletteDragging}
              showStarters={showStarters}
              onAddBlock={(type) => onAddBlock(type, 0)}
              onApplyStarter={onApplyStarter}
              onPaletteDragStart={() => setPaletteDragging(true)}
              onPaletteDragEnd={endDrag}
            />
          ) : (
            <div
              className="lesson-builder__bento-grid"
              style={{ gridTemplateRows: `repeat(${rowCount}, minmax(140px, auto))` }}
            >
              {emptyCells.map((cell) => (
                    <div
                      key={`cell-${cell.col}-${cell.row}`}
                      className={`lesson-builder__bento-drop-cell${hoverCell?.col === cell.col && hoverCell?.row === cell.row ? ' is-active' : ''}`}
                      style={{
                        gridColumn: `${cell.col} / span 3`,
                        gridRow: `${cell.row} / span 1`,
                      }}
                      onDragEnter={() => setHoverCell(cell)}
                      onDragLeave={() => setHoverCell(null)}
                      onDragOver={(e) => {
                        if (isBlockTypeDrag(e) || dragIndex != null) e.preventDefault()
                      }}
                      onDrop={(e) => handleCellDrop(e, cell.col, cell.row)}
                    />
                  ))}

              {displayBlocks.map((block, index) => {
                const layout = getCanvasLayout(displayBlocks, index)
                const isSelected = selectedBlockId === block.id
                return (
                  <div
                    key={block.id}
                    id={`block-${block.id}`}
                    className={`lesson-builder__bento-slot${hoverBlockIndex === index ? ' is-drop-target' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
                    style={gridPlacementStyle(layout)}
                    onDragEnter={() => setHoverBlockIndex(index)}
                    onDragLeave={() => setHoverBlockIndex(null)}
                    onDragOver={(e) => {
                      if (dragIndex != null && !isBlockTypeDrag(e)) e.preventDefault()
                    }}
                    onDrop={(e) => handleBentoBlockDrop(e, index)}
                  >
                    <CanvasBlockCard
                      block={block}
                      index={index}
                      selected={isSelected}
                      collapsed={collapsedIds.has(block.id)}
                      previewMode={false}
                      userId={userId}
                      siblingBlocks={displayBlocks}
                      bentoMode
                      layout={layout}
                      onResize={() => {
                        onBlocksChange(resizeBlockColSpan(displayBlocks, index))
                        onDirty()
                      }}
                      onContentUpdate={(content) => onUpdateBlockContent(index, content)}
                      onSelect={() => onSelectBlock(block.id)}
                      onToggleCollapse={() => onToggleCollapse(block.id)}
                      onDuplicate={() => onDuplicateBlock(index)}
                      onDelete={() => onDeleteBlock(block.id)}
                      onDragStart={onDragIndexChange}
                      onDragOver={(e) => {
                        if (dragIndex != null && !isBlockTypeDrag(e)) e.preventDefault()
                      }}
                      onDrop={(e) => handleBentoBlockDrop(e, index)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      {blocks.length > 0 ? (
        <div className="lesson-builder__canvas-dock">
          <BlockPickerToolbar
            onAddBlock={(type) => onAddBlock(type)}
            onPaletteDragStart={() => setPaletteDragging(true)}
            onPaletteDragEnd={endDrag}
          />
        </div>
      ) : null}
    </main>
  )
}
