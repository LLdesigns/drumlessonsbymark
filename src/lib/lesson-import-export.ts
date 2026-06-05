import { normalizeLessonTextHtml } from './block-content-utils'
import { normalizeDrumNotationContent } from './drum-notation'
import { normalizeMusicNotationContent } from './music-notation'
import {
  autoLayoutBentoBlocks,
  inferLayoutModeFromBlocks,
  type BlockCanvasLayout,
  type CanvasViewMode,
} from './lesson-builder-canvas-layout'
import type { EditableBlock } from './lesson-builder-utils'
import {
  defaultBlockContent,
  detectVideoSource,
  LESSON_CATEGORIES,
  newChecklistItem,
} from './lesson-planning-constants'
import type {
  ChecklistItem,
  LessonBlockContent,
  LessonBlockType,
  LessonTemplateSkillLevel,
} from '../types/lesson-planning'

export const LESSON_IMPORT_VERSION = 1 as const

const VALID_BLOCK_TYPES = new Set<LessonBlockType>([
  'text',
  'notation_image',
  'sequencer',
  'notation',
  'video',
  'audio',
  'tempo',
  'rudiment',
  'checklist',
  'resource_link',
])

const VALID_SKILL_LEVELS = new Set<LessonTemplateSkillLevel>(['beginner', 'intermediate', 'advanced'])

export interface LessonImportCanvasLayout {
  gridCol: number
  gridRow: number
  colSpan: 3 | 4 | 6 | 8 | 12
  rowSpan?: 1 | 2
}

export interface LessonImportBlock {
  /** Stable key for cross-block references (checklist linked_block_ref). */
  ref?: string
  block_type: LessonBlockType
  display_title?: string
  content?: Record<string, unknown>
  canvas_layout?: LessonImportCanvasLayout
}

export interface LessonImportLessonMeta {
  title: string
  short_description?: string
  category?: string
  skill_level?: LessonTemplateSkillLevel
  estimated_duration_minutes?: number
  lesson_goal?: string
  teacher_notes?: string
  student_instructions?: string
  practice_assignment?: string
  tags?: string[]
  canvas_layout?: CanvasViewMode
}

export interface LessonImportDocument {
  version: typeof LESSON_IMPORT_VERSION
  exported_at?: string
  /** Human-readable hints for AI authors; ignored on import. */
  _documentation?: string
  lesson: LessonImportLessonMeta
  blocks: LessonImportBlock[]
}

export interface LessonExportInput {
  title: string
  shortDescription: string
  category: string
  skillLevel: LessonTemplateSkillLevel
  duration: number
  lessonGoal: string
  teacherNotes: string
  studentInstructions: string
  practiceAssignment: string
  tags: string[]
  canvasViewMode: CanvasViewMode
  blocks: EditableBlock[]
}

export interface LessonImportResult {
  lesson: LessonImportLessonMeta
  canvasViewMode: CanvasViewMode
  blocks: EditableBlock[]
}

export interface LessonImportParseResult {
  ok: true
  result: LessonImportResult
}

export interface LessonImportParseError {
  ok: false
  errors: string[]
}

export type LessonImportOutcome = LessonImportParseResult | LessonImportParseError

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function readCanvasLayout(raw: unknown): BlockCanvasLayout | undefined {
  if (!isRecord(raw)) return undefined
  const gridCol = Number(raw.gridCol)
  const gridRow = Number(raw.gridRow)
  const colSpan = Number(raw.colSpan)
  const rowSpan = raw.rowSpan != null ? Number(raw.rowSpan) : undefined
  if (!Number.isFinite(gridCol) || !Number.isFinite(gridRow) || !Number.isFinite(colSpan)) return undefined
  if (![3, 4, 6, 8, 12].includes(colSpan)) return undefined
  if (rowSpan != null && rowSpan !== 1 && rowSpan !== 2) return undefined
  return {
    gridCol: Math.max(1, Math.min(12, Math.round(gridCol))),
    gridRow: Math.max(1, Math.round(gridRow)),
    colSpan: colSpan as BlockCanvasLayout['colSpan'],
    ...(rowSpan != null ? { rowSpan: rowSpan as 1 | 2 } : {}),
  }
}

function normalizeCategory(category: unknown): string {
  const value = String(category ?? '').trim()
  if (!value) return 'Grooves'
  if ((LESSON_CATEGORIES as readonly string[]).includes(value)) return value
  return value
}

function normalizeSkillLevel(level: unknown): LessonTemplateSkillLevel {
  const value = String(level ?? '').toLowerCase()
  return VALID_SKILL_LEVELS.has(value as LessonTemplateSkillLevel)
    ? (value as LessonTemplateSkillLevel)
    : 'beginner'
}

function stripImportOnlyFields(content: Record<string, unknown>): Record<string, unknown> {
  const next = { ...content }
  delete next.canvasLayout
  delete next.displayTitle
  return next
}

