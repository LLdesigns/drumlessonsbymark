import type {
  AssignedLessonBlock,
  LessonBlockContent,
  LessonBlockType,
  LessonTemplateBlock,
} from '../types/lesson-planning'

/** Legacy drum sequencer blocks were saved with block_type "notation". */
export function isDrumSequencerContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  const c = content as Record<string, unknown>
  return (
    typeof c.beats_per_measure === 'number' ||
    typeof c.steps_per_beat === 'number' ||
    (Array.isArray(c.measures) &&
      c.measures.length > 0 &&
      typeof (c.measures[0] as Record<string, unknown>)?.steps !== 'undefined')
  )
}

export function isMusicNotationContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  const c = content as Record<string, unknown>
  if (c.notationData && typeof c.notationData === 'object') return true
  if (typeof c.instrument === 'string' && typeof c.timeSignature === 'string') return true
  return false
}

/** Resolve stored block_type for rendering and save (legacy notation → sequencer). */
export function resolveBlockType(
  blockType: LessonBlockType | string,
  content: unknown
): LessonBlockType {
  if (blockType === 'notation') {
    if (isDrumSequencerContent(content)) return 'sequencer'
    if (isMusicNotationContent(content)) return 'notation'
    return 'sequencer'
  }
  return blockType as LessonBlockType
}

export function normalizeLessonBlock<T extends LessonTemplateBlock | AssignedLessonBlock>(block: T): T {
  const resolved = resolveBlockType(block.block_type, block.content)
  if (resolved === block.block_type) return block
  return { ...block, block_type: resolved }
}

export function normalizeLessonBlocks<T extends LessonTemplateBlock | AssignedLessonBlock>(
  blocks: T[]
): T[] {
  return blocks.map(normalizeLessonBlock)
}

export function normalizeBlockForSave(
  blockType: LessonBlockType,
  content: LessonBlockContent
): { block_type: LessonBlockType; content: LessonBlockContent } {
  return { block_type: blockType, content }
}
