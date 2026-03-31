import { useEffect, useState } from 'react'
import { theme, getToken } from '../lib/theme'

/**
 * React hook for accessing design tokens
 * Similar to Pando v1's useTheme hook
 * 
 * @example
 * const { colors, spacing, typography } = useTheme()
 * const primaryColor = colors.brand.primary
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    // Initialize from localStorage or default to dark
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
      if (savedTheme) {
        theme.setTheme(savedTheme)
        return savedTheme
      }
    }
    return 'dark'
  })

  useEffect(() => {
    // Set initial theme on mount
    theme.setTheme(currentTheme)
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const newTheme = theme.getTheme()
      setCurrentTheme(newTheme)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    
    return () => observer.disconnect()
  }, [])
  
  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    theme.setTheme(newTheme)
    setCurrentTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  return {
    theme: currentTheme,
    setTheme: (newTheme: 'dark' | 'light') => {
      theme.setTheme(newTheme)
      setCurrentTheme(newTheme)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
      }
    },
    toggleTheme,
    tokens: {
      // Brand colors
      colors: {
        brand: {
          primary: () => getToken('--color-brand-primary'),
          primaryHover: () => getToken('--color-brand-primary-hover'),
          primaryActive: () => getToken('--color-brand-primary-active'),
          secondary: () => getToken('--color-brand-secondary'),
          tertiary: () => getToken('--color-brand-tertiary'),
        },
        background: {
          primary: () => getToken('--color-bg-primary'),
          secondary: () => getToken('--color-bg-secondary'),
          tertiary: () => getToken('--color-bg-tertiary'),
          overlay: () => getToken('--color-bg-overlay'),
          input: () => getToken('--color-bg-input'),
          inputError: () => getToken('--color-bg-input-error'),
        },
        text: {
          primary: () => getToken('--color-text-primary'),
          secondary: () => getToken('--color-text-secondary'),
          tertiary: () => getToken('--color-text-tertiary'),
          onPrimary: () => getToken('--color-text-on-primary'),
          onDark: () => getToken('--color-text-on-dark'),
        },
        border: {
          default: () => getToken('--color-border-default'),
          focus: () => getToken('--color-border-focus'),
          error: () => getToken('--color-border-error'),
          primary: () => getToken('--color-border-primary'),
        },
        semantic: {
          success: () => getToken('--color-success'),
          successLight: () => getToken('--color-success-light'),
          warning: () => getToken('--color-warning'),
          warningLight: () => getToken('--color-warning-light'),
          error: () => getToken('--color-error'),
          errorLight: () => getToken('--color-error-light'),
          info: () => getToken('--color-info'),
          infoLight: () => getToken('--color-info-light'),
        },
      },
      // Typography
      typography: {
        fontFamily: {
          display: () => getToken('--font-family-display'),
          body: () => getToken('--font-family-body'),
          button: () => getToken('--font-family-button'),
          accent: () => getToken('--font-family-accent'),
        },
        fontSize: {
          xs: () => getToken('--font-size-xs'),
          sm: () => getToken('--font-size-sm'),
          base: () => getToken('--font-size-base'),
          md: () => getToken('--font-size-md'),
          lg: () => getToken('--font-size-lg'),
          xl: () => getToken('--font-size-xl'),
          '2xl': () => getToken('--font-size-2xl'),
          '3xl': () => getToken('--font-size-3xl'),
          '4xl': () => getToken('--font-size-4xl'),
          '5xl': () => getToken('--font-size-5xl'),
          '6xl': () => getToken('--font-size-6xl'),
          '7xl': () => getToken('--font-size-7xl'),
          '8xl': () => getToken('--font-size-8xl'),
        },
        fontWeight: {
          light: () => getToken('--font-weight-light'),
          normal: () => getToken('--font-weight-normal'),
          medium: () => getToken('--font-weight-medium'),
          semibold: () => getToken('--font-weight-semibold'),
          bold: () => getToken('--font-weight-bold'),
          black: () => getToken('--font-weight-black'),
        },
      },
      // Spacing
      spacing: {
        _0: () => getToken('--space-0'),
        _1: () => getToken('--space-1'),
        _2: () => getToken('--space-2'),
        _3: () => getToken('--space-3'),
        _4: () => getToken('--space-4'),
        _5: () => getToken('--space-5'),
        _6: () => getToken('--space-6'),
        _8: () => getToken('--space-8'),
        _10: () => getToken('--space-10'),
        _12: () => getToken('--space-12'),
        _16: () => getToken('--space-16'),
        _20: () => getToken('--space-20'),
        _24: () => getToken('--space-24'),
      },
      // Border radius
      radius: {
        none: () => getToken('--radius-none'),
        sm: () => getToken('--radius-sm'),
        md: () => getToken('--radius-md'),
        base: () => getToken('--radius-base'),
        lg: () => getToken('--radius-lg'),
        xl: () => getToken('--radius-xl'),
        '2xl': () => getToken('--radius-2xl'),
        full: () => getToken('--radius-full'),
      },
      // Shadows
      shadow: {
        none: () => getToken('--shadow-none'),
        sm: () => getToken('--shadow-sm'),
        md: () => getToken('--shadow-md'),
        lg: () => getToken('--shadow-lg'),
        xl: () => getToken('--shadow-xl'),
        primary: () => getToken('--shadow-primary'),
      },
      // Transitions
      transition: {
        fast: () => getToken('--transition-fast'),
        base: () => getToken('--transition-base'),
        slow: () => getToken('--transition-slow'),
        slower: () => getToken('--transition-slower'),
      },
    },
  }
}

