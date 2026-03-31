import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useMediaQuery'
import { TextField, Button, Card } from '../components/ui'

const ResetPassword = () => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  })

  useEffect(() => {
    // Check if we have the required tokens from the reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (!accessToken || type !== 'recovery') {
      setError('Invalid or expired reset link. Please request a new password reset.')
    }
  }, [])

  useEffect(() => {
    // Check password strength
    setPasswordStrength({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    })
  }, [password])

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validatePassword()) {
      return
    }

    setLoading(true)

    try {
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (error: any) {
      console.error('Password reset error:', error)
      setError(error.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const allRequirementsMet = Object.values(passwordStrength).every(req => req === true)

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
          maxWidth: '400px'
        }}
      >
        <h1 style={{
          textAlign: 'center',
          marginBottom: 'var(--space-8)',
          color: 'var(--color-brand-primary)',
          fontSize: 'var(--font-size-4xl)',
          fontFamily: 'var(--font-family-display)',
          fontWeight: 'var(--font-weight-bold)',
          marginTop: 0
        }}>
          Reset Password
        </h1>

        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'rgba(46, 213, 115, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-base)',
              padding: 'var(--space-4)',
              color: 'var(--color-success)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <strong>Password reset successful!</strong>
              <p style={{ margin: 'var(--space-2) 0 0 0', opacity: 0.9 }}>
                Redirecting to login page...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)'
          }}>
            <TextField
              name="password"
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />

            {/* Password Requirements */}
            {password && (
              <div style={{
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-base)',
                padding: 'var(--space-3)',
                fontSize: 'var(--font-size-xs)'
              }}>
                <div style={{ marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Password requirements:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <div style={{ color: passwordStrength.minLength ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {passwordStrength.minLength ? '✓' : '○'} At least 8 characters
                  </div>
                  <div style={{ color: passwordStrength.hasUpper ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {passwordStrength.hasUpper ? '✓' : '○'} One uppercase letter
                  </div>
                  <div style={{ color: passwordStrength.hasLower ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {passwordStrength.hasLower ? '✓' : '○'} One lowercase letter
                  </div>
                  <div style={{ color: passwordStrength.hasNumber ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {passwordStrength.hasNumber ? '✓' : '○'} One number
                  </div>
                  <div style={{ color: passwordStrength.hasSpecial ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {passwordStrength.hasSpecial ? '✓' : '○'} One special character
                  </div>
                </div>
              </div>
            )}

            <TextField
              name="confirmPassword"
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />

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
              disabled={loading || !allRequirementsMet || !confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

export default ResetPassword

