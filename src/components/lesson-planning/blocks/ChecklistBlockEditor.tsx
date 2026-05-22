import { newChecklistItem } from '../../../lib/lesson-planning-constants'
import {
  CHECKLIST_QUICK_ADD,
  CHECKLIST_TASK_TYPES,
  normalizeChecklistItem,
} from '../../../lib/block-content-utils'
import type { ChecklistItem, ChecklistTaskType } from '../../../types/lesson-planning'

interface ChecklistBlockEditorProps {
  instructions?: string
  items: ChecklistItem[]
  onChange: (patch: { instructions?: string; items?: ChecklistItem[] }) => void
}

export default function ChecklistBlockEditor({ instructions, items, onChange }: ChecklistBlockEditorProps) {
  const normalized = items.map(normalizeChecklistItem)

  const updateItems = (next: ChecklistItem[]) => onChange({ items: next })

  const updateItem = (index: number, patch: Partial<ChecklistItem>) => {
    const next = [...normalized]
    next[index] = { ...next[index], ...patch }
    updateItems(next)
  }

  const removeItem = (index: number) => updateItems(normalized.filter((_, i) => i !== index))

  const moveItem = (from: number, to: number) => {
    if (from === to) return
    const next = [...normalized]
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row)
    updateItems(next)
  }

  return (
    <div className="block-checklist">
      <div className="lesson-builder__field">
        <label>Instructions for student (optional)</label>
        <textarea
          rows={2}
          value={instructions ?? ''}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="Complete these before our next lesson…"
        />
      </div>

      <div className="block-checklist__quick">
        <span>Quick add:</span>
        {CHECKLIST_QUICK_ADD.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="block-checklist__quick-btn"
            onClick={() => updateItems([...normalized, newChecklistItem(preset.label, preset.task_type)])}
          >
            + {preset.label}
          </button>
        ))}
      </div>

      <ul className="block-checklist__list">
        {normalized.map((item, index) => {
          const typeMeta = CHECKLIST_TASK_TYPES.find((t) => t.value === (item.task_type ?? 'practice'))
          return (
            <li
              key={item.id}
              className="block-checklist__item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index))
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                moveItem(from, index)
              }}
            >
              <span className="block-checklist__drag" title="Drag to reorder">
                <i className="bi bi-grip-vertical" />
              </span>
              <span className="block-checklist__type-icon" title={typeMeta?.label}>
                <i className={`bi ${typeMeta?.icon ?? 'bi-check2-square'}`} />
              </span>
              <div className="block-checklist__item-body">
                <div className="block-checklist__item-row">
                  <div className="block-checklist__field block-checklist__field--type">
                    <span className="block-checklist__field-label">Type</span>
                    <select
                      value={item.task_type ?? 'practice'}
                      onChange={(e) => updateItem(index, { task_type: e.target.value as ChecklistTaskType })}
                      className="lesson-builder__control lesson-builder__control--select block-checklist__type-select"
                      aria-label="Task type"
                    >
                      {CHECKLIST_TASK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="block-checklist__field">
                    <span className="block-checklist__field-label">Task</span>
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                      placeholder="What should they do?"
                      className="lesson-builder__control block-checklist__label-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="block-checklist__remove"
                    onClick={() => removeItem(index)}
                    aria-label="Remove task"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
                <div className="block-checklist__field">
                  <span className="block-checklist__field-label">Hint (optional)</span>
                  <input
                    value={item.hint ?? ''}
                    onChange={(e) => updateItem(index, { hint: e.target.value })}
                    placeholder="Tempo, reps, link…"
                    className="lesson-builder__control block-checklist__hint-input"
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="lesson-builder__btn"
        style={{ width: '100%' }}
        onClick={() => updateItems([...normalized, newChecklistItem('', 'practice')])}
      >
        <i className="bi bi-plus-lg" /> Add task
      </button>
    </div>
  )
}
