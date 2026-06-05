import {
  LESSON_RICH_TEXT_ALIGN_CLASSES,
  LESSON_RICH_TEXT_CLASSES,
  LESSON_RICH_TEXT_LIST_CLASSES,
  LESSON_RICH_TEXT_VARIANT_CLASSES,
  sanitizeLessonHtml,
} from './block-content-utils'

export type LessonRichTextClass = (typeof LESSON_RICH_TEXT_CLASSES)[number]
export type LessonRichTextVariantClass = (typeof LESSON_RICH_TEXT_VARIANT_CLASSES)[number]
export type LessonRichTextAlignClass = (typeof LESSON_RICH_TEXT_ALIGN_CLASSES)[number]

export type RichTextBlockTag = 'p' | 'h2' | 'h3' | 'h4' | 'h5' | 'blockquote'

const BLOCK_TAGS = new Set(['P', 'H2', 'H3', 'H4', 'H5', 'DIV', 'BLOCKQUOTE'])
const LIST_TAGS = new Set(['UL', 'OL'])

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function toEditorHtml(value: string): string {
  const text = String(value ?? '')
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
}

export function clearRichTextBlockClasses(el: HTMLElement) {
  for (const cls of LESSON_RICH_TEXT_CLASSES) {
    el.classList.remove(cls)
  }
}

export function clearBlockVariantClasses(el: HTMLElement) {
  for (const cls of LESSON_RICH_TEXT_VARIANT_CLASSES) {
    el.classList.remove(cls)
  }
}

export function clearBlockAlignClasses(el: HTMLElement) {
  for (const cls of LESSON_RICH_TEXT_ALIGN_CLASSES) {
    el.classList.remove(cls)
  }
}

export function getClosestBlock(node: Node | null, editor: HTMLElement): HTMLElement | null {
  let current: Node | null = node
  while (current && current !== editor) {
    if (current instanceof HTMLElement && BLOCK_TAGS.has(current.tagName)) {
      if (current.tagName === 'DIV' && current.parentElement !== editor) {
        current = current.parentNode
        continue
      }
      return current
    }
    current = current.parentNode
  }
  return editor.querySelector<HTMLElement>('p, h2, h3, h4, h5, div, blockquote')
}

export function getClosestList(node: Node | null, editor: HTMLElement): HTMLElement | null {
  let current: Node | null = node
  while (current && current !== editor) {
    if (current instanceof HTMLElement && LIST_TAGS.has(current.tagName)) {
      return current
    }
    current = current.parentNode
  }
  return null
}

export function execOnEditor(editor: HTMLElement, command: string, value?: string): boolean {
  editor.focus()
  try {
    return document.execCommand(command, false, value)
  } catch {
    return false
  }
}

export function formatRichTextBlock(editor: HTMLElement, tag: RichTextBlockTag): void {
  editor.focus()
  execOnEditor(editor, 'formatBlock', tag)
  const sel = window.getSelection()
  const block = getClosestBlock(sel?.anchorNode ?? null, editor)
  if (block) clearBlockVariantClasses(block)
}

export function wrapSelectionWithClass(editor: HTMLElement, className: LessonRichTextClass): boolean {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return false

  const span = document.createElement('span')
  span.className = className
  try {
    range.surroundContents(span)
  } catch {
    span.appendChild(range.extractContents())
    range.insertNode(span)
  }
  sel.removeAllRanges()
  const after = document.createRange()
  after.setStartAfter(span)
  after.collapse(true)
  sel.addRange(after)
  return true
}

export function wrapSelectionWithCode(editor: HTMLElement): boolean {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return false

  const code = document.createElement('code')
  code.className = 'lesson-text-code'
  try {
    range.surroundContents(code)
  } catch {
    code.appendChild(range.extractContents())
    range.insertNode(code)
  }
  sel.removeAllRanges()
  return true
}

export function applyBlockStyleClass(editor: HTMLElement, className: LessonRichTextVariantClass): boolean {
  editor.focus()
  const sel = window.getSelection()
  let block = getClosestBlock(sel?.anchorNode ?? null, editor)

  if (!block && !editor.textContent?.trim()) {
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    editor.appendChild(p)
    block = p
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(true)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  if (!block) return false
  clearBlockVariantClasses(block)
  block.classList.add(className)
  return true
}

export function setBlockAlignment(editor: HTMLElement, align: 'left' | 'center' | 'right'): boolean {
  const sel = window.getSelection()
  const block = getClosestBlock(sel?.anchorNode ?? null, editor)
  if (!block) return false
  clearBlockAlignClasses(block)
  if (align === 'center') block.classList.add('lesson-text-center')
  if (align === 'right') block.classList.add('lesson-text-right')
  return true
}

export function toggleBlockIndent(editor: HTMLElement): boolean {
  const sel = window.getSelection()
  const block = getClosestBlock(sel?.anchorNode ?? null, editor)
  if (!block) return false
  block.classList.toggle('lesson-text-indent')
  return true
}

export function applyListStyleClass(editor: HTMLElement, className: (typeof LESSON_RICH_TEXT_LIST_CLASSES)[number]): boolean {
  editor.focus()
  const sel = window.getSelection()
  let list = getClosestList(sel?.anchorNode ?? null, editor)
  if (!list) {
    execOnEditor(editor, 'insertOrderedList')
    list = getClosestList(sel?.anchorNode ?? null, editor)
  }
  if (!list) return false
  for (const cls of LESSON_RICH_TEXT_LIST_CLASSES) {
    list.classList.remove(cls)
  }
  list.classList.add(className)
  return true
}

export function insertLineBreak(editor: HTMLElement): void {
  editor.focus()
  if (!execOnEditor(editor, 'insertLineBreak')) {
    execOnEditor(editor, 'insertHTML', '<br>')
  }
}

export function insertSpacer(editor: HTMLElement): void {
  insertSanitizedHtml(editor, '<p class="lesson-text-spacer" aria-hidden="true"><br></p>')
}

export function insertStepsList(editor: HTMLElement): void {
  insertSanitizedHtml(
    editor,
    '<ol class="lesson-text-steps"><li>First step</li><li>Second step</li><li>Third step</li></ol>'
  )
}

export function clearRichTextFormatting(editor: HTMLElement): void {
  editor.focus()
  execOnEditor(editor, 'removeFormat')
  const sel = window.getSelection()
  const block = getClosestBlock(sel?.anchorNode ?? null, editor)
  if (block) clearRichTextBlockClasses(block)
  const list = getClosestList(sel?.anchorNode ?? null, editor)
  if (list) {
    for (const cls of LESSON_RICH_TEXT_LIST_CLASSES) {
      list.classList.remove(cls)
    }
  }
}

export function insertSanitizedHtml(editor: HTMLElement, html: string): void {
  const clean = sanitizeLessonHtml(html)
  if (!clean) return
  editor.focus()
  execOnEditor(editor, 'insertHTML', clean)
}

export function insertPlainText(editor: HTMLElement, text: string): void {
  editor.focus()
  execOnEditor(editor, 'insertText', text)
}

export function handleRichTextPaste(editor: HTMLElement, data: DataTransfer | null): void {
  if (!data) return
  const html = data.getData('text/html')
  const plain = data.getData('text/plain')
  if (html?.trim()) {
    insertSanitizedHtml(editor, html)
  } else if (plain) {
    insertPlainText(editor, plain)
  }
}

export function handleRichTextKeyDown(
  editor: HTMLElement,
  event: { key: string; shiftKey: boolean; preventDefault: () => void }
): void {
  if (event.key === 'Enter' && event.shiftKey) {
    event.preventDefault()
    insertLineBreak(editor)
  }
}
