import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useTheme } from '../hooks/useTheme'
import AccountSettingsModal from './AccountSettingsModal'
import { Button } from './ui'

interface UserDropdownProps {
  sidebarOpen: boolean
}

const UserDropdown = ({ sidebarOpen }: UserDropdownProps) => {
  const { userProfile } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!userProfile) return null

  const handleEditAccount = () => {
    setIsOpen(false)
    setIsModalOpen(true)
  }

  const handleToggleTheme = () => {
    toggleTheme()
    setIsOpen(false)
  }

  if (!sidebarOpen) {
    return (
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="tertiary"
        style={{
          width: '100%',
          padding: 'var(--space-3)',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-base)',
          border: 'none',
          fontSize: 'var(--font-size-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <i className="bi bi-person-circle" />
        {isOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              marginBottom: 'var(--space-2)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-base)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '200px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            <div
              onClick={handleEditAccount}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                transition: 'var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <i className="bi bi-pencil" />
              <span>Edit Account</span>
            </div>
            <div
              onClick={handleToggleTheme}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                transition: 'var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`} />
              <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
            </div>
          </div>
        )}
      </Button>
    )
  }

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: 'var(--space-3)',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-base)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'var(--transition-base)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-tertiary)'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
            {userProfile.first_name || userProfile.display_name || 'User'} {userProfile.last_name || ''}
          </div>
          <div style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-xs)',
            marginTop: 'var(--space-1)'
          }}>
            {userProfile.email || 'No email'}
          </div>
        </div>
        <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ marginLeft: 'var(--space-2)' }} />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            marginBottom: 'var(--space-2)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-base)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div
            onClick={handleEditAccount}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              borderBottom: '1px solid var(--color-border-default)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <i className="bi bi-pencil" />
            <span>Edit Account</span>
          </div>
          <div
            onClick={handleToggleTheme}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`} />
            <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
          </div>
        </div>
      )}
      
      <AccountSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default UserDropdown

