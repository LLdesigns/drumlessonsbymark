# Project Structure & AI Assistant Guide

## ⚠️ CRITICAL ISSUES TO AVOID

### Issue: Browser Displaying Raw HTML Instead of Rendering React App

**Problem:** Browser shows HTML source code with syntax highlighting instead of rendering the React application.

**Root Cause:** This can happen when:
1. Dev server is not running or crashed
2. Browser cache issues
3. Incorrect file being served

**Solution:**
- **ALWAYS ensure `index.html` in root contains the React entry point:**
  ```html
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
  ```
- **DO NOT rename `index.html`** - Vite requires this file in the root as the entry point
- If issues persist, restart the dev server:
  ```bash
  npm run dev
  ```
- Verify server is running on correct port (check terminal output)

**Files to NEVER modify incorrectly:**
- `index.html` - MUST be the React entry point, not static HTML
- `landingPage.html` - Static HTML file, separate from React app
- `vite.config.ts` - Server configuration, do not add Content-Type overrides

---

## Project Overview

**Project Name:** Drum Lessons by Mark  
**Type:** React + TypeScript + Vite application  
**Domain:** https://www.drumlessonsbymark.com

---

## Directory Structure

```
play-it-pro-platform/
├── index.html              # ⚠️ CRITICAL: React app entry point (DO NOT replace)
├── landingPage.html        # Static HTML landing page (legacy, not used in React app)
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies and scripts
│
├── src/                    # Source code directory
│   ├── main.tsx           # React app entry point
│   ├── App.tsx            # Main React component with routing
│   ├── App.css            # App-level styles
│   ├── index.css          # Global styles
│   │
│   ├── pages/             # Page components
│   │   ├── Home.tsx       # Main landing page (React version)
│   │   ├── Login.tsx      # Login page
│   │   ├── Admin.tsx      # Legacy admin page
│   │   ├── Learn.tsx      # Learn section page
│   │   ├── Play.tsx       # Play section page
│   │   ├── admin/         # Admin pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Teachers.tsx
│   │   │   ├── Students.tsx
│   │   │   └── Courses.tsx
│   │   ├── teacher/       # Teacher pages
│   │   │   ├── Library.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Assignments.tsx
│   │   │   └── CourseEditor.tsx
│   │   └── student/       # Student pages
│   │       ├── Library.tsx
│   │       ├── Assignments.tsx
│   │       └── CourseView.tsx
│   │
│   ├── components/        # Reusable React components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── InfoSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── ResultsSection.tsx
│   │   ├── CTASection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ContactSection.tsx  # ⚠️ Contains reCAPTCHA integration
│   │   ├── Footer.tsx
│   │   ├── SectionDropdown.tsx  # Section navigation dropdown
│   │   ├── PageTransition.tsx   # Smooth page transitions
│   │   ├── ProtectedRoute.tsx   # Route protection wrapper
│   │   └── layout/              # Layout components
│   │       ├── AdminLayout.tsx  # Admin/Author layout
│   │       ├── TeacherLayout.tsx
│   │       └── StudentLayout.tsx
│   │
│   ├── lib/              # Library configurations
│   │   ├── supabase.ts   # Supabase client configuration
│   │   └── tokens.css    # Design tokens
│   │
│   ├── store/            # State management (Zustand)
│   │   └── auth.ts       # Authentication store
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── useActiveSection.ts
│   │
│   └── data/             # Static data
│       └── designSystemNav.ts
│
├── public/               # Static assets served by Vite
│   ├── assets/          # Images and SVG files
│   ├── 404.html         # Custom 404 page
│   └── _headers         # Cloudflare Pages headers config
│
├── assets/               # Legacy assets directory
├── dist/                 # Build output (gitignored, generated)
├── scripts/              # Build scripts
│   └── fix-mime-types.js
│
└── node_modules/        # Dependencies (gitignored)
```

---

## Key Files & Their Purposes

### Entry Points

- **`index.html`** (ROOT)
  - **Purpose:** Vite entry point - serves the React application
  - **⚠️ CRITICAL:** This file MUST exist and MUST contain the React mount point
  - **Content:** `<div id="root"></div>` + `<script type="module" src="/src/main.tsx"></script>`
  - **DO NOT** replace this with static HTML content

- **`src/main.tsx`**
  - React application bootstrap
  - Creates root and renders `<App />` component

- **`src/App.tsx`**
  - Main React component with routing configuration
  - Sets up React Router, React Query, and authentication
  - Routes:
    - `/` → Home page
    - `/login` → Admin login
    - `/admin` → Admin dashboard

### React Components

