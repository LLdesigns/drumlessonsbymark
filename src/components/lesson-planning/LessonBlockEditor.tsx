import { useState } from 'react'
import {
  LESSON_BLOCK_TYPES,
  defaultBlockContent,
  detectVideoSource,
  newChecklistItem,
} from '../../lib/lesson-planning-constants'
import { uploadStudioMedia } from '../../lib/studio-media-service'
import type { LessonBlockContent, LessonBlockType } from '../../types/lesson-planning'

export interface EditableBlock {
  id: string
  block_type: LessonBlockType
  content: LessonBlockContent
  sort_order: number
}

interface LessonBlockEditorProps {
  blocks: EditableBlock[]
  onChange: (blocks: EditableBlock[]) => void
  userId: string
}

export default function LessonBlockEditor({ blocks, onChange, userId }: LessonBlockEditorProps) {
  const [uploading, setUploading] = useState<string | null>(null)

  const updateBlock = (index: number, content: LessonBlockContent) => {
    const next = [...blocks]
    next[index] = { ...next[index], content }
    onChange(next)
  }

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((b, i) => ({ ...b, sort_order: i })))
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, sort_order: i })))
  }

  const addBlock = (type: LessonBlockType) => {
    onChange([
      ...blocks,
      {
        id: crypto.randomUUID(),
        block_type: type,
        content: defaultBlockContent(type) as LessonBlockContent,
        sort_order: blocks.length,
      },
    ])
  }

  const handleFileUpload = async (index: number, file: File, field: 'url') => {
    setUploading(blocks[index].id)
    try {
      const url = await uploadStudioMedia(userId, file)
      const content = { ...blocks[index].content, [field]: url } as LessonBlockContent
      if (blocks[index].block_type === 'video') {
        Object.assign(content, { source: file.type.startsWith('video/') ? 'upload' : detectVideoSource(url) })
      }
      updateBlock(index, content)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div>
      <div className="lesson-block-list">
        {blocks.map((block, index) => {
          const meta = LESSON_BLOCK_TYPES.find((t) => t.type === block.block_type)
          const c = block.content as Record<string, unknown>
          return (
            <div key={block.id} className="lesson-block-item">
              <div className="lesson-block-item__header">
                <span className="lesson-block-item__type">
                  <i className={`bi ${meta?.icon ?? 'bi-square'}`} />
                  {meta?.label ?? block.block_type}
                </span>
                <div className="lesson-block-item__actions">
                  <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} title="Move up">
                    <i className="bi bi-arrow-up" />
                  </button>
                  <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} title="Move down">
                    <i className="bi bi-arrow-down" />
                  </button>
                  <button type="button" onClick={() => removeBlock(index)} title="Remove">
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>

              {block.block_type === 'text' ? (
                <textarea
                  className="studio-textarea"
                  rows={3}
                  placeholder="Instructions, reminders, teaching notes…"
                  value={String(c.body ?? '')}
                  onChange={(e) => updateBlock(index, { body: e.target.value })}
                />
              ) : null}

              {block.block_type === 'notation_image' ? (
                <>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="studio-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(index, file, 'url')
                    }}
                    disabled={uploading === block.id}
                  />
                  {c.url ? <img src={String(c.url)} alt="" className="lesson-notation-img" style={{ marginTop: '0.5rem' }} /> : null}
                  <input
                    className="studio-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Caption (optional)"
                    value={String(c.caption ?? '')}
                    onChange={(e) => updateBlock(index, { ...c, caption: e.target.value } as LessonBlockContent)}
                  />
                </>
              ) : null}

              {block.block_type === 'video' ? (
                <>
                  <input
                    className="studio-input"
                    placeholder="YouTube, Vimeo, or video URL"
                    value={String(c.url ?? '')}
                    onChange={(e) =>
                      updateBlock(index, {
                        ...c,
                        url: e.target.value,
                        source: detectVideoSource(e.target.value),
                      } as LessonBlockContent)
                    }
                  />
                  <input type="file" accept="video/*" className="studio-input" style={{ marginTop: '0.5rem' }} onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(index, file, 'url')
                  }} />
                  <input
                    className="studio-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Title (optional)"
                    value={String(c.title ?? '')}
                    onChange={(e) => updateBlock(index, { ...c, title: e.target.value } as LessonBlockContent)}
                  />
                </>
              ) : null}

              {block.block_type === 'audio' ? (
                <>
                  <input type="file" accept="audio/*" className="studio-input" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(index, file, 'url')
                  }} />
                  <input
                    className="studio-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Track title"
                    value={String(c.title ?? '')}
                    onChange={(e) => updateBlock(index, { ...c, title: e.target.value } as LessonBlockContent)}
                  />
                </>
              ) : null}

              {block.block_type === 'tempo' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <label>
                    <span className="studio-label">Start BPM</span>
                    <input type="number" className="studio-input" value={Number(c.starting_bpm ?? 60)} onChange={(e) => updateBlock(index, { ...c, starting_bpm: Number(e.target.value) } as LessonBlockContent)} />
                  </label>
                  <label>
                    <span className="studio-label">Current</span>
                    <input type="number" className="studio-input" value={Number(c.current_bpm ?? 60)} onChange={(e) => updateBlock(index, { ...c, current_bpm: Number(e.target.value) } as LessonBlockContent)} />
                  </label>
                  <label>
                    <span className="studio-label">Goal BPM</span>
                    <input type="number" className="studio-input" value={Number(c.target_bpm ?? 90)} onChange={(e) => updateBlock(index, { ...c, target_bpm: Number(e.target.value) } as LessonBlockContent)} />
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    <span className="studio-label">Notes</span>
                    <input className="studio-input" value={String(c.notes ?? '')} onChange={(e) => updateBlock(index, { ...c, notes: e.target.value } as LessonBlockContent)} />
                  </label>
                </div>
              ) : null}

              {block.block_type === 'rudiment' ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <input className="studio-input" placeholder="Rudiment name" value={String(c.name ?? '')} onChange={(e) => updateBlock(index, { ...c, name: e.target.value } as LessonBlockContent)} />
                  <input className="studio-input" placeholder="Sticking: R L R L" value={String(c.sticking_pattern ?? '')} onChange={(e) => updateBlock(index, { ...c, sticking_pattern: e.target.value } as LessonBlockContent)} />
                  <input type="number" className="studio-input" placeholder="Tempo goal" value={Number(c.tempo_goal ?? '')} onChange={(e) => updateBlock(index, { ...c, tempo_goal: Number(e.target.value) } as LessonBlockContent)} />
                  <textarea className="studio-textarea" rows={2} placeholder="Notes" value={String(c.notes ?? '')} onChange={(e) => updateBlock(index, { ...c, notes: e.target.value } as LessonBlockContent)} />
                </div>
              ) : null}

              {block.block_type === 'checklist' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {((c.items as { id: string; label: string }[]) ?? []).map((item, itemIdx) => (
                    <div key={item.id} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="studio-input"
                        value={item.label}
                        onChange={(e) => {
                          const items = [...((c.items as { id: string; label: string }[]) ?? [])]
                          items[itemIdx] = { ...item, label: e.target.value }
                          updateBlock(index, { items } as LessonBlockContent)
                        }}
                      />
                      <button
                        type="button"
                        className="studio-btn studio-btn--ghost"
                        onClick={() => {
                          const items = ((c.items as { id: string; label: string }[]) ?? []).filter((_, i) => i !== itemIdx)
                          updateBlock(index, { items } as LessonBlockContent)
                        }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="studio-btn studio-btn--ghost"
                    onClick={() => {
                      const items = [...((c.items as { id: string; label: string }[]) ?? []), newChecklistItem('New practice task')]
                      updateBlock(index, { items } as LessonBlockContent)
                    }}
                  >
                    <i className="bi bi-plus" /> Add task
                  </button>
                </div>
              ) : null}

              {block.block_type === 'resource_link' ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <input className="studio-input" placeholder="Label" value={String(c.label ?? '')} onChange={(e) => updateBlock(index, { ...c, label: e.target.value } as LessonBlockContent)} />
                  <input className="studio-input" placeholder="URL" value={String(c.url ?? '')} onChange={(e) => updateBlock(index, { ...c, url: e.target.value } as LessonBlockContent)} />
                </div>
              ) : null}

              {uploading === block.id ? <p className="studio-subtext">Uploading…</p> : null}
            </div>
          )
        })}
      </div>

      <p className="studio-label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        Add content block
      </p>
      <div className="lesson-block-picker">
        {LESSON_BLOCK_TYPES.map((bt) => (
          <button key={bt.type} type="button" onClick={() => addBlock(bt.type)}>
            <i className={`bi ${bt.icon}`} />
            <strong>{bt.label}</strong>
            <span style={{ opacity: 0.65, fontSize: '0.75rem' }}>{bt.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
