import { useCallback, useEffect, useRef } from 'react'
import { isHtmlBody, plainTextFromHtml } from '../../../lib/block-content-utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value)

  useEffect(() => {
    const el = editorRef.current
    if (!el || el === document.activeElement) return
    if (value !== lastValue.current) {
      el.innerHTML = isHtmlBody(value) ? value : value ? `<p>${escapeHtml(value).replace(/\n/g, '<br>')}</p>` : ''
      lastValue.current = value
    }
  }, [value])

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? ''
    lastValue.current = html
    onChange(html)
  }, [onChange])

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    emitChange()
  }

  const insertLink = () => {
    const url = window.prompt('Link URL')
    if (url) exec('createLink', url)
  }

  return (
    <div className="block-rich-text">
      <div className="block-rich-text__toolbar" role="toolbar" aria-label="Text formatting">
        <button type="button" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <i className="bi bi-type-bold" />
        </button>
        <button type="button" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
          <i className="bi bi-type-italic" />
        </button>
        <button type="button" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
          <i className="bi bi-type-underline" />
        </button>
        <span className="block-rich-text__sep" />
        <button type="button" title="Heading" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'h3')}>
          <i className="bi bi-type-h3" />
        </button>
        <button type="button" title="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <i className="bi bi-list-ul" />
        </button>
        <button type="button" title="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
          <i className="bi bi-list-ol" />
        </button>
        <span className="block-rich-text__sep" />
        <button type="button" title="Link" onMouseDown={(e) => e.preventDefault()} onClick={insertLink}>
          <i className="bi bi-link-45deg" />
        </button>
        <button type="button" title="Clear formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}>
          <i className="bi bi-eraser" />
        </button>
      </div>
      <div
        ref={editorRef}
        className="block-rich-text__editor"
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        suppressContentEditableWarning
      />
      {!value.trim() || plainTextFromHtml(value).trim() ? null : (
        <p className="block-rich-text__hint">Formatted text — students see headings, lists, and emphasis.</p>
      )}
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
