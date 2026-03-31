import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Button } from './ui'
import ConsoleLogo from '../assets/ConsoleLogo.png'
import LearnLogo from '../assets/LearnLogo.png'
import PlayLogo from '../assets/PlayLogo.png'

interface SectionDropdownProps {
  sidebarOpen: boolean
}

const SectionDropdown = ({ sidebarOpen }: SectionDropdownProps) => {
  const { userProfile } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getCurrentSection = () => {
    if (location.pathname.startsWith('/learn')) return 'learn'
    if (location.pathname.startsWith('/play')) return 'play'
    return 'home'
  }

  const getHomePath = () => {
    if (!userProfile?.role) return '/'
    switch (userProfile.role) {
      case 'admin':
      case 'author':
        return '/admin/dashboard'
      case 'employee':
        return '/admin/songs' // Play Studio
      case 'teacher':
        return '/teacher/library'
      case 'student':
        return '/student/library'
      default:
        return '/'
    }
  }

  const currentSection = getCurrentSection()

  // Build sections array with role-based access
  const allSections = [
    {
      id: 'home',
      label: 'Console',
      path: getHomePath(),
      logo: ConsoleLogo,
      roles: ['admin', 'author', 'teacher', 'employee'] // Students don't see Console
    },
    {
      id: 'learn',
      label: 'Learn',
      path: '/learn',
      logo: LearnLogo,
      roles: ['admin', 'author', 'teacher', 'employee', 'student'] // Admin, author, teacher, employee, and student see Learn
    },
    {
      id: 'play',
      label: 'Play',
      path: '/play',
      logo: PlayLogo,
      roles: ['admin', 'author', 'teacher', 'student', 'employee'] // All roles see Play
    }
  ]

  // Filter sections based on user role
  const sections = allSections.filter(section => 
    !userProfile?.role || section.roles.includes(userProfile.role)
  )

  const currentSectionData = sections.find(s => s.id === currentSection) || sections[0]

  // Get available sections for dropdown (exclude current active section)
  const availableSections = sections.filter(section => section.id !== currentSection)

  // Safety check: if no currentSectionData, don't render
  if (!currentSectionData) {
    return null
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Use a small delay to prevent immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 10)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  if (!sidebarOpen) {
    return (
      <div style={{ position: 'relative', minWidth: 0, overflow: 'visible' }} ref={dropdownRef}>
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(prev => !prev)
          }}
          variant="tertiary"
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border-default)',
            fontSize: 'var(--font-size-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-base)',
            minWidth: 0,
            overflow: 'hidden',
            boxSizing: 'border-box',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-tertiary)'
          }}
        >
          <img 
            src={currentSectionData.logo}
            alt={currentSectionData.label}
            style={{
              height: '28px',
              width: 'auto',
              objectFit: 'contain'
            }}
            />
          </Button>
        {isOpen && (
          <div
            onClick={(e) => {
              // Prevent clicks inside dropdown from closing it
              e.stopPropagation()
            }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: 'var(--space-2)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-base)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '220px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {availableSections.map((section, index) => (
              <Link
                key={section.id}
                to={section.path}
                onClick={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                  // Use navigate with a small delay to allow dropdown to close smoothly
                  setTimeout(() => {
                    navigate(section.path)
                  }, 100)
                }}
                style={{
                  padding: 'var(--space-4) var(--space-5)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-primary)',
                  borderBottom: index !== availableSections.length - 1 ? '1px solid var(--color-border-default)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  transition: 'var(--transition-base)',
                  textDecoration: 'none',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <img 
                  src={section.logo}
                  alt={section.label}
                  style={{
                    height: '32px',
                    width: 'auto',
                    objectFit: 'contain',
                    flexShrink: 0
                  }}
                />
                <span>{section.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minWidth: 0, overflow: 'visible' }} ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(prev => !prev)
        }}
        style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border-default)',
            fontSize: 'var(--font-size-base)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'var(--transition-base)',
            minWidth: 0,
            overflow: 'hidden',
            boxSizing: 'border-box',
            userSelect: 'none'
          }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-tertiary)'
        }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0, overflow: 'hidden' }}
        >
          <img 
            src={currentSectionData.logo}
            alt={currentSectionData.label}
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
          <span style={{ 
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0
          }}>
            {currentSectionData.label}
          </span>
        </div>
        <i 
          className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} 
          style={{ 
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: 'var(--space-1)',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div
          onClick={(e) => {
            // Prevent clicks inside dropdown from closing it
            e.stopPropagation()
          }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: 'var(--space-2)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-base)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {availableSections.map((section, index) => (
            <Link
              key={section.id}
              to={section.path}
              onClick={(e) => {
                e.preventDefault()
                setIsOpen(false)
                // Use navigate with a small delay to allow dropdown to close smoothly
                setTimeout(() => {
                  navigate(section.path)
                }, 100)
              }}
              style={{
                padding: 'var(--space-4) var(--space-5)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-primary)',
                borderBottom: index !== availableSections.length - 1 ? '1px solid var(--color-border-default)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'var(--transition-base)',
                textDecoration: 'none',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <img 
                src={section.logo}
                alt={section.label}
                style={{
                  height: '32px',
                  width: 'auto',
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
              <span>{section.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SectionDropdown
