import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import LegacyPlatformRedirect from './components/LegacyPlatformRedirect'
import ThemeProvider from './components/ThemeProvider'
import PageLoader from './components/PageLoader'
import { MARK_STUDIO_ROLES } from './lib/studio-roles'
import { queryClient } from './lib/query-client'
import {
  Home,
  Login,
  ChangePassword,
  ResetPassword,
  StudioAppEntry,
  HelpCaptureShowcase,
  MarkDashboard,
  MarkStudents,
  MarkStudentDetail,
  MarkSchedule,
  MarkMessages,
  MarkLessonPlanning,
  LessonBuilder,
  LegacyLessonBuilderRedirect,
  AssignedLessonEdit,
  LessonSession,
  StudentHome,
  StudentLessons,
  StudentLessonDetail,
  StudentMessages,
  StudentSchedule,
  StudentProgress,
} from './lib/lazy-pages'

function AppContent() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const existingExpiration = localStorage.getItem('session_expiration')
          if (!existingExpiration) {
            const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
            localStorage.setItem('session_expiration', expirationTime.toString())
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_expiration')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
          localStorage.setItem('session_expiration', expirationTime.toString())
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/landingpage" element={<Home />} />
        <Route path="/landingPage" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/student" element={<Navigate to="/login?portal=student" replace />} />
        <Route path="/login/studio" element={<Navigate to="/login?portal=studio" replace />} />
        <Route path="/app" element={<StudioAppEntry />} />
        <Route path="/help-capture" element={<HelpCaptureShowcase />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute requirePasswordChange>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Legacy Play It Pro routes — redirect to Mark's studio or student portal */}
        <Route path="/admin" element={<LegacyPlatformRedirect />} />
        <Route path="/admin/*" element={<LegacyPlatformRedirect />} />
        <Route path="/learn" element={<LegacyPlatformRedirect />} />
        <Route path="/learn/*" element={<LegacyPlatformRedirect />} />
        <Route path="/play" element={<LegacyPlatformRedirect />} />
        <Route path="/play/*" element={<LegacyPlatformRedirect />} />
        <Route path="/teacher/*" element={<LegacyPlatformRedirect />} />

        {/* Mark's studio — teacher & admin */}
        <Route
          path="/studio/dashboard"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/students"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/students/:studentId"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkStudentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/schedule"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/messages"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkMessages />
            </ProtectedRoute>
          }
        />
        <Route path="/studio/lesson-notes" element={<Navigate to="/studio/lesson-planning" replace />} />
        <Route
          path="/studio/lesson-planning"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <MarkLessonPlanning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/lesson-planning/lesson/:templateId"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <LessonBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/lesson-planning/builder/:templateId"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <LegacyLessonBuilderRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/lesson-planning/assigned/:id"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <AssignedLessonEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/lesson-planning/session/:scheduledId"
          element={
            <ProtectedRoute allowedRoles={MARK_STUDIO_ROLES}>
              <LessonSession />
            </ProtectedRoute>
          }
        />

        {/* Student studio portal */}
        <Route path="/student/library" element={<Navigate to="/student/home" replace />} />
        <Route path="/student/assignments" element={<Navigate to="/student/lessons" replace />} />
        <Route path="/student/practice" element={<Navigate to="/student/lessons" replace />} />
        <Route path="/student/courses/:courseId" element={<Navigate to="/student/home" replace />} />
        <Route
          path="/student/home"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/lessons"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/lessons/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLessonDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/messages"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProgress />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
