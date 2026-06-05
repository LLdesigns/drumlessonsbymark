import { useRef, useState } from 'react'
import {
  downloadLessonJson,
  exportLessonDocument,
  readLessonImportFile,
  type LessonExportInput,
  type LessonImportResult,
} from '../../../lib/lesson-import-export'

interface LessonJsonImportExportProps {
  exportInput: LessonExportInput
  hasExistingContent: boolean
  onImport: (result: LessonImportResult) => void
}

export default function LessonJsonImportExport({
  exportInput,
  hasExistingContent,
  onImport,
}: LessonJsonImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const handleExport = () => {
    const doc = exportLessonDocument(exportInput)
    downloadLessonJson(doc)
    setImportNotice('Lesson exported as JSON')
    setImportError(null)
    window.setTimeout(() => setImportNotice(null), 2500)
  }

  const handleImportClick = () => {
    setImportError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (hasExistingContent) {
      const ok = window.confirm(
        'Importing JSON will replace the current lesson title, details, and all blocks. Continue?'
      )
      if (!ok) return
    }

    const outcome = await readLessonImportFile(file)
    if (!outcome.ok) {
      setImportError(outcome.errors.join(' '))
      setImportNotice(null)
      return
    }

    onImport(outcome.result)
    setImportError(null)
    setImportNotice(`Imported "${outcome.result.lesson.title}" (${outcome.result.blocks.length} blocks)`)
    window.setTimeout(() => setImportNotice(null), 3500)
  }

  return (
    <div className="lesson-builder__json-io">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="lesson-builder__json-io-input"
        aria-hidden
        tabIndex={-1}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="lesson-builder__btn"
        title="Import lesson from JSON file (AI-generated or exported)"
        onClick={handleImportClick}
      >
        <i className="bi bi-file-earmark-arrow-up" /> Import JSON
      </button>
      <button
        type="button"
        className="lesson-builder__btn"
        title="Export lesson as JSON for AI or backup"
        onClick={handleExport}
      >
        <i className="bi bi-file-earmark-arrow-down" /> Export JSON
      </button>
      {importNotice ? <span className="lesson-builder__json-io-notice">{importNotice}</span> : null}
      {importError ? (
        <span className="lesson-builder__json-io-error" role="alert">
          {importError}
        </span>
      ) : null}
    </div>
  )
}
