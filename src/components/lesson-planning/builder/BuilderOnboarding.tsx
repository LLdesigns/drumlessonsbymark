import { BUILDER_ONBOARDING_KEY } from '../../../lib/lesson-builder-utils'

interface BuilderOnboardingProps {
  onDismiss: () => void
}

export default function BuilderOnboarding({ onDismiss }: BuilderOnboardingProps) {
  const handleDismiss = () => {
    localStorage.setItem(BUILDER_ONBOARDING_KEY, '1')
    onDismiss()
  }

  return (
    <div className="builder-onboarding" role="dialog" aria-modal="true">
      <div className="builder-onboarding__card">
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Welcome to the Lesson Builder</h2>
        <p style={{ color: 'var(--lb-muted)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
          Your digital drum teaching canvas — build lessons visually, not with paperwork.
        </p>
        <ol className="builder-onboarding__steps">
          <li>
            <span className="builder-onboarding__step-num">1</span>
            <span>Add lesson blocks in the center canvas — video, notation, BPM, practice tasks.</span>
          </li>
          <li>
            <span className="builder-onboarding__step-num">2</span>
            <span>Drag blocks in the left outline to reorder your teaching flow.</span>
          </li>
          <li>
            <span className="builder-onboarding__step-num">3</span>
            <span>Attach finished lessons to students from your Lesson Library.</span>
          </li>
          <li>
            <span className="builder-onboarding__step-num">4</span>
            <span>Use Teach Mode during real lessons for a calm, focused view.</span>
          </li>
        </ol>
        <button type="button" className="lesson-builder__btn lesson-builder__btn--primary" style={{ width: '100%' }} onClick={handleDismiss}>
          Start building
        </button>
      </div>
    </div>
  )
}
