import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

export type StudioFloatingPlacement = 'sidebar' | 'mobile' | 'inline'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function measurePosition(
  anchor: HTMLElement,
  placement: StudioFloatingPlacement,
  panelWidth: number,
  panelMaxHeight: number
): CSSProperties {
  const rect = anchor.getBoundingClientRect()
  const gap = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (placement === 'sidebar') {
    let left = rect.right + gap
    let top = rect.top
    if (left + panelWidth > vw - gap) {
      left = rect.left - panelWidth - gap
    }
    top = clamp(top, gap, vh - panelMaxHeight - gap)
    return {
      position: 'fixed',
      top,
      left,
      width: panelWidth,
      maxHeight: panelMaxHeight,
      zIndex: 10000,
      overflow: 'hidden',
    }
  }

  if (placement === 'mobile') {
    const width = panelWidth
    let left = clamp(rect.right - width, gap, vw - width - gap)
    let top = rect.bottom + gap
    if (top + panelMaxHeight > vh - gap) {
      top = rect.top - panelMaxHeight - gap
    }
    top = clamp(top, gap, vh - panelMaxHeight - gap)
    return {
      position: 'fixed',
      top,
      left,
      width,
      maxHeight: panelMaxHeight,
      zIndex: 10000,
      overflow: 'hidden',
    }
  }

  return {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    minWidth: panelWidth,
    zIndex: 10000,
  }
}

interface UseStudioFloatingPanelOptions {
  open: boolean
  placement: StudioFloatingPlacement
  onClose: () => void
  panelWidth?: number
  panelMaxHeight?: number
}

export function useStudioFloatingPanel({
  open,
  placement,
  onClose,
  panelWidth = 220,
  panelMaxHeight = 320,
}: UseStudioFloatingPanelOptions) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const usePortal = placement !== 'inline'

  const updatePosition = useCallback(() => {
    if (!open || !anchorRef.current) return
    setPanelStyle(measurePosition(anchorRef.current, placement, panelWidth, panelMaxHeight))
  }, [open, placement, panelWidth, panelMaxHeight])

  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, onClose])

  return { anchorRef, panelRef, panelStyle, usePortal }
}
