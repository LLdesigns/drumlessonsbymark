import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useTheme } from '../../hooks/useTheme'
import { useStudioFloatingPanel } from '../../hooks/useStudioFloatingPanel'
import AccountSettingsModal from '../AccountSettingsModal'
import PwaInstallHelpModal from './PwaInstallHelpModal'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { studioFloatingRootClass } from '../../lib/studio-portal-classes'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotificationFeed,
} from '../../lib/notification-service'
import type { StudioNotification } from '../../types/notifications'
import { formatNotificationTime } from './studio-notification-utils'

interface StudioProfileMenuProps {
  roleLabel: string
  portal: 'student' | 'studio'
  showSignOut?: boolean
  /** Embed recent notifications in the account menu (sidebar + mobile). */
  includeNotifications?: boolean
  placement?: 'sidebar' | 'mobile' | 'topbar'
  collapsed?: boolean
}

export default function StudioProfileMenu({
  roleLabel,
  portal,
  showSignOut = true,
  includeNotifications = false,
  placement = 'topbar',
  collapsed = false,
}: StudioProfileMenuProps) {
  const { user, userProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pwaHelpOpen, setPwaHelpOpen] = useState(false)
  const { showInstallOption, install } = usePwaInstall()
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<StudioNotification[]>([])

  const floatingPlacement = placement === 'topbar' ? 'inline' : placement
  const panelWidth = includeNotifications ? 300 : 220
  const panelMaxHeight = includeNotifications ? 480 : 300

  const { anchorRef, panelRef, panelStyle, usePortal } = useStudioFloatingPanel({
    open: isOpen,
    placement: floatingPlacement,
    onClose: () => setIsOpen(false),
    panelWidth,
    panelMaxHeight,
  })

  const refreshNotifications = async () => {
    if (!user?.id || !includeNotifications) return
    const [count, list] = await Promise.all([
      fetchUnreadNotificationCount(user.id),
      fetchNotifications(user.id, 8),
    ])
    setUnread(count)
    setNotifications(list)
  }

  useEffect(() => {
    if (!user?.id || !includeNotifications) return
    refreshNotifications()
    return subscribeToNotificationFeed(user.id, refreshNotifications)
  }, [user?.id, includeNotifications])

  useEffect(() => {
    if (isOpen && includeNotifications) refreshNotifications()
  }, [isOpen, includeNotifications])

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

  const handleAddToHomeScreen = async () => {
    setIsOpen(false)
    const outcome = await install()
    if (outcome === 'ios') setPwaHelpOpen(true)
  }

  const handleOpenNotification = async (n: StudioNotification) => {
    if (!n.read_at) await markNotificationRead(n.id)
    setIsOpen(false)
    if (n.action_url) navigate(n.action_url)
    refreshNotifications()
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    await markAllNotificationsRead(user.id)
    refreshNotifications()
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
          ? `${floatingRoot} studio-profile-menu__dropdown studio-profile-menu__dropdown--portal${
              includeNotifications ? ' studio-profile-menu__dropdown--account' : ''
            }`
          : `studio-profile-menu__dropdown${
              includeNotifications ? ' studio-profile-menu__dropdown--account' : ''
            }`
      }
      style={usePortal ? panelStyle : undefined}
      role="menu"
    >
      {includeNotifications ? (
        <div className="studio-account-menu__notifications" role="presentation">
          <div className="studio-notify-bell__head">
            <span>Updates</span>
            {unread > 0 ? (
              <button type="button" className="studio-notify-bell__mark" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="studio-notify-bell__list studio-account-menu__notify-list">
            {notifications.length === 0 ? (
              <li className="studio-notify-bell__empty">You&apos;re all caught up.</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`studio-notify-bell__item${n.read_at ? '' : ' studio-notify-bell__item--unread'}`}
                    onClick={() => handleOpenNotification(n)}
                  >
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                    <time>{formatNotificationTime(n.created_at)}</time>
                  </button>
                </li>
              ))
            )}
          </ul>
          <Link
            to={portal === 'student' ? '/student/messages' : '/studio/messages'}
            className="studio-notify-bell__footer"
            onClick={() => setIsOpen(false)}
          >
            Open messages
          </Link>
        </div>
      ) : null}

      <div className="studio-account-menu__actions" role="group" aria-label="Account options">
        <button type="button" role="menuitem" onClick={() => { setIsOpen(false); setIsModalOpen(true) }}>
          <i className="bi bi-pencil" /> Edit account
        </button>
        {showInstallOption ? (
          <button type="button" role="menuitem" onClick={handleAddToHomeScreen}>
            <i className="bi bi-box-arrow-down" /> Add to home screen
          </button>
        ) : null}
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
    </div>
  ) : null

  return (
    <div className={`studio-profile-menu${placementClass}`} ref={anchorRef}>
      <button
        type="button"
        className={`studio-profile studio-profile--clickable${collapsed ? ' studio-profile--compact' : ''}${
          placement === 'sidebar' ? ' studio-profile--sidebar' : ''
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={
          collapsed
            ? `${displayName}, ${roleLabel}${unread > 0 ? `, ${unread} unread notifications` : ''}`
            : undefined
        }
      >
        <div className="studio-avatar studio-avatar--lg">
          {userProfile.avatar_url ? (
            <img src={userProfile.avatar_url} alt="" />
          ) : (
            initials
          )}
          {includeNotifications && unread > 0 ? (
            <span className="studio-avatar__notify-badge" aria-hidden="true">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </div>
        {!collapsed ? (
          <>
            <div className="studio-profile__text">
              <div className="studio-profile__name">{displayName}</div>
              <div className="studio-profile__role">{roleLabel}</div>
            </div>
            <i
              className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}
              style={{ fontSize: '0.75rem', opacity: 0.6, flexShrink: 0 }}
            />
          </>
        ) : null}
      </button>

      {usePortal && dropdown ? createPortal(dropdown, document.body) : dropdown}

      <AccountSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <PwaInstallHelpModal isOpen={pwaHelpOpen} onClose={() => setPwaHelpOpen(false)} />
    </div>
  )
}
