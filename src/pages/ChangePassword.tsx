import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useIsMobile } from '../hooks/useMediaQuery'
import { TextField, Button, Card } from '../components/ui'
import { validatePassword } from '../lib/password'
import { getDefaultPathForRole } from '../lib/permissions'

const ChangePassword = () => {
  const isMobile = useIsMobile()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const { updatePassword, userRole, mustChangePassword, user } = useAuthStore()
  const navigate = useNavigate()

  // If user is logged out (page refreshed after password change), redirect to landing page
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // If user is logged out, don't render the form
  if (!user) {
    return null
  }

  // If password change is not required, redirect
  if (!mustChangePassword) {
    const redirectPath = getDefaultPathForRole(userRole) || '/'
    navigate(redirectPath, { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setValidationErrors([])

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setLoading(false)
      return
    }

    try {
      await updatePassword(newPassword)
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check if user is still logged in after password update
      const { user: currentUser } = useAuthStore.getState()
      if (!currentUser) {
        // User was logged out (session invalidated), redirect to landing page
        navigate('/', { replace: true })
        return
      }
      
      // Redirect to appropriate dashboard
      const redirectPath = getDefaultPathForRole(userRole) || '/'
      navigate(redirectPath, { replace: true })
    } catch (error: any) {
      console.error('Password update error:', error)
      setError(error.message || 'Failed to update password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? 'var(--space-4)' : 'var(--space-8)'
    }}>
      <Card
        padding="lg"
        variant="elevated"
        style={{
          width: '100%',
          maxWidth: '450px'
        }}
      >
        <h1 style={{
          textAlign: 'center',
          marginBottom: 'var(--space-2)',
          color: 'var(--color-brand-primary)',
          fontSize: 'var(--font-size-3xl)',
          fontFamily: 'var(--font-family-display)',
          fontWeight: 'var(--font-weight-bold)',
          marginTop: 0
        }}>
          Change Password
        </h1>
        
        <p style={{
          textAlign: 'center',
          marginBottom: 'var(--space-8)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)'
        }}>
          Please set a new password for your account
        </p>
        
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)'
        }}>
          <TextField
            name="currentPassword"
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            fullWidth
          />

          <TextField
            name="newPassword"
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setValidationErrors([])
            }}
            required
            fullWidth
          />
          
          <TextField
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setError('')
            }}
            required
            fullWidth
          />

          {validationErrors.length > 0 && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-base)',
              padding: 'var(--space-3)',
              color: 'var(--color-warning)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <strong>Password requirements:</strong>
              <ul style={{ margin: 'var(--space-2) 0 0 0', paddingLeft: 'var(--space-6)' }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-base)',
              padding: 'var(--space-3)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)'
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Change Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default ChangePassword
