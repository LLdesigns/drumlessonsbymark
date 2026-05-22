interface LessonBuilderDrawerBackdropProps {
  visible: boolean
  onClose: () => void
}

export default function LessonBuilderDrawerBackdrop({ visible, onClose }: LessonBuilderDrawerBackdropProps) {
  if (!visible) return null
  return (
    <button
      type="button"
      className="lesson-builder__drawer-backdrop"
      aria-label="Close panel"
      onClick={onClose}
    />
  )
}
