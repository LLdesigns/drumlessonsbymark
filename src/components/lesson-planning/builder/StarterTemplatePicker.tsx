import { LESSON_STARTER_TEMPLATES, type LessonStarterTemplate } from '../../../lib/lesson-starter-templates'

interface StarterTemplatePickerProps {
  onSelect: (template: LessonStarterTemplate) => void
  onClose: () => void
}

export default function StarterTemplatePicker({ onSelect, onClose }: StarterTemplatePickerProps) {
  return (
    <div className="starter-picker-overlay" role="dialog" aria-modal="true">
      <div className="starter-picker">
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Start your lesson</h2>
        <p style={{ color: 'var(--lb-muted)', margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
          Pick a template to pre-build your teaching flow, or start blank.
        </p>
        <div className="starter-picker__grid">
          {LESSON_STARTER_TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="starter-picker__card" onClick={() => onSelect(t)}>
              <i className={`bi ${t.icon}`} />
              <strong>{t.name}</strong>
              <span>{t.description}</span>
            </button>
          ))}
        </div>
        <button type="button" className="lesson-builder__btn" style={{ marginTop: '1rem' }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
