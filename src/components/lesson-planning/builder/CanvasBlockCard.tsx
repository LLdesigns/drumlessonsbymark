import { normalizeLessonTextHtml, parseStickingPattern } from '../../../lib/block-content-utils'
import { normalizeDrumNotationContent, notationHasNotes } from '../../../lib/drum-notation'
import { instrumentLabel, normalizeMusicNotationContent } from '../../../lib/music-notation'
import { embedVideoUrl } from '../../../lib/lesson-planning-constants'
import type { ChecklistBlockContent, DrumNotationBlockContent, RudimentBlockContent } from '../../../types/lesson-planning'
import type { BlockCanvasLayout } from '../../../lib/lesson-builder-canvas-layout'
import { getBlockMeta, getBlockPreview, getBlockTitle, type EditableBlock } from '../../../lib/lesson-builder-utils'
import type { LessonBlockContent } from '../../../types/lesson-planning'
import type { LessonBlockRef } from '../../../lib/practice-task-utils'
import CanvasBlockEditor from './CanvasBlockEditor'
import DrumNotationView from '../blocks/DrumNotationView'
import MusicNotationStaffView from '../blocks/MusicNotationStaffView'

interface CanvasBlockCardProps {
  block: EditableBlock
  index: number
  selected: boolean
  collapsed: boolean
  previewMode: boolean
  userId?: string
  siblingBlocks?: LessonBlockRef[]
  bentoMode?: boolean
  layout?: BlockCanvasLayout
  onResize?: () => void
  onSelect: () => void
  onToggleCollapse: () => void
  onDuplicate: () => void
  onDelete: () => void
  onContentUpdate?: (content: LessonBlockContent) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
}

