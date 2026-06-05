/**
 * Play It Pro instrument pack format.
 * Raw CC0 samples + JSON maps — not DAW/VST/Kontakt.
 */

export type InstrumentPackType = 'drumkit' | 'melodic'

export interface DrumSampleEntry {
  file: string
  midi?: number
  gain?: number
}

export interface MelodicRootNote {
  note?: string
  midi: number
  file: string
  gain?: number
}

export interface InstrumentSynthFallback {
  waveform: OscillatorType
  gain?: number
  semitoneOffset?: number
}

export interface InstrumentPackDefinition {
  id: string
  name: string
  license: string
  type: InstrumentPackType
  baseUrl?: string
  samples?: Record<string, DrumSampleEntry>
  root_notes?: MelodicRootNote[]
  fallback?: 'synth'
  synth?: InstrumentSynthFallback
}

export interface InstrumentPackManifest {
  version: 1
  bundled: {
    name: string
    license: string
    packs: string[]
  }
  expansion?: Array<{
    id: string
    name: string
    description?: string
    url: string
  }>
}
