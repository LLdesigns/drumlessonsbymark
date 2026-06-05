import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react'
import { plainTextFromHtml, sanitizeLinkHref } from '../../../lib/block-content-utils'
import {
  applyBlockStyleClass,
  applyListStyleClass,
  clearRichTextFormatting,
  execOnEditor,
  formatRichTextBlock,
  handleRichTextKeyDown,
  handleRichTextPaste,
  insertLineBreak,
  insertSpacer,
  insertStepsList,
  setBlockAlignment,
  toEditorHtml,
  toggleBlockIndent,
  wrapSelectionWithClass,
  wrapSelectionWithCode,
  type LessonRichTextClass,
  type LessonRichTextVariantClass,
  type RichTextBlockTag,
} from '../../../lib/rich-text-editor-utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function isEditorFocused(el: HTMLDivElement | null): boolean {
  if (!el) return false
  const active = document.activeElement
  return active === el || (active != null && el.contains(active))
}

function ToolbarButton({
  title,
  icon,
  label,
  className,
  onClick,
}: {
  title: string
  icon?: string
  label?: string
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={className}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label ? <span>{label}</span> : icon ? <i className={`bi ${icon}`} /> : null}
    </button>
  )
}

function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block-rich-text__toolbar-group">
      <span className="block-rich-text__toolbar-label">{label}</span>
      <div className="block-rich-text__toolbar-group-btns">{children}</div>
    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedHtml = useRef(toEditorHtml(value))
  const suppressInputRef = useRef(false)
  const mountedRef = useRef(false)

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? ''
    if (html === lastEmittedHtml.current) return
    lastEmittedHtml.current = html
    onChange(html)
  }, [onChange])

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const nextHtml = toEditorHtml(value)

    if (!mountedRef.current) {
      mountedRef.current = true
      el.innerHTML = nextHtml
      lastEmittedHtml.current = nextHtml
      return
    }

    if (isEditorFocused(el)) return
    if (el.innerHTML === nextHtml) {
      lastEmittedHtml.current = nextHtml
      return
    }

    suppressInputRef.current = true
    el.innerHTML = nextHtml
    lastEmittedHtml.current = nextHtml
  }, [value])

  const run = useCallback(
    (fn: (editor: HTMLDivElement) => void) => {
      const el = editorRef.current
      if (!el) return
      fn(el)
      emitChange()
    },
    [emitChange]
  )

  const exec = useCallback(
    (command: string, val?: string) => {
      run((el) => {
        execOnEditor(el, command, val)
      })
    },
    [run]
  )

  const formatBlock = useCallback(
    (tag: RichTextBlockTag) => {
      run((el) => formatRichTextBlock(el, tag))
    },
    [run]
  )

  const wrapClass = useCallback(
    (className: LessonRichTextClass) => {
      run((el) => {
        wrapSelectionWithClass(el, className)
      })
    },
    [run]
  )

  const applyVariant = useCallback(
    (className: LessonRichTextVariantClass) => {
      run((el) => {
        applyBlockStyleClass(el, className)
      })
    },
    [run]
  )

  const insertLink = () => {
    const raw = window.prompt('Link URL (https://…)')
    if (!raw?.trim()) return
    const href = sanitizeLinkHref(raw)
    if (!href) {
      window.alert('Enter a valid web link (https:// or mailto:).')
      return
    }
    exec('createLink', href)
  }

  const handleInput = () => {
    if (suppressInputRef.current) {
      suppressInputRef.current = false
      return
    }
    emitChange()
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const el = editorRef.current
    if (!el) return
    event.preventDefault()
    handleRichTextPaste(el, event.clipboardData)
    emitChange()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = editorRef.current
    if (!el) return
    handleRichTextKeyDown(el, event)
    if (event.key === 'Enter' && event.shiftKey) {
      emitChange()
    }
  }

  const isEmpty =
    !String(value ?? '').trim() ||
    (/<[a-z]/i.test(String(value)) && !plainTextFromHtml(String(value)).trim())

  return (
    <div className="block-rich-text">
      <div className="block-rich-text__toolbar" role="toolbar" aria-label="Text formatting">
        <ToolbarGroup label="Text">
          <ToolbarButton title="Bold" icon="bi-type-bold" onClick={() => exec('bold')} />
          <ToolbarButton title="Italic" icon="bi-type-italic" onClick={() => exec('italic')} />
          <ToolbarButton title="Underline" icon="bi-type-underline" onClick={() => exec('underline')} />
          <ToolbarButton title="Strikethrough" icon="bi-type-strikethrough" onClick={() => exec('strikeThrough')} />
          <ToolbarButton title="Superscript" icon="bi-superscript" onClick={() => exec('superscript')} />
          <ToolbarButton title="Subscript" icon="bi-subscript" onClick={() => exec('subscript')} />
        </ToolbarGroup>

        <ToolbarGroup label="Breaks">
          <ToolbarButton
            title="Line break (Shift+Enter)"
            label="Br"
            className="block-rich-text__toolbar-btn--text"
            onClick={() => run((el) => insertLineBreak(el))}
          />
          <ToolbarButton
            title="Extra vertical space between sections"
            icon="bi-distribute-vertical"
            onClick={() => run((el) => insertSpacer(el))}
          />
          <ToolbarButton title="Horizontal divider" icon="bi-hr" onClick={() => exec('insertHorizontalRule')} />
        </ToolbarGroup>

        <ToolbarGroup label="Headings">
          <ToolbarButton title="Paragraph" label="P" className="block-rich-text__toolbar-btn--text" onClick={() => formatBlock('p')} />
          <ToolbarButton title="Section heading" label="H2" className="block-rich-text__toolbar-btn--text" onClick={() => formatBlock('h2')} />
          <ToolbarButton title="Heading 3" label="H3" className="block-rich-text__toolbar-btn--text" onClick={() => formatBlock('h3')} />
          <ToolbarButton title="Heading 4" label="H4" className="block-rich-text__toolbar-btn--text" onClick={() => formatBlock('h4')} />
          <ToolbarButton title="Label heading" label="H5" className="block-rich-text__toolbar-btn--text" onClick={() => formatBlock('h5')} />
        </ToolbarGroup>

        <ToolbarGroup label="Boxes">
          <ToolbarButton title="Lead intro paragraph" label="Lead" className="block-rich-text__toolbar-btn--text" onClick={() => applyVariant('lesson-text-lead')} />
          <ToolbarButton title="General callout" label="Note" className="block-rich-text__toolbar-btn--text" onClick={() => applyVariant('lesson-text-callout')} />
          <ToolbarButton
            title="Tip for students"
            icon="bi-lightbulb"
            className="block-rich-text__toolbar-btn--tip"
            onClick={() => applyVariant('lesson-text-tip')}
          />
          <ToolbarButton
            title="Important warning"
            icon="bi-exclamation-triangle"
            className="block-rich-text__toolbar-btn--warning"
            onClick={() => applyVariant('lesson-text-warning')}
          />
          <ToolbarButton
            title="Practice at the kit"
            icon="bi-music-note-beamed"
            className="block-rich-text__toolbar-btn--practice"
            onClick={() => applyVariant('lesson-text-practice')}
          />
        </ToolbarGroup>

        <ToolbarGroup label="Lists">
          <ToolbarButton title="Bullet list" icon="bi-list-ul" onClick={() => exec('insertUnorderedList')} />
          <ToolbarButton title="Numbered list" icon="bi-list-ol" onClick={() => exec('insertOrderedList')} />
          <ToolbarButton
            title="Numbered steps (1, 2, 3…)"
            label="Steps"
            className="block-rich-text__toolbar-btn--text"
            onClick={() => run((el) => insertStepsList(el))}
          />
          <ToolbarButton
            title="Apply step styling to current list"
            label="Step style"
            className="block-rich-text__toolbar-btn--text"
            onClick={() => run((el) => applyListStyleClass(el, 'lesson-text-steps'))}
          />
          <ToolbarButton title="Block quote" icon="bi-blockquote-left" onClick={() => formatBlock('blockquote')} />
        </ToolbarGroup>

        <ToolbarGroup label="Layout">
          <ToolbarButton title="Align left" icon="bi-text-left" onClick={() => run((el) => setBlockAlignment(el, 'left'))} />
          <ToolbarButton title="Align center" icon="bi-text-center" onClick={() => run((el) => setBlockAlignment(el, 'center'))} />
          <ToolbarButton title="Align right" icon="bi-text-right" onClick={() => run((el) => setBlockAlignment(el, 'right'))} />
          <ToolbarButton title="Indent paragraph" icon="bi-text-indent-left" onClick={() => run((el) => toggleBlockIndent(el))} />
        </ToolbarGroup>

        <ToolbarGroup label="Emphasis">
          <ToolbarButton
            title="Highlight"
            icon="bi-highlighter"
            className="block-rich-text__toolbar-btn--highlight"
            onClick={() => wrapClass('lesson-text-highlight')}
          />
          <ToolbarButton
            title="Accent"
            icon="bi-star-fill"
            className="block-rich-text__toolbar-btn--accent"
            onClick={() => wrapClass('lesson-text-accent')}
          />
          <ToolbarButton
            title="Muted"
            icon="bi-dash-circle"
            className="block-rich-text__toolbar-btn--muted"
            onClick={() => wrapClass('lesson-text-muted')}
          />
          <ToolbarButton title="Small text" label="Sm" className="block-rich-text__toolbar-btn--text" onClick={() => wrapClass('lesson-text-small')} />
          <ToolbarButton title="Code / sticking" icon="bi-code-slash" onClick={() => run((el) => wrapSelectionWithCode(el))} />
          <ToolbarButton title="Keyboard key" icon="bi-keyboard" onClick={() => wrapClass('lesson-text-kbd')} />
        </ToolbarGroup>

        <ToolbarGroup label="Link">
          <ToolbarButton title="Add link" icon="bi-link-45deg" onClick={insertLink} />
          <ToolbarButton title="Remove link" icon="bi-link-45deg" className="block-rich-text__toolbar-btn--unlink" onClick={() => exec('unlink')} />
        </ToolbarGroup>

        <ToolbarGroup label="Edit">
          <ToolbarButton title="Undo" icon="bi-arrow-counterclockwise" onClick={() => exec('undo')} />
          <ToolbarButton title="Redo" icon="bi-arrow-clockwise" onClick={() => exec('redo')} />
          <ToolbarButton title="Clear formatting" icon="bi-eraser" onClick={() => run((el) => clearRichTextFormatting(el))} />
        </ToolbarGroup>
      </div>

      <div
        ref={editorRef}
        className="block-rich-text__editor lesson-rich-text"
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      />

      <p className="block-rich-text__hint" aria-live="polite">
        {isEmpty
          ? 'Tutorial text — students read this in order. Use boxes for tips and practice notes, Steps for numbered instructions, and Shift+Enter for a line break within a paragraph.'
          : 'Shift+Enter = line break · Lead, Tip, Warning, and Practice boxes help students scan · Check student preview before assigning.'}
      </p>
    </div>
  )
}
