import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useMediaQuery'
import { TextField, Button, Card } from '../components/ui'
import { getDefaultPathForRole } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { formatAuthErrorMessage } from '../lib/auth-errors'

const Login = () => {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const { signIn, signOut, databaseSchemaMissing } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      
      // Get fresh values from store after signIn completes
      const storeState = useAuthStore.getState()
      const currentMustChange = storeState.mustChangePassword
      const currentRole = storeState.userRole
      const schemaMissing = storeState.databaseSchemaMissing
      
      console.log('Login successful:', { currentMustChange, currentRole, schemaMissing })
      
      if (schemaMissing) {
        setError(
          'This Supabase project is missing app tables (profiles / user_roles). Open Supabase Dashboard → SQL Editor, run supabase/sql/apply-all-migrations-once.sql, then run supabase/sql/after-migrations-first-user.sql with your email. Reload the app and sign in again.'
        )
        await signOut()
        return
      }
      
      // Check if password change is required
      if (currentMustChange) {
        navigate('/change-password', { replace: true })
      } else if (currentRole) {
        // Redirect based on role
        const redirectPath = getDefaultPathForRole(currentRole) || '/admin/dashboard'
        console.log('Redirecting to:', redirectPath)
        navigate(redirectPath, { replace: true })
      } else {
        setError(
          'You are signed in, but this account has no role in user_roles. In Supabase SQL Editor, run the INSERT in supabase/sql/after-migrations-first-user.sql for your email, then reload and sign in again.'
        )
        await signOut()
        return
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError(formatAuthErrorMessage(error, 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetEmailSent(false)

    if (!email) {
      setResetError('Please enter your email address')
      setResetLoading(false)
      return
    }

    try {
      // Use Supabase's password reset function
      // This will send a password reset email with a link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setResetEmailSent(true)
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      setResetError(formatAuthErrorMessage(error, 'Failed to send password reset email'))
    } finally {
      setResetLoading(false)
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
          {showForgotPassword ? 'Reset Password' : 'Welcome'}
        </h1>
        
        {showForgotPassword ? (
          <div>
            {resetEmailSent ? (
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
                  <strong>Password reset email sent!</strong>
                  <p style={{ margin: 'var(--space-2) 0 0 0', opacity: 0.9 }}>
                    Check your email for a password reset link. Click the link to reset your password.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmailSent(false)
                    setResetError('')
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-6)'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Enter your email address and we'll send you a link to reset your password.
                </div>

                <TextField
                  name="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  fullWidth
                />

                {resetError && (
                  <div style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-base)',
                    padding: 'var(--space-3)',
                    color: 'var(--color-error)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {resetError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={resetLoading}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="tertiary"
                  fullWidth
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetError('')
                  }}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)'
          }}>
            {databaseSchemaMissing && (
              <div style={{
                background: 'rgba(255, 193, 7, 0.12)',
                border: '1px solid rgba(239, 204, 24, 0.6)',
                borderRadius: 'var(--radius-base)',
                padding: 'var(--space-4)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.5
              }}>
                <strong>Database setup required.</strong>{' '}
                In Supabase → SQL Editor, run <code style={{ wordBreak: 'break-all' }}>supabase/sql/apply-all-migrations-once.sql</code>, then{' '}
                <code style={{ wordBreak: 'break-all' }}>supabase/sql/after-migrations-first-user.sql</code> (set your email). Reload and sign in.
              </div>
            )}
            <TextField
              name="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            
            <div>
              <TextField
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-primary)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  padding: 'var(--space-2) 0 0 0',
                  textAlign: 'right',
                  width: '100%',
                  textDecoration: 'none',
                  transition: 'var(--transition-base)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Forgot password?
              </button>
            </div>

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
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-8)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)'
        }}>
          <Link
            to="/"
            style={{
              color: 'var(--color-brand-primary)',
              textDecoration: 'none',
              transition: 'var(--transition-base)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            ← Back to Home
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Login
