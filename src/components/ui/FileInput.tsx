import React from 'react'
import { Button } from './Button'

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  buttonText?: string
  buttonVariant?: 'primary' | 'secondary' | 'tertiary'
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * FileInput - File upload input component
 * 
 * @example
 * <FileInput 
 *   name="file"
 *   accept="image/*"
 *   label="Upload Image"
 *   onChange={handleFileChange}
 * />
 */
export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    fullWidth = false, 
    size = 'md',
    buttonText,
    buttonVariant = 'primary',
    className = '',
    onChange,
    disabled,
    ...props 
  }, ref) => {
    const inputId = props.id || props.name || `file-input-${Math.random().toString(36).substr(2, 9)}`
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
      }
    }

    const defaultButtonText = buttonText || (props.multiple ? 'Choose Files' : 'Choose File')

    return (
      <div className={`field-wrapper ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {props.required && (
              <span style={{ color: 'var(--color-brand-primary)', marginLeft: '0.25rem' }}>*</span>
            )}
          </label>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant={buttonVariant}
            size={size}
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById(inputId) as HTMLInputElement
              input?.click()
            }}
            style={{
              pointerEvents: disabled ? 'none' : 'auto',
              opacity: disabled ? 0.6 : 1
            }}
          >
            {defaultButtonText}
          </Button>
          <input
            ref={ref}
            type="file"
            id={inputId}
            className={className}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <div id={`${inputId}-error`} className="field-error" role="alert">
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

FileInput.displayName = 'FileInput'

