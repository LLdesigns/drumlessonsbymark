import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureDrumAudio,
  playNotationSequence,
  previewDrumVoice,
} from '../../../lib/drum-notation-audio'
import type { DrumNotationBlockContent, DrumPracticeSpeed, DrumVoiceId } from '../../../types/lesson-planning'

export interface DrumNotationPlaybackConfig {
  bpm?: number
  loop?: boolean
  metronome?: boolean
  countIn?: 0 | 1 | 2
  speedPercent?: DrumPracticeSpeed
}

export function useDrumNotationPlayback(
  content: DrumNotationBlockContent,
  config: DrumNotationPlaybackConfig = {}
) {
  const [playing, setPlaying] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const playbackBpm = config.bpm ?? content.playback_bpm ?? 90
  const playbackLoop = config.loop ?? content.playback_loop ?? true
  const playbackMetronome = config.metronome ?? content.playback_metronome !== false
  const playbackCountIn = config.countIn ?? content.playback_count_in ?? 1
  const speedPercent = config.speedPercent ?? 100

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPlaying(false)
    setActiveStep(null)
  }, [])

  useEffect(() => () => stop(), [stop])

  const play = useCallback(async () => {
    await ensureDrumAudio()
    stop()
    const controller = new AbortController()
    abortRef.current = controller
    setPlaying(true)
    try {
      await playNotationSequence(content, {
        bpm: playbackBpm,
        speedPercent,
        loop: playbackLoop,
        metronome: playbackMetronome,
        countInBars: playbackCountIn,
        signal: controller.signal,
        onStep: setActiveStep,
      })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) throw err
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setPlaying(false)
        setActiveStep(null)
      }
    }
  }, [
    content,
    playbackBpm,
    playbackLoop,
    playbackMetronome,
    playbackCountIn,
    speedPercent,
    stop,
  ])

  const previewVoice = useCallback(async (voice: DrumVoiceId) => {
    await previewDrumVoice(voice)
  }, [])

  const effectiveBpm = Math.round(playbackBpm * speedPercent / 100)

  return {
    playing,
    activeStep,
    playbackBpm,
    effectiveBpm,
    playbackLoop,
    playbackMetronome,
    playbackCountIn,
    speedPercent,
    play,
    stop,
    previewVoice,
  }
}
