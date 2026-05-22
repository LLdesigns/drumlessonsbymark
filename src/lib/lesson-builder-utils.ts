import { plainTextFromHtml } from './block-content-utils'
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
  if (block.block_type === 'notation_image') return String(c.caption || '') || 'Notation'
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
      return plainTextFromHtml(String(c.body ?? '')).slice(0, 80) || 'Add your teaching notes…'
    case 'video':
      return c.url ? 'Video linked' : 'Add a demo video'
    case 'audio':
      return c.url ? 'Audio track ready' : 'Add practice audio'
    case 'notation_image':
      return c.url ? 'Notation uploaded' : 'Upload notation image'
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

export const BUILDER_ONBOARDING_KEY = 'mark-studio-builder-onboarding-v1'
