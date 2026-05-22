import type { ChecklistItem, ChecklistTaskType } from '../types/lesson-planning'

export type StickingHand = 'R' | 'L' | 'K'

const STICKING_TOKEN = /^[RLK]$/i

export function parseStickingPattern(pattern: string | undefined): StickingHand[] {
  if (!pattern?.trim()) return []
  return pattern
    .toUpperCase()
    .replace(/[^RLK]/g, ' ')
    .split(/\s+/)
    .filter((t) => STICKING_TOKEN.test(t))
    .map((t) => t.toUpperCase() as StickingHand)
}

export function formatStickingPattern(hands: StickingHand[]): string {
  return hands.join(' ')
}

export function isHtmlBody(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body)
}

/** Minimal allowlist for lesson text rendered to students */
export function sanitizeLessonHtml(html: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H3', 'H4', 'A', 'SPAN', 'DIV'])
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (!allowed.has(el.tagName)) {
        const parent = el.parentNode
        while (el.firstChild) parent?.insertBefore(el.firstChild, el)
        parent?.removeChild(el)
        return
      }
      if (el.tagName === 'A') {
        el.setAttribute('rel', 'noreferrer noopener')
        el.setAttribute('target', '_blank')
      }
      ;[...el.attributes].forEach((attr) => {
        if (attr.name === 'href' || attr.name === 'class') return
        el.removeAttribute(attr.name)
      })
    }
    ;[...node.childNodes].forEach(walk)
  }
  walk(doc.body)
  return doc.body.innerHTML
}

export function plainTextFromHtml(html: string): string {
  if (!isHtmlBody(html)) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}

export const RUDIMENT_PRESETS: { label: string; hands: StickingHand[] }[] = [
  { label: 'Single stroke roll', hands: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'] },
  { label: 'Double stroke roll', hands: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'] },
  { label: 'Paradiddle', hands: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'] },
  { label: 'Double paradiddle', hands: ['R', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'R', 'L', 'L'] },
  { label: 'Flam tap', hands: ['R', 'L', 'R', 'L'] },
]

export const CHECKLIST_TASK_TYPES: { value: ChecklistTaskType; label: string; icon: string }[] = [
  { value: 'practice', label: 'Practice', icon: 'bi-music-note-beamed' },
  { value: 'watch', label: 'Watch', icon: 'bi-play-circle' },
  { value: 'listen', label: 'Listen', icon: 'bi-headphones' },
  { value: 'record', label: 'Record', icon: 'bi-mic' },
  { value: 'read', label: 'Read', icon: 'bi-book' },
  { value: 'custom', label: 'Task', icon: 'bi-check2-square' },
]

export const CHECKLIST_QUICK_ADD: { label: string; task_type: ChecklistTaskType }[] = [
  { label: 'Practice with metronome', task_type: 'practice' },
  { label: 'Watch demo video', task_type: 'watch' },
  { label: 'Record yourself playing', task_type: 'record' },
  { label: 'Review notation', task_type: 'read' },
]

export function normalizeChecklistItem(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    task_type: item.task_type ?? 'practice',
  }
}