export default function CanvasBlockCard({
  block,
  index,
  selected,
  collapsed,
  previewMode,
  userId,
  siblingBlocks = [],
  bentoMode = false,
  layout,
  onResize,
  onSelect,
  onToggleCollapse,
  onDuplicate,
  onDelete,
  onContentUpdate,
  onDragStart,
  onDragOver,
  onDrop,
}: CanvasBlockCardProps) {
  const meta = getBlockMeta(block.block_type)
  const c = block.content as unknown as Record<string, unknown>
  const title = getBlockTitle(block)
  const preview = getBlockPreview(block)
  const isEditing = !previewMode && selected && !!userId && !!onContentUpdate

  const handleBodyClick = (e: React.MouseEvent) => {
    if (!isEditing && !previewMode) {
      e.stopPropagation()
      onSelect()
    }
  }

  const renderPreview = () => {
    if (block.block_type === 'notation_image' && c.url) {
      return <img src={String(c.url)} alt="" className="lesson-notation-img" />
    }
    if (block.block_type === 'sequencer') {
      const notation = normalizeDrumNotationContent(c as unknown as DrumNotationBlockContent)
      if (notationHasNotes(notation)) {
        return <DrumNotationView content={notation} compact />
      }
    }
    if (block.block_type === 'notation') {
      const music = normalizeMusicNotationContent(c)
      return (
        <div className="canvas-block__notation-preview">
          <div className="canvas-block__notation-meta">
            <span>{instrumentLabel(music.instrument)}</span>
            <span>{music.tempo} BPM</span>
            <span>{music.timeSignature}</span>
          </div>
          <MusicNotationStaffView content={music} size="compact" />
          {music.caption ? <p className="canvas-block__notation-caption">{music.caption}</p> : null}
        </div>
      )
    }
    if (block.block_type === 'video' && c.url) {
      const embed = embedVideoUrl(String(c.url))
      if (embed) {
        return (
          <div className="lesson-video-embed">
            <iframe src={embed} title={title} allowFullScreen />
          </div>
        )
      }
    }
    if (block.block_type === 'tempo') {
      return (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <span className="lesson-bpm-pill"><span>Start</span><strong>{String(c.starting_bpm ?? '—')}</strong></span>
          <span style={{ alignSelf: 'center', color: 'var(--lb-muted)' }}>→</span>
          <span className="lesson-bpm-pill"><span>Goal</span><strong>{String(c.target_bpm ?? '—')}</strong></span>
        </div>
      )
    }
    if (block.block_type === 'rudiment') {
      const r = c as unknown as RudimentBlockContent
      const hands = r.sticking_hands?.length ? r.sticking_hands : parseStickingPattern(String(r.sticking_pattern))
      if (hands.length) {
        return (
          <div className="lesson-sticking lesson-sticking--chips">
            {hands.map((hand, i) => (
              <span key={i} className={`block-rudiment__chip block-rudiment__chip--${hand.toLowerCase()}`}>{hand}</span>
            ))}
          </div>
        )
      }
      if (c.sticking_pattern) return <div className="lesson-sticking">{String(c.sticking_pattern)}</div>
    }
    if (block.block_type === 'checklist') {
      const checklist = c as unknown as ChecklistBlockContent
      const items = checklist.items ?? []
      return (
        <ul className="canvas-block__preview-checklist">
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <i className="bi bi-check2-square" style={{ marginRight: '0.35rem', opacity: 0.5 }} />
              {item.label || 'Untitled task'}
            </li>
          ))}
          {items.length > 4 ? <li className="canvas-block__preview-more">+{items.length - 4} more</li> : null}
        </ul>
      )
    }
    if (block.block_type === 'text' && c.body) {
      const html = normalizeLessonTextHtml(String(c.body))
      if (!html) return null
      return (
        <div
          className="canvas-block__preview canvas-block__preview--text lesson-rich-text lesson-rich-text--compact"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    }
    return <p className="canvas-block__preview">{preview}</p>
  }

  return (
    <div
      className={`canvas-block${selected ? ' canvas-block--selected' : ''}${collapsed ? ' canvas-block--collapsed' : ''}${isEditing ? ' canvas-block--editing' : ''}${bentoMode ? ' canvas-block--bento' : ''}`}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop(e, index)
      }}
    >
      <div className="canvas-block__head" onClick={onSelect}>
        {!previewMode ? (
          <span
            className="canvas-block__drag"
            draggable
            onDragStart={(e) => {
              e.stopPropagation()
              onDragStart(index)
            }}
            title={bentoMode ? 'Drag to reposition on grid' : 'Drag to reorder'}
          >
            <i className="bi bi-grip-vertical" />
          </span>
        ) : null}
        {meta?.icon ? <i className={`bi ${meta.icon} canvas-block__type-icon`} aria-hidden /> : null}
        <span className="canvas-block__type-badge">{meta?.label ?? block.block_type}</span>
        <h4 className="canvas-block__title">{title}</h4>
        {!previewMode ? (
          <div className="canvas-block__actions" onClick={(e) => e.stopPropagation()}>
            {bentoMode && onResize && layout ? (
              <button type="button" onClick={onResize} title={`Width: ${layout.colSpan}/12 columns`}>
                <i className="bi bi-arrows-angle-expand" />
              </button>
            ) : null}
            <button type="button" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
              <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`} />
            </button>
            <button type="button" onClick={onDuplicate} title="Duplicate">
              <i className="bi bi-copy" />
            </button>
            <button type="button" onClick={onDelete} title="Delete">
              <i className="bi bi-trash" />
            </button>
          </div>
        ) : null}
      </div>
      {!collapsed ? (
        <div
          className={`canvas-block__body${!isEditing && !previewMode ? ' canvas-block__body--selectable' : ''}`}
          onClick={handleBodyClick}
        >
          {isEditing ? (
            <div className="canvas-block__editor" onClick={(e) => e.stopPropagation()}>
            <CanvasBlockEditor
              block={block}
              userId={userId!}
              siblingBlocks={siblingBlocks}
              onUpdate={onContentUpdate!}
            />
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      ) : block.block_type === 'notation' ? (
        <div
          className="canvas-block__body canvas-block__body--collapsed-preview canvas-block__body--selectable"
          onClick={handleBodyClick}
        >
          {renderPreview()}
        </div>
      ) : null}
    </div>
  )
}
