import { useModalBodyLock } from '../../hooks/useModalBodyLock'

interface PwaInstallHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PwaInstallHelpModal({ isOpen, onClose }: PwaInstallHelpModalProps) {
  useModalBodyLock(isOpen)
  if (!isOpen) return null

  return (
    <div
      className="studio-app studio-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      onClick={onClose}
    >
      <div className="studio-modal studio-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="studio-modal__header">
          <h2 id="pwa-install-title" className="studio-modal__title">
            Add to home screen
          </h2>
          <button type="button" className="studio-modal__close" aria-label="Close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="studio-modal__body">
        <p className="studio-subtext" style={{ marginTop: 0 }}>
          Install Mark&apos;s Drum Studio like an app for quick access and notifications.
        </p>
        <ol className="studio-pwa-banner__steps" style={{ margin: '1rem 0 0', paddingLeft: '1.25rem' }}>
          <li>
            Tap the <strong>Share</strong> button in Safari (square with arrow)
          </li>
          <li>
            Choose <strong>Add to Home Screen</strong>
          </li>
          <li>Open the studio from your home screen anytime</li>
        </ol>
        <div className="studio-modal__actions">
          <button type="button" className="studio-btn studio-btn--primary" onClick={onClose}>
            Got it
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
