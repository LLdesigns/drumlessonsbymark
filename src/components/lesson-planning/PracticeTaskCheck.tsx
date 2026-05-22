interface PracticeTaskCheckProps {
  checked: boolean
  label: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/** Accessible custom checkbox with a visible check mark for student practice tasks. */
export default function PracticeTaskCheck({
  checked,
  label,
  disabled = false,
  onChange,
}: PracticeTaskCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Mark "${label}" incomplete` : `Mark "${label}" complete`}
      disabled={disabled}
      className={`lesson-task-check${checked ? ' lesson-task-check--checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="lesson-task-check__box" aria-hidden="true">
        {checked ? <i className="bi bi-check-lg" /> : null}
      </span>
    </button>
  )
}
