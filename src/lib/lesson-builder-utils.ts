import { plainTextFromHtml } from './block-content-utils'
import { notationHasNotes, normalizeDrumNotationContent } from './drum-notation'
import { instrumentLabel, normalizeMusicNotationContent } from './music-notation'
import { LESSON_BLOCK_TYPES } from './lesson-planning-constants'
import type { LessonBlockContent, LessonBlockType } from '../types/lesson-planning'

export interface EditableBlock {
  id: string
  block_type: LessonBlockType
  content: LessonBlockContent
  sort_order: number
}

export function getBlockMeta(type: LessonBlockType) {
  return LESSON_BLOCK_TYPES.find((t) => t.type === type)
}

export function getBlockTitle(block: EditableBlock): string {
  const c = block.content as unknown as Record<string, unknown>
  if (c.displayTitle && String(c.displayTitle).trim()) return String(c.displayTitle)
  if (block.block_type === 'video' || block.block_type === 'audio') {
    return String(c.title || '') || getBlockMeta(block.block_type)?.label || 'Block'
  }
  if (block.block_type === 'rudiment') return String(c.name || '') || 'Rudiment'
  if (block.block_type === 'text') {
    const body = plainTextFromHtml(String(c.body ?? '')).trim()
    if (body) return body.slice(0, 48) + (body.length > 48 ? '…' : '')
  }
  if (block.block_type === 'notation_image') return String(c.caption || '') || 'Image'
  if (block.block_type === 'sequencer') return String(c.caption || '') || 'Sequencer'
  if (block.block_type === 'notation') {
    const title = String(c.title ?? c.displayTitle ?? '').trim()
    return title || 'Notation'
  }
  if (block.block_type === 'tempo') {
    const s = c.starting_bpm
    const t = c.target_bpm
    if (s != null && t != null) return `${s} → ${t} BPM`
  }
  if (block.block_type === 'checklist') {
    const items = (c.items as { label: string }[]) ?? []
    return items[0]?.label || 'Practice tasks'
  }
  if (block.block_type === 'resource_link') return String(c.label || '') || 'Resource'
  return getBlockMeta(block.block_type)?.label ?? 'Block'
}

export function getBlockPreview(block: EditableBlock): string {
  const c = block.content as unknown as Record<string, unknown>
  switch (block.block_type) {
    case 'text':
      return plainTextFromHtml(String(c.body ?? '')).slice(0, 80) || 'Write your tutorial…'
    case 'video':
      return c.url ? 'Video linked' : 'Add a demo video'
    case 'audio':
      return c.url ? 'Audio track ready' : 'Add practice audio'
    case 'notation_image':
      return c.url ? 'Image uploaded' : 'Upload an image or PDF'
    case 'sequencer': {
      const n = normalizeDrumNotationContent(c)
      const bars = n.measures.length
      return notationHasNotes(n)
        ? `${bars} bar${bars !== 1 ? 's' : ''} in sequencer`
        : 'Build a groove in the sequencer'
    }
    case 'notation': {
      const m = normalizeMusicNotationContent(c)
      const notes = m.notationData.tracks[0]?.measures.reduce((n, meas) => n + meas.notes.length, 0) ?? 0
      if (notes > 0) {
        return `${instrumentLabel(m.instrument)} · ${m.timeSignature} · ${notes} note${notes !== 1 ? 's' : ''}`
      }
      return `${instrumentLabel(m.instrument)} · ${m.timeSignature} · Open editor to add notes`
    }
    case 'tempo':
      return `Start ${c.starting_bpm ?? '—'} · Goal ${c.target_bpm ?? '—'} BPM`
    case 'rudiment':
      return String(c.sticking_pattern ?? '') || 'Define sticking pattern'
    case 'checklist': {
      const n = ((c.items as unknown[]) ?? []).length
      return `${n} practice task${n !== 1 ? 's' : ''}`
    }
    case 'resource_link':
      return String(c.url ?? '') || 'Add external link'
    default:
      return ''
  }
}

export function reorderBlocks(blocks: EditableBlock[], fromIndex: number, toIndex: number): EditableBlock[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return blocks
  const next = [...blocks]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next.map((b, i) => ({ ...b, sort_order: i }))
}

export function duplicateBlock(block: EditableBlock): EditableBlock {
  return {
    ...block,
    id: crypto.randomUUID(),
    content: JSON.parse(JSON.stringify(block.content)),
  }
}

export const BUILDER_ONBOARDING_KEY = 'mark-studio-builder-help-seen-v1'
