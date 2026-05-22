import { useCallback, useEffect, useState } from 'react'

const MOBILE_MQ = '(max-width: 900px)'

export function useLessonBuilderDrawers() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 901px)').matches : true
  )
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
        setInspectorOpen(true)
      } else {
        setInspectorOpen(false)
        setSidebarOpen(false)
      }
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const closeAll = useCallback(() => {
    setSidebarOpen(false)
    setInspectorOpen(false)
  }, [])

  const openSidebar = useCallback(() => {
    setInspectorOpen(false)
    setSidebarOpen(true)
  }, [])

  const openInspector = useCallback(() => {
    setSidebarOpen(false)
    setInspectorOpen(true)
  }, [])

  const anyOpen = sidebarOpen || inspectorOpen

  useEffect(() => {
    if (!isMobile || !anyOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, anyOpen, closeAll])

  useEffect(() => {
    if (!isMobile || !anyOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, anyOpen])

  return {
    sidebarOpen,
    inspectorOpen,
    isMobile,
    anyOpen,
    closeAll,
    openSidebar,
    openInspector,
    setInspectorOpen,
  }
}
