import { LESSON_BLOCK_TYPES } from '../../../lib/lesson-planning-constants'
import type { LessonBlockType } from '../../../types/lesson-planning'

interface BlockPickerModalProps {
  onPick: (type: LessonBlockType) => void
  onClose: () => void
}

export default function BlockPickerModal({ onPick, onClose }: BlockPickerModalProps) {
  return (
    <div className="block-picker-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="block-picker" onClick={(e) => e.stopPropagation()}>
        <h3>Add a block</h3>
        <p>Choose what to add to your lesson flow</p>
        <div className="block-picker__grid">
          {LESSON_BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              className="block-picker__item"
              onClick={() => {
                onPick(bt.type)
                onClose()
              }}
            >
              <i className={`bi ${bt.icon}`} />
              <span>{bt.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="lesson-builder__btn" style={{ marginTop: '1rem', width: '100%' }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
