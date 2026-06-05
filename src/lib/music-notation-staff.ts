import type {
  MusicNotationBlockContent,
  MusicNotationClef,
  MusicNotationDrumVoice,
  MusicNotationInstrument,
  MusicNotationPitch,
  MusicNotationTrack,
} from '../types/lesson-planning'
import { beatsPerMeasure, getMeasuresPerSystem, getPrimaryTrack, getTracks, isDrumsInstrument } from './music-notation'
import { signaturePrefixWidth } from './music-notation-key-sig'

export const STAFF_LINES = 5

/** Horizontal offset from beat grid to note head center (matches beatToX / xToMeasureAndBeat). */
export const NOTE_HEAD_X_OFFSET = 14

/** @deprecated Use getMusicStaffLayout('preview') */
export const STAFF_LINE_GAP = 10
/** @deprecated Use getMusicStaffLayout('preview') */
export const STAFF_TOP = 44
/** @deprecated Use getMusicStaffLayout('preview') */
export const STAFF_LEFT = 80
/** @deprecated Use getMusicStaffLayout('preview') */
export const MEASURE_WIDTH = 140

const FULL_SHEET_NOTATION_WIDTH = 960

export interface MusicStaffLayout {
  lineGap: number
  labelWidth: number
  staffLeft: number
  measureWidth: number
  staffLines: number
  rightPad: number
  noteScale: number
  clefSize: number
  staffPaddingTop: number
  staffPaddingBottom: number
  trackGap: number
  systemGap: number
  titleHeight: number
}

export interface ScoreSystem {
  systemIndex: number
  startMeasure: number
  measureCount: number
}

export interface ScoreLayout {
  layout: MusicStaffLayout
  measuresPerSystem: number
  measureCount: number
  systemCount: number
  trackCount: number
  width: number
  height: number
  trackRowHeight: number
  systemHeight: number
  systems: ScoreSystem[]
}

const PITCH_STEPS: Record<MusicNotationPitch, number> = {
  C4: -2,
  D4: -1,
  E4: 0,
  F4: 1,
  G4: 2,
  A4: 3,
  B4: 4,
  C5: 5,
}

const DRUM_STEPS: Record<MusicNotationDrumVoice, number> = {
  kick: 6,
  snare: 2,
  hihat: -1,
  tom: 3,
  crash: -2,
  ride: 0,
}

export function getMusicStaffLayout(
  size: 'compact' | 'preview' | 'full',
  measuresPerRow = 4
): MusicStaffLayout {
  if (size === 'compact') {
    return {
      lineGap: 8,
      labelWidth: 0,
      staffLeft: 56,
      measureWidth: 100,
      staffLines: STAFF_LINES,
      rightPad: 24,
      noteScale: 0.85,
      clefSize: 22,
      staffPaddingTop: 8,
      staffPaddingBottom: 8,
      trackGap: 12,
      systemGap: 16,
      titleHeight: 0,
    }
  }

  if (size === 'preview') {
    const minMeasureWidth = 120
    const available = 640 - 80 - 32
    const measureWidth = Math.max(minMeasureWidth, Math.floor(available / Math.max(measuresPerRow, 1)))
    return {
      lineGap: 11,
      labelWidth: 0,
      staffLeft: 80,
      measureWidth,
      staffLines: STAFF_LINES,
      rightPad: 32,
      noteScale: 1.1,
      clefSize: 28,
      staffPaddingTop: 10,
      staffPaddingBottom: 10,
      trackGap: 16,
      systemGap: 20,
      titleHeight: 28,
    }
  }

  const labelWidth = 96
  const clefPad = 40
  const minMeasureWidth = 120
  const available = FULL_SHEET_NOTATION_WIDTH - labelWidth - clefPad - 32
  const measureWidth = Math.max(minMeasureWidth, Math.floor(available / Math.max(measuresPerRow, 1)))

  return {
    lineGap: 12,
    labelWidth,
    staffLeft: labelWidth + clefPad,
    measureWidth,
    staffLines: STAFF_LINES,
    rightPad: 32,
    noteScale: 1.2,
    clefSize: 30,
    staffPaddingTop: 14,
    staffPaddingBottom: 10,
    trackGap: 22,
    systemGap: 36,
    titleHeight: 36,
  }
}

