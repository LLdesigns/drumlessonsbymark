interface LessonBuilderPanelHeadProps {
  title: string
  onClose: () => void
}

export default function LessonBuilderPanelHead({ title, onClose }: LessonBuilderPanelHeadProps) {
  return (
    <div className="lesson-builder__panel-head">
      <h2 className="lesson-builder__panel-head-title">{title}</h2>
      <button type="button" className="lesson-builder__panel-close" onClick={onClose} aria-label={`Close ${title}`}>
        <i className="bi bi-x-lg" />
      </button>
    </div>
  )
}
