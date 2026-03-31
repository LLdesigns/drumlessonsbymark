import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * TextField - Reusable text input component
 * 
 * @example
 * <TextField 
 *   name="email" 
 *   placeholder="Enter your email" 
 *   type="email"
 *   required 
 * />
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, fullWidth = false, size = 'md', className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const baseClasses = 'contact-input'
    const sizeClasses = `contact-input-${size}`
    const errorClasses = error ? 'contact-input-error' : ''
    const widthClasses = fullWidth ? 'w-full' : ''
    const combinedClasses = `${baseClasses} ${sizeClasses} ${errorClasses} ${widthClasses} ${className}`.trim()

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className={`field-wrapper ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={props.id || props.name} className="field-label">
            {label}
            {props.required && <span style={{ color: 'var(--color-brand-primary)', marginLeft: '0.25rem' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            type={inputType}
            className={combinedClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id || props.name}-error` : undefined}
            style={isPassword ? { paddingRight: '3rem' } : {}}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                transition: 'var(--transition-base)'
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          )}
        </div>
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

TextField.displayName = 'TextField'

