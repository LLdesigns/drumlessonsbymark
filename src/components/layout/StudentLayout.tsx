import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SectionDropdown from '../SectionDropdown'
import UserDropdown from '../UserDropdown'

interface StudentLayoutProps {
  children: ReactNode
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { path: '/student/library', label: 'My Library', icon: 'bi-book' },
    { path: '/student/assignments', label: 'Assignments', icon: 'bi-clipboard-check' },
  ]

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '250px' : '70px',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <h2 style={{
              margin: 0,
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-brand-primary)'
            }}>
              Student Portal
            </h2>
          )}
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
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <SectionDropdown sidebarOpen={sidebarOpen} />
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: 'var(--space-4) 0'
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            
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
        overflow: 'auto'
      }}>
        {/* Top bar */}
        <header style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)'
          }}>
            {navItems.find(item => location.pathname === item.path)?.label || 'Student Portal'}
          </h1>
        </header>

        {/* Page content */}
        <div style={{
          flex: 1,
          padding: 'var(--space-8)'
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default StudentLayout

