import React from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  options: SelectOption[]
}

/**
 * Select - Dropdown select component
 * 
 * @example
 * <Select
 *   name="status"
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 * />
 * 
 * @example
 * <Select
 *   name="status"
 *   label="Status"
 *   variant="secondary"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 * />
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, fullWidth = false, size = 'md', variant = 'primary', options, className = '', ...props }, ref) => {
    const baseClasses = 'contact-input'
    const sizeClasses = `contact-input-${size}`
    const variantClasses = variant === 'secondary' ? 'contact-input-secondary' : ''
    const errorClasses = error ? 'contact-input-error' : ''
    const widthClasses = fullWidth ? 'w-full' : ''
    const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${errorClasses} ${widthClasses} ${className}`.trim()

    return (
      <div className={`field-wrapper ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={props.id || props.name} className="field-label">
            {label}
            {props.required && (
              <span style={{ 
                color: 'var(--color-brand-primary)', 
                marginLeft: 'var(--space-1)',
                fontSize: 'var(--font-size-sm)'
              }}>*</span>
            )}
          </label>
        )}
        <select
          ref={ref}
          className={combinedClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        >
          {!props.value && <option value="">Select an option...</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'

