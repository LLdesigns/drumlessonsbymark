import { useCallback, useEffect, useRef, useState } from 'react'
import { playNotationEvent, prepareMusicAudioForContent } from '../../../lib/music-notation-audio'
import {
  buildPlaybackEvents,
  totalDurationSec,
} from '../../../lib/music-notation'
import type { MusicNotationBlockContent } from '../../../types/lesson-planning'

/** Lead time so Web Audio can schedule notes before they sound */
const SCHEDULE_LOOKAHEAD_SEC = 0.05

interface UseMusicNotationPlaybackOptions {
  speedPercent?: number
  loop?: boolean
  onStarted?: () => void
}

export function useMusicNotationPlayback(
  content: MusicNotationBlockContent,
  options: UseMusicNotationPlaybackOptions = {}
) {
  const [playing, setPlaying] = useState(false)
  const [activeGlobalBeat, setActiveGlobalBeat] = useState<number | null>(null)
  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const contentRef = useRef(content)
  const optionsRef = useRef(options)
  contentRef.current = content
  optionsRef.current = options

  const clearAll = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    clearAll()
    setPlaying(false)
    setActiveGlobalBeat(null)
  }, [clearAll])

  const playRef = useRef<() => Promise<void>>(async () => {})

  playRef.current = async () => {
    clearAll()
    setActiveGlobalBeat(null)
    const c = contentRef.current
    const { speedPercent: sp = 100, loop: lp = false, onStarted: started } = optionsRef.current
    const ctx = await prepareMusicAudioForContent(c)
    const events = buildPlaybackEvents(c)
    const speed = sp / 100
    const duration = totalDurationSec(c) / speed
    const secPerBeat = 60 / c.tempo / speed
    const startAt = ctx.currentTime + SCHEDULE_LOOKAHEAD_SEC

    setPlaying(true)
    started?.()

    for (const event of events) {
      const when = startAt + event.timeSec / speed
      playNotationEvent(ctx, event, when, sp)
    }

    const syncCursor = () => {
      const elapsed = ctx.currentTime - startAt
      if (elapsed < 0) {
        rafRef.current = window.requestAnimationFrame(syncCursor)
        return
      }
      if (elapsed >= duration) {
        setActiveGlobalBeat(null)
        rafRef.current = null
        return
      }
      setActiveGlobalBeat(1 + elapsed / secPerBeat)
      rafRef.current = window.requestAnimationFrame(syncCursor)
    }
    rafRef.current = window.requestAnimationFrame(syncCursor)

    const endTimer = window.setTimeout(() => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (lp) void playRef.current()
      else stop()
    }, (SCHEDULE_LOOKAHEAD_SEC + Math.max(duration, 0.5)) * 1000 + 50)
    timersRef.current.push(endTimer)
  }

  const play = useCallback(async () => {
    await playRef.current()
  }, [])

  useEffect(() => () => stop(), [stop])

  useEffect(() => {
    if (playing) stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.tempo, content.timeSignature, JSON.stringify(content.notationData)])

  return {
    playing,
    activeGlobalBeat,
    play,
    stop,
    toggle: () => (playing ? stop() : void play()),
  }
}
