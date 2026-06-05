import type { DrumPracticeSpeed } from '../../../types/lesson-planning'
import { DRUM_PRACTICE_SPEEDS } from '../../../types/lesson-planning'

interface DrumNotationPlaybackBarProps {
  bpm: number
  playing: boolean
  loop: boolean
  onTogglePlay: () => void
  onLoopChange?: (loop: boolean) => void
  onBpmChange?: (bpm: number) => void
  compact?: boolean
  metronome?: boolean
  onMetronomeChange?: (on: boolean) => void
  countIn?: 0 | 1 | 2
  onCountInChange?: (bars: 0 | 1 | 2) => void
  speedPercent?: DrumPracticeSpeed
  onSpeedChange?: (percent: DrumPracticeSpeed) => void
  showPracticeSpeed?: boolean
}

export default function DrumNotationPlaybackBar({
  bpm,
  playing,
  loop,
  onTogglePlay,
  onLoopChange,
  onBpmChange,
  compact = false,
  metronome = true,
  onMetronomeChange,
  countIn = 1,
  onCountInChange,
  speedPercent = 100,
  onSpeedChange,
  showPracticeSpeed = false,
}: DrumNotationPlaybackBarProps) {
  const effectiveBpm = Math.round(bpm * speedPercent / 100)

  return (
    <div className={`drum-notation-playback ${compact ? 'drum-notation-playback--compact' : ''}`}>
      <button
        type="button"
        className={`drum-notation-playback__play${playing ? ' is-playing' : ''}`}
        onClick={onTogglePlay}
        aria-label={playing ? 'Stop groove' : 'Play groove'}
      >
        <i className={`bi bi-${playing ? 'stop-fill' : 'play-fill'}`} />
        {playing ? 'Stop' : 'Play groove'}
      </button>

      <button
        type="button"
        className={`drum-notation-playback__loop${loop ? ' is-on' : ''}`}
        onClick={() => onLoopChange?.(!loop)}
        aria-pressed={loop}
        aria-label={loop ? 'Loop on — click to play once' : 'Loop off — click to repeat groove'}
      >
        <i className="bi bi-arrow-repeat" />
        Loop
      </button>

      {onMetronomeChange ? (
        <button
          type="button"
          className={`drum-notation-playback__toggle${metronome ? ' is-on' : ''}`}
          onClick={() => onMetronomeChange(!metronome)}
          aria-pressed={metronome}
          aria-label={metronome ? 'Metronome on' : 'Metronome off'}
        >
          <i className="bi bi-music-note-beamed" />
          Click
        </button>
      ) : null}

      {onCountInChange ? (
        <label className="drum-notation-playback__count-in">
          <span>Count-in</span>
          <select
            value={countIn}
            onChange={(e) => onCountInChange(Number(e.target.value) as 0 | 1 | 2)}
            aria-label="Count-in bars"
          >
            <option value={0}>Off</option>
            <option value={1}>1 bar</option>
            <option value={2}>2 bars</option>
          </select>
        </label>
      ) : null}

      {showPracticeSpeed && onSpeedChange ? (
        <label className="drum-notation-playback__speed">
          <span>Practice speed</span>
          <select
            value={speedPercent}
            onChange={(e) => onSpeedChange(Number(e.target.value) as DrumPracticeSpeed)}
            aria-label="Practice speed"
          >
            {DRUM_PRACTICE_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}%
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="drum-notation-playback__bpm">
        <span>{showPracticeSpeed && speedPercent !== 100 ? 'Target BPM' : 'BPM'}</span>
        <input
          type="number"
          min={40}
          max={240}
          value={bpm}
          readOnly={!onBpmChange}
          disabled={playing && !onBpmChange}
          onChange={(e) => onBpmChange?.(Math.min(240, Math.max(40, Number(e.target.value) || 90)))}
        />
      </label>

      {showPracticeSpeed && speedPercent !== 100 ? (
        <span className="drum-notation-playback__effective-bpm" aria-live="polite">
          Playing at <strong>{effectiveBpm}</strong> BPM
        </span>
      ) : null}

      {!compact ? (
        <p className="drum-notation-playback__hint">
          {showPracticeSpeed
            ? `Teacher tempo ${bpm} BPM — choose a practice speed that fits you`
            : loop
              ? 'Loop on — groove repeats until you press Stop'
              : 'Loop off — plays through once · drag across cells to paint notes'}
        </p>
      ) : null}
    </div>
  )
}
