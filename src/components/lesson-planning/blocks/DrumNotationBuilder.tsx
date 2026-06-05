import { useMemo, useRef, useState } from 'react'
import { ensureDrumAudio, playDrumVoice } from '../../../lib/drum-notation-audio'
import {
  beatLabel,
  cloneMeasure,
  cycleHit,
  DRUM_GROOVE_PRESETS,
  DRUM_VOICES,
  duplicateMeasureAt,
  globalStepIndex,
  insertMeasureAt,
  newMeasure,
  normalizeDrumNotationContent,
  resizeMeasures,
  stepsInMeasure,
} from '../../../lib/drum-notation'
import type { DrumHit, DrumNotationBlockContent, DrumNotationMeasure, DrumVoiceId } from '../../../types/lesson-planning'
import DrumNotationPlaybackBar from './DrumNotationPlaybackBar'
import DrumNotationView from './DrumNotationView'
import { useDrumGridPaint } from './useDrumGridPaint'
import { useDrumNotationPlayback } from './useDrumNotationPlayback'

interface DrumNotationBuilderProps {
  content: DrumNotationBlockContent
  onChange: (content: DrumNotationBlockContent) => void
}

function hitClass(_voice: DrumVoiceId, hit?: DrumHit): string {
  if (!hit) return ''
  if (hit === 'accent') return 'is-accent'
  if (hit === 'open') return 'is-open'
  if (hit === 'ghost') return 'is-ghost'
  return 'is-on'
}

