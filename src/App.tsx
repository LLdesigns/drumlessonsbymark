import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import DesignSystem from './pages/DesignSystem'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminTeachers from './pages/admin/Teachers'
import AdminStudents from './pages/admin/Students'
import AdminCourses from './pages/admin/Courses'
import AdminSongs from './pages/admin/Songs'
import SongCreator from './pages/admin/SongCreator'
import SongAuthor from './pages/admin/SongAuthor'
// Teacher pages
import TeacherLibrary from './pages/teacher/Library'
import TeacherStudents from './pages/teacher/Students'
import TeacherAssignments from './pages/teacher/Assignments'
import CourseEditor from './pages/teacher/CourseEditor'
// Student pages
import StudentLibrary from './pages/student/Library'
import StudentAssignments from './pages/student/Assignments'
import CourseView from './pages/student/CourseView'
// Section pages
import Learn from './pages/Learn'
import Play from './pages/Play'

const queryClient = new QueryClient()

function AppContent() {
  const { checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    
    // Check for stored redirect path from 404.html
    const redirectPath = sessionStorage.getItem('redirectPath')
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath')
      navigate(redirectPath)
    }

    // Set up auth state change listener for automatic session refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Don't interfere with manual signIn - let the signIn function handle it
        if (event === 'SIGNED_IN' && session) {
          // Only update expiration if not already set (to avoid race conditions)
          const existingExpiration = localStorage.getItem('session_expiration')
          if (!existingExpiration) {
            const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
            localStorage.setItem('session_expiration', expirationTime.toString())
          }
          // Don't call checkAuth here - signIn already does this
        } else if (event === 'SIGNED_OUT') {
          // Clear expiration on sign out
          localStorage.removeItem('session_expiration')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update expiration timestamp on token refresh
          const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
          localStorage.setItem('session_expiration', expirationTime.toString())
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth, navigate])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/landingpage" element={<Home />} />
      <Route path="/landingPage" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes - password change */}
      <Route 
        path="/change-password" 
        element={
          <ProtectedRoute requirePasswordChange>
            <ChangePassword />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/teachers" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTeachers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/students" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStudents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/songs" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'employee']}>
            <AdminSongs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/songs/create" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'employee']}>
            <SongCreator />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/songs/author" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'employee', 'author']}>
            <SongAuthor />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/courses" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCourses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/design-system" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DesignSystem />
          </ProtectedRoute>
        } 
      />
      
      {/* Section routes - Learn and Play */}
      <Route 
        path="/learn" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'author', 'teacher', 'employee', 'student']}>
            <Learn />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/play" 
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin', 'employee', 'author']}>
            <Play />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/play/:songId" 
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin', 'employee', 'author']}>
            <Play />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher routes */}
      <Route 
        path="/teacher/library" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLibrary />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/students" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherStudents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/assignments" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherAssignments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/courses/:courseId" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CourseEditor />
          </ProtectedRoute>
        } 
      />
      
      {/* Student routes */}
      <Route 
        path="/student/library" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLibrary />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/assignments" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAssignments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/courses/:courseId" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseView />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  )
}

export default App