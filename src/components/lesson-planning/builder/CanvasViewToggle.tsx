import type { CanvasViewMode } from '../../../lib/lesson-builder-canvas-layout'

interface CanvasViewToggleProps {
  mode: CanvasViewMode
  onChange: (mode: CanvasViewMode) => void
}

export default function CanvasViewToggle({ mode, onChange }: CanvasViewToggleProps) {
  return (
    <div className="lesson-builder__canvas-view-toggle" role="group" aria-label="Canvas layout">
      <button
        type="button"
        className={`lesson-builder__canvas-view-btn${mode === 'stack' ? ' is-active' : ''}`}
        aria-pressed={mode === 'stack'}
        onClick={() => onChange('stack')}
        title="Vertical scroll layout"
      >
        <i className="bi bi-layout-text-sidebar-reverse" />
        <span>Stack</span>
      </button>
      <button
        type="button"
        className={`lesson-builder__canvas-view-btn${mode === 'bento' ? ' is-active' : ''}`}
        aria-pressed={mode === 'bento'}
        onClick={() => onChange('bento')}
        title="Bento grid — drag blocks to arrange"
      >
        <i className="bi bi-grid-3x3-gap" />
        <span>Bento</span>
      </button>
    </div>
  )
}