export default function DrumNotationBuilder({ content, onChange }: DrumNotationBuilderProps) {
  const notation = useMemo(() => normalizeDrumNotationContent(content), [content])
  const {
    beats_per_measure: beats,
    steps_per_beat: spb,
    playback_bpm: bpm = 90,
    playback_loop: loop = true,
    playback_metronome: metronome = true,
    playback_count_in: countIn = 1,
  } = notation
  const stepCount = stepsInMeasure(beats, spb)
  const [copiedBar, setCopiedBar] = useState<DrumNotationMeasure | null>(null)
  const pasteAfterRef = useRef<number | null>(null)
  const [painting, setPainting] = useState(false)

  const { playing, activeStep, play, stop, previewVoice } = useDrumNotationPlayback(notation, {
    bpm,
    loop,
    metronome,
    countIn,
  })

  const update = (patch: Partial<DrumNotationBlockContent>) => {
    onChange({ ...notation, ...patch })
  }

  const updateMeasures = (measures: DrumNotationMeasure[]) => update({ measures })

  const { startPaint, paintCell, shouldSuppressClick } = useDrumGridPaint({
    measures: notation.measures,
    onMeasuresChange: updateMeasures,
  })

  const toggleCell = async (measureIndex: number, stepIndex: number, voice: DrumVoiceId) => {
    if (shouldSuppressClick()) return

    let previewHit: DrumHit | undefined
    const measures = notation.measures.map((m, mi) => {
      if (mi !== measureIndex) return m
      const steps = m.steps.map((step, si) => {
        if (si !== stepIndex) return step
        const next = { ...step }
        const cycled = cycleHit(voice, step[voice])
        if (cycled) {
          next[voice] = cycled
          previewHit = cycled
        } else {
          delete next[voice]
        }
        return next
      })
      return { ...m, steps }
    })
    updateMeasures(measures)
    if (previewHit) {
      await ensureDrumAudio()
      playDrumVoice(voice, previewHit)
    }
  }

  const applyPreset = (presetId: string) => {
    const preset = DRUM_GROOVE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    updateMeasures(preset.build(beats, spb))
  }

  const addMeasure = () => updateMeasures([...notation.measures, newMeasure(beats, spb)])

  const duplicateBar = (index: number) => {
    updateMeasures(duplicateMeasureAt(notation.measures, index))
  }

  const copyBar = (index: number) => {
    setCopiedBar(cloneMeasure(notation.measures[index]))
    pasteAfterRef.current = index
  }

  const pasteBar = () => {
    if (!copiedBar) return
    const after = pasteAfterRef.current ?? notation.measures.length - 1
    updateMeasures(insertMeasureAt(notation.measures, after, cloneMeasure(copiedBar)))
  }

  const removeMeasure = (index: number) => {
    if (notation.measures.length <= 1) return
    updateMeasures(notation.measures.filter((_, i) => i !== index))
  }

  const clearMeasure = (index: number) => {
    updateMeasures(notation.measures.map((m, i) => (i === index ? newMeasure(beats, spb) : m)))
  }

  const setBeats = (nextBeats: number) => {
    onChange(resizeMeasures(notation, nextBeats, spb))
  }

  const setSubdivision = (nextSpb: 2 | 4) => {
    onChange(resizeMeasures(notation, beats, nextSpb))
  }

  const handlePointerDown = (
    measureIndex: number,
    stepIndex: number,
    voice: DrumVoiceId,
    hasHit: boolean
  ) => {
    setPainting(true)
    startPaint(measureIndex, stepIndex, voice, hasHit)
  }

  const handlePointerEnter = (measureIndex: number, stepIndex: number, voice: DrumVoiceId) => {
    paintCell(measureIndex, stepIndex, voice)
  }

  const handlePointerUp = () => {
    setPainting(false)
  }

  return (
    <div className={`block-notation${painting ? ' is-painting' : ''}`}>
      <div className="block-notation__toolbar">
        <div className="block-notation__toolbar-group">
          <label className="block-notation__toolbar-label">Time</label>
          <select value={beats} onChange={(e) => setBeats(Number(e.target.value))} aria-label="Beats per measure">
            <option value={3}>3/4</option>
            <option value={4}>4/4</option>
          </select>
        </div>
        <div className="block-notation__toolbar-group">
          <label className="block-notation__toolbar-label">Grid</label>
          <select
            value={spb}
            onChange={(e) => setSubdivision(Number(e.target.value) as 2 | 4)}
            aria-label="Subdivision"
          >
            <option value={2}>8th notes</option>
            <option value={4}>16th notes</option>
          </select>
        </div>
        <div className="block-notation__toolbar-group block-notation__toolbar-group--grow">
          <label className="block-notation__toolbar-label">Presets</label>
          <div className="block-notation__presets">
            {DRUM_GROOVE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="block-notation__preset-btn"
                title={preset.description}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        {copiedBar ? (
          <button type="button" className="block-notation__paste-bar" onClick={pasteBar}>
            <i className="bi bi-clipboard-check" /> Paste bar
          </button>
        ) : null}
        <button type="button" className="block-notation__add-measure" onClick={addMeasure}>
          <i className="bi bi-plus-lg" /> Add bar
        </button>
      </div>

      <DrumNotationPlaybackBar
        bpm={bpm}
        loop={loop}
        playing={playing}
        onTogglePlay={() => void (playing ? stop() : play())}
        onBpmChange={(next) => update({ playback_bpm: next })}
        onLoopChange={(next) => update({ playback_loop: next })}
        metronome={metronome}
        onMetronomeChange={(next) => update({ playback_metronome: next })}
        countIn={countIn}
        onCountInChange={(next) => update({ playback_count_in: next })}
      />

      <p className="block-notation__help">
        Click cells to cycle hits (snare: hit → accent → ghost). Drag across cells to paint or erase.
        Copy / duplicate bars to build fills faster. Metronome click and count-in apply during playback.
      </p>

      <div className="block-notation__grid-wrap">
        {notation.measures.map((measure, mi) => (
          <div key={measure.id} className="block-notation__measure">
            <div className="block-notation__measure-head">
              <span>Bar {mi + 1}</span>
              <div className="block-notation__measure-actions">
                <button type="button" title="Copy bar" aria-label="Copy bar" onClick={() => copyBar(mi)}>
                  <i className="bi bi-clipboard" />
                </button>
                <button type="button" title="Duplicate bar" aria-label="Duplicate bar" onClick={() => duplicateBar(mi)}>
                  <i className="bi bi-copy" />
                </button>
                <button type="button" title="Clear bar" aria-label="Clear bar" onClick={() => clearMeasure(mi)}>
                  <i className="bi bi-eraser" />
                </button>
                {notation.measures.length > 1 ? (
                  <button type="button" title="Remove bar" aria-label="Remove bar" onClick={() => removeMeasure(mi)}>
                    <i className="bi bi-trash" />
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="block-notation__grid"
              style={{ gridTemplateColumns: `5.25rem repeat(${stepCount}, minmax(1.45rem, 1fr))` }}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div className="block-notation__corner" />
              {Array.from({ length: stepCount }, (_, si) => (
                <div key={si} className="block-notation__col-label">
                  {beatLabel(si, spb)}
                </div>
              ))}

              {DRUM_VOICES.map((voice) => (
                <div key={voice.id} className="block-notation__row">
                  <div className="block-notation__row-label">
                    <button
                      type="button"
                      className="block-notation__row-preview"
                      title={`Preview ${voice.label}`}
                      aria-label={`Preview ${voice.label}`}
                      onClick={() => void previewVoice(voice.id)}
                    >
                      <i className="bi bi-volume-up" />
                    </button>
                    <span>{voice.short}</span>
                  </div>
                  {measure.steps.map((step, si) => {
                    const hit = step[voice.id]
                    const beatBoundary = si % spb === 0
                    const gStep = globalStepIndex(mi, si, stepCount)
                    const isActive = playing && activeStep === gStep
                    return (
                      <button
                        key={`${voice.id}-${si}`}
                        type="button"
                        className={`block-notation__cell block-notation__cell--${voice.id} ${hitClass(voice.id, hit)}${beatBoundary ? ' is-beat-start' : ''}${isActive ? ' is-step-active' : ''}`}
                        aria-label={`${voice.label} step ${si + 1}${hit ? ` (${String(hit)})` : ''}`}
                        aria-pressed={!!hit}
                        onPointerDown={(e) => {
                          e.preventDefault()
                          handlePointerDown(mi, si, voice.id, !!hit)
                        }}
                        onPointerEnter={() => handlePointerEnter(mi, si, voice.id)}
                        onClick={() => void toggleCell(mi, si, voice.id)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="block-notation__preview">
        <label className="block-notation__preview-label">Staff preview</label>
        <DrumNotationView content={notation} activeStep={playing ? activeStep : null} />
      </div>

      <div className="lesson-builder__field" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
        <label>Caption (optional)</label>
        <input
          value={notation.caption ?? ''}
          onChange={(e) => update({ caption: e.target.value })}
          placeholder="e.g. Play this groove with a relaxed grip"
        />
      </div>
    </div>
  )
}
