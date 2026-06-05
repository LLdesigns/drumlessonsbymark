import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { MusicStaffLayout, ScoreLayout } from '../../../lib/music-notation-staff'
import {
  keyAccidentalY,
  keySignatureAccidentals,
  signaturePrefixWidth,
  timeSignatureNumbers,
} from '../../../lib/music-notation-key-sig'
import {
  beatToX,
  drumVoiceToStaffY,
  pitchToStaffY,
  staffDimensions,
  staffLineYs,
  staffLinesStartX,
  systemSignaturePrefix,
  trackRowYOffset,
  tracksForRender,
} from '../../../lib/music-notation-staff'
import { beatsPerMeasure, getTracks, instrumentLabel, isDrumsInstrument } from '../../../lib/music-notation'
import type {
  MusicNotationBlockContent,
  MusicNotationClef,
  MusicNotationNote,
  MusicNotationTrack,
} from '../../../types/lesson-planning'

export interface NoteDragPreview {
  noteId: string
  cx: number
  cy: number
}

export interface NoteSelectEvent {
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface MusicNotationStaffViewProps {
  content: MusicNotationBlockContent
  size?: 'compact' | 'preview' | 'full'
  showSheetTitle?: boolean
  className?: string
  interactive?: boolean
  activeTrackIndex?: number
  selectedNoteIds?: string[]
  selectToolActive?: boolean
  selectionRect?: SelectionRect | null
  draggingNoteId?: string | null
  dragPreview?: NoteDragPreview | null
  activeGlobalBeat?: number | null
  onStaffClick?: (
    trackIndex: number,
    measureIndex: number,
    clientX: number,
    clientY: number,
    svg: SVGSVGElement
  ) => void
  onNoteSelect?: (noteId: string, event: NoteSelectEvent) => void
  onMarqueePointerDown?: (event: ReactPointerEvent<SVGElement>, svg: SVGSVGElement) => void
  onMarqueePointerMove?: (event: ReactPointerEvent<SVGElement>) => void
  onMarqueePointerUp?: (event: ReactPointerEvent<SVGElement>) => void
  onNoteDragStart?: (
    event: ReactPointerEvent<SVGGElement>,
    info: { noteId: string; trackIndex: number; measureIndex: number }
  ) => void
  onNoteDragMove?: (event: ReactPointerEvent<SVGGElement>) => void
  onNoteDragEnd?: (event: ReactPointerEvent<SVGGElement>, svg: SVGSVGElement) => void
}

function clefSymbol(clef: MusicNotationClef): string {
  switch (clef) {
    case 'bass':
      return '𝄢'
    case 'percussion':
      return '𝄥'
    default:
      return '𝄞'
  }
}

function keySigLabel(key: string): string {
  if (key === 'Bb') return 'B♭'
  if (key === 'Eb') return 'E♭'
  return key
}

function renderNoteHead(
  note: MusicNotationNote,
  cx: number,
  cy: number,
  selected: boolean,
  dragging: boolean,
  layout: MusicStaffLayout
): ReactNode {
  const dur = note.duration
  const s = layout.noteScale
  const rx = (dur === 'whole' ? 7 : dur === 'half' ? 6 : 5.5) * s
  const ry = (dur === 'whole' ? 5 : dur === 'half' ? 4.5 : 4) * s
  const stemLen = 20 * s
  const ringR = 14 * s
  const opacity = dragging ? 0.55 : 1

  if (note.type === 'rest') {
    const rw = 10 * s
    const rh = 14 * s
    return (
      <g opacity={opacity}>
        <rect x={cx - rw / 2} y={cy - rh / 2} width={rw} height={rh} rx={1} className="music-notation-staff__rest" />
        {selected ? <circle cx={cx} cy={cy} r={ringR} className="music-notation-staff__selection-ring" /> : null}
      </g>
    )
  }

  const hollow = dur === 'whole' || dur === 'half'
  return (
    <g opacity={opacity}>
      {selected ? <circle cx={cx} cy={cy} r={ringR} className="music-notation-staff__selection-ring" /> : null}
      {dur !== 'whole' && dur !== 'half' ? (
        <line
          x1={cx + rx - 1}
          y1={cy - stemLen}
          x2={cx + rx - 1}
          y2={cy}
          className="music-notation-staff__stem"
        />
      ) : null}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        className={`music-notation-staff__note music-notation-staff__note--${dur}${hollow ? ' music-notation-staff__note--hollow' : ''}${selected ? ' music-notation-staff__note--selected' : ''}${dragging ? ' music-notation-staff__note--dragging' : ''}`}
      />
    </g>
  )
}

function renderSignatures(
  content: MusicNotationBlockContent,
  track: MusicNotationTrack,
  trackIndex: number,
  systemIndex: number,
  lineYs: number[],
  layout: MusicStaffLayout
): ReactNode {
  const showTimeSig = systemIndex === 0 && trackIndex === 0
  const keyAccs = keySignatureAccidentals(content.keySignature, track.clef)
  if (keyAccs.length === 0 && !showTimeSig) return null

  const clefEndX = layout.labelWidth + 32
  let x = clefEndX

  return (
    <g className="music-notation-staff__signatures">
      {keyAccs.map((acc, i) => (
        <text
          key={`${acc.kind}-${i}`}
          x={x + i * 11}
          y={keyAccidentalY(acc.lineFromTop, lineYs, layout)}
          className="music-notation-staff__accidental"
        >
          {acc.kind === 'sharp' ? '♯' : '♭'}
        </text>
      ))}
      {showTimeSig ? (() => {
        const ts = timeSignatureNumbers(content.timeSignature)
        const tx = clefEndX + keyAccs.length * 11 + 8
        return (
          <>
            <text x={tx} y={lineYs[1] + layout.lineGap * 0.15} className="music-notation-staff__time-sig">
              {ts.top}
            </text>
            <text x={tx} y={lineYs[3] + layout.lineGap * 0.15} className="music-notation-staff__time-sig">
              {ts.bottom}
            </text>
          </>
        )
      })() : null}
    </g>
  )
}

function renderTrackSystem(
  track: MusicNotationTrack,
  trackIndex: number,
  system: ScoreLayout['systems'][number],
  score: ScoreLayout,
  content: MusicNotationBlockContent,
  opts: {
    interactive: boolean
    selectedNoteIds: string[]
    selectToolActive: boolean
    draggingNoteId: string | null
    dragPreview: NoteDragPreview | null
    activeTrackIndex: number
    showPitchLabels: boolean
    onStaffClick?: MusicNotationStaffViewProps['onStaffClick']
    onNoteSelect?: MusicNotationStaffViewProps['onNoteSelect']
    onMarqueePointerDown?: MusicNotationStaffViewProps['onMarqueePointerDown']
    onNoteDragStart?: MusicNotationStaffViewProps['onNoteDragStart']
    onNoteDragMove?: MusicNotationStaffViewProps['onNoteDragMove']
    onNoteDragEnd?: MusicNotationStaffViewProps['onNoteDragEnd']
  }
): ReactNode {
  const { layout } = score
  const yOffset = trackRowYOffset(score, system.systemIndex, trackIndex)
  const lineYs = staffLineYs(layout, yOffset)
  const beats = beatsPerMeasure(content.timeSignature)
  const barlinePad = layout.lineGap * 0.75
  const staffSpan = lineYs[layout.staffLines - 1] - lineYs[0]
  const isActiveTrack = trackIndex === opts.activeTrackIndex
  const rowClass = isActiveTrack && opts.interactive ? ' music-notation-staff__track--active' : ''
  const showTimeSig = system.systemIndex === 0 && trackIndex === 0
  const prefixOffset = signaturePrefixWidth(content.keySignature, track.clef, showTimeSig)
  const primaryClef = getTracks(content)[0]?.clef ?? track.clef
  const systemPrefix = systemSignaturePrefix(content, system.systemIndex, primaryClef)
  const linesLeft = staffLinesStartX(layout, systemPrefix)

  return (
    <g key={`${track.id}-${system.systemIndex}`} className={`music-notation-staff__track${rowClass}`.trim()}>
      {layout.labelWidth > 0 ? (
        <text
          x={layout.labelWidth - 8}
          y={lineYs[2] + layout.lineGap * 0.35}
          textAnchor="end"
          className="music-notation-staff__track-label"
        >
          {track.name || instrumentLabel(track.instrument)}
        </text>
      ) : null}

      {lineYs.map((y, i) => (
        <line
          key={`line-${trackIndex}-${system.systemIndex}-${i}`}
          x1={linesLeft}
          y1={y}
          x2={score.width - layout.rightPad / 2}
          y2={y}
          className="music-notation-staff__line"
        />
      ))}

      {systemPrefix > 0 ? (
        <>
          <line
            x1={linesLeft - 3}
            y1={lineYs[0] - barlinePad}
            x2={linesLeft - 3}
            y2={lineYs[layout.staffLines - 1] + barlinePad}
            className="music-notation-staff__barline"
          />
          <line
            x1={linesLeft}
            y1={lineYs[0] - barlinePad}
            x2={linesLeft}
            y2={lineYs[layout.staffLines - 1] + barlinePad}
            className="music-notation-staff__barline music-notation-staff__barline--final"
          />
        </>
      ) : null}

      <text
        x={layout.labelWidth + 10}
        y={lineYs[2] + layout.lineGap * 0.4}
        className="music-notation-staff__clef"
        style={layout.clefSize ? { fontSize: layout.clefSize } : undefined}
      >
        {clefSymbol(track.clef)}
      </text>

      {renderSignatures(content, track, trackIndex, system.systemIndex, lineYs, layout)}

      {Array.from({ length: system.measureCount }, (_, localMi) => {
        const globalMi = system.startMeasure + localMi
        const measure = track.measures[globalMi]
        if (!measure) return null
        const mx = layout.staffLeft + localMi * layout.measureWidth
        const measurePrefix = localMi === 0 ? prefixOffset : 0
        const beatableWidth = Math.max(layout.measureWidth - measurePrefix, layout.measureWidth * 0.5)

        return (
          <g key={measure.id}>
            {localMi > 0 ? (
              <line
                x1={mx}
                y1={lineYs[0] - barlinePad}
                x2={mx}
                y2={lineYs[layout.staffLines - 1] + barlinePad}
                className="music-notation-staff__barline"
              />
            ) : null}
            {Array.from({ length: beats - 1 }, (_, bi) => (
              <line
                key={`beat-${globalMi}-${bi}`}
                x1={mx + measurePrefix + ((bi + 1) * beatableWidth) / beats}
                y1={lineYs[0]}
                x2={mx + measurePrefix + ((bi + 1) * beatableWidth) / beats}
                y2={lineYs[layout.staffLines - 1]}
                className="music-notation-staff__beat"
              />
            ))}

            {opts.interactive ? (
              <rect
                x={mx}
                y={lineYs[0] - barlinePad * 2}
                width={layout.measureWidth}
                height={staffSpan + barlinePad * 4}
                fill="transparent"
                className="music-notation-staff__hit-area"
                data-track-index={trackIndex}
                data-measure-index={globalMi}
                onPointerDown={(e) => {
                  if (opts.selectToolActive && opts.onMarqueePointerDown) {
                    const svg = e.currentTarget.ownerSVGElement
                    if (!svg) return
                    e.stopPropagation()
                    opts.onMarqueePointerDown(e, svg)
                    return
                  }
                }}
                onClick={(e) => {
                  if (opts.selectToolActive) return
                  e.stopPropagation()
                  opts.onStaffClick?.(
                    trackIndex,
                    globalMi,
                    e.clientX,
                    e.clientY,
                    e.currentTarget.ownerSVGElement!
                  )
                }}
              />
            ) : null}

            {measure.notes.map((note) => {
              const isDragging =
                opts.draggingNoteId === note.id || opts.dragPreview?.noteId === note.id
              const preview = isDragging && opts.dragPreview?.noteId === note.id ? opts.dragPreview : null
              const cx = preview
                ? preview.cx
                : beatToX(localMi, note.startBeat, content.timeSignature, layout, measurePrefix)
              const cy =
                preview
                  ? preview.cy
                  : note.type === 'rest'
                    ? lineYs[2]
                    : isDrumsInstrument(track.instrument)
                      ? drumVoiceToStaffY(note.voice ?? 'snare', lineYs, layout)
                      : pitchToStaffY(note.pitch ?? 'C4', lineYs, layout)
              const selected = opts.selectedNoteIds.includes(note.id)
              const canDrag = opts.interactive && opts.onNoteDragStart

              const selectModifiers = (e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): NoteSelectEvent => ({
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
              })

              return (
                <g
                  key={note.id}
                  data-note-id={note.id}
                  className={isDragging ? 'music-notation-staff__note-group--dragging' : undefined}
                  style={{ cursor: canDrag ? 'grab' : opts.interactive ? 'pointer' : undefined }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    if (canDrag) {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      opts.onNoteDragStart?.(e, { noteId: note.id, trackIndex, measureIndex: globalMi })
                    }
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      opts.onNoteDragMove?.(e)
                    }
                  }}
                  onPointerUp={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      opts.onNoteDragEnd?.(e, e.currentTarget.ownerSVGElement!)
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId)
                      } catch {
                        /* capture already released */
                      }
                    } else if (!canDrag) {
                      opts.onNoteSelect?.(note.id, selectModifiers(e))
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!opts.draggingNoteId) {
                      opts.onNoteSelect?.(note.id, selectModifiers(e))
                    }
                  }}
                >
                  {renderNoteHead(note, cx, cy, selected, isDragging, layout)}
                  {note.type === 'note' && opts.showPitchLabels ? (
                    <text
                      x={cx}
                      y={cy + 18 * layout.noteScale}
                      textAnchor="middle"
                      className="music-notation-staff__pitch-label"
                    >
                      {note.voice ?? note.pitch}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </g>
        )
      })}

      <line
        x1={layout.staffLeft + system.measureCount * layout.measureWidth}
        y1={lineYs[0] - barlinePad}
        x2={layout.staffLeft + system.measureCount * layout.measureWidth}
        y2={lineYs[layout.staffLines - 1] + barlinePad}
        className="music-notation-staff__barline music-notation-staff__barline--final"
      />
    </g>
  )
}

export default function MusicNotationStaffView({
  content,
  size = 'preview',
  showSheetTitle = true,
  className = '',
  interactive = false,
  activeTrackIndex = 0,
  selectedNoteIds = [],
  selectToolActive = false,
  selectionRect = null,
  draggingNoteId = null,
  dragPreview = null,
  activeGlobalBeat = null,
  onStaffClick,
  onNoteSelect,
  onMarqueePointerDown,
  onMarqueePointerMove,
  onMarqueePointerUp,
  onNoteDragStart,
  onNoteDragMove,
  onNoteDragEnd,
}: MusicNotationStaffViewProps) {
  const score = staffDimensions(content, size)
  const tracks = tracksForRender(content, size)
  const beatsInMeasure = beatsPerMeasure(content.timeSignature)
  const showMeta = size !== 'full'
  const showPitchLabels = size !== 'compact' && !interactive
  const sheetTitle = size === 'full' && showSheetTitle ? content.title?.trim() : ''
  const fillWidth = size === 'full' || size === 'preview'

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onStaffClick || draggingNoteId || selectToolActive) return
    const target = e.target as SVGElement
    if (target.closest('[data-note-id]')) return
    onStaffClick(activeTrackIndex, 0, e.clientX, e.clientY, e.currentTarget)
  }

  const handleSvgPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive || !selectToolActive || !onMarqueePointerDown) return
    const target = e.target as SVGElement
    if (target.closest('[data-note-id]')) return
    onMarqueePointerDown(e, e.currentTarget)
  }

  const staffSvg = (
    <svg
      width={fillWidth ? undefined : score.width}
      height={fillWidth ? undefined : score.height}
      viewBox={`0 0 ${score.width} ${score.height}`}
      className="music-notation-staff__svg"
      role="img"
      onClick={handleSvgClick}
      onPointerDown={handleSvgPointerDown}
      onPointerMove={onMarqueePointerMove}
      onPointerUp={onMarqueePointerUp}
      preserveAspectRatio={fillWidth ? 'xMidYMid meet' : undefined}
    >
      {showMeta ? (
        <text x={12} y={20} className="music-notation-staff__meta">
          {keySigLabel(content.keySignature)} · {content.timeSignature} · {content.tempo} BPM
        </text>
      ) : null}

      {size === 'full' && sheetTitle ? (
        <text x={score.width / 2} y={24} textAnchor="middle" className="music-notation-staff__sheet-title">
          {sheetTitle}
        </text>
      ) : null}

      {score.systems.map((system) =>
        tracks.map((track, trackIndex) =>
          renderTrackSystem(track, trackIndex, system, score, content, {
            interactive,
            selectedNoteIds,
            selectToolActive,
            draggingNoteId,
            dragPreview,
            activeTrackIndex,
            showPitchLabels,
            onStaffClick,
            onNoteSelect,
            onMarqueePointerDown,
            onNoteDragStart,
            onNoteDragMove,
            onNoteDragEnd,
          })
        )
      )}

      {selectionRect && selectionRect.width + selectionRect.height > 0 ? (
        <rect
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.width}
          height={selectionRect.height}
          className="music-notation-staff__selection-box"
          pointerEvents="none"
        />
      ) : null}

      {activeGlobalBeat != null ? (() => {
        const measureIndex = Math.floor((activeGlobalBeat - 1) / beatsInMeasure)
        const beatInMeasure = ((activeGlobalBeat - 1) % beatsInMeasure) + 1
        const systemIndex = Math.floor(measureIndex / score.measuresPerSystem)
        const localMi = measureIndex % score.measuresPerSystem
        const system = score.systems[systemIndex]
        if (!system) return null
        const yOffset = trackRowYOffset(score, systemIndex, 0)
        const lineYs = staffLineYs(score.layout, yOffset)
        const showTimeSig = systemIndex === 0
        const prefixOffset = signaturePrefixWidth(content.keySignature, tracks[0]?.clef ?? 'treble', showTimeSig)
        const cx = beatToX(localMi, beatInMeasure, content.timeSignature, score.layout, localMi === 0 ? prefixOffset : 0)
        const barlinePad = score.layout.lineGap * 0.75
        return (
          <line
            key="playback-cursor"
            x1={cx}
            y1={lineYs[0] - barlinePad * 1.5}
            x2={cx}
            y2={lineYs[score.layout.staffLines - 1] + barlinePad * 1.5}
            className="music-notation-staff__cursor"
          />
        )
      })() : null}

      {tracks.every((t) => t.measures.every((m) => m.notes.length === 0)) && !interactive ? (
        <text x={score.layout.staffLeft} y={score.height - 16} className="music-notation-staff__placeholder">
          No notes yet — open the editor to add notation
        </text>
      ) : null}
    </svg>
  )

  return (
    <div
      className={`music-notation-staff music-notation-staff--${size}${interactive ? ' music-notation-staff--interactive' : ''}${draggingNoteId ? ' music-notation-staff--dragging' : ''}${selectToolActive ? ' music-notation-staff--select-tool' : ''} ${className}`.trim()}
      aria-label="Music notation staff"
    >
      {size === 'full' ? (
        <div className="music-notation-staff__sheet">
          <div className="music-notation-staff__sheet-body">{staffSvg}</div>
        </div>
      ) : (
        staffSvg
      )}
    </div>
  )
}
