import { useEffect } from 'react'

/** Prevent background scroll while a modal is open */
export function useModalBodyLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])
}
