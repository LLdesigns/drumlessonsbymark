import { useAuthStore } from '../store/auth'
import AdminLayout from '../components/layout/AdminLayout'
import TeacherLayout from '../components/layout/TeacherLayout'
import StudentLayout from '../components/layout/StudentLayout'

const Learn = () => {
  const { userProfile } = useAuthStore()

  // Use appropriate layout based on role
  const content = (
    <div className="responsive-container" style={{
      maxWidth: '1200px'
    }}>
      <h1 style={{
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-bold)',
        marginBottom: 'var(--space-6)',
        color: 'var(--color-text-primary)'
      }}>
        Learn Section
      </h1>
      <div style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        border: '1px solid var(--color-border)'
      }}>
        <p style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6'
        }}>
          Welcome to the Learn section. This section will be built out with content management features for authors and admins.
        </p>
      </div>
    </div>
  )

  // Use appropriate layout based on role
  if (userProfile?.role === 'admin' || userProfile?.role === 'author' || userProfile?.role === 'employee') {
    return <AdminLayout>{content}</AdminLayout>
  }
  
  if (userProfile?.role === 'teacher') {
    return <TeacherLayout>{content}</TeacherLayout>
  }
  
  if (userProfile?.role === 'student') {
    return <StudentLayout>{content}</StudentLayout>
  }

  // Fallback for unknown roles
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      {content}
    </div>
  )
}

export default Learn

