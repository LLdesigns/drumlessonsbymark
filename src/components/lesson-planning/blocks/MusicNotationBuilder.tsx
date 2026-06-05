import { useCallback, useMemo, useState } from 'react'
import {
  getTracks,
  instrumentLabel,
  MUSIC_KEY_SIGNATURES,
  MUSIC_NOTATION_INSTRUMENTS,
  MUSIC_TIME_SIGNATURES,
  normalizeMusicNotationContent,
  setTrackInstrument,
} from '../../../lib/music-notation'
import type { MusicNotationBlockContent } from '../../../types/lesson-planning'
import MusicNotationEditorModal from './MusicNotationEditorModal'
import MusicNotationStaffView from './MusicNotationStaffView'
import { useMusicNotationPlayback } from './useMusicNotationPlayback'

interface MusicNotationBuilderProps {
  content: MusicNotationBlockContent
  onChange: (content: MusicNotationBlockContent) => void
}

export default function MusicNotationBuilder({ content, onChange }: MusicNotationBuilderProps) {
  const notation = useMemo(() => normalizeMusicNotationContent(content), [content])
  const [editorOpen, setEditorOpen] = useState(false)
  const playback = useMusicNotationPlayback(notation)

  const update = useCallback(
    (next: MusicNotationBlockContent) => {
      onChange(next)
    },
    [onChange]
  )

  const patch = useCallback(
    (partial: Partial<MusicNotationBlockContent>) => update({ ...notation, ...partial }),
    [notation, update]
  )

  return (
    <div className="music-notation-builder">
      <div className="music-notation-builder__meta">
        <div className="lesson-builder__field">
          <label>Block title</label>
          <input
            value={notation.title ?? ''}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="e.g. Verse melody"
          />
        </div>

        <div className="music-notation-builder__row">
          <div className="lesson-builder__field">
            <label>Primary instrument</label>
            <select
              value={notation.instrument}
              onChange={(e) =>
                update(setTrackInstrument(notation, 0, e.target.value as MusicNotationBlockContent['instrument']))
              }
            >
              {MUSIC_NOTATION_INSTRUMENTS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="lesson-builder__field">
            <label>Tempo</label>
            <input
              type="number"
              min={40}
              max={240}
              value={notation.tempo}
              onChange={(e) => patch({ tempo: Math.min(240, Math.max(40, Number(e.target.value) || 90)) })}
            />
          </div>
          <div className="lesson-builder__field">
            <label>Time signature</label>
            <select
              value={notation.timeSignature}
              onChange={(e) => patch({ timeSignature: e.target.value as MusicNotationBlockContent['timeSignature'] })}
            >
              {MUSIC_TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
          </div>
          <div className="lesson-builder__field">
            <label>Key signature</label>
            <select
              value={notation.keySignature}
              onChange={(e) => patch({ keySignature: e.target.value as MusicNotationBlockContent['keySignature'] })}
            >
              {MUSIC_KEY_SIGNATURES.map((ks) => (
                <option key={ks} value={ks}>{ks}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="music-notation-builder__playback">
        <button
          type="button"
          className={`music-notation-builder__play${playback.playing ? ' is-playing' : ''}`}
          onClick={() => playback.toggle()}
        >
          <i className={`bi bi-${playback.playing ? 'stop-fill' : 'play-fill'}`} />
          {playback.playing ? 'Stop' : 'Play'}
        </button>
        <span className="music-notation-builder__playback-meta">
          {getTracks(notation).length > 1
            ? `${getTracks(notation).length} instruments · `
            : ''}
          {instrumentLabel(notation.instrument)} · {notation.tempo} BPM · {notation.timeSignature}
        </span>
      </div>

      <div className="music-notation-builder__preview">
        <MusicNotationStaffView
          content={notation}
          size="preview"
          activeGlobalBeat={playback.activeGlobalBeat}
        />
      </div>

      <button type="button" className="music-notation-builder__open-editor" onClick={() => setEditorOpen(true)}>
        <i className="bi bi-arrows-fullscreen" />
        Open Notation Editor
      </button>

      <div className="lesson-builder__field">
        <label>Caption / notes</label>
        <textarea
          value={notation.caption ?? ''}
          onChange={(e) => patch({ caption: e.target.value })}
          placeholder="Optional notes for the student"
          rows={2}
        />
      </div>

      {editorOpen ? (
        <MusicNotationEditorModal
          content={notation}
          onChange={update}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}
    </div>
  )
}
