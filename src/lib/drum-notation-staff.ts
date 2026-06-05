import type { DrumHit, DrumVoiceId } from '../types/lesson-planning'

/** Half-line units from the top staff line (0 = top line, 4 = middle/snare). */
export type DrumStaffPosition = number

export interface DrumStaffVoiceSpec {
  id: DrumVoiceId
  /** Half-line position on a 5-line staff (PAS / standard drum set map). */
  staffPosition: DrumStaffPosition
  stem: 'up' | 'down'
  /** x = cymbal cross, open = open circle, head = normal notehead */
  head: 'x' | 'open' | 'head'
}

/**
 * Standard drum-set staff map (top → bottom):
 * Crash (ledger above) · Hi-hat (above staff) · Ride (top line) ·
 * Rack tom · Snare (middle) · Tom 14" · Floor tom 16" (bottom line) · Kick (below staff)
 */
export const DRUM_STAFF_VOICES: DrumStaffVoiceSpec[] = [
  { id: 'crash', staffPosition: -2, stem: 'down', head: 'x' },
  { id: 'hihat', staffPosition: -1, stem: 'down', head: 'x' },
  { id: 'ride', staffPosition: 0, stem: 'down', head: 'x' },
  { id: 'tom', staffPosition: 2, stem: 'up', head: 'head' },
  { id: 'snare', staffPosition: 4, stem: 'up', head: 'head' },
  { id: 'tom_14', staffPosition: 6, stem: 'up', head: 'head' },
  { id: 'tom_16', staffPosition: 8, stem: 'up', head: 'head' },
  { id: 'kick', staffPosition: 10, stem: 'up', head: 'head' },
]

export function getStaffVoiceSpec(id: DrumVoiceId): DrumStaffVoiceSpec | undefined {
  return DRUM_STAFF_VOICES.find((v) => v.id === id)
}

export interface DrumStaffLayout {
  lineGap: number
  stepWidth: number
  measurePad: number
  staffTop: number
  noteRadius: number
  stemLength: number
  strokeWidth: number
  staffLineCount: number
}

export function getDrumStaffLayout(size: 'full' | 'preview'): DrumStaffLayout {
  if (size === 'preview') {
    return {
      lineGap: 11,
      stepWidth: 20,
      measurePad: 40,
      staffTop: 28,
      noteRadius: 4.5,
      stemLength: 22,
      strokeWidth: 1.35,
      staffLineCount: 5,
    }
  }
  return {
    lineGap: 14,
    stepWidth: 28,
    measurePad: 52,
    staffTop: 36,
    noteRadius: 5.5,
    stemLength: 28,
    strokeWidth: 1.5,
    staffLineCount: 5,
  }
}

export function staffLineY(lineIndex: number, layout: DrumStaffLayout): number {
  return layout.staffTop + lineIndex * layout.lineGap
}

export function staffPositionY(position: DrumStaffPosition, layout: DrumStaffLayout): number {
  return layout.staffTop + (position / 2) * layout.lineGap
}

export function staffHeight(layout: DrumStaffLayout): number {
  return layout.staffTop + layout.lineGap * (layout.staffLineCount + 2) + 36
}

export function measurePixelWidth(stepCount: number, layout: DrumStaffLayout): number {
  return layout.measurePad * 2 + stepCount * layout.stepWidth
}

/** Open hi-hat / open ride use open circle instead of × */
export function effectiveHead(spec: DrumStaffVoiceSpec, hit: DrumHit): 'x' | 'open' | 'head' {
  if (hit === 'open' && (spec.id === 'hihat' || spec.id === 'ride')) return 'open'
  return spec.head
}

export function isGhostHit(hit: DrumHit): boolean {
  return hit === 'ghost'
}

export function isAccentHit(hit: DrumHit): boolean {
  return hit === 'accent'
}
