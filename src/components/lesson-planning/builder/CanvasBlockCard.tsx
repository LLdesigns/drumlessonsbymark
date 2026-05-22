import { isHtmlBody, parseStickingPattern, plainTextFromHtml, sanitizeLessonHtml } from '../../../lib/block-content-utils'
import { embedVideoUrl } from '../../../lib/lesson-planning-constants'
import type { ChecklistBlockContent, RudimentBlockContent } from '../../../types/lesson-planning'
import { getBlockMeta, getBlockPreview, getBlockTitle, type EditableBlock } from '../../../lib/lesson-builder-utils'
import type { LessonBlockContent } from '../../../types/lesson-planning'
import CanvasBlockEditor from './CanvasBlockEditor'

interface CanvasBlockCardProps {
  block: EditableBlock
  index: number
  selected: boolean
  collapsed: boolean
  previewMode: boolean
  userId?: string
  onSelect: () => void
  onToggleCollapse: () => void
  onDuplicate: () => void
  onDelete: () => void
  onContentUpdate?: (content: LessonBlockContent) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
}

export default function CanvasBlockCard({
  block,
  index,
  selected,
  collapsed,
  previewMode,
  userId,
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

  const renderPreview = () => {
    if (block.block_type === 'notation_image' && c.url) {
      return <img src={String(c.url)} alt="" className="lesson-notation-img" />
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
      const body = String(c.body)
      if (isHtmlBody(body)) {
        return (
          <div
            className="canvas-block__preview canvas-block__preview--text lesson-rich-text lesson-rich-text--compact"
            dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(body) }}
          />
        )
      }
      return <p className="canvas-block__preview canvas-block__preview--text">{plainTextFromHtml(body)}</p>
    }
    return <p className="canvas-block__preview">{preview}</p>
  }

  return (
    <div
      className={`canvas-block ${selected ? 'canvas-block--selected' : ''} ${collapsed ? 'canvas-block--collapsed' : ''} ${isEditing ? 'canvas-block--editing' : ''}`}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
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
            title="Drag to reorder"
          >
            <i className="bi bi-grip-vertical" />
          </span>
        ) : null}
        {meta?.icon ? <i className={`bi ${meta.icon} canvas-block__type-icon`} aria-hidden /> : null}
        <span className="canvas-block__type-badge">{meta?.label ?? block.block_type}</span>
        <h4 className="canvas-block__title">{title}</h4>
        {!previewMode ? (
          <div className="canvas-block__actions" onClick={(e) => e.stopPropagation()}>
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
        <div className="canvas-block__body">
          {isEditing ? (
            <CanvasBlockEditor block={block} userId={userId!} onUpdate={onContentUpdate!} />
          ) : (
            renderPreview()
          )}
        </div>
      ) : null}
    </div>
  )
}
