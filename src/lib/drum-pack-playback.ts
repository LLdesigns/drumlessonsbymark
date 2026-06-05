import type { DrumHit, DrumVoiceId } from '../types/lesson-planning'

export const DRUM_PACK_ID = 'basic_acoustic_drums'
export const METRONOME_PACK_ID = 'metronome_click'

export interface DrumPackSampleChoice {
  sampleKey: string
  gain: number
}

/** Map sequencer voice + hit type → pack sample key + gain (basic_acoustic_drums). */
export function pickDrumPackSample(voice: DrumVoiceId, hit: DrumHit = true): DrumPackSampleChoice {
  switch (voice) {
    case 'kick':
      return { sampleKey: 'kick', gain: 1 }
    case 'snare':
      if (hit === 'accent') return { sampleKey: 'snare2', gain: 1.05 }
      if (hit === 'ghost') return { sampleKey: 'snare3', gain: 0.55 }
      return { sampleKey: 'snare', gain: 1 }
    case 'hihat':
      if (hit === 'open') return { sampleKey: 'open_hat', gain: 0.95 }
      return { sampleKey: 'closed_hat', gain: 0.9 }
    case 'tom':
      return { sampleKey: 'tom', gain: 0.95 }
    case 'tom_14':
      return { sampleKey: 'tom_mid', gain: 0.95 }
    case 'tom_16':
      return { sampleKey: 'tom_low', gain: 0.95 }
    case 'crash':
      return { sampleKey: 'crash', gain: 0.9 }
    case 'ride':
      return { sampleKey: 'ride', gain: hit === 'open' ? 0.85 : 0.75 }
    default:
      return { sampleKey: 'snare', gain: 1 }
  }
}

export function hitGainMultiplier(hit: DrumHit): number {
  if (hit === 'accent') return 1.15
  if (hit === 'ghost') return 0.35
  if (hit === 'open') return 0.9
  return 1
}
