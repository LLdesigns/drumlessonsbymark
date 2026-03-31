import React from 'react'

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Textarea - Reusable textarea component
 * 
 * @example
 * <Textarea 
 *   name="message" 
 *   placeholder="Your message" 
 *   rows={4}
 *   required 
 * />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = false, size = 'md', className = '', ...props }, ref) => {
    const baseClasses = 'contact-input contact-message'
    const sizeClasses = `contact-input-${size}`
    const errorClasses = error ? 'contact-input-error' : ''
    const widthClasses = fullWidth ? 'w-full' : ''
    const combinedClasses = `${baseClasses} ${sizeClasses} ${errorClasses} ${widthClasses} ${className}`.trim()

    return (
      <div className={`field-wrapper ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={props.id || props.name} className="field-label">
            {label}
            {props.required && <span style={{ color: 'var(--color-brand-primary)', marginLeft: '0.25rem' }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={combinedClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        {error && (
          <div id={`${props.id || props.name}-error`} className="field-error" role="alert">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div className="field-helper">
            {helperText}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

