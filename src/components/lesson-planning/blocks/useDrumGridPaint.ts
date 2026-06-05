import { useCallback, useEffect, useRef } from 'react'
import type { DrumHit, DrumNotationMeasure, DrumVoiceId } from '../../../types/lesson-planning'

interface PaintSession {
  active: boolean
  measureIndex: number
  voice: DrumVoiceId
  erase: boolean
  suppressClick: boolean
  lastKey: string
}

function cellKey(measureIndex: number, stepIndex: number, voice: DrumVoiceId): string {
  return `${measureIndex}:${stepIndex}:${voice}`
}

function applyCellHit(
  measures: DrumNotationMeasure[],
  measureIndex: number,
  stepIndex: number,
  voice: DrumVoiceId,
  hit: DrumHit | undefined
): DrumNotationMeasure[] {
  return measures.map((m, mi) => {
    if (mi !== measureIndex) return m
    return {
      ...m,
      steps: m.steps.map((step, si) => {
        if (si !== stepIndex) return step
        const next = { ...step }
        if (hit) next[voice] = hit
        else delete next[voice]
        return next
      }),
    }
  })
}

interface UseDrumGridPaintOptions {
  measures: DrumNotationMeasure[]
  onMeasuresChange: (measures: DrumNotationMeasure[]) => void
}

export function useDrumGridPaint({ measures, onMeasuresChange }: UseDrumGridPaintOptions) {
  const measuresRef = useRef(measures)
  const paintRef = useRef<PaintSession>({
    active: false,
    measureIndex: 0,
    voice: 'snare',
    erase: false,
    suppressClick: false,
    lastKey: '',
  })

  useEffect(() => {
    measuresRef.current = measures
  }, [measures])

  const endPaint = useCallback(() => {
    paintRef.current.active = false
  }, [])

  useEffect(() => {
    const onPointerUp = () => endPaint()
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [endPaint])

  const paintCell = useCallback(
    (measureIndex: number, stepIndex: number, voice: DrumVoiceId) => {
      const session = paintRef.current
      if (!session.active) return

      const key = cellKey(measureIndex, stepIndex, voice)
      if (session.lastKey === key) return
      session.lastKey = key
      session.suppressClick = true

      const hit: DrumHit | undefined = session.erase ? undefined : true
      const next = applyCellHit(measuresRef.current, measureIndex, stepIndex, voice, hit)
      measuresRef.current = next
      onMeasuresChange(next)
    },
    [onMeasuresChange]
  )

  const startPaint = useCallback(
    (measureIndex: number, stepIndex: number, voice: DrumVoiceId, hasHit: boolean) => {
      paintRef.current = {
        active: true,
        measureIndex,
        voice,
        erase: hasHit,
        suppressClick: false,
        lastKey: cellKey(measureIndex, stepIndex, voice),
      }
      paintCell(measureIndex, stepIndex, voice)
    },
    [paintCell]
  )

  const shouldSuppressClick = useCallback(() => {
    const suppress = paintRef.current.suppressClick
    paintRef.current.suppressClick = false
    return suppress
  }, [])

  return { startPaint, paintCell, shouldSuppressClick, isPainting: () => paintRef.current.active }
}

export { applyCellHit }