function normalizeBlockContent(
  blockType: LessonBlockType,
  displayTitle: string,
  rawContent: Record<string, unknown>
): LessonBlockContent {
  const base = defaultBlockContent(blockType, displayTitle) as Record<string, unknown>
  const merged = { ...base, ...stripImportOnlyFields(rawContent) }

  if (displayTitle) merged.displayTitle = displayTitle

  if (blockType === 'text' && typeof merged.body === 'string') {
    merged.body = normalizeLessonTextHtml(merged.body)
  }

  if (blockType === 'video' && typeof merged.url === 'string') {
    merged.source = detectVideoSource(merged.url)
  }

  if (blockType === 'sequencer') {
    const normalized = normalizeDrumNotationContent(merged)
    return { ...normalized, displayTitle: displayTitle || String(merged.displayTitle ?? '') } as LessonBlockContent
  }

  if (blockType === 'notation') {
    const normalized = normalizeMusicNotationContent(merged)
    return {
      ...normalized,
      displayTitle: displayTitle || String(merged.displayTitle ?? ''),
      title: String(merged.title ?? displayTitle ?? 'Notation'),
    } as LessonBlockContent
  }

  if (blockType === 'checklist' && Array.isArray(merged.items)) {
    merged.items = (merged.items as unknown[]).map((item) => {
      if (!isRecord(item)) return newChecklistItem()
      const label = String(item.label ?? '').trim() || 'Practice task'
      const taskType = item.task_type
      const validTask =
        taskType === 'practice' ||
        taskType === 'watch' ||
        taskType === 'listen' ||
        taskType === 'record' ||
        taskType === 'read' ||
        taskType === 'custom'
          ? taskType
          : 'practice'
      return {
        id: crypto.randomUUID(),
        label,
        task_type: validTask,
        auto_complete: Boolean(item.auto_complete),
        _linked_block_ref: item.linked_block_ref ?? item._linked_block_ref,
      }
    })
  }

  return merged as LessonBlockContent
}

function resolveLinkedBlockRefs(blocks: EditableBlock[]): EditableBlock[] {
  const refToId = new Map<string, string>()
  blocks.forEach((block, index) => {
    const content = block.content as unknown as Record<string, unknown>
    const ref = content._importRef
    if (typeof ref === 'string' && ref.trim()) refToId.set(ref.trim(), block.id)
    refToId.set(String(index), block.id)
    refToId.set(`block-${index}`, block.id)
  })

  return blocks.map((block) => {
    if (block.block_type !== 'checklist') return block
    const content = { ...(block.content as object) } as Record<string, unknown>
    const items = (content.items as unknown[]) ?? []
    content.items = items.map((raw) => {
      if (!isRecord(raw)) return raw
      const item = { ...raw } as unknown as ChecklistItem & { _linked_block_ref?: unknown }
      const ref = item._linked_block_ref
      delete (item as unknown as Record<string, unknown>)._linked_block_ref
      if (ref != null) {
        const key = String(ref).trim()
        const linked = refToId.get(key)
        if (linked) item.linked_block_id = linked
      }
      if (!item.id) item.id = crypto.randomUUID()
      return item
    })
    delete content._importRef
    return { ...block, content: content as LessonBlockContent }
  })
}

export function exportLessonDocument(input: LessonExportInput): LessonImportDocument {
  const refById = new Map(input.blocks.map((b, i) => [b.id, `block-${i}`]))

  const blockRefs: LessonImportBlock[] = input.blocks.map((b, i) => {
    const content = b.content as unknown as Record<string, unknown>
    const canvasLayout = readCanvasLayout(content.canvasLayout)
    const { canvasLayout: _cl, displayTitle, ...rest } = content
    void _cl

    const exportContent = { ...rest } as Record<string, unknown>
    if (displayTitle != null && displayTitle !== '') exportContent.displayTitle = displayTitle

    return {
      ref: `block-${i}`,
      block_type: b.block_type,
      ...(displayTitle ? { display_title: String(displayTitle) } : {}),
      content: exportContent,
      ...(canvasLayout ? { canvas_layout: canvasLayout } : {}),
    }
  })

  const blocks = blockRefs.map((block) => {
    if (block.block_type !== 'checklist' || !block.content?.items) return block
    const items = (block.content.items as unknown[]).map((raw) => {
      if (!isRecord(raw)) return raw
      const next = { ...raw }
      const linkedId = raw.linked_block_id
      if (typeof linkedId === 'string') {
        const idx = input.blocks.findIndex((b) => b.id === linkedId)
        next.linked_block_ref = refById.get(linkedId) ?? (idx >= 0 ? `block-${idx}` : undefined)
        delete next.linked_block_id
      }
      delete next.id
      return next
    })
    return { ...block, content: { ...block.content, items } }
  })

  return {
    version: LESSON_IMPORT_VERSION,
    exported_at: new Date().toISOString(),
    _documentation:
      'Play It Pro lesson import v1. Rich text HTML may use classes: lesson-text-lead, lesson-text-callout, lesson-text-tip, lesson-text-warning, lesson-text-practice, lesson-text-highlight, lesson-text-center, lesson-text-steps (on ul). Use canvas_layout "bento" with per-block canvas_layout for grid placement (12 columns). Checklist items use linked_block_ref matching a block ref.',
    lesson: {
      title: input.title.trim() || 'Untitled Lesson',
      short_description: input.shortDescription.trim() || undefined,
      category: input.category,
      skill_level: input.skillLevel,
      estimated_duration_minutes: input.duration,
      lesson_goal: input.lessonGoal.trim() || undefined,
      teacher_notes: input.teacherNotes.trim() || undefined,
      student_instructions: input.studentInstructions.trim() || undefined,
      practice_assignment: input.practiceAssignment.trim() || undefined,
      tags: input.tags.length ? input.tags : undefined,
      canvas_layout: input.canvasViewMode,
    },
    blocks,
  }
}