export function measureCountForSize(size: 'compact' | 'preview' | 'full', content: MusicNotationBlockContent): number {
  const track = getPrimaryTrack(content)
  const count = track.measures.length
  if (size === 'compact') return Math.min(count, 2) || 1
  if (size === 'preview') return Math.min(count, 4) || 1
  return Math.max(count, 1)
}

export function buildScoreLayout(
  content: MusicNotationBlockContent,
  size: 'compact' | 'preview' | 'full'
): ScoreLayout {
  const allTracks = getTracks(content)
  const tracks =
    size === 'compact' ? [allTracks[0] ?? getPrimaryTrack(content)] : allTracks
  const measureCount = measureCountForSize(size, content)
  const measuresPerSystem =
    size === 'full'
      ? getMeasuresPerSystem(content)
      : Math.min(measureCount, size === 'compact' ? 2 : 4)

  const layout = getMusicStaffLayout(size, measuresPerSystem)
  const systemCount = Math.max(1, Math.ceil(measureCount / measuresPerSystem))
  const systems: ScoreSystem[] = Array.from({ length: systemCount }, (_, systemIndex) => {
    const startMeasure = systemIndex * measuresPerSystem
    const remaining = measureCount - startMeasure
    return {
      systemIndex,
      startMeasure,
      measureCount: Math.min(measuresPerSystem, remaining),
    }
  })

  const staffSpan = layout.lineGap * (layout.staffLines - 1)
  const trackRowHeight = layout.staffPaddingTop + staffSpan + layout.staffPaddingBottom
  const trackCount = tracks.length
  const systemHeight =
    trackCount * trackRowHeight + Math.max(0, trackCount - 1) * layout.trackGap + layout.systemGap
  const width = layout.staffLeft + measuresPerSystem * layout.measureWidth + layout.rightPad
  const height =
    size === 'compact'
      ? 108
      : size === 'preview'
        ? layout.titleHeight + trackCount * trackRowHeight + (trackCount - 1) * layout.trackGap + 24
        : layout.titleHeight + systemCount * systemHeight + 40

  return {
    layout,
    measuresPerSystem,
    measureCount,
    systemCount,
    trackCount,
    width,
    height,
    trackRowHeight,
    systemHeight,
    systems,
  }
}

export function staffDimensions(
  content: MusicNotationBlockContent,
  size: 'compact' | 'preview' | 'full'
): ScoreLayout {
  return buildScoreLayout(content, size)
}

export function staffLineYs(layout: MusicStaffLayout, yOffset = 0): number[] {
  const top = yOffset + layout.staffPaddingTop
  return Array.from({ length: layout.staffLines }, (_, i) => top + i * layout.lineGap)
}

export function trackRowYOffset(score: ScoreLayout, systemIndex: number, trackIndex: number): number {
  const { layout, systemHeight, trackRowHeight } = score
  return (
    layout.titleHeight +
    systemIndex * systemHeight +
    trackIndex * (trackRowHeight + layout.trackGap)
  )
}

export function pitchToStaffY(
  pitch: MusicNotationPitch,
  lineYs: number[],
  layout: MusicStaffLayout
): number {
  const bottomLine = lineYs[layout.staffLines - 1]
  return bottomLine - PITCH_STEPS[pitch] * (layout.lineGap / 2)
}

export function drumVoiceToStaffY(
  voice: MusicNotationDrumVoice,
  lineYs: number[],
  layout: MusicStaffLayout
): number {
  const bottomLine = lineYs[layout.staffLines - 1]
  return bottomLine - DRUM_STEPS[voice] * (layout.lineGap / 2)
}

export function staffYToPitch(y: number, lineYs: number[], layout: MusicStaffLayout): MusicNotationPitch {
  const bottomLine = lineYs[layout.staffLines - 1]
  const step = Math.round((bottomLine - y) / (layout.lineGap / 2))
  const clamped = Math.max(-2, Math.min(5, step))
  const entries = Object.entries(PITCH_STEPS) as [MusicNotationPitch, number][]
  return entries.find(([, s]) => s === clamped)?.[0] ?? 'C4'
}

