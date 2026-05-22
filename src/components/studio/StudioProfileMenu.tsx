import { useState } from 'react'

import { createPortal } from 'react-dom'

import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/auth'

import { useTheme } from '../../hooks/useTheme'

import { useStudioFloatingPanel } from '../../hooks/useStudioFloatingPanel'

import AccountSettingsModal from '../AccountSettingsModal'
import { studioFloatingRootClass } from '../../lib/studio-portal-classes'

interface StudioProfileMenuProps {
  roleLabel: string
  portal: 'student' | 'studio'
  /** Student keeps logout in the sidebar; hide it here */
  showSignOut?: boolean
  placement?: 'sidebar' | 'mobile' | 'topbar'
  /** Icon-only (collapsed sidebar or mobile bar) */
  collapsed?: boolean
}



export default function StudioProfileMenu({
  roleLabel,
  portal,
  showSignOut = true,
  placement = 'topbar',
  collapsed = false,
}: StudioProfileMenuProps) {

  const { userProfile, signOut } = useAuthStore()

  const navigate = useNavigate()

  const { theme, toggleTheme } = useTheme()

  const [isOpen, setIsOpen] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)



  const floatingPlacement = placement === 'topbar' ? 'inline' : placement

  const { anchorRef, panelRef, panelStyle, usePortal } = useStudioFloatingPanel({

    open: isOpen,

    placement: floatingPlacement,

    onClose: () => setIsOpen(false),

    panelWidth: 220,

    panelMaxHeight: 240,

  })



  if (!userProfile) return null



  const displayName =

    [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') ||

    userProfile.display_name ||

    'User'



  const initials =

    (userProfile.first_name?.[0] || '') + (userProfile.last_name?.[0] || '') || '?'



  const handleSignOut = async () => {

    setIsOpen(false)

    await signOut()

    navigate('/', { replace: true })

  }



  const placementClass =

    placement === 'sidebar'

      ? ' studio-profile-menu--sidebar'

      : placement === 'mobile'

        ? ' studio-profile-menu--mobile'

        : ''



  const floatingRoot = studioFloatingRootClass(portal)

  const dropdown = isOpen ? (
    <div
      ref={panelRef}
      className={
        usePortal
          ? `${floatingRoot} studio-profile-menu__dropdown studio-profile-menu__dropdown--portal`
          : 'studio-profile-menu__dropdown'
      }
      style={usePortal ? panelStyle : undefined}
      role="menu"
    >

      <button type="button" role="menuitem" onClick={() => { setIsOpen(false); setIsModalOpen(true) }}>

        <i className="bi bi-pencil" /> Edit account

      </button>

      <button type="button" role="menuitem" onClick={() => { toggleTheme(); setIsOpen(false) }}>

        <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`} />

        {theme === 'dark' ? 'Light' : 'Dark'} mode

      </button>

      {showSignOut ? (

        <button type="button" role="menuitem" onClick={handleSignOut}>

          <i className="bi bi-box-arrow-right" /> Sign out

        </button>

      ) : null}

    </div>

  ) : null



  return (

    <div className={`studio-profile-menu${placementClass}`} ref={anchorRef}>

      <button

        type="button"

        className={`studio-profile studio-profile--clickable${collapsed ? ' studio-profile--compact' : ''}${placement === 'sidebar' ? ' studio-profile--sidebar' : ''}`}

        onClick={() => setIsOpen((prev) => !prev)}

        aria-expanded={isOpen}

        aria-haspopup="menu"

        aria-label={collapsed ? `${displayName}, ${roleLabel}` : undefined}

      >

        <div className="studio-avatar studio-avatar--lg">

          {userProfile.avatar_url ? (

            <img src={userProfile.avatar_url} alt="" />

          ) : (

            initials

          )}

        </div>

        {!collapsed ? (

          <>

            <div className="studio-profile__text">

              <div className="studio-profile__name">{displayName}</div>

              <div className="studio-profile__role">{roleLabel}</div>

            </div>

            <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', opacity: 0.6 }} />

          </>

        ) : null}

      </button>



      {usePortal && dropdown ? createPortal(dropdown, document.body) : dropdown}



      <AccountSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>

  )

}


