import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { Card } from './Card'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Studio portal theme (gold/purple tokens). Use for modals opened from Mark's Studio. */
  variant?: 'default' | 'studio'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

/**
 * Modal - Overlay dialog component for focused user interactions
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="My Modal">
 *   <p>Modal content goes here</p>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '500px' },
    lg: { maxWidth: '700px' },
    xl: { maxWidth: '900px' }
  }

  const isStudio = variant === 'studio'

  const modalContent = (
    <div
      className={isStudio ? 'studio-app studio-modal-backdrop' : undefined}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={
        isStudio
          ? undefined
          : {
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: 'var(--space-4)'
            }
      }
    >
      {isStudio ? (
        <div
          className="studio-modal"
          style={{ maxWidth: sizeClasses[size].maxWidth }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'studio-modal-title' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="studio-modal__header">
              {title && (
                <h2 id="studio-modal-title" className="studio-modal__title">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="studio-modal__close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
          )}
          <div className="studio-modal__body">{children}</div>
        </div>
      ) : (
        <Card
          variant="elevated"
          style={{
            width: '100%',
            ...sizeClasses[size],
            maxHeight: '90vh',
            overflow: 'auto',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-5)',
                borderBottom: '1px solid var(--color-border-default)'
              }}
            >
              {title && (
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  onClick={onClose}
                  variant="tertiary"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xl)',
                    color: 'var(--color-text-secondary)',
                    padding: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'auto'
                  }}
                  aria-label="Close modal"
                >
                  <i className="bi bi-x" />
                </Button>
              )}
            </div>
          )}
          <div style={{ padding: 'var(--space-5)' }}>{children}</div>
        </Card>
      )}
    </div>
  )

  return createPortal(modalContent, document.body)
}

Modal.displayName = 'Modal'

