# Design System Component Library

## Overview

This project uses a comprehensive design system inspired by [Pando v1](https://pando-storybook.pluralsight.com/tutorials/add-pando-to-a-web-app/v1/pando-v1/) to ensure consistency across the application. The system includes:

- **Design Tokens** - Centralized design values (colors, typography, spacing, etc.)
- **UI Components** - Reusable React components
- **Theme System** - TypeScript utilities for accessing tokens
- **React Hooks** - `useTheme()` for component-level token access

**⚠️ IMPORTANT:** 
- Always use design system components instead of raw HTML elements
- Reference design tokens instead of hardcoded values
- Update tokens to change the entire design system globally

---

## Core Principles

### 1. **Modularity**
- Each component is a single file
- Components can be composed together
- No monolithic components - break down into smaller, reusable pieces

### 2. **Consistency**
- All form components share the same styling classes
- Consistent prop naming across components
- Standardized error handling and validation display

### 3. **Accessibility**
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader friendly

### 4. **TypeScript First**
- Full type safety for all props
- Exported interfaces for extending components
- IntelliSense support in IDEs

---

## Available Components

### TextField

**File:** `src/components/ui/TextField.tsx`

Reusable text input component for single-line text entry.

#### Props

```typescript
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string              // Optional label above input
  error?: string              // Error message to display
  helperText?: string         // Helper text below input (when no error)
  fullWidth?: boolean          // Makes input take full width of container
}
```

#### Usage

```tsx
import { TextField } from '@/components/ui'

// Basic usage
<TextField 
  name="email" 
  type="email"
  placeholder="Enter your email" 
  required 
/>

// With label and error handling
<TextField
  name="firstName"
  label="First Name"
  placeholder="John"
  required
  error={errors.firstName}
  helperText="Enter your legal first name"
/>

// Full width for forms
<TextField
  name="email"
  type="email"
  placeholder="Email"
  fullWidth
  required
/>
```

#### Features
- ✅ Automatic error state styling
- ✅ Accessibility attributes (aria-invalid, aria-describedby)
- ✅ Required field indicator (*)
- ✅ Consistent styling with `.contact-input` class
- ✅ Supports all standard HTML input attributes

---

### Textarea

**File:** `src/components/ui/Textarea.tsx`

Reusable textarea component for multi-line text entry.

#### Props

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string              // Optional label above textarea
  error?: string              // Error message to display
  helperText?: string         // Helper text below textarea (when no error)
  fullWidth?: boolean          // Makes textarea take full width of container
}
```

#### Usage

```tsx
import { Textarea } from '@/components/ui'

// Basic usage
<Textarea 
  name="message" 
  placeholder="Your message" 
  rows={4}
  required 
/>

// With label and validation
<Textarea
  name="description"
  label="Description"
  placeholder="Tell us about yourself"
  rows={5}
  error={errors.description}
  helperText="Minimum 10 characters"
  fullWidth
/>
```

#### Features
- ✅ Same API as TextField for consistency
- ✅ Automatic error state styling
- ✅ Accessibility attributes
- ✅ Uses `.contact-input` and `.contact-message` classes

---

### Button

**File:** `src/components/ui/Button.tsx`

Reusable button component with multiple variants and sizes.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}
```

#### Usage

```tsx
import { Button } from '@/components/ui'

// Primary button (default)
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Tertiary button
<Button variant="tertiary">
  Learn More
</Button>

// With loading state
<Button 
  variant="primary" 
  loading={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>

// Full width button
<Button variant="primary" fullWidth>
  Submit Form
</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

#### Variants

- **primary**: Yellow/gold button (`btn-primary`) - Primary actions
- **secondary**: Dark button (`btn-secondary`) - Secondary actions
- **tertiary**: Tertiary styled button (`btn-tertiary`) - Less prominent actions

#### Features
- ✅ Loading state with spinner
- ✅ Disabled state handling
- ✅ Full width option
- ✅ Size variants (sm, md, lg)
- ✅ Consistent styling with existing button classes

---

## Component Composition

Components are designed to work together:

```tsx
import { TextField, Textarea, Button } from '@/components/ui'

function ContactForm() {
  return (
    <form>
      <div className="contact-row">
        <TextField 
          name="firstName" 
          placeholder="First name" 
          required 
        />
        <TextField 
          name="lastName" 
          placeholder="Last name" 
          required 
        />
      </div>
      
      <div className="contact-row">
        <TextField 
          name="email" 
          type="email"
          placeholder="Email" 
          fullWidth
          required 
        />
      </div>
      
      <div className="contact-row">
        <Textarea 
          name="message" 
          placeholder="Your message" 
          rows={4}
          fullWidth
          required 
        />
      </div>
      
      <Button 
        type="submit" 
        variant="primary"
        fullWidth
      >
        Submit
      </Button>
    </form>
  )
}
```

---

## Styling System

### CSS Classes Used

All components use existing CSS classes from `src/index.css`:

- **Text Fields:**
  - `.contact-input` - Base input styling
  - `.contact-message` - Textarea specific styling
  - `.contact-input-error` - Error state styling (to be added)

- **Buttons:**
  - `.btn` - Base button styling
  - `.btn-primary` - Primary variant
  - `.btn-secondary` - Secondary variant
  - `.btn-tertiary` - Tertiary variant
  - `.btn-sm`, `.btn-lg` - Size variants (to be added)
  - `.btn-loading` - Loading state (to be added)

- **Field Wrappers:**
  - `.field-wrapper` - Container for label + input + messages
  - `.field-label` - Label styling
  - `.field-error` - Error message styling
  - `.field-helper` - Helper text styling

### Design Tokens

Components respect existing design tokens:

```css
:root {
  --primary: #ffb800;          /* Yellow/gold primary color */
  --secondary: #1a0a3c;        /* Dark purple secondary */
  --tertiary: #2a174d;         /* Lighter purple tertiary */
  --primary-bg: #0a071a;       /* Very dark background */
  --secondary-bg: #1a0a3c;     /* Secondary background */
  --primary-text: #f7f7fa;     /* Light text color */
  --button-radius: 8px;         /* Button border radius */
  --button-font: 'Montserrat', Arial, sans-serif;
}
```

---

## Migration Guide

### From Raw HTML to Components

**Before (Raw HTML):**
```tsx
<input 
  type="text" 
  className="contact-input" 
  name="firstName" 
  placeholder="First name" 
  required 
