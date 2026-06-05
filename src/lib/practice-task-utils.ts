import type {
  AssignedLessonBlock,
  ChecklistBlockContent,
  ChecklistItem,
  ChecklistTaskType,
  LessonTemplateBlock,
  PracticeTaskCompletion,
  StudentBlockProgress,
} from '../types/lesson-planning'

export type LessonBlockRef = Pick<AssignedLessonBlock | LessonTemplateBlock, 'id' | 'block_type' | 'content' | 'sort_order'> & {
  source_block_id?: string | null
}

export interface LessonTaskProgress {
  total: number
  done: number
  percent: number
}

export function resolveLinkedBlockId(
  linkedId: string | undefined,
  blocks: LessonBlockRef[]
): string | undefined {
  if (!linkedId) return undefined
  const direct = blocks.find((b) => b.id === linkedId)
  if (direct) return direct.id
  const bySource = blocks.find((b) => b.source_block_id === linkedId)
  return bySource?.id
}

export function getBlockLabel(block: LessonBlockRef): string {
  const c = block.content as Record<string, unknown>
  const displayTitle = typeof c.displayTitle === 'string' ? c.displayTitle.trim() : ''
  if (displayTitle) return displayTitle
  if (block.block_type === 'video' && typeof c.title === 'string' && c.title.trim()) return c.title.trim()
  if (block.block_type === 'rudiment' && typeof c.name === 'string' && c.name.trim()) return c.name.trim()
  if (block.block_type === 'sequencer' && typeof c.caption === 'string' && c.caption.trim()) return c.caption.trim()
  if (block.block_type === 'notation') {
    const title = typeof c.title === 'string' ? c.title.trim() : ''
    if (title) return title
    if (typeof c.caption === 'string' && c.caption.trim()) return c.caption.trim()
  }
  const labels: Record<string, string> = {
    text: 'Text',
    video: 'Video',
    audio: 'Audio',
    sequencer: 'Sequencer',
    notation: 'Notation',
    notation_image: 'Image',
    tempo: 'Tempo',
    rudiment: 'Rudiment',
    checklist: 'Practice tasks',
    resource_link: 'Resource',
  }
  return labels[block.block_type] ?? block.block_type
}

export function linkableBlocks(blocks: LessonBlockRef[], excludeBlockId?: string): LessonBlockRef[] {
  return blocks.filter(
    (b) =>
      b.id !== excludeBlockId &&
      b.block_type !== 'checklist' &&
      b.block_type !== 'resource_link'
  )
}

export function computeLessonTaskProgress(
  blocks: LessonBlockRef[],
  completions: PracticeTaskCompletion[]
): LessonTaskProgress {
  let total = 0
  let done = 0

  for (const block of blocks) {
    if (block.block_type !== 'checklist') continue
    const items = (block.content as ChecklistBlockContent).items ?? []
    total += items.length
    done += items.filter((item) =>
      completions.some((c) => c.block_id === block.id && c.item_id === item.id)
    ).length
  }

  return {
    total,
    done,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  }
}

export function progressKindForTaskType(taskType: ChecklistTaskType | undefined): StudentBlockProgress['progress_kind'] {
  switch (taskType) {
    case 'watch':
    case 'read':
    case 'listen':
      return 'viewed'
    case 'practice':
    case 'record':
      return 'played'
    default:
      return 'completed'
  }
}

export function blockProgressSatisfiesTask(
  taskType: ChecklistTaskType | undefined,
  progress: StudentBlockProgress[]
): boolean {
  const kind = progressKindForTaskType(taskType)
  return progress.some((p) => p.progress_kind === kind || p.progress_kind === 'completed')
}

export function findAutoCompleteTasksForBlock(
  blocks: LessonBlockRef[],
  blockId: string,
  progress: StudentBlockProgress[],
  completions: PracticeTaskCompletion[]
): { checklistBlockId: string; item: ChecklistItem }[] {
  const matches: { checklistBlockId: string; item: ChecklistItem }[] = []

  for (const block of blocks) {
    if (block.block_type !== 'checklist') continue
    const items = (block.content as ChecklistBlockContent).items ?? []
    for (const item of items) {
      if (!item.auto_complete || !item.linked_block_id) continue
      const resolved = resolveLinkedBlockId(item.linked_block_id, blocks)
      if (resolved !== blockId) continue
      if (completions.some((c) => c.block_id === block.id && c.item_id === item.id)) continue
      if (!blockProgressSatisfiesTask(item.task_type, progress)) continue
      matches.push({ checklistBlockId: block.id, item })
    }
  }

  return matches
}

export function findRecordTasksForLesson(
  blocks: LessonBlockRef[],
  completions: PracticeTaskCompletion[]
): { checklistBlockId: string; item: ChecklistItem }[] {
  const matches: { checklistBlockId: string; item: ChecklistItem }[] = []

  for (const block of blocks) {
    if (block.block_type !== 'checklist') continue
    const items = (block.content as ChecklistBlockContent).items ?? []
    for (const item of items) {
      if (item.task_type !== 'record') continue
      if (completions.some((c) => c.block_id === block.id && c.item_id === item.id)) continue
      matches.push({ checklistBlockId: block.id, item })
    }
  }

  return matches
}

export function suggestedLinkForTaskType(
  taskType: ChecklistTaskType,
  blocks: LessonBlockRef[]
): string | undefined {
  const candidates = linkableBlocks(blocks)
  const pick = (types: string[]) => candidates.find((b) => types.includes(b.block_type))?.id

  switch (taskType) {
    case 'watch':
      return pick(['video'])
    case 'listen':
      return pick(['audio'])
    case 'read':
      return pick(['sequencer', 'notation', 'notation_image', 'text'])
    case 'practice':
      return pick(['sequencer', 'notation', 'rudiment', 'tempo'])
    case 'record':
      return undefined
    default:
      return undefined
  }
}
