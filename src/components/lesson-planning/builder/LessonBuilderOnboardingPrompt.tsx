interface LessonBuilderOnboardingPromptProps {
  hasBlocks: boolean
  onDismiss: () => void
  onOpenGuide: () => void
}

export default function LessonBuilderOnboardingPrompt({
  hasBlocks,
  onDismiss,
  onOpenGuide,
}: LessonBuilderOnboardingPromptProps) {
  return (
    <div
      className={`lesson-builder-onboarding${hasBlocks ? ' lesson-builder-onboarding--above-dock' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="lesson-builder-onboarding__inner">
        <p className="lesson-builder-onboarding__text">
          <strong>Welcome to the Lesson Builder.</strong>
          {hasBlocks
            ? ' Keep adding blocks from the toolbar below, then save when you are ready.'
            : ' Pick a block type below to add your first step, then save to your library.'}
        </p>
        <div className="lesson-builder-onboarding__actions">
          <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" onClick={onDismiss}>
            Get started
          </button>
          <button type="button" className="lesson-builder__btn lesson-builder-onboarding__guide" onClick={onOpenGuide}>
            Open guide
          </button>
        </div>
      </div>
    </div>
  )
}
