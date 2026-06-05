import { useEffect, useMemo, useState } from 'react'
import { buildDrumNotationSvg } from '../../../lib/drum-notation-render'
import type { DrumNotationBlockContent, DrumPracticeSpeed } from '../../../types/lesson-planning'
import DrumNotationPlaybackBar from './DrumNotationPlaybackBar'
import { useDrumNotationPlayback } from './useDrumNotationPlayback'

interface DrumNotationViewProps {
  content: DrumNotationBlockContent
  /** preview = builder card; full = editor + student view */
  compact?: boolean
  className?: string
  showPlayback?: boolean
  activeStep?: number | null
  onPlaybackStarted?: () => void
}

export default function DrumNotationView({
  content,
  compact = false,
  className = '',
  showPlayback = false,
  activeStep: activeStepProp = null,
  onPlaybackStarted,
}: DrumNotationViewProps) {
  const [loop, setLoop] = useState(content.playback_loop ?? true)
  const [metronome, setMetronome] = useState(content.playback_metronome !== false)
  const [countIn, setCountIn] = useState<0 | 1 | 2>(content.playback_count_in ?? 1)
  const [speedPercent, setSpeedPercent] = useState<DrumPracticeSpeed>(100)

  useEffect(() => {
    setLoop(content.playback_loop ?? true)
  }, [content.playback_loop])

  useEffect(() => {
    setMetronome(content.playback_metronome !== false)
  }, [content.playback_metronome])

  useEffect(() => {
    setCountIn(content.playback_count_in ?? 1)
  }, [content.playback_count_in])

  const playback = useDrumNotationPlayback(content, {
    bpm: content.playback_bpm ?? 90,
    loop,
    metronome,
    countIn,
    speedPercent: showPlayback ? speedPercent : 100,
  })
  const activeStep = activeStepProp ?? (showPlayback ? playback.activeStep : null)
  const size = compact ? 'preview' : 'full'

  const { width, height, elements } = useMemo(
    () => buildDrumNotationSvg(content, { size, activeStep }),
    [content, size, activeStep]
  )

  return (
    <div
      className={`drum-notation-view drum-notation-view--${size} ${compact ? 'drum-notation-view--compact' : ''} ${className}`.trim()}
    >
      {showPlayback ? (
        <DrumNotationPlaybackBar
          bpm={content.playback_bpm ?? 90}
          loop={loop}
          playing={playback.playing}
          onTogglePlay={() => {
            if (playback.playing) {
              playback.stop()
            } else {
              onPlaybackStarted?.()
              void playback.play()
            }
          }}
          onLoopChange={setLoop}
          metronome={metronome}
          onMetronomeChange={setMetronome}
          countIn={countIn}
          onCountInChange={setCountIn}
          speedPercent={speedPercent}
          onSpeedChange={setSpeedPercent}
          showPracticeSpeed
          compact={compact}
        />
      ) : null}
      <div className="drum-notation-view__scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="drum-notation-view__svg"
          role="img"
          aria-label="Drum set notation"
          preserveAspectRatio="xMinYMin meet"
        >
          {elements}
        </svg>
      </div>
      {content.caption ? <p className="drum-notation-view__caption">{content.caption}</p> : null}
    </div>
  )
}
