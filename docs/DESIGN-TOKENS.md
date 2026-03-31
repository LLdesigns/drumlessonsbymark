# Design Tokens System

## Overview

The design tokens system provides a single source of truth for all design values. Inspired by [Pando v1's approach](https://pando-storybook.pluralsight.com/tutorials/add-pando-to-a-web-app/v1/pando-v1/), this system allows you to change the entire design by updating tokens in one place.

**File:** `src/lib/design-tokens.css`

---

## Philosophy

> "Change one token, update the entire application"

All colors, typography, spacing, shadows, and other design values are defined as CSS custom properties (CSS variables). Components reference these tokens, ensuring consistency and making global changes easy.

---

## Token Categories

### 1. Color Tokens

Colors are organized by semantic meaning:

#### Brand Colors
```css
--color-brand-primary: #ffb800;        /* Yellow/gold - primary brand */
--color-brand-primary-hover: #e6a700; /* Hover state */
--color-brand-primary-active: #cc9600;/* Active state */
--color-brand-secondary: #1a0a3c;     /* Dark purple */
--color-brand-tertiary: #2a174d;      /* Lighter purple */
```

#### Background Colors
```css
--color-bg-primary: #0a071a;          /* Main background */
--color-bg-secondary: #1a0a3c;        /* Secondary background */
--color-bg-tertiary: #2a174d;         /* Tertiary background */
--color-bg-overlay: rgba(255, 255, 255, 0.01);
--color-bg-input: #060111;
```

#### Text Colors
```css
--color-text-primary: #f7f7fa;        /* Primary text */
--color-text-secondary: rgba(247, 247, 250, 0.7); /* Muted text */
--color-text-tertiary: rgba(247, 247, 250, 0.5);   /* Very muted */
--color-text-on-primary: #181818;     /* Text on primary bg */
--color-text-on-dark: #fff;
```

#### Semantic Colors
```css
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ff6b6b;
--color-info: #3b82f6;
```

### 2. Typography Tokens

#### Font Families
```css
--font-family-display: 'Jost', Arial, sans-serif;   /* Headings */
--font-family-body: 'Jost', Arial, sans-serif;      /* Body text */
--font-family-button: 'Montserrat', Arial, sans-serif; /* Buttons */
--font-family-accent: 'Unbounded', Arial, sans-serif;  /* Accent text */
```

#### Font Sizes
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.1rem;      /* 17.6px */
--font-size-xl: 1.15rem;     /* 18.4px */
--font-size-2xl: 1.2rem;     /* 19.2px */
--font-size-3xl: 1.5rem;     /* 24px */
--font-size-4xl: 1.6rem;     /* 25.6px */
--font-size-5xl: 2rem;       /* 32px */
--font-size-6xl: 2.2rem;     /* 35.2px */
--font-size-7xl: 2.4rem;     /* 38.4px */
--font-size-8xl: 4rem;       /* 64px - Hero titles */
```

#### Font Weights
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-black: 900;
```

### 3. Spacing Tokens

Consistent spacing scale:
```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### 4. Border Radius Tokens

```css
--radius-sm: 0.125rem;   /* 2px */
--radius-md: 0.375rem;   /* 6px */
--radius-base: 0.5rem;   /* 8px - buttons, inputs */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Fully rounded */
```

### 5. Shadow Tokens

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-primary: 0 2px 8px rgba(255, 184, 0, 0.08);
```

### 6. Transition Tokens

```css
--transition-fast: 0.15s ease-in-out;
--transition-base: 0.2s ease-in-out;
--transition-slow: 0.3s ease-in-out;
--transition-slower: 0.5s ease-in-out;
```

---

## Usage

### In CSS

```css
.my-component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.my-button {
  background: var(--color-brand-primary);
  color: var(--color-text-on-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-base);
}

.my-button:hover {
  background: var(--color-brand-primary-hover);
}
```

### In React Components (Inline Styles)

```tsx
const MyComponent = () => {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-base)',
    }}>
      Content
    </div>
  )
}
```

### Using TypeScript Theme Utilities

```tsx
import { theme, tokens } from '@/lib/theme'

// Get token value programmatically
const primaryColor = theme.color('brand-primary')
const spacing = theme.space('4')

// Or use convenience functions
const primary = tokens.primary()
const bgPrimary = tokens.bgPrimary()
```

### Using React Hook

```tsx
import { useTheme } from '@/hooks/useTheme'

const MyComponent = () => {
  const { tokens } = useTheme()
  
  const primaryColor = tokens.colors.brand.primary()
  const fontSize = tokens.typography.fontSize.base()
  
  return (
    <div style={{
      color: primaryColor,
      fontSize: fontSize,
    }}>
      Content
    </div>
  )
}
```

---

## Making Global Changes

### Change Primary Brand Color

**Before:**
```css
--color-brand-primary: #ffb800;
```

**After:**
```css
--color-brand-primary: #00ff00; /* New green */
```

This automatically updates:
- All buttons with primary variant
- All links and interactive elements
- All accents and highlights
- All components using `var(--color-brand-primary)`

### Change Typography Scale

Update font sizes in `design-tokens.css`:
```css
--font-size-base: 1.125rem; /* Changed from 1rem */
```

All components using `var(--font-size-base)` will update automatically.

### Change Spacing System

Update spacing scale:
```css
--space-4: 1.5rem; /* Changed from 1rem */
```

All padding/margins using `var(--space-4)` update globally.

---

## Legacy Token Support

For backward compatibility, legacy tokens are mapped to new tokens:

```css
:root {
  --primary: var(--color-brand-primary);
  --secondary: var(--color-brand-secondary);
  --primary-bg: var(--color-bg-primary);
  --primary-text: var(--color-text-primary);
  --button-radius: var(--radius-base);
  --button-font: var(--font-family-button);
}
```

**Migration:** Gradually replace legacy tokens with new semantic tokens.

---

## Theme Variations

### Dark Theme (Default)

Dark theme is the default and all tokens are optimized for dark backgrounds.

### Light Theme (Future)

To add light theme support:

```css
[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-bg-secondary: #f3f4f6;
  /* ... other light theme tokens */
}
```

Switch themes:
```tsx
import { theme } from '@/lib/theme'

theme.setTheme('light') // or 'dark'
```

---

## Responsive Tokens

Some tokens adjust based on screen size:

```css
@media (max-width: 768px) {
  :root {
    --font-size-8xl: 2.4rem;     /* Smaller on mobile */
    --font-size-6xl: 1.5rem;
    --space-section: var(--space-8); /* Reduced spacing */
  }
}
```

---

## Best Practices

### ✅ DO

- Use design tokens for all values
- Reference tokens semantically (e.g., `--color-brand-primary` not `--primary`)
- Use the spacing scale consistently
- Update tokens for global changes
- Use theme utilities for programmatic access

### ❌ DON'T

- Don't hardcode colors, sizes, or spacing
- Don't create new tokens without checking if one exists
- Don't use magic numbers (e.g., `padding: 17px`)
- Don't bypass the token system for "quick fixes"

---

## Token Naming Convention

Tokens follow this pattern:
- Category: `--color-`, `--font-`, `--space-`, etc.
- Subcategory: `--color-brand-`, `--color-bg-`, etc.
- Specific: `--color-brand-primary`, `--space-4`, etc.

**Examples:**
- ✅ `--color-brand-primary`
- ✅ `--font-size-base`
- ✅ `--space-4`
- ✅ `--radius-base`
- ❌ `--primary-color` (wrong order)
- ❌ `--size4` (missing category)

---

## Adding New Tokens

When adding new tokens:

1. **Place in correct category** - Colors go in color section, etc.
2. **Follow naming convention** - Use semantic names
3. **Document in this file** - Update this documentation
4. **Consider backwards compatibility** - Map to legacy tokens if needed
5. **Test across components** - Ensure token works everywhere

**Example:**
```css
/* In design-tokens.css */

/* New token */
--color-accent-purple: #8b5cf6;

/* Update documentation */
```

---

## References

- **Token File:** `src/lib/design-tokens.css`
- **Theme Utilities:** `src/lib/theme.ts`
- **React Hook:** `src/hooks/useTheme.ts`
- **Inspiration:** [Pando v1 Design System](https://pando-storybook.pluralsight.com/tutorials/add-pando-to-a-web-app/v1/pando-v1/)
- **Component Docs:** `designmcp.md`

---

**Last Updated:** After implementing comprehensive design tokens system  
**Status:** ✅ Active - All tokens defined and ready for use