export function staffYToDrumVoice(y: number, lineYs: number[], layout: MusicStaffLayout): MusicNotationDrumVoice {
  const bottomLine = lineYs[layout.staffLines - 1]
  const step = Math.round((bottomLine - y) / (layout.lineGap / 2))
  let best: MusicNotationDrumVoice = 'snare'
  let bestDist = Infinity
  for (const [voice, s] of Object.entries(DRUM_STEPS) as [MusicNotationDrumVoice, number][]) {
    const dist = Math.abs(s - step)
    if (dist < bestDist) {
      bestDist = dist
      best = voice
    }
  }
  return best
}

export function staffLinesStartX(layout: MusicStaffLayout, signaturePrefix = 0): number {
  return layout.staffLeft + Math.max(0, signaturePrefix)
}

export function systemSignaturePrefix(
  content: MusicNotationBlockContent,
  systemIndex: number,
  primaryClef: MusicNotationClef = 'treble'
): number {
  if (systemIndex !== 0) return 0
  return signaturePrefixWidth(content.keySignature, primaryClef, true)
}

export function normalizeSelectionRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  }
}

export interface NoteLayoutPosition {
  noteId: string
  trackIndex: number
  measureIndex: number
  cx: number
  cy: number
}

export function collectNoteLayoutPositions(
  content: MusicNotationBlockContent,
  score: ScoreLayout
): NoteLayoutPosition[] {
  const tracks = getTracks(content)
  const positions: NoteLayoutPosition[] = []

  score.systems.forEach((system) => {
    tracks.forEach((track, trackIndex) => {
      const yOffset = trackRowYOffset(score, system.systemIndex, trackIndex)
      const lineYs = staffLineYs(score.layout, yOffset)
      const showTimeSig = system.systemIndex === 0 && trackIndex === 0
      const prefixOffset = signaturePrefixWidth(content.keySignature, track.clef, showTimeSig)

      for (let localMi = 0; localMi < system.measureCount; localMi++) {
        const globalMi = system.startMeasure + localMi
        const measure = track.measures[globalMi]
        if (!measure) continue
        const measurePrefix = localMi === 0 ? prefixOffset : 0

        measure.notes.forEach((note) => {
          const cx = beatToX(localMi, note.startBeat, content.timeSignature, score.layout, measurePrefix)
          const cy =
            note.type === 'rest'
              ? lineYs[2]
              : isDrumsInstrument(track.instrument)
                ? drumVoiceToStaffY(note.voice ?? 'snare', lineYs, score.layout)
                : pitchToStaffY(note.pitch ?? 'C4', lineYs, score.layout)
          positions.push({
            noteId: note.id,
            trackIndex,
            measureIndex: globalMi,
            cx,
            cy,
          })
        })
      }
    })
  })

  return positions
}

export function noteIdsInRect(
  positions: readonly NoteLayoutPosition[],
  rect: { x: number; y: number; width: number; height: number }
): string[] {
  if (rect.width < 1 && rect.height < 1) return []
  const minX = Math.min(rect.x, rect.x + rect.width)
  const maxX = Math.max(rect.x, rect.x + rect.width)
  const minY = Math.min(rect.y, rect.y + rect.height)
  const maxY = Math.max(rect.y, rect.y + rect.height)
  return positions
    .filter((p) => p.cx >= minX && p.cx <= maxX && p.cy >= minY && p.cy <= maxY)
    .map((p) => p.noteId)
}

export function measurePrefixForLocalIndex(localMeasureIndex: number, systemPrefixOffset: number): number {
  return localMeasureIndex === 0 ? systemPrefixOffset : 0
}

export function measureBeatGeometry(
  localMeasureIndex: number,
  systemPrefixOffset: number,
  layout: MusicStaffLayout
): { mx: number; prefix: number; beatableWidth: number } {
  const prefix = measurePrefixForLocalIndex(localMeasureIndex, systemPrefixOffset)
  const mx = layout.staffLeft + localMeasureIndex * layout.measureWidth
  return { mx, prefix, beatableWidth: Math.max(layout.measureWidth - prefix, layout.measureWidth * 0.5) }
}

export function beatToX(
  localMeasureIndex: number,
  startBeat: number,
  timeSignature: MusicNotationBlockContent['timeSignature'],
  layout: MusicStaffLayout,
  prefixOffset = 0
): number {
  const beats = beatsPerMeasure(timeSignature)
  const localBeat = startBeat - 1
  const { mx, prefix, beatableWidth } = measureBeatGeometry(localMeasureIndex, prefixOffset, layout)
  return mx + prefix + (localBeat / beats) * beatableWidth + NOTE_HEAD_X_OFFSET
}

export function xToMeasureAndBeat(
  x: number,
  systemStartMeasure: number,
  measuresInSystem: number,
  timeSignature: MusicNotationBlockContent['timeSignature'],
  layout: MusicStaffLayout,
  systemPrefixOffset = 0
): { measureIndex: number; beat: number } {
  const relX = x - layout.staffLeft
  if (relX < 0) return { measureIndex: systemStartMeasure, beat: 1 }
  const localIndex = Math.min(measuresInSystem - 1, Math.max(0, Math.floor(relX / layout.measureWidth)))
  const prefix = measurePrefixForLocalIndex(localIndex, systemPrefixOffset)
  const beatableWidth = Math.max(layout.measureWidth - prefix, layout.measureWidth * 0.5)
  const localX = relX - localIndex * layout.measureWidth - prefix - NOTE_HEAD_X_OFFSET
  const beats = beatsPerMeasure(timeSignature)
  const beat = 1 + Math.max(0, (localX / beatableWidth) * beats)
  return {
    measureIndex: systemStartMeasure + localIndex,
    beat: Math.min(Math.max(1, beat), beats + 0.999),
  }
}

export function hitTestScore(
  _x: number,
  y: number,
  score: ScoreLayout
): { trackIndex: number; systemIndex: number; system: ScoreSystem } | null {
  const { layout, systemCount, trackCount, systemHeight, trackRowHeight } = score
  const relY = y - layout.titleHeight
  if (relY < 0) return null

  const systemIndex = Math.min(systemCount - 1, Math.max(0, Math.floor(relY / systemHeight)))
  const withinSystem = relY - systemIndex * systemHeight
  const trackIndex = Math.min(trackCount - 1, Math.max(0, Math.floor(withinSystem / (trackRowHeight + layout.trackGap))))
  const system = score.systems[systemIndex]
  if (!system) return null

  return { trackIndex, systemIndex, system }
}

export function isPitchedTrack(instrument: MusicNotationInstrument): boolean {
  return !isDrumsInstrument(instrument)
}

export function isPitchedInstrument(content: MusicNotationBlockContent): boolean {
  return isPitchedTrack(content.instrument)
}

export function tracksForRender(
  content: MusicNotationBlockContent,
  size: 'compact' | 'preview' | 'full'
): MusicNotationTrack[] {
  const tracks = getTracks(content)
  if (size === 'compact') return [tracks[0] ?? getPrimaryTrack(content)]
  return tracks
}

export function resolveDropAt(
  content: MusicNotationBlockContent,
  x: number,
  y: number,
  score: ScoreLayout
): {
  trackIndex: number
  measureIndex: number
  startBeat: number
  pitch?: MusicNotationPitch
  voice?: MusicNotationDrumVoice
} | null {
  const hit = hitTestScore(x, y, score)
  if (!hit) return null

  const { trackIndex, system } = hit
  const track = getTracks(content)[trackIndex]
  if (!track) return null

  const showTimeSig = hit.systemIndex === 0 && trackIndex === 0
  const prefixOffset = signaturePrefixWidth(content.keySignature, track.clef, showTimeSig)

  const { measureIndex, beat } = xToMeasureAndBeat(
    x,
    system.startMeasure,
    system.measureCount,
    content.timeSignature,
    score.layout,
    prefixOffset
  )

  const yOffset =
    score.layout.titleHeight +
    hit.systemIndex * score.systemHeight +
    trackIndex * (score.trackRowHeight + score.layout.trackGap)
  const lineYs = staffLineYs(score.layout, yOffset)

  if (isDrumsInstrument(track.instrument)) {
    return {
      trackIndex,
      measureIndex,
      startBeat: beat,
      voice: staffYToDrumVoice(y, lineYs, score.layout),
    }
  }

  return {
    trackIndex,
    measureIndex,
    startBeat: beat,
    pitch: staffYToPitch(y, lineYs, score.layout),
  }
}
