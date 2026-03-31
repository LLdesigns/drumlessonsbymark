import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { validatePassword } from '../lib/password'
import { TextField, Button, Modal, Tabs, type TabItem } from './ui'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const AccountSettingsModal = ({ isOpen, onClose }: AccountSettingsModalProps) => {
  const { updatePassword, signOut } = useAuthStore()
  const navigate = useNavigate()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'account' | 'password'>('account')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setValidationErrors([])
      setActiveTab('account')
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      // Reset form on success
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setValidationErrors([])
      // Close modal after successful update
      onClose()
    } catch (error: unknown) {
      console.error('Password update error:', error)
      const message = error instanceof Error ? error.message : 'Failed to update password. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const tabItems: TabItem[] = [
    {
      id: 'account',
      label: 'Account',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h3 style={{
                  margin: 0,
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)'
                }}>
                  Account Information
                </h3>
                <p style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Manage your account settings and preferences.
                </p>
              </div>

              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                border: '1px solid var(--color-border-default)'
              }}>
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  fullWidth
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    background: 'var(--color-error)',
                    color: 'white',
                    borderColor: 'var(--color-error)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <i className="bi bi-box-arrow-right" />
                  Sign Out
                </Button>
              </div>
            </div>
          )
    },
    {
      id: 'password',
      label: 'Change Password',
      content: (
        <form onSubmit={handlePasswordSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)'
        }}>
              <div>
                <h3 style={{
                  margin: 0,
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)'
                }}>
                  Change Password
                </h3>
                <p style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Update your password to keep your account secure.
                </p>
              </div>

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

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )
    }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      size="md"
    >
      <Tabs
        items={tabItems}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'account' | 'password')}
      />
    </Modal>
  )
}

export default AccountSettingsModal

