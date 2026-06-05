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

/** Inline spans — highlight, code, etc. */
export const LESSON_RICH_TEXT_INLINE_CLASSES = [
  'lesson-text-highlight',
  'lesson-text-accent',
  'lesson-text-muted',
  'lesson-text-small',
  'lesson-text-code',
  'lesson-text-kbd',
] as const

/** Block-level tutorial styles (one variant at a time). */
export const LESSON_RICH_TEXT_VARIANT_CLASSES = [
  'lesson-text-lead',
  'lesson-text-callout',
  'lesson-text-tip',
  'lesson-text-warning',
  'lesson-text-practice',
  'lesson-text-spacer',
] as const

/** Layout on paragraphs/headings. */
export const LESSON_RICH_TEXT_ALIGN_CLASSES = [
  'lesson-text-center',
  'lesson-text-right',
] as const

export const LESSON_RICH_TEXT_LAYOUT_CLASSES = [
  ...LESSON_RICH_TEXT_ALIGN_CLASSES,
  'lesson-text-indent',
] as const

/** List styling. */
export const LESSON_RICH_TEXT_LIST_CLASSES = ['lesson-text-steps'] as const

export const LESSON_RICH_TEXT_CLASSES = [
  ...LESSON_RICH_TEXT_INLINE_CLASSES,
  ...LESSON_RICH_TEXT_VARIANT_CLASSES,
  ...LESSON_RICH_TEXT_LAYOUT_CLASSES,
  ...LESSON_RICH_TEXT_LIST_CLASSES,
] as const

const ALLOWED_RICH_TEXT_CLASS_SET = new Set<string>(LESSON_RICH_TEXT_CLASSES)

/** Safe href for lesson links (editor + sanitizer). */
export function sanitizeLinkHref(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed) return null
  if (/^mailto:/i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`
  }
  return null
}

function sanitizeElementClass(el: Element) {
  const raw = el.getAttribute('class')
  if (!raw) return
  const safe = raw.split(/\s+/).filter((c) => ALLOWED_RICH_TEXT_CLASS_SET.has(c))
  if (safe.length) el.setAttribute('class', safe.join(' '))
  else el.removeAttribute('class')
}

/** Minimal allowlist for lesson text rendered to students */
export function sanitizeLessonHtml(html: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const allowed = new Set([
    'P',
    'BR',
    'STRONG',
    'B',
    'EM',
    'I',
    'U',
    'S',
    'STRIKE',
    'DEL',
    'UL',
    'OL',
    'LI',
    'H2',
    'H3',
    'H4',
    'H5',
    'BLOCKQUOTE',
    'HR',
    'A',
    'SPAN',
    'CODE',
    'SUB',
    'SUP',
    'DIV',
  ])
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
        const href = el.getAttribute('href')
        const safeHref = href ? sanitizeLinkHref(href) : null
        if (!safeHref) {
          const parent = el.parentNode
          while (el.firstChild) parent?.insertBefore(el.firstChild, el)
          parent?.removeChild(el)
          return
        }
        el.setAttribute('href', safeHref)
        el.setAttribute('rel', 'noreferrer noopener')
        el.setAttribute('target', '_blank')
      }
      ;[...el.attributes].forEach((attr) => {
        if (el.tagName === 'A' && attr.name === 'href') return
        if (attr.name === 'class') {
          sanitizeElementClass(el)
          return
        }
        el.removeAttribute(attr.name)
      })
    }
    ;[...node.childNodes].forEach(walk)
  }
  const body = doc.body
  if (!body) return ''
  // Sanitize body children only — walking `body` itself would unwrap/remove it (BODY is not allowlisted).
  ;[...body.childNodes].forEach(walk)
  return body.innerHTML
}

/** Normalize plain or HTML lesson text for student rendering */
export function normalizeLessonTextHtml(body: string): string {
  const trimmed = String(body ?? '').trim()
  if (!trimmed) return ''
  if (isHtmlBody(trimmed)) return sanitizeLessonHtml(trimmed)
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return trimmed
    .split(/\n{2,}/)
    .map((para) => `<p>${escape(para).replace(/\n/g, '<br>')}</p>`)
    .join('')
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
  { label: 'Review groove in sequencer', task_type: 'read' },
]

export function normalizeChecklistItem(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    task_type: item.task_type ?? 'practice',
    auto_complete: item.auto_complete ?? false,
  }
}
