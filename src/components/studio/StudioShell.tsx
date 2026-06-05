import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import StudioProfileMenu from './StudioProfileMenu'
import StudioPortalChrome from './StudioPortalChrome'
import { STUDIO_BRAND_LINE1, studioPortalLabel } from '../../lib/studio-brand'
import { prefetchRoute } from '../../lib/route-prefetch'
import '../../lib/studio-tokens.css'
import '../../lib/studio-pwa.css'
import '../../lib/studio-responsive.css'

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
}: {
  portal: 'student' | 'studio'
  profileRoleLabel?: string
  variant: 'teacher' | 'student'
  sidebarOpen: boolean
}) {
  return (
    <div className={`studio-sidebar-account ${sidebarOpen ? '' : 'studio-sidebar-account--collapsed'}`}>
      <StudioProfileMenu
        portal={portal}
        roleLabel={profileRoleLabel ?? (variant === 'teacher' ? 'Teacher' : 'Student')}
        showSignOut
        includeNotifications
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
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
              <p className="studio-brand__mark">{STUDIO_BRAND_LINE1}</p>
              <h2 className="studio-brand__title">{studioPortalLabel(variant)}</h2>
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
                onMouseEnter={() => prefetchRoute(item.path)}
                onFocus={() => prefetchRoute(item.path)}
              >
                <i className={`bi ${item.icon}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="studio-sidebar__bottom">
          <SidebarAccount
            portal={portal}
            profileRoleLabel={profileRoleLabel}
            variant={variant}
            sidebarOpen={sidebarOpen}
          />
        </div>
      </aside>

      <div className="studio-mobile-util" aria-label="Account menu">
        <StudioProfileMenu
          portal={portal}
          roleLabel={profileRoleLabel ?? (variant === 'teacher' ? 'Teacher' : 'Student')}
          showSignOut
          includeNotifications
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
              onTouchStart={() => prefetchRoute(item.path)}
              onFocus={() => prefetchRoute(item.path)}
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
