# UI Components

This directory contains reusable UI components for the Play It Pro platform. All components are built with TypeScript and Tailwind CSS for consistency and maintainability.

## Components

### Layout Components
- **Section** - Container component for organizing content sections with titles and descriptions

### Form Components
- **Button** - Interactive button with multiple variants (primary, secondary, ghost, danger) and sizes
- **Input** - Form input field with label, validation, and helper text support
- **Modal** - Overlay dialog for focused user interactions

### Display Components
- **Card** - Container for grouping related content with configurable padding
- **Badge** - Small status indicators and labels with semantic variants
- **Accordion** - Collapsible content sections for organizing information
- **Progress** - Visual indicators for task completion and loading states
- **Toast** - Temporary messages for user feedback and alerts

## Usage

```tsx
import { Button, Card, Input } from '@/components/ui'

function MyComponent() {
  return (
    <Card>
      <Input label="Email" placeholder="Enter your email" />
      <Button variant="primary">Submit</Button>
    </Card>
  )
}
```

## Design Principles

1. **Consistency** - All components follow the same design patterns and API conventions
2. **Accessibility** - Components include proper ARIA attributes and keyboard navigation
3. **Flexibility** - Components accept className props for custom styling
4. **TypeScript** - Full type safety with comprehensive prop interfaces
5. **Composability** - Components can be easily combined to create complex UIs

## Styling

Components use Tailwind CSS classes and can be customized through:
- Built-in variant props (e.g., `variant="primary"`)
- Size props (e.g., `size="lg"`)
- Custom className props for additional styling
- Design tokens defined in `~/src/lib/tokens.css`

## Development

When adding new components:
1. Create the component file in this directory
2. Export it from `index.ts`
3. Add it to the Design System showcase page
4. Include TypeScript interfaces for all props
5. Add proper accessibility attributes
6. Test with different variants and states
