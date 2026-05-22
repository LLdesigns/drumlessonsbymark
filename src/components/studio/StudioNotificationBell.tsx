import { useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import { Link, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/auth'

import { useStudioFloatingPanel } from '../../hooks/useStudioFloatingPanel'

import {

  fetchNotifications,

  fetchUnreadNotificationCount,

  markAllNotificationsRead,

  markNotificationRead,

  subscribeToNotificationFeed,

} from '../../lib/notification-service'

import type { StudioNotification } from '../../types/notifications'
import { studioFloatingRootClass } from '../../lib/studio-portal-classes'



function formatRelativeTime(iso: string): string {

  const diff = Date.now() - new Date(iso).getTime()

  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'Just now'

  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)

  if (hrs < 24) return `${hrs}h ago`

  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

}



interface StudioNotificationBellProps {

  portal: 'student' | 'studio'

  placement?: 'sidebar' | 'mobile' | 'topbar'

}



export default function StudioNotificationBell({ portal, placement = 'topbar' }: StudioNotificationBellProps) {

  const { user } = useAuthStore()

  const navigate = useNavigate()

  const [open, setOpen] = useState(false)

  const [unread, setUnread] = useState(0)

  const [items, setItems] = useState<StudioNotification[]>([])



  const floatingPlacement = placement === 'topbar' ? 'inline' : placement

  const { anchorRef, panelRef, panelStyle, usePortal } = useStudioFloatingPanel({

    open,

    placement: floatingPlacement,

    onClose: () => setOpen(false),

    panelWidth: 320,

    panelMaxHeight: 400,

  })



  const refresh = async () => {

    if (!user?.id) return

    const [count, list] = await Promise.all([

      fetchUnreadNotificationCount(user.id),

      fetchNotifications(user.id, 12),

    ])

    setUnread(count)

    setItems(list)

  }



  useEffect(() => {

    if (!user?.id) return

    refresh()

    return subscribeToNotificationFeed(user.id, refresh)

  }, [user?.id])



  const handleOpenItem = async (n: StudioNotification) => {

    if (!n.read_at) await markNotificationRead(n.id)

    setOpen(false)

    if (n.action_url) navigate(n.action_url)

    refresh()

  }



  const handleMarkAll = async () => {

    if (!user?.id) return

    await markAllNotificationsRead(user.id)

    refresh()

  }



  const placementClass =

    placement === 'sidebar'

      ? ' studio-notify-bell--sidebar'

      : placement === 'mobile'

        ? ' studio-notify-bell--mobile'

        : ''



  const floatingRoot = studioFloatingRootClass(portal)

  const panel = open ? (
    <div
      ref={panelRef}
      className={
        usePortal
          ? `${floatingRoot} studio-notify-bell__panel studio-notify-bell__panel--portal`
          : 'studio-notify-bell__panel'
      }
      style={usePortal ? panelStyle : undefined}
    >

      <div className="studio-notify-bell__head">

        <span>Updates</span>

        {unread > 0 ? (

          <button type="button" className="studio-notify-bell__mark" onClick={handleMarkAll}>

            Mark all read

          </button>

        ) : null}

      </div>

      <ul className="studio-notify-bell__list">

        {items.length === 0 ? (

          <li className="studio-notify-bell__empty">You&apos;re all caught up.</li>

        ) : (

          items.map((n) => (

            <li key={n.id}>

              <button

                type="button"

                className={`studio-notify-bell__item${n.read_at ? '' : ' studio-notify-bell__item--unread'}`}

                onClick={() => handleOpenItem(n)}

              >

                <strong>{n.title}</strong>

                <span>{n.body}</span>

                <time>{formatRelativeTime(n.created_at)}</time>

              </button>

            </li>

          ))

        )}

      </ul>

      <Link

        to={portal === 'student' ? '/student/messages' : '/studio/messages'}

        className="studio-notify-bell__footer"

        onClick={() => setOpen(false)}

      >

        Open messages

      </Link>

    </div>

  ) : null



  return (

    <div className={`studio-notify-bell${placementClass}`} ref={anchorRef}>

      <button

        type="button"

        className="studio-notify-bell__btn"

        onClick={() => setOpen((prev) => !prev)}

        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}

        aria-expanded={open}

      >

        <i className="bi bi-bell" />

        {unread > 0 ? (

          <span className="studio-notify-bell__badge">{unread > 9 ? '9+' : unread}</span>

        ) : null}

      </button>



      {usePortal && panel ? createPortal(panel, document.body) : panel}

    </div>

  )

}


