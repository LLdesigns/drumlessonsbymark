import { useMemo, useState } from 'react'
import { instrumentLabel, getTracks, normalizeMusicNotationContent } from '../../../lib/music-notation'
import type { MusicNotationBlockContent, MusicPracticeSpeed } from '../../../types/lesson-planning'
import { MUSIC_PRACTICE_SPEEDS } from '../../../types/lesson-planning'
import MusicNotationStaffView from './MusicNotationStaffView'
import { useMusicNotationPlayback } from './useMusicNotationPlayback'

interface MusicNotationStudentViewProps {
  content: MusicNotationBlockContent
  showPlayback?: boolean
  showTitle?: boolean
  showSheetTitle?: boolean
  onPlaybackStarted?: () => void
}

export default function MusicNotationStudentView({
  content,
  showPlayback = false,
  showTitle = true,
  showSheetTitle = true,
  onPlaybackStarted,
}: MusicNotationStudentViewProps) {
  const notation = useMemo(() => normalizeMusicNotationContent(content), [content])
  const [speedPercent, setSpeedPercent] = useState<MusicPracticeSpeed>(100)
  const [loop, setLoop] = useState(notation.playback_loop ?? false)

  const playback = useMusicNotationPlayback(notation, {
    speedPercent,
    loop,
    onStarted: onPlaybackStarted,
  })

  const effectiveBpm = Math.round((notation.tempo * speedPercent) / 100)
  const title = notation.title?.trim() || 'Notation'

  return (
    <div className="music-notation-student">
      {showTitle ? <h4 className="music-notation-student__title">{title}</h4> : null}

      {showPlayback ? (
        <div className="music-notation-student__controls">
          <button
            type="button"
            className={`music-notation-student__play${playback.playing ? ' is-playing' : ''}`}
            onClick={() => playback.toggle()}
          >
            <i className={`bi bi-${playback.playing ? 'stop-fill' : 'play-fill'}`} />
            {playback.playing ? 'Stop' : 'Play'}
          </button>

          <span className="music-notation-student__tempo">
            {speedPercent !== 100 ? (
              <>
                Playing at <strong>{effectiveBpm}</strong> BPM
              </>
            ) : (
              <>
                <strong>{notation.tempo}</strong> BPM
              </>
            )}
          </span>

          <label className="music-notation-student__speed">
            <span>Practice speed</span>
            <select
              value={speedPercent}
              onChange={(e) => setSpeedPercent(Number(e.target.value) as MusicPracticeSpeed)}
            >
              {MUSIC_PRACTICE_SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}%
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`music-notation-student__loop${loop ? ' is-on' : ''}`}
            onClick={() => setLoop((l) => !l)}
            aria-pressed={loop}
          >
            <i className="bi bi-arrow-repeat" /> Loop
          </button>
        </div>
      ) : null}

      <div className="music-notation-student__meta">
        {getTracks(notation).map((t) => (
          <span key={t.id}>{t.name || instrumentLabel(t.instrument)}</span>
        ))}
        <span>{notation.timeSignature}</span>
        <span>{notation.keySignature}</span>
        <span>{notation.tempo} BPM</span>
      </div>

      <div className="music-notation-student__staff-scroll">
        <MusicNotationStaffView
          content={notation}
          size="full"
          showSheetTitle={showSheetTitle}
          activeGlobalBeat={playback.activeGlobalBeat}
        />
      </div>

      {notation.caption ? (
        <p className="music-notation-student__caption">{notation.caption}</p>
      ) : null}
    </div>
  )
}
