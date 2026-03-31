import { useState, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useIsMobile } from '../../hooks/useMediaQuery'
import SectionDropdown from '../SectionDropdown'
import PageTransition from '../PageTransition'
import UserDropdown from '../UserDropdown'
import playitproLogo from '../../assets/playitproLogo.png'

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { userProfile } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  
  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  const navItems = useMemo(() => {
    const allItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-bar-chart' },
      { path: '/admin/users', label: 'Users', icon: 'bi-people' },
      { path: '/admin/teachers', label: 'Teachers', icon: 'bi-person-badge' },
      { path: '/admin/students', label: 'Students', icon: 'bi-mortarboard' },
      { path: '/admin/songs', label: 'Play Studio', icon: 'bi-music-note-beamed' },
      { path: '/admin/courses', label: 'Courses', icon: 'bi-book' },
      { path: '/admin/design-system', label: 'Design System', icon: 'bi-palette' },
    ]
    
    // Employees only see Play Studio
    if (userProfile?.role === 'employee') {
      return allItems.filter(item => item.path === '/admin/songs')
    }
    
    // Admins see everything
    return allItems
  }, [userProfile?.role])
  
  const pageTitle = useMemo(() => {
    // Handle songs create/edit page
    if (location.pathname.startsWith('/admin/songs/create')) {
      return 'Song Creator'
    }
    
    const matchedItem = navItems.find(item => 
      location.pathname === item.path || 
      (item.path === '/admin/dashboard' && location.pathname === '/admin')
    )
    
    return matchedItem?.label || (userProfile?.role === 'employee' ? 'Play Studio' : 'Admin Panel')
  }, [location.pathname, navItems, userProfile?.role])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'block'
          }}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        data-sidebar="true"
        className="admin-sidebar"
        style={{
          width: sidebarOpen ? '250px' : '70px',
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease, width 0.3s ease',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto',
          willChange: 'width, transform',
          flexShrink: 0,
          zIndex: 1000,
          transform: isMobile && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}>
        {/* Logo/Header */}
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Link
              to={getHomePath()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                textDecoration: 'none',
                color: 'var(--color-text-primary)'
              }}
            >
              <img 
                src={playitproLogo} 
                alt="Play it Pro Logo" 
                style={{
                  height: sidebarOpen ? '32px' : '28px',
                  width: 'auto',
                  objectFit: 'contain',
                  transition: 'height 0.3s ease'
                }}
              />
              {sidebarOpen && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: '1.2'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)'
                  }}>
                    Play it
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)'
                  }}>
                    Pro
                  </span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-text-primary)',
                padding: 'var(--space-2)'
              }}
            >
              {sidebarOpen ? <i className="bi bi-chevron-left" /> : <i className="bi bi-chevron-right" />}
            </button>
          </div>
          
          {/* Section Dropdown */}
          <SectionDropdown sidebarOpen={sidebarOpen} />
        </div>

        {/* Navigation - Only show on admin routes */}
        {location.pathname.startsWith('/admin') && (
          <nav style={{
            flex: 1,
            padding: 'var(--space-4) 0'
          }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                              (item.path === '/admin/dashboard' && location.pathname === '/admin')
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--space-4) var(--space-6)',
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                    textDecoration: 'none',
                    background: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
                    transition: 'all 0.2s',
                    fontSize: 'var(--font-size-base)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <i className={`${item.icon} bi`} style={{ marginRight: sidebarOpen ? 'var(--space-3)' : 0, fontSize: 'var(--font-size-lg)' }} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        )}

        {/* User section */}
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          marginTop: 'auto'
        }}>
          <UserDropdown sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Top bar */}
        <header style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)'
        }}>
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-text-primary)',
                padding: 'var(--space-2)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Toggle menu"
            >
              <i className="bi bi-list" />
            </button>
          )}
          
          <h1 
            key={location.pathname}
            style={{
              margin: 0,
              fontSize: 'clamp(var(--font-size-lg), 4vw, var(--font-size-2xl))',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              opacity: 1,
              transition: 'opacity 0.15s ease-out'
            }}>
            {pageTitle}
          </h1>
        </header>

        {/* Page content */}
        <div style={{
          flex: 1,
          padding: isMobile ? 'var(--space-4)' : 'var(--space-8)',
          position: 'relative'
        }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout

