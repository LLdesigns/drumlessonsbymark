import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  addMeasure,
  addTrack,
  beatsPerMeasure,
  clearMeasure,
  deleteMeasure,
  deleteNote,
  deleteNotes,
  duplicateMeasure,
  DURATION_TOOLS,
  findNote,
  getAllNoteIds,
  getMeasuresPerSystem,
  getPrimaryTrack,
  getTracks,
  instrumentLabel,
  isDrumsInstrument,
  MEASURES_PER_SYSTEM_OPTIONS,
  moveNote,
  moveNoteGroup,
  MUSIC_DRUM_VOICES,
  MUSIC_KEY_SIGNATURES,
  MUSIC_NOTATION_DURATIONS,
  MUSIC_NOTATION_INSTRUMENTS,
  MUSIC_NOTATION_PITCHES,
  MUSIC_TIME_SIGNATURES,
  normalizeMusicNotationContent,
  removeTrack,
  setMeasuresPerSystem,
  setTrackInstrument,
  snapStartBeat,
  upsertNote,
  type MusicNotationEditorTool,
} from '../../../lib/music-notation'
import {
  collectNoteLayoutPositions,
  hitTestScore,
  isPitchedTrack,
  normalizeSelectionRect,
  noteIdsInRect,
  resolveDropAt,
  staffDimensions,
  staffLineYs,
  staffYToDrumVoice,
  staffYToPitch,
  xToMeasureAndBeat,
} from '../../../lib/music-notation-staff'
import { signaturePrefixWidth } from '../../../lib/music-notation-key-sig'
import type {
  MusicNotationBlockContent,
  MusicNotationDuration,
  MusicNotationDrumVoice,
  MusicNotationInstrument,
  MusicNotationNote,
  MusicNotationPitch,
} from '../../../types/lesson-planning'
import MusicNotationStaffView, { type NoteDragPreview, type NoteSelectEvent, type SelectionRect } from './MusicNotationStaffView'
import { useMusicNotationPlayback } from './useMusicNotationPlayback'

