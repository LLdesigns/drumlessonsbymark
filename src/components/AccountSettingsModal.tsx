import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useTheme } from '../hooks/useTheme'
import { validatePassword } from '../lib/password'
import { getLoginPathForRole } from '../lib/login-portal'
import type { ThemePreference } from '../lib/theme-preference'
import { TextField, Textarea, Button, Modal, Tabs, type TabItem } from './ui'
import NotificationSettingsPanel from './studio/NotificationSettingsPanel'
import { roleDisplayLabel } from '../lib/studio-service'

interface ProfileFormState {
  first_name: string
  last_name: string
  display_name: string
  handle: string
  bio: string
}

const emptyProfileForm = (): ProfileFormState => ({
  first_name: '',
  last_name: '',
  display_name: '',
  handle: '',
  bio: '',
})

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'dark', label: 'Dark', description: 'Purple studio look (default)' },
  { value: 'light', label: 'Light', description: 'Bright, easy-on-the-eyes' },
  { value: 'system', label: 'System', description: 'Match your device settings' },
]

const AccountSettingsModal = ({ isOpen, onClose }: AccountSettingsModalProps) => {
  const { updatePassword, updateProfile, signOut, userRole, userProfile, user, fetchUserProfile } =
    useAuthStore()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()

  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<
    'account' | 'notifications' | 'appearance' | 'password'
  >('account')
  const [savingTheme, setSavingTheme] = useState(false)

  useEffect(() => {
    if (isOpen && userProfile) {
      setProfileForm({
        first_name: userProfile.first_name ?? '',
        last_name: userProfile.last_name ?? '',
        display_name: userProfile.display_name ?? '',
        handle: userProfile.handle ?? '',
        bio: userProfile.bio ?? '',
      })
      setProfileError('')
      setProfileSuccess(false)
    }
  }, [isOpen, userProfile])

  useEffect(() => {
    if (isOpen && !userProfile && user?.id) {
      fetchUserProfile()
    }
  }, [isOpen, userProfile, user?.id, fetchUserProfile])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProfileForm(emptyProfileForm())
      setProfileError('')
      setProfileSuccess(false)
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
    const loginPath = getLoginPathForRole(userRole)
    await signOut()
    navigate(loginPath)
  }

  const handleThemeChange = async (pref: ThemePreference) => {
    setSavingTheme(true)
    try {
      await setPreference(pref)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      await updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        display_name: profileForm.display_name,
        handle: profileForm.handle,
        bio: profileForm.bio,
      })
      setProfileSuccess(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not save profile. Please try again.'
      setProfileError(message)
    } finally {
      setProfileSaving(false)
    }
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
                  Profile
                </h3>
                <p style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Updates save to your <code>profiles</code> record in Supabase.
                </p>
              </div>

              {userProfile ? (
                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <TextField
                      name="first_name"
                      label="First name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      fullWidth
                      autoComplete="given-name"
                    />
                    <TextField
                      name="last_name"
                      label="Last name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      fullWidth
                      autoComplete="family-name"
                    />
                  </div>

                  <TextField
                    name="display_name"
                    label="Display name"
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                    helperText="Optional — shown if first/last name are empty"
                    fullWidth
                  />

                  <TextField
                    name="handle"
                    label="Handle"
                    value={profileForm.handle}
                    onChange={(e) => setProfileForm({ ...profileForm, handle: e.target.value })}
                    helperText="Optional username-style identifier"
                    fullWidth
                  />

                  <Textarea
                    name="bio"
                    label="Bio"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="A short note about you…"
                    fullWidth
                  />

                  <TextField
                    name="email"
                    label="Email"
                    value={userProfile.email || user?.email || ''}
                    disabled
                    helperText="Sign-in email is managed in Supabase Auth (contact support to change)"
                    fullWidth
                  />

                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-base)',
                      border: '1px solid var(--color-border-default)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
                      Role
                    </span>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {roleDisplayLabel(userRole)}
                    </p>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      From <code>user_roles</code> — only an admin can change this in the database.
                    </p>
                  </div>

                  {profileSuccess ? (
                    <div
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--color-success, #6dd4a0)',
                        background: 'rgba(109, 212, 160, 0.1)',
                        color: 'var(--color-success, #6dd4a0)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Profile saved. Your name will update across the studio.
                    </div>
                  ) : null}

                  {profileError ? (
                    <div
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--color-error)',
                        background: 'rgba(255, 107, 107, 0.1)',
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {profileError}
                    </div>
                  ) : null}

                  <Button type="submit" variant="primary" fullWidth loading={profileSaving} disabled={profileSaving}>
                    {profileSaving ? 'Saving…' : 'Save profile'}
                  </Button>
                </form>
              ) : (
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-warning, #e6a700)' }}>
                  No profile row found in <code>public.profiles</code> for your account. Run{' '}
                  <code>supabase/sql/after-migrations-first-user.sql</code> or add a profile linked to your auth user id.
                </p>
              )}

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
      id: 'notifications',
      label: 'Notifications',
      content: <NotificationSettingsPanel />,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h3
              style={{
                margin: 0,
                marginBottom: 'var(--space-2)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Theme
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Saved to your account and synced across devices when you sign in.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {THEME_OPTIONS.map((opt) => {
              const selected = preference === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={savingTheme}
                  onClick={() => handleThemeChange(opt.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.2rem',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-base)',
                    border: selected
                      ? '2px solid var(--color-brand-primary)'
                      : '1px solid var(--color-border-default)',
                    background: selected ? 'rgba(255, 184, 0, 0.08)' : 'var(--color-bg-secondary)',
                    cursor: savingTheme ? 'wait' : 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {opt.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ),
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
      size="lg"
      variant="studio"
    >
      <Tabs
        variant="studio"
        items={tabItems}
        activeTab={activeTab}
        onTabChange={(tabId) =>
          setActiveTab(tabId as 'account' | 'notifications' | 'appearance' | 'password')
        }
      />
    </Modal>
  )
}

export default AccountSettingsModal