export function parseLessonImportJson(jsonText: string): LessonImportOutcome {
  const errors: string[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, errors: ['Invalid JSON — check syntax and try again.'] }
  }

  if (!isRecord(parsed)) {
    return { ok: false, errors: ['Root value must be a JSON object.'] }
  }

  const version = parsed.version
  if (version !== LESSON_IMPORT_VERSION) {
    errors.push(`Unsupported version "${String(version)}". Expected version ${LESSON_IMPORT_VERSION}.`)
  }

  const lessonRaw = parsed.lesson
  if (!isRecord(lessonRaw)) {
    errors.push('Missing "lesson" object.')
  }

  const title = isRecord(lessonRaw) ? String(lessonRaw.title ?? '').trim() : ''
  if (!title) errors.push('lesson.title is required.')

  const blocksRaw = parsed.blocks
  if (!Array.isArray(blocksRaw)) {
    errors.push('"blocks" must be an array.')
  }

  if (errors.length) return { ok: false, errors }

  const lessonRecord = lessonRaw as Record<string, unknown>
  const blocksArray = blocksRaw as unknown[]

  const lesson: LessonImportLessonMeta = {
    title,
    short_description: String(lessonRecord.short_description ?? '').trim() || undefined,
    category: normalizeCategory(lessonRecord.category),
    skill_level: normalizeSkillLevel(lessonRecord.skill_level),
    estimated_duration_minutes: Number.isFinite(Number(lessonRecord.estimated_duration_minutes))
      ? Math.max(1, Math.round(Number(lessonRecord.estimated_duration_minutes)))
      : 30,
    lesson_goal: String(lessonRecord.lesson_goal ?? '').trim() || undefined,
    teacher_notes: String(lessonRecord.teacher_notes ?? '').trim() || undefined,
    student_instructions: String(lessonRecord.student_instructions ?? '').trim() || undefined,
    practice_assignment: String(lessonRecord.practice_assignment ?? '').trim() || undefined,
    tags: Array.isArray(lessonRecord.tags)
      ? lessonRecord.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : undefined,
    canvas_layout:
      lessonRecord.canvas_layout === 'bento' || lessonRecord.canvas_layout === 'stack'
        ? lessonRecord.canvas_layout
        : undefined,
  }

  const importBlocks: EditableBlock[] = []
  blocksArray.forEach((raw: unknown, index: number) => {
    if (!isRecord(raw)) {
      errors.push(`Block ${index + 1}: must be an object.`)
      return
    }
    const blockType = String(raw.block_type ?? '') as LessonBlockType
    if (!VALID_BLOCK_TYPES.has(blockType)) {
      errors.push(`Block ${index + 1}: unknown block_type "${blockType}".`)
      return
    }
    const displayTitle = String(
      raw.display_title ?? (isRecord(raw.content) ? raw.content.displayTitle : '') ?? ''
    ).trim()
    const contentRaw = isRecord(raw.content) ? raw.content : {}
    let content = normalizeBlockContent(blockType, displayTitle, contentRaw)

    const layout =
      readCanvasLayout(raw.canvas_layout) ??
      readCanvasLayout(isRecord(contentRaw) ? contentRaw.canvasLayout : undefined)

    const importRef = String(raw.ref ?? `block-${index}`).trim()
    const contentRecord = { ...(content as object), _importRef: importRef } as Record<string, unknown>
    if (layout) contentRecord.canvasLayout = layout
    content = contentRecord as LessonBlockContent

    importBlocks.push({
      id: crypto.randomUUID(),
      block_type: blockType,
      content,
      sort_order: index,
    })
  })

  if (errors.length) return { ok: false, errors }

  let blocks = resolveLinkedBlockRefs(importBlocks)

  let canvasViewMode: CanvasViewMode =
    lesson.canvas_layout ?? inferLayoutModeFromBlocks(blocks)

  if (canvasViewMode === 'bento') {
    blocks = autoLayoutBentoBlocks(blocks)
  } else {
    blocks = blocks.map((b) => {
      const content = { ...(b.content as object) } as Record<string, unknown>
      delete content.canvasLayout
      return { ...b, content: content as LessonBlockContent }
    })
  }

  return {
    ok: true,
    result: {
      lesson,
      canvasViewMode,
      blocks,
    },
  }
}

export function downloadLessonJson(doc: LessonImportDocument, filename?: string) {
  const safeName =
    filename ??
    `${doc.lesson.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'lesson'}-import.json`
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function readLessonImportFile(file: File): Promise<LessonImportOutcome> {
  return file.text().then(parseLessonImportJson)
}