- **`src/pages/Home.tsx`**
  - Main landing page with all sections
  - Contains: Navbar, Hero, Info, Pricing, Testimonials, Results, CTA, About, Contact, Footer

- **`src/components/ContactSection.tsx`**
  - Contact form with reCAPTCHA integration
  - Supabase integration for storing messages
  - Features:
    - Google reCAPTCHA v2 (site key: `6LfpRfgrAAAAADKnlAAQ696lz8DB93jBEsx_FHXD`)
    - Form validation
    - Supabase database storage

### Configuration Files

- **`vite.config.ts`**
  - Vite development and build configuration
  - Server config: port 5173, host enabled
  - Build output: `dist/` directory
  - **⚠️ DO NOT add Content-Type header overrides to server config**

- **`package.json`**
  - Node.js >= 20.19.0 required
  - Scripts:
    - `npm run dev` - Start development server
    - `npm run build` - Build for production
    - `npm run preview` - Preview production build
    - `npm run deploy` - Deploy to GitHub Pages

---

## Important Features

### Authentication & User Roles
- **Library:** Zustand (`src/store/auth.ts`)
- **Backend:** Supabase Auth
- **Roles:**
  - `admin` - Full platform access
  - `author` - Subject Matter Experts (SMEs), content creators
  - `teacher` - Users with physical students
  - `student` - Monthly paid users with library access
- **Routes:** `/login` for authentication
- **Protected Routes:** Uses `ProtectedRoute` component to guard routes based on roles

### Navigation System
- **Section-Based Navigation:** Three main sections (Console, Learn, Play)
- **Components:**
  - `SectionDropdown` - Section switcher with logo and text
  - `PageTransition` - Smooth page transitions (prevents flashing)
  - `AdminLayout` - Layout wrapper for admin/author sections
- **Routes:**
  - **Console:** Role-based dashboards
    - Admin/Author: `/admin/dashboard`
    - Teacher: `/teacher/library`
    - Student: `/student/library`
  - **Learn:** `/learn` (Admin/Author only)
  - **Play:** `/play` (Admin/Author only)
- **See:** `docs/NAVIGATION-SYSTEM.md` for complete documentation

### Database Integration
- **Backend:** Supabase
- **Config:** `src/lib/supabase.ts`
- **Tables:**
  - `contact_messages` - Stores contact form submissions
  - `profiles` - User profile information
  - `user_roles` - User role assignments
  - `teachers` - Teacher-specific data
  - `teacher_students` - Teacher-student relationships
  - `courses` - Course content
- **Features:**
  - Contact form submissions with reCAPTCHA
  - Admin dashboard to view messages
  - User role management
  - Teacher-student relationships

### reCAPTCHA Integration
- **Component:** `src/components/ContactSection.tsx`
- **Type:** Google reCAPTCHA v2
- **Site Key:** `6LfpRfgrAAAAADKnlAAQ696lz8DB93jBEsx_FHXD`
- **Theme:** Dark mode
- **Validation:** Required before form submission

### Routing
- **Library:** React Router DOM v7
- **Router Type:** BrowserRouter (client-side routing)
- **Main Routes:**
  - `/` - Home page (main landing page)
  - `/login` - Login page
  - `/admin/*` - Admin routes (protected, admin role)
  - `/learn` - Learn section (protected, admin/author roles)
  - `/play` - Play section (protected, admin/author roles)
  - `/teacher/*` - Teacher routes (protected, teacher role)
  - `/student/*` - Student routes (protected, student role)
- **Route Protection:** `ProtectedRoute` component handles authentication and authorization

---

## Development Workflow

### Starting Development Server

```bash
cd play-it-pro-platform
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Accessing the Application

- **Main App (React):** http://localhost:5173/
- **NOT:** http://localhost:5173/landingpage (this serves static HTML file)

**⚠️ IMPORTANT:** The React app is at the ROOT URL (`/`), not `/landingpage`

### Common Issues & Solutions

#### Issue: Browser shows raw HTML source code
**Solution:**
1. Verify `index.html` contains React entry point
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Ctrl + Shift + R`
4. Check browser console for errors

#### Issue: "Cannot find module" errors
**Solution:**
1. Install dependencies: `npm install`
2. Verify Node.js version: `node --version` (must be >= 20.19.0)

#### Issue: Port already in use
**Solution:**
- Vite will auto-select next available port (5174, 5175, etc.)
- Check terminal output for actual port number

---

## File Naming Conventions

### React Components
- **Format:** PascalCase.tsx
- **Example:** `ContactSection.tsx`, `Navbar.tsx`

### Pages
- **Location:** `src/pages/`
- **Format:** PascalCase.tsx
- **Example:** `Home.tsx`, `Login.tsx`, `Admin.tsx`

