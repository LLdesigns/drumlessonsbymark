/**
 * Theme System - TypeScript Theme Utilities
 * 
 * Provides type-safe access to design tokens
 * Similar to Pando v1's theme system
 */

/**
 * Design Token Types
 */
export interface DesignTokens {
  colors: {
    brand: {
      primary: string
      primaryHover: string
      primaryActive: string
      secondary: string
      tertiary: string
    }
    background: {
      primary: string
      secondary: string
      tertiary: string
      overlay: string
      input: string
      inputError: string
    }
    text: {
      primary: string
      secondary: string
      tertiary: string
      onPrimary: string
      onDark: string
    }
    border: {
      default: string
      focus: string
      error: string
      primary: string
    }
    semantic: {
      success: string
      successLight: string
      warning: string
      warningLight: string
      error: string
      errorLight: string
      info: string
      infoLight: string
    }
  }
  typography: {
    fontFamily: {
      display: string
      body: string
      button: string
      accent: string
    }
    fontWeight: {
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
      black: number
    }
    fontSize: {
      xs: string
      sm: string
      base: string
      md: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
      '5xl': string
      '6xl': string
      '7xl': string
      '8xl': string
    }
    lineHeight: {
      tight: string
      normal: string
      relaxed: string
      loose: string
    }
  }
  spacing: {
    [key: string]: string
  }
  borderRadius: {
    [key: string]: string
  }
  shadows: {
    [key: string]: string
  }
  transitions: {
    [key: string]: string
  }
  zIndex: {
    [key: string]: number
  }
}

/**
 * Get a CSS custom property value
 */
export function getToken(tokenName: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim()
  }
  return ''
}

/**
 * Set a CSS custom property value
 */
export function setToken(tokenName: string, value: string): void {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(tokenName, value)
  }
}

/**
 * Theme utilities for programmatic access
 */
export const theme = {
  /**
   * Get color token
   */
  color: (path: string) => getToken(`--color-${path}`),
  
  /**
   * Get spacing token
   */
  space: (size: string) => getToken(`--space-${size}`),
  
  /**
   * Get font size token
   */
  fontSize: (size: string) => getToken(`--font-size-${size}`),
  
  /**
   * Get border radius token
   */
  radius: (size: string) => getToken(`--radius-${size}`),
  
  /**
   * Get shadow token
   */
  shadow: (size: string) => getToken(`--shadow-${size}`),
  
  /**
   * Set theme mode
   */
  setTheme: (themeName: 'dark' | 'light') => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeName)
    }
  },
  
  /**
   * Get current theme
   */
  getTheme: (): 'dark' | 'light' => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'dark') as 'dark' | 'light'
    }
    return 'dark'
  }
}

/**
 * Common token accessors for convenience
 */
export const tokens = {
  // Brand colors
  primary: () => theme.color('brand-primary'),
  secondary: () => theme.color('brand-secondary'),
  tertiary: () => theme.color('brand-tertiary'),
  
  // Backgrounds
  bgPrimary: () => theme.color('bg-primary'),
  bgSecondary: () => theme.color('bg-secondary'),
  
  // Text
  textPrimary: () => theme.color('text-primary'),
  textSecondary: () => theme.color('text-secondary'),
  
  // Borders
  borderDefault: () => theme.color('border-default'),
  borderFocus: () => theme.color('border-focus'),
  borderError: () => theme.color('border-error'),
  
  // Semantic
  success: () => theme.color('semantic-success'),
  warning: () => theme.color('semantic-warning'),
  error: () => theme.color('semantic-error'),
  info: () => theme.color('semantic-info'),
}