interface MusicNotationEditorModalProps {
  content: MusicNotationBlockContent
  onChange: (content: MusicNotationBlockContent) => void
  onClose: () => void
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

function toolToDuration(tool: MusicNotationEditorTool): MusicNotationDuration | null {
  if (tool === 'select' || tool === 'rest') return null
  return tool as MusicNotationDuration
}

const DRAG_THRESHOLD_PX = 4
const MARQUEE_THRESHOLD_PX = 4

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function toggleNoteInSelection(ids: string[], noteId: string): string[] {
  return ids.includes(noteId) ? ids.filter((id) => id !== noteId) : [...ids, noteId]
}

export default function MusicNotationEditorModal({
  content,
  onChange,
  onClose,
}: MusicNotationEditorModalProps) {
  const initial = useMemo(() => normalizeMusicNotationContent(content), [content])
  const [draft, setDraft] = useState(initial)
  const [activeTool, setActiveTool] = useState<MusicNotationEditorTool>('quarter')
  const [restMode, setRestMode] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [activeTrackIndex, setActiveTrackIndex] = useState(0)
  const [activeMeasureIndex, setActiveMeasureIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<MusicNotationBlockContent[]>([])
  const [redoStack, setRedoStack] = useState<MusicNotationBlockContent[]>([])
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<NoteDragPreview | null>(null)
  const dragRef = useRef<{
    noteId: string
    trackIndex: number
    measureIndex: number
    startX: number
    startY: number
    active: boolean
    groupIds: string[]
  } | null>(null)
  const marqueeRef = useRef<{
    startX: number
    startY: number
    additive: boolean
    active: boolean
  } | null>(null)

  const playback = useMusicNotationPlayback(draft)
  const tracks = getTracks(draft)
  const track = tracks[activeTrackIndex] ?? getPrimaryTrack(draft)
  const measuresPerSystem = getMeasuresPerSystem(draft)

  useEffect(() => {
    setDraft(initial)
    setUndoStack([])
    setRedoStack([])
    setSelectedNoteIds([])
    setSelectionRect(null)
    setActiveTrackIndex(0)
  }, [initial])

  useEffect(() => {
    if (activeTrackIndex >= tracks.length) {
      setActiveTrackIndex(Math.max(0, tracks.length - 1))
    }
  }, [activeTrackIndex, tracks.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Escape') {
        if (selectedNoteIds.length > 0) {
          e.preventDefault()
          setSelectedNoteIds([])
          setSelectionRect(null)
          return
        }
        onClose()
        return
      }

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
        return
      }

      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
        return
      }

      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setSelectedNoteIds(getAllNoteIds(draft))
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIds.length > 0) {
          e.preventDefault()
          applyDraft(deleteNotes(draft, selectedNoteIds))
          setSelectedNoteIds([])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    document.body.classList.add('music-notation-editor-open')
    return () => document.body.classList.remove('music-notation-editor-open')
  }, [])

  const applyDraft = useCallback((next: MusicNotationBlockContent) => {
    setUndoStack((stack) => [...stack.slice(-19), draft])
    setRedoStack([])
    setDraft(next)
  }, [draft])

  const patchDraft = useCallback(
    (patch: Partial<MusicNotationBlockContent>) => applyDraft({ ...draft, ...patch }),
    [draft, applyDraft]
  )

  const handleUndo = () => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const prev = stack[stack.length - 1]
      setRedoStack((r) => [...r, draft])
      setDraft(prev)
      return stack.slice(0, -1)
    })
  }

  const handleRedo = () => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack
      const next = stack[stack.length - 1]
      setUndoStack((u) => [...u, draft])
      setDraft(next)
      return stack.slice(0, -1)
    })
  }

  const handleSave = () => {
    onChange(draft)
    onClose()
  }

  const activeDuration = toolToDuration(activeTool) ?? 'quarter'
  const beatsInMeasure = beatsPerMeasure(draft.timeSignature)
  const primarySelectedId = selectedNoteIds[selectedNoteIds.length - 1] ?? null
  const selected = primarySelectedId ? findNote(draft, primarySelectedId) : null
  const measureCount = track.measures.length
  const selectToolActive = activeTool === 'select'

  const handleNoteSelect = (noteId: string, event: NoteSelectEvent) => {
    const toggle = event.ctrlKey || event.metaKey
    if (toggle) {
      setSelectedNoteIds((ids) => toggleNoteInSelection(ids, noteId))
    } else if (event.shiftKey) {
      setSelectedNoteIds((ids) => (ids.includes(noteId) ? ids : [...ids, noteId]))
    } else {
      setSelectedNoteIds([noteId])
    }
    setActiveTool('select')
    setRestMode(false)
    const found = findNote(draft, noteId)
    if (found) {
      setActiveMeasureIndex(found.measureIndex)
      setActiveTrackIndex(found.trackIndex)
    }
  }

  const handleMarqueePointerDown = (event: ReactPointerEvent<SVGElement>, svg: SVGSVGElement) => {
    if (!selectToolActive) return
    const { x, y } = clientToSvg(svg, event.clientX, event.clientY)
    const additive = event.shiftKey || event.ctrlKey || event.metaKey
    marqueeRef.current = { startX: x, startY: y, additive, active: false }
    if (!additive) setSelectedNoteIds([])
    setSelectionRect({ x, y, width: 0, height: 0 })
    svg.setPointerCapture(event.pointerId)
  }

  const handleMarqueePointerMove = (event: ReactPointerEvent<SVGElement>) => {
    const marquee = marqueeRef.current
    if (!marquee) return
    const svg = event.currentTarget as SVGSVGElement
    const { x, y } = clientToSvg(svg, event.clientX, event.clientY)
    if (!marquee.active) {
      if (
        Math.abs(x - marquee.startX) < MARQUEE_THRESHOLD_PX &&
        Math.abs(y - marquee.startY) < MARQUEE_THRESHOLD_PX
      ) {
        return
      }
      marquee.active = true
    }
    setSelectionRect(normalizeSelectionRect(marquee.startX, marquee.startY, x, y))
  }

  const handleMarqueePointerUp = (event: ReactPointerEvent<SVGElement>) => {
    const marquee = marqueeRef.current
    marqueeRef.current = null
    const svg = event.currentTarget as SVGSVGElement
    try {
      svg.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }

    if (!marquee) {
      setSelectionRect(null)
      return
    }

    if (!marquee.active) {
      setSelectionRect(null)
      if (!marquee.additive) setSelectedNoteIds([])
      return
    }

    const { x, y } = clientToSvg(svg, event.clientX, event.clientY)
    const rect = normalizeSelectionRect(marquee.startX, marquee.startY, x, y)
    setSelectionRect(null)
    const score = staffDimensions(draft, 'full')
    const ids = noteIdsInRect(collectNoteLayoutPositions(draft, score), rect)
    setSelectedNoteIds((prev) => {
      if (marquee.additive) {
        const merged = new Set(prev)
        ids.forEach((id) => merged.add(id))
        return [...merged]
      }
      return ids
    })
  }

  const handleToolClick = (tool: MusicNotationEditorTool) => {
    if (tool === 'rest') {
      setRestMode((m) => !m)
      setActiveTool('rest')
      return
    }
    if (tool === 'select') {
      setActiveTool('select')
      setRestMode(false)
      return
    }
    setActiveTool(tool)
    setRestMode(false)
  }

  const handleStaffClick = (
    _trackIndex: number,
    _measureIndex: number,
    clientX: number,
    clientY: number,
    svg: SVGSVGElement
  ) => {
    if (activeTool === 'select') return

    const { x, y } = clientToSvg(svg, clientX, clientY)
    const score = staffDimensions(draft, 'full')
    const hit = hitTestScore(x, y, score)
    if (!hit) return

    const { trackIndex, system } = hit
    const activeTrack = tracks[trackIndex]
    if (!activeTrack) return

    const showTimeSig = hit.systemIndex === 0 && trackIndex === 0
    const prefixOffset = signaturePrefixWidth(draft.keySignature, activeTrack.clef, showTimeSig)
    const { measureIndex, beat } = xToMeasureAndBeat(
      x,
      system.startMeasure,
      system.measureCount,
      draft.timeSignature,
      score.layout,
      prefixOffset
    )
    const startBeat = snapStartBeat(beat, activeDuration, beatsInMeasure)

    setActiveTrackIndex(trackIndex)
    setActiveMeasureIndex(measureIndex)

    if (restMode || activeTool === 'rest') {
      applyDraft(
        upsertNote(draft, trackIndex, measureIndex, {
          type: 'rest',
          duration: activeDuration,
          startBeat,
        })
      )
      return
    }

    const yOffset =
      score.layout.titleHeight +
      hit.systemIndex * score.systemHeight +
      trackIndex * (score.trackRowHeight + score.layout.trackGap)
    const lineYs = staffLineYs(score.layout, yOffset)
    const pitched = isPitchedTrack(activeTrack.instrument)

    applyDraft(
      upsertNote(draft, trackIndex, measureIndex, {
        type: 'note',
        duration: activeDuration,
        startBeat,
        ...(pitched
          ? { pitch: staffYToPitch(y, lineYs, score.layout) }
          : { voice: staffYToDrumVoice(y, lineYs, score.layout) }),
      })
    )
  }

  const handleNoteDragStart = (
    event: ReactPointerEvent<SVGGElement>,
    info: { noteId: string; trackIndex: number; measureIndex: number }
  ) => {
    const groupIds =
      selectedNoteIds.includes(info.noteId) && selectedNoteIds.length > 1
        ? selectedNoteIds
        : [info.noteId]
    dragRef.current = {
      ...info,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      groupIds,
    }
  }

  const handleNoteDragMove = (event: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return

    if (!drag.active) {
      if (
        Math.abs(event.clientX - drag.startX) < DRAG_THRESHOLD_PX &&
        Math.abs(event.clientY - drag.startY) < DRAG_THRESHOLD_PX
      ) {
        return
      }
      drag.active = true
      setDraggingNoteId(drag.noteId)
      setSelectedNoteIds(drag.groupIds)
      setActiveTool('select')
      setRestMode(false)
    }

    const { x, y } = clientToSvg(svg, event.clientX, event.clientY)
    setDragPreview({ noteId: drag.noteId, cx: x, cy: y })
  }

  const handleNoteDragEnd = (event: ReactPointerEvent<SVGGElement>, svg: SVGSVGElement) => {
    const drag = dragRef.current
    dragRef.current = null
    const wasActive = drag?.active ?? false
    setDraggingNoteId(null)
    setDragPreview(null)

    if (!drag) return

    if (!wasActive) {
      if (!selectedNoteIds.includes(drag.noteId)) {
        setSelectedNoteIds([drag.noteId])
      }
      setActiveTool('select')
      setActiveTrackIndex(drag.trackIndex)
      setActiveMeasureIndex(drag.measureIndex)
      return
    }

    event.preventDefault()

    const { x, y } = clientToSvg(svg, event.clientX, event.clientY)
    const score = staffDimensions(draft, 'full')
    const target = resolveDropAt(draft, x, y, score)
    if (!target) return

    const found = findNote(draft, drag.noteId)
    if (!found) return

    const moved =
      drag.groupIds.length > 1
        ? moveNoteGroup(draft, drag.groupIds, drag.noteId, {
            trackIndex: target.trackIndex,
            measureIndex: target.measureIndex,
            startBeat: target.startBeat,
            pitch: target.pitch,
            voice: target.voice,
          })
        : moveNote(
            draft,
            { trackIndex: found.trackIndex, measureIndex: found.measureIndex, noteId: drag.noteId },
            {
              trackIndex: target.trackIndex,
              measureIndex: target.measureIndex,
              startBeat: target.startBeat,
              pitch: target.pitch,
              voice: target.voice,
            }
          )

    if (moved) {
      applyDraft(moved)
      setActiveTrackIndex(target.trackIndex)
      setActiveMeasureIndex(target.measureIndex)
      setSelectedNoteIds(drag.groupIds)
    }
  }

  const updateSelectedNote = (patch: Partial<MusicNotationNote>) => {
    if (!selected) return
    applyDraft(
      upsertNote(draft, selected.trackIndex, selected.measureIndex, {
        ...selected.note,
        ...patch,
      })
    )
  }

  const selectedTrack = selected ? tracks[selected.trackIndex] : track

  return (
    <div className="music-notation-editor" role="dialog" aria-modal="true" aria-label="Notation editor">
      <div className="music-notation-editor__backdrop" onClick={onClose} aria-hidden />

      <div className="music-notation-editor__shell">
        <header className="music-notation-editor__topbar">
          <button type="button" className="music-notation-editor__topbtn" onClick={onClose}>
            <i className="bi bi-x-lg" /> Close
          </button>
          <button
            type="button"
            className="music-notation-editor__topbtn music-notation-editor__topbtn--primary"
            onClick={handleSave}
          >
            <i className="bi bi-check-lg" /> Save to lesson
          </button>
          <button type="button" className="music-notation-editor__topbtn" onClick={handleUndo} disabled={undoStack.length === 0}>
            <i className="bi bi-arrow-counterclockwise" /> Undo
          </button>
          <button type="button" className="music-notation-editor__topbtn" onClick={handleRedo} disabled={redoStack.length === 0}>
            <i className="bi bi-arrow-clockwise" /> Redo
          </button>
          <button
            type="button"
            className={`music-notation-editor__topbtn${playback.playing ? ' is-active' : ''}`}
            onClick={() => playback.toggle()}
          >
            <i className={`bi bi-${playback.playing ? 'stop-fill' : 'play-fill'}`} />
            {playback.playing ? 'Stop' : 'Play'}
          </button>

          <label className="music-notation-editor__topfield">
            <span>Tempo</span>
            <input
              type="number"
              min={40}
              max={240}
              value={draft.tempo}
              onChange={(e) => patchDraft({ tempo: Math.min(240, Math.max(40, Number(e.target.value) || 90)) })}
            />
          </label>

          <label className="music-notation-editor__topfield">
            <span>Time</span>
            <select
              value={draft.timeSignature}
              onChange={(e) =>
                patchDraft({ timeSignature: e.target.value as MusicNotationBlockContent['timeSignature'] })
              }
            >
              {MUSIC_TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
          </label>

          <label className="music-notation-editor__topfield">
            <span>Key</span>
            <select
              value={draft.keySignature}
              onChange={(e) =>
                patchDraft({ keySignature: e.target.value as MusicNotationBlockContent['keySignature'] })
              }
            >
              {MUSIC_KEY_SIGNATURES.map((ks) => (
                <option key={ks} value={ks}>{ks}</option>
              ))}
            </select>
          </label>

          <label className="music-notation-editor__topfield">
            <span>Bars / row</span>
            <select
              value={measuresPerSystem}
              onChange={(e) => applyDraft(setMeasuresPerSystem(draft, Number(e.target.value)))}
            >
              {MEASURES_PER_SYSTEM_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </header>

        <div className="music-notation-editor__body">
          <aside className="music-notation-editor__tools">
            {DURATION_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`music-notation-editor__tool${
                  activeTool === tool.id || (tool.id === 'rest' && restMode) ? ' is-active' : ''
                }`}
                onClick={() => handleToolClick(tool.id)}
                title={tool.label}
              >
                <i className={`bi ${tool.icon}`} />
                <span>{tool.label}</span>
              </button>
            ))}
          </aside>

          <main className="music-notation-editor__canvas">
            <div className="music-notation-editor__measure-bar">
              <span className="music-notation-editor__measure-label">
                Measure {activeMeasureIndex + 1} of {measureCount}
              </span>
              <button type="button" className="music-notation-editor__measure-btn" onClick={() => applyDraft(addMeasure(draft))}>
                <i className="bi bi-plus-lg" /> Add bar
              </button>
              <button
                type="button"
                className="music-notation-editor__measure-btn"
                onClick={() => applyDraft(duplicateMeasure(draft, activeMeasureIndex))}
              >
                <i className="bi bi-copy" /> Duplicate
              </button>
              <button
                type="button"
                className="music-notation-editor__measure-btn"
                onClick={() => applyDraft(clearMeasure(draft, activeMeasureIndex))}
              >
                <i className="bi bi-eraser" /> Clear
              </button>
              <button
                type="button"
                className="music-notation-editor__measure-btn"
                disabled={measureCount <= 1}
                onClick={() => {
                  applyDraft(deleteMeasure(draft, activeMeasureIndex))
                  setActiveMeasureIndex((i) => Math.max(0, i - 1))
                }}
              >
                <i className="bi bi-trash" /> Remove bar
              </button>
              <label className="music-notation-editor__measure-select">
                <span>Jump to</span>
                <select
                  value={activeMeasureIndex}
                  onChange={(e) => setActiveMeasureIndex(Number(e.target.value))}
                >
                  {track.measures.map((m, i) => (
                    <option key={m.id} value={i}>Measure {i + 1}</option>
                  ))}
                </select>
              </label>
            </div>

            <MusicNotationStaffView
              content={draft}
              size="full"
              interactive
              activeTrackIndex={activeTrackIndex}
              selectedNoteIds={selectedNoteIds}
              selectToolActive={selectToolActive}
              selectionRect={selectionRect}
              draggingNoteId={draggingNoteId}
              dragPreview={dragPreview}
              activeGlobalBeat={playback.activeGlobalBeat}
              onStaffClick={handleStaffClick}
              onNoteSelect={handleNoteSelect}
              onMarqueePointerDown={handleMarqueePointerDown}
              onMarqueePointerMove={handleMarqueePointerMove}
              onMarqueePointerUp={handleMarqueePointerUp}
              onNoteDragStart={handleNoteDragStart}
              onNoteDragMove={handleNoteDragMove}
              onNoteDragEnd={handleNoteDragEnd}
            />

            <p className="music-notation-editor__hint">
              {draggingNoteId
                ? 'Release to place the note — invalid spots snap back.'
                : selectToolActive
                  ? 'Drag on empty staff to box-select · Shift/Ctrl+click to add · Del to delete · Ctrl+A select all.'
                  : restMode
                    ? `Click a staff row to place a ${activeDuration} rest.`
                    : `Click a staff row to place a ${activeDuration} note. Pitch follows click height.`}
            </p>
          </main>

          <aside className="music-notation-editor__panel">
            <section className="music-notation-editor__panel-section">
              <h4>Instruments</h4>
              <ul className="music-notation-editor__track-list">
                {tracks.map((t, i) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`music-notation-editor__track-item${i === activeTrackIndex ? ' is-active' : ''}`}
                      onClick={() => setActiveTrackIndex(i)}
                    >
                      <span>{t.name || instrumentLabel(t.instrument)}</span>
                      <span className="music-notation-editor__track-clef">{t.clef}</span>
                    </button>
                    <select
                      className="music-notation-editor__track-instrument"
                      value={t.instrument}
                      aria-label={`Instrument for ${t.name}`}
                      onChange={(e) =>
                        applyDraft(setTrackInstrument(draft, i, e.target.value as MusicNotationInstrument))
                      }
                    >
                      {MUSIC_NOTATION_INSTRUMENTS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              <div className="music-notation-editor__track-actions">
                <button
                  type="button"
                  className="music-notation-editor__measure-btn"
                  onClick={() => {
                    applyDraft(addTrack(draft, 'piano'))
                    setActiveTrackIndex(tracks.length)
                  }}
                >
                  <i className="bi bi-plus-lg" /> Add instrument
                </button>
                <button
                  type="button"
                  className="music-notation-editor__measure-btn"
                  disabled={tracks.length <= 1}
                  onClick={() => {
                    applyDraft(removeTrack(draft, activeTrackIndex))
                    setActiveTrackIndex((i) => Math.max(0, i - 1))
                  }}
                >
                  <i className="bi bi-dash-lg" /> Remove
                </button>
              </div>
            </section>

            <section className="music-notation-editor__panel-section">
              <h4>Selected</h4>
              {selectedNoteIds.length > 1 ? (
                <div className="music-notation-editor__props">
                  <p className="music-notation-editor__selected-track">
                    {selectedNoteIds.length} notes selected
                  </p>
                  <button
                    type="button"
                    className="music-notation-editor__delete-btn"
                    onClick={() => {
                      applyDraft(deleteNotes(draft, selectedNoteIds))
                      setSelectedNoteIds([])
                    }}
                  >
                    <i className="bi bi-trash" /> Delete selected
                  </button>
                </div>
              ) : selected ? (
                <div className="music-notation-editor__props">
                  <p className="music-notation-editor__selected-track">
                    {instrumentLabel(selectedTrack?.instrument ?? draft.instrument)} · measure {selected.measureIndex + 1}
                  </p>
                  <label>
                    Type
                    <select
                      value={selected.note.type}
                      onChange={(e) =>
                        updateSelectedNote({
                          type: e.target.value as 'note' | 'rest',
                        })
                      }
                    >
                      <option value="note">Note</option>
                      <option value="rest">Rest</option>
                    </select>
                  </label>

                  {selected.note.type === 'note' ? (
                    isDrumsInstrument(selectedTrack?.instrument ?? 'drums') ? (
                      <label>
                        Drum voice
                        <select
                          value={selected.note.voice ?? 'snare'}
                          onChange={(e) =>
                            updateSelectedNote({ voice: e.target.value as MusicNotationDrumVoice })
                          }
                        >
                          {MUSIC_DRUM_VOICES.map((v) => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>
                        Pitch
                        <select
                          value={selected.note.pitch ?? 'C4'}
                          onChange={(e) =>
                            updateSelectedNote({ pitch: e.target.value as MusicNotationPitch })
                          }
                        >
                          {MUSIC_NOTATION_PITCHES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                    )
                  ) : null}

                  <label>
                    Duration
                    <select
                      value={selected.note.duration}
                      onChange={(e) =>
                        updateSelectedNote({ duration: e.target.value as MusicNotationDuration })
                      }
                    >
                      {MUSIC_NOTATION_DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Start beat
                    <input
                      type="number"
                      min={1}
                      max={beatsInMeasure}
                      step={0.25}
                      value={selected.note.startBeat}
                      onChange={(e) =>
                        updateSelectedNote({
                          startBeat: snapStartBeat(
                            Number(e.target.value) || 1,
                            selected.note.duration,
                            beatsInMeasure
                          ),
                        })
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="music-notation-editor__delete-btn"
                    onClick={() => {
                      applyDraft(deleteNote(draft, selected.trackIndex, selected.measureIndex, selected.note.id))
                      setSelectedNoteIds([])
                    }}
                  >
                    <i className="bi bi-trash" /> Delete
                  </button>
                </div>
              ) : (
                <p className="music-notation-editor__placeholder">
                  Select notes with the Select tool, drag a box on the staff, or click to add one.
                </p>
              )}
            </section>

            <section className="music-notation-editor__panel-section">
              <h4>Score</h4>
              <dl className="music-notation-editor__dl">
                <dt>Instruments</dt>
                <dd>{tracks.length}</dd>
                <dt>Key</dt>
                <dd>{draft.keySignature}</dd>
                <dt>Time</dt>
                <dd>{draft.timeSignature}</dd>
                <dt>Measures</dt>
                <dd>{measureCount}</dd>
                <dt>Rows (systems)</dt>
                <dd>{Math.ceil(measureCount / measuresPerSystem)}</dd>
                <dt>Bars per row</dt>
                <dd>{measuresPerSystem}</dd>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
