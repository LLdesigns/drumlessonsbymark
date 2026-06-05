import type { MusicNotationClef, MusicNotationKeySignature, MusicNotationTimeSignature } from '../types/lesson-planning'
import type { MusicStaffLayout } from './music-notation-staff'

export interface KeySigAccidental {
  /** Staff position from top line in half-line steps (0 = top line, 1 = next line, 0.5 = space). */
  lineFromTop: number
  kind: 'sharp' | 'flat'
}

const KEY_SIG_TREBLE: Record<MusicNotationKeySignature, KeySigAccidental[]> = {
  C: [],
  G: [{ lineFromTop: 0, kind: 'sharp' }],
  D: [
    { lineFromTop: 0, kind: 'sharp' },
    { lineFromTop: 0.5, kind: 'sharp' },
  ],
  A: [
    { lineFromTop: 0, kind: 'sharp' },
    { lineFromTop: 0.5, kind: 'sharp' },
    { lineFromTop: 1, kind: 'sharp' },
  ],
  E: [
    { lineFromTop: 0, kind: 'sharp' },
    { lineFromTop: 0.5, kind: 'sharp' },
    { lineFromTop: 1, kind: 'sharp' },
    { lineFromTop: 1.5, kind: 'sharp' },
  ],
  F: [{ lineFromTop: 3, kind: 'flat' }],
  Bb: [
    { lineFromTop: 3, kind: 'flat' },
    { lineFromTop: 2.5, kind: 'flat' },
  ],
  Eb: [
    { lineFromTop: 3, kind: 'flat' },
    { lineFromTop: 2.5, kind: 'flat' },
    { lineFromTop: 4, kind: 'flat' },
  ],
}

const KEY_SIG_BASS: Record<MusicNotationKeySignature, KeySigAccidental[]> = {
  C: [],
  G: [{ lineFromTop: 2, kind: 'sharp' }],
  D: [
    { lineFromTop: 2, kind: 'sharp' },
    { lineFromTop: 2.5, kind: 'sharp' },
  ],
  A: [
    { lineFromTop: 2, kind: 'sharp' },
    { lineFromTop: 2.5, kind: 'sharp' },
    { lineFromTop: 3, kind: 'sharp' },
  ],
  E: [
    { lineFromTop: 2, kind: 'sharp' },
    { lineFromTop: 2.5, kind: 'sharp' },
    { lineFromTop: 3, kind: 'sharp' },
    { lineFromTop: 3.5, kind: 'sharp' },
  ],
  F: [{ lineFromTop: 1, kind: 'flat' }],
  Bb: [
    { lineFromTop: 1, kind: 'flat' },
    { lineFromTop: 0.5, kind: 'flat' },
  ],
  Eb: [
    { lineFromTop: 1, kind: 'flat' },
    { lineFromTop: 0.5, kind: 'flat' },
    { lineFromTop: 2, kind: 'flat' },
  ],
}

export function keySignatureAccidentals(
  key: MusicNotationKeySignature,
  clef: MusicNotationClef
): KeySigAccidental[] {
  if (clef === 'percussion') return []
  return clef === 'bass' ? KEY_SIG_BASS[key] : KEY_SIG_TREBLE[key]
}

export function keySignatureWidth(accidentalCount: number): number {
  if (accidentalCount === 0) return 0
  return accidentalCount * 11 + 6
}

export function keyAccidentalY(lineFromTop: number, lineYs: number[], layout: MusicStaffLayout): number {
  return lineYs[0] + lineFromTop * (layout.lineGap / 2)
}

export function timeSignatureNumbers(ts: MusicNotationTimeSignature): { top: string; bottom: string } {
  const [top, bottom] = ts.split('/')
  return { top, bottom }
}

export function timeSignatureWidth(): number {
  return 22
}

export function signaturePrefixWidth(
  key: MusicNotationKeySignature,
  clef: MusicNotationClef,
  showTimeSignature: boolean
): number {
  const keyW = keySignatureWidth(keySignatureAccidentals(key, clef).length)
  return keyW + (showTimeSignature ? timeSignatureWidth() + 4 : 0)
}