/>
```

**After (Component):**
```tsx
import { TextField } from '@/components/ui'

<TextField
  name="firstName"
  placeholder="First name"
  required
/>
```

### Refactoring Existing Components

**Example: ContactSection.tsx**

Replace raw inputs with components:

```tsx
// OLD
<div className="contact-row">
  <input type="text" className="contact-input" name="firstName" placeholder="First name" required />
  <input type="text" className="contact-input" name="lastName" placeholder="Last name" required />
</div>

// NEW
<div className="contact-row">
  <TextField name="firstName" placeholder="First name" required />
  <TextField name="lastName" placeholder="Last name" required />
</div>
```

---

## Adding New Components

When creating new reusable components:

1. **Create the component file** in `src/components/ui/`
2. **Export from `index.ts`**
3. **Follow existing patterns:**
   - Use `forwardRef` for DOM access
   - Extend native HTML element props
   - Include TypeScript interfaces
   - Add JSDoc comments with examples
   - Include accessibility attributes
4. **Document in this file** (designmcp.md)
5. **Update README.md** in ui folder if needed

### Template

```tsx
import React from 'react'

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props here
  variant?: 'default' | 'alternative'
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    // Component implementation
    return (
      <div ref={ref} className={`base-class ${className}`} {...props}>
        {/* Content */}
      </div>
    )
  }
)

MyComponent.displayName = 'MyComponent'
```

---

## Best Practices

### ✅ DO

- Always use design system components for forms
- Import from `@/components/ui` or relative path
- Use TypeScript interfaces for type safety
- Compose components instead of creating monoliths
- Keep components focused on single responsibility
- Add proper error handling and validation
- Include accessibility attributes

### ❌ DON'T

- Don't use raw HTML inputs in forms (use TextField/Textarea)
- Don't create one-off components that duplicate functionality
- Don't bypass the design system for "quick fixes"
- Don't add inline styles (use className and existing CSS classes)
- Don't create components that mix multiple concerns

---

## Component Hierarchy

```
src/components/ui/
├── TextField.tsx      # Text input component
├── Textarea.tsx       # Textarea component
├── Button.tsx         # Button component
├── index.ts           # Centralized exports
└── README.md          # Additional documentation
```

---

## Future Components

Planned additions to the design system:

- [ ] Select/Dropdown component
- [ ] Checkbox component
- [ ] Radio component
- [ ] Modal/Dialog component
- [ ] Toast/Notification component
- [ ] Card component
- [ ] Badge component
- [ ] Loading spinner component

---

## Design Tokens System

This project uses a comprehensive design tokens system similar to [Pando v1](https://pando-storybook.pluralsight.com/tutorials/add-pando-to-a-web-app/v1/pando-v1/).

### Key Features

- **Single Source of Truth** - All design values in one place
- **Global Updates** - Change one token, update entire app
- **Type-Safe Access** - TypeScript utilities for token access
- **Theme Support** - Ready for light/dark mode variations

### Token Categories

1. **Colors** - Brand, background, text, semantic colors
2. **Typography** - Font families, sizes, weights, line heights
3. **Spacing** - Consistent spacing scale
4. **Border Radius** - Standardized border radii
5. **Shadows** - Elevation system
6. **Transitions** - Animation timing
7. **Z-Index** - Layering system

### Usage

**In CSS:**
```css
.my-component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
}
```

**In TypeScript:**
```tsx
import { theme, tokens } from '@/lib/theme'

const primaryColor = tokens.primary()
```

**In React Components:**
```tsx
import { useTheme } from '@/hooks/useTheme'

const { tokens } = useTheme()
const primaryColor = tokens.colors.brand.primary()
```

### Documentation

For complete design tokens documentation, see:
- **Design Tokens Guide:** `DESIGN-TOKENS.md`
- **Token File:** `src/lib/design-tokens.css`
- **Theme Utilities:** `src/lib/theme.ts`
- **React Hook:** `src/hooks/useTheme.ts`

---

## References

- **Component Location:** `src/components/ui/`
- **Styles:** `src/index.css`
- **Design Tokens:** `src/lib/design-tokens.css`
- **Theme System:** `src/lib/theme.ts`
- **React Hook:** `src/hooks/useTheme.ts`
- **Design Tokens Docs:** `docs/DESIGN-TOKENS.md`
- **Main Documentation:** `docs/mcp.md` (project structure)
- **Design System Showcase:** `/admin/design-system` (admin only - visual component library)
- **Inspiration:** [Pando v1 Design System](https://pando-storybook.pluralsight.com/tutorials/add-pando-to-a-web-app/v1/pando-v1/)

---

**Last Updated:** After implementing comprehensive design tokens system  
**Status:** ✅ Active - Components and tokens ready for use

