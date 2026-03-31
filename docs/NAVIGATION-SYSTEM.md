# Navigation & Section System Documentation

## Overview

The application uses a multi-section navigation system that allows users to switch between different "sections" of the platform: **Console**, **Learn**, and **Play**. This system is built with smooth page transitions to prevent UI flashing and provide a polished user experience.

## Architecture

### Section Structure

The platform is organized into three main sections:

1. **Console** (Home)
   - Uses: `ConsoleLogo.png`
   - Text: "Console"
   - Path: Role-based dashboard
     - Admin/Author: `/admin/dashboard`
     - Teacher: `/teacher/library`
     - Student: `/student/library`

2. **Learn**
   - Uses: `LearnLogo.png`
   - Text: "Learn"
   - Path: `/learn`
   - Access: Admin and Author roles only

3. **Play**
   - Uses: `PlayLogo.png`
   - Text: "Play"
   - Path: `/play`
   - Access: Admin and Author roles only

### User Roles & Permissions

- **Admin**: Full access to all sections and admin routes
- **Author** (SMEs): Access to Learn and Play sections for content creation
- **Teacher**: Access to Console (Teacher Library), can create content for students
- **Student**: Access to Console (Student Library), limited library access based on teacher assignments

## Components

### SectionDropdown Component

**Location:** `src/components/SectionDropdown.tsx`

**Purpose:** Provides a dropdown menu for switching between platform sections.

**Features:**
- Shows current active section with logo and text
- Expands to show other available sections
- Automatically closes when route changes
- Handles collapsed sidebar state (icon-only view)
- Smooth animations for dropdown expansion

**Key Functionality:**
- Detects current section based on route pathname
- Provides role-based home path navigation
- Manages dropdown open/closed state
- Handles route changes automatically

**Usage:**
```tsx
<SectionDropdown sidebarOpen={sidebarOpen} />
```

### PageTransition Component

**Location:** `src/components/PageTransition.tsx`

**Purpose:** Provides smooth page transitions when navigating between routes.

**Features:**
- Fade-in/fade-out animations
- Subtle slide-up effect (3px translateY)
- Prevents flashing during route changes
- Maintains previous content visibility during transition
- Fast transitions (30ms delay, 0.08s fade-out, 0.15s fade-in)

**Key Implementation:**
- Uses React Router's `useLocation` to detect route changes
- Maintains display state separate from route state
- Uses `requestAnimationFrame` for smooth DOM updates
- Prevents pointer events during transitions

**Usage:**
```tsx
<PageTransition>
  {children}
</PageTransition>
```

### AdminLayout Component

**Location:** `src/components/layout/AdminLayout.tsx`

**Purpose:** Main layout component for admin and author sections.

**Features:**
- Persistent sidebar navigation
- Section dropdown integration
- Role-based navigation items
- Smooth transitions for header title changes
- Responsive sidebar (collapsible)

**Navigation Items (Admin Routes Only):**
- Dashboard (`/admin/dashboard`)
- Users (`/admin/users`)
- Teachers (`/admin/teachers`)
- Students (`/admin/students`)
- Courses (`/admin/courses`)
- Design System (`/admin/design-system`)

**Logo Display:**
- Shows `playitproLogo.png` in top-left
- Text: "Play it" / "Pro" (two-line display)
- Links to role-based home path

## Routing Structure

### Route Configuration

Routes are defined in `src/App.tsx`:

**Section Routes:**
```tsx
<Route 
  path="/learn" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'author']}>
      <Learn />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/play" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'author']}>
      <Play />
    </ProtectedRoute>
  } 
/>
```

**Admin Routes:**
All admin routes use `AdminLayout` and require `admin` role:
- `/admin` - Legacy admin page
- `/admin/dashboard` - Main dashboard
- `/admin/users` - User management
- `/admin/teachers` - Teacher management
- `/admin/students` - Student management
- `/admin/courses` - Course management
- `/admin/design-system` - Design system showcase

### ProtectedRoute Updates

**Location:** `src/components/ProtectedRoute.tsx`

**Key Change:** Only shows loading screen on initial auth check, not during route navigation.

**Implementation:**
```tsx
// Only show loading on initial auth check
const isInitialLoad = loading && !session && !user

if (isInitialLoad) {
  return <LoadingScreen />
}
```

This prevents flashing when navigating between authenticated routes.

## Page Components

### Learn Page

**Location:** `src/pages/Learn.tsx`

- Blank page placeholder for Learn section
- Uses `AdminLayout` for admin/author users
- Will be expanded with content management features

### Play Page

**Location:** `src/pages/Play.tsx`

- Blank page placeholder for Play section
- Uses `AdminLayout` for admin/author users
- Will be expanded with interactive features

## Assets

### Logo Files

All located in `src/assets/`:
- `playitproLogo.png` - Main platform logo (used in AdminLayout header)
- `ConsoleLogo.png` - Console section logo
- `LearnLogo.png` - Learn section logo
- `PlayLogo.png` - Play section logo

## Future Plans

### Opportunity Board

The foundation has been set for building an Opportunity Board system:

**Access:**
- Available to Admin and Author roles only
- Will be built in the Learn or Play section (TBD)

**Functionality (Planned):**
- Admins can create opportunities
- Teachers can apply to opportunities
- Admins can approve/deny applications
- This system will drive content creation for the library

**Role Definitions:**
- **Authors (SMEs)**: Subject Matter Experts who create content, will eventually receive royalties based on views
- **Teachers**: Users with physical students who can assign content to students
- **Students**: Monthly paid users with library access. Students added via teacher codes get:
  - 3-month free access
  - Limited access (their instrument only)
  - Access to teacher-assigned playlist videos

## Performance Optimizations

### Transition Optimizations

1. **Fast Transitions:**
   - 30ms content swap delay
   - 0.08s fade-out duration
   - 0.15s fade-in duration

2. **Layout Stability:**
   - Sidebar uses `position: sticky`
   - `flexShrink: 0` prevents layout shifts
   - CSS containment for performance

3. **Memoization:**
   - Navigation items memoized
   - Page title memoized
   - Prevents unnecessary recalculations

### No-Flash Guarantee

The system is designed to prevent UI flashing by:
- Not showing loading screens during route navigation
- Maintaining previous content during transitions
- Using stable sidebar positioning
- Fast, smooth transitions

## CSS Animations

**Location:** `src/index.css`

**Animations:**
- `@keyframes slideDown` - Dropdown expansion animation
- Page transition classes (for future use)

## Development Notes

### Adding New Sections

1. Add logo to `src/assets/`
2. Add section to `SectionDropdown.tsx` sections array
3. Create page component in `src/pages/`
4. Add route in `src/App.tsx` with appropriate `ProtectedRoute`
5. Update `getCurrentSection()` in `SectionDropdown.tsx`

### Modifying Transitions

Transition timing can be adjusted in `PageTransition.tsx`:
- `setTimeout` delay (currently 30ms)
- Fade-out duration (currently 0.08s)
- Fade-in duration (currently 0.15s)
- Transform distance (currently 3px)

---

**Last Updated:** After implementing section navigation system and smooth page transitions

