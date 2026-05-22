import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import StudioProfileMenu from './StudioProfileMenu'
import StudioNotificationBell from './StudioNotificationBell'
import StudioPortalChrome from './StudioPortalChrome'
import '../../lib/studio-tokens.css'
import '../../lib/studio-pwa.css'

export interface StudioNavItem {
  path: string
  label: string
  icon: string
}

interface StudioShellProps {
  children: ReactNode
  navItems: StudioNavItem[]
  variant: 'teacher' | 'student'
  profileRoleLabel?: string
}

function SidebarAccount({
  portal,
  profileRoleLabel,
  variant,
  sidebarOpen,
  showSignOut,
}: {
  portal: 'student' | 'studio'
  profileRoleLabel?: string
  variant: 'teacher' | 'student'
  sidebarOpen: boolean
  showSignOut: boolean
}) {
  return (
    <div className={`studio-sidebar-account ${sidebarOpen ? '' : 'studio-sidebar-account--collapsed'}`}>
      <StudioNotificationBell portal={portal} placement="sidebar" />
      <StudioProfileMenu
        portal={portal}
        roleLabel={profileRoleLabel ?? (variant === 'teacher' ? 'Teacher' : 'Student')}
        showSignOut={showSignOut}
        placement="sidebar"
        collapsed={!sidebarOpen}
      />
    </div>
  )
}

export default function StudioShell({
  children,
  navItems,
  variant,
  profileRoleLabel,
}: StudioShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const portal = variant === 'teacher' ? 'studio' : 'student'

  return (
    <StudioPortalChrome portal={portal}>
    <div
      className={`studio-app studio-app--${variant}${isStandaloneClass()}`}
      style={{ display: 'flex', minHeight: '100vh' }}
    >
      <aside className={`studio-sidebar ${sidebarOpen ? '' : 'studio-sidebar--collapsed'}`}>
        <div className="studio-brand">
          {sidebarOpen ? (
            <>
              <p className="studio-brand__mark">MARK&apos;S</p>
              <h2 className="studio-brand__title">DRUM STUDIO</h2>
            </>
          ) : (
            <p className="studio-brand__title" style={{ fontSize: '1.25rem', textAlign: 'center' }}>
              🥁
            </p>
          )}
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            style={{ marginTop: '0.75rem', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          >
            <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`} />
          </button>
        </div>

        <nav className="studio-nav">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`studio-nav__link ${isActive ? 'studio-nav__link--active' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <i className={`bi ${item.icon}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="studio-sidebar__bottom">
          {variant === 'teacher' ? (
            <>
              {sidebarOpen ? (
                <div className="studio-sidebar__quote">
                  <p>Great playing comes from consistent practice.</p>
                  <cite>— Mark</cite>
                </div>
              ) : null}
              <div className="studio-sidebar__visual" aria-hidden="true" title="Mark's Drum Studio" />
            </>
          ) : null}

          <SidebarAccount
            portal={portal}
            profileRoleLabel={profileRoleLabel}
            variant={variant}
            sidebarOpen={sidebarOpen}
            showSignOut={variant === 'teacher'}
          />

          {variant === 'student' ? (
            <div className="studio-sidebar__footer">
              <button type="button" className="studio-logout" onClick={handleSignOut}>
                <i className="bi bi-box-arrow-right" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="studio-mobile-util" aria-label="Account and notifications">
        <StudioNotificationBell portal={portal} placement="mobile" />
        <StudioProfileMenu
          portal={portal}
          roleLabel={profileRoleLabel ?? (variant === 'teacher' ? 'Teacher' : 'Student')}
          showSignOut
          placement="mobile"
          collapsed
        />
      </div>

      <div className="studio-main">
        <div className="studio-content studio-fade-in">{children}</div>
      </div>

      <nav className="studio-mobile-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`studio-mobile-nav__link ${isActive ? 'studio-mobile-nav__link--active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
    </StudioPortalChrome>
  )
}

function isStandaloneClass(): string {
  if (typeof window === 'undefined') return ''
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return standalone ? ' studio-app--standalone' : ''
}
