import type { MusicNotationInstrument } from '../types/lesson-planning'

export const NOTATION_INSTRUMENT_PACK: Record<MusicNotationInstrument, string> = {
  piano: 'practice_piano_light',
  guitar: 'clean_guitar',
  bass: 'practice_bass',
  drums: 'basic_acoustic_drums',
  voice: 'practice_voice',
}

export const NOTATION_DRUM_VOICE_ALIASES: Record<string, string> = {
  kick: 'kick',
  snare: 'snare',
  hihat: 'closed_hat',
  tom: 'tom',
  tom_14: 'tom_mid',
  tom_16: 'tom_low',
  crash: 'crash',
  ride: 'ride',
}

/** Core v1 packs preloaded on first audio unlock */
export const CORE_PACK_IDS = [
  'basic_acoustic_drums',
  'practice_piano_light',
  'practice_bass',
  'clean_guitar',
  'practice_voice',
  'metronome_click',
] as const

export function packIdForNotationInstrument(instrument: MusicNotationInstrument): string {
  return NOTATION_INSTRUMENT_PACK[instrument]
}

export function resolvePackIdsForInstruments(instruments: MusicNotationInstrument[]): string[] {
  return [...new Set(instruments.map(packIdForNotationInstrument))]
}