### Styles
- **Global:** `src/index.css`
- **Component:** `ComponentName.css` or inline styles
- **Legacy:** `styles.css` (root directory, not used by React)

---

## Static Files vs React Components

### Static HTML Files (Legacy)
- `landingPage.html` - Original static HTML version
- **Purpose:** Reference/backup only
- **NOT used by React app**

### React Components (Current)
- All components in `src/components/`
- Rendered through React Router
- Access at root URL: `http://localhost:5173/`

**⚠️ DO NOT confuse:**
- Static `landingPage.html` (old version)
- React `Home.tsx` component (current version with reCAPTCHA, Supabase, etc.)

---

## Build & Deployment

### Production Build
```bash
npm run build
```
- Outputs to `dist/` directory
- Runs TypeScript compilation
- Builds optimized assets
- Fixes MIME types for deployment

### Deployment
- **Platform:** GitHub Pages
- **Command:** `npm run deploy`
- **Domain:** www.drumlessonsbymark.com (via CNAME)

### Build Output Structure
```
dist/
├── index.html           # Built React app
├── assets/
│   ├── index.js        # Bundled JavaScript
│   └── index.css       # Bundled CSS
└── [other static assets]
```

---

## Dependencies

### Core
- **React:** ^19.1.1
- **TypeScript:** ~5.8.3
- **Vite:** ^7.1.2

### UI & Styling
- **Tailwind CSS:** ^4.1.13
- **@headlessui/react:** ^2.2.7
- **@heroicons/react:** ^2.2.0
- **lucide-react:** ^0.542.0

### State Management & Routing
- **zustand:** ^5.0.8
- **react-router-dom:** ^7.8.2
- **@tanstack/react-query:** ^5.87.1

### Backend Services
- **@supabase/supabase-js:** ^2.57.2
- **react-google-recaptcha:** ^3.1.0

---

## Environment Requirements

- **Node.js:** >= 20.19.0 (see `package.json` engines)
- **Package Manager:** npm
- **OS:** Windows (based on current setup)

---

## Troubleshooting Checklist

When the app doesn't load:

1. ✅ **Check dev server is running**
   ```bash
   netstat -ano | findstr :5173
   ```

2. ✅ **Verify `index.html` is correct React entry point**
   - Should have `<div id="root"></div>`
   - Should have `<script type="module" src="/src/main.tsx"></script>`

3. ✅ **Check browser console for errors**
   - Press F12, check Console tab

4. ✅ **Verify dependencies installed**
   ```bash
   npm install
   ```

5. ✅ **Check Node.js version**
   ```bash
   node --version
   ```
   Must be >= 20.19.0

6. ✅ **Restart dev server**
   - Stop current process
   - Run `npm run dev` again

---

## Key Takeaways for AI Assistants

1. **NEVER replace `index.html` with static content** - It's the React entry point
2. **React app is at root URL (`/`), not `/landingpage`**
3. **`landingPage.html` is legacy static file, not used by React app**
4. **All recent features (reCAPTCHA, Supabase, login) are in React components**
5. **Server must return `Content-Type: text/html` for `index.html`**
6. **Dev server runs on port 5173 by default, but may use 5174, 5175, etc. if busy**
7. **Always check terminal output for actual port number when server starts**

---

**Last Updated:** After implementing section navigation system, smooth page transitions, and Opportunity Board foundation

## Recent Updates

### Navigation System (Latest)
- **Implemented:** Section-based navigation with Console, Learn, and Play sections
- **Features:**
  - SectionDropdown component with logo-based navigation
  - Smooth page transitions to prevent UI flashing
  - Role-based route protection
  - Optimized performance with memoization
- **Components Added:**
  - `SectionDropdown.tsx` - Section switcher
  - `PageTransition.tsx` - Smooth transitions
  - Updated `AdminLayout.tsx` - Integrated section navigation
- **Routes Added:**
  - `/learn` - Learn section (admin/author only)
  - `/play` - Play section (admin/author only)

### Performance Optimizations
- **Page Transitions:**
  - No loading screens during route navigation (only on initial auth check)
  - Fast transitions (30ms delay, 0.08s fade-out, 0.15s fade-in)
  - Previous content stays visible during transitions
- **Layout Stability:**
  - Sidebar uses sticky positioning
  - Memoized navigation items and page titles
  - CSS containment for performance

### Future Plans
- **Opportunity Board:**
  - Will be built in Learn or Play section
  - Admins create opportunities
  - Teachers apply to opportunities
  - Admins approve/deny applications
  - Drives content creation for library

**Status:** ✅ Navigation system working correctly with smooth transitions

