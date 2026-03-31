import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

/**
 * Button - Reusable button component with variants
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * 
 * <Button variant="secondary" size="lg" loading>
 *   Processing...
 * </Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    disabled,
    className = '',
    children,
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'btn btn-primary',
      secondary: 'btn btn-secondary',
      tertiary: 'btn btn-tertiary'
    }
    
    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg'
    }
    
    const widthClasses = fullWidth ? 'w-full' : ''
    const loadingClasses = loading ? 'btn-loading' : ''
    const stateClasses = disabled ? 'disabled' : ''
    
    const combinedClasses = `${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${loadingClasses} ${stateClasses} ${className}`.trim()

    return (
      <button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="btn-spinner" aria-hidden="true"></span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

