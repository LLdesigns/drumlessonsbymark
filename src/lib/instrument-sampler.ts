import type { InstrumentPackDefinition, InstrumentPackManifest } from '../types/instrument-map'
import {
  CORE_PACK_IDS,
  NOTATION_DRUM_VOICE_ALIASES,
  packIdForNotationInstrument,
  resolvePackIdsForInstruments,
} from './instrument-registry'
import { DRUM_PACK_ID, METRONOME_PACK_ID, pickDrumPackSample } from './drum-pack-playback'
import type {
  DrumHit,
  DrumVoiceId,
  MusicNotationDrumVoice,
  MusicNotationInstrument,
  MusicNotationPitch,
} from '../types/lesson-planning'

const MAP_BASE = '/audio/instruments'
const PACKS_BASE = `${MAP_BASE}/packs`
const MANIFEST_URL = `${MAP_BASE}/manifest.json`

const PITCH_MIDI: Record<MusicNotationPitch, number> = {
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function bufferKey(packId: string, file: string): string {
  return `${packId}::${file}`
}

class InstrumentSampler {
  private packs = new Map<string, InstrumentPackDefinition>()
  private buffers = new Map<string, AudioBuffer>()
  private packLoads = new Map<string, Promise<InstrumentPackDefinition | null>>()
  private manifest: InstrumentPackManifest | null = null

  async getManifest(): Promise<InstrumentPackManifest> {
    if (this.manifest) return this.manifest
    try {
      const res = await fetch(MANIFEST_URL)
      if (!res.ok) throw new Error('manifest missing')
      this.manifest = (await res.json()) as InstrumentPackManifest
    } catch {
      this.manifest = {
        version: 1,
        bundled: {
          name: 'Play It Pro Core v1',
          license: 'CC0',
          packs: [...CORE_PACK_IDS],
        },
      }
    }
    return this.manifest
  }

  async loadPack(packId: string): Promise<InstrumentPackDefinition | null> {
    const cached = this.packs.get(packId)
    if (cached) return cached

    const pending = this.packLoads.get(packId)
    if (pending) return pending

    const promise = (async () => {
      try {
        const res = await fetch(`${PACKS_BASE}/${packId}.json`)
        if (!res.ok) return null
        const def = (await res.json()) as InstrumentPackDefinition
        this.packs.set(packId, def)
        return def
      } catch {
        return null
      } finally {
        this.packLoads.delete(packId)
      }
    })()

    this.packLoads.set(packId, promise)
    return promise
  }

  async ensurePacks(ctx: AudioContext, packIds: string[]): Promise<void> {
    const unique = [...new Set(packIds)]
    await Promise.all(
      unique.map(async (id) => {
        const def = await this.loadPack(id)
        if (def && (def.samples || def.root_notes)) {
          await this.loadSamplesForPack(ctx, def)
        }
      })
    )
  }

  async ensureCorePack(ctx: AudioContext): Promise<void> {
    const manifest = await this.getManifest()
    await this.ensurePacks(ctx, manifest.bundled.packs)
  }

  private sampleUrl(def: InstrumentPackDefinition, file: string): string {
    const base = def.baseUrl ?? `${PACKS_BASE}/${def.id}/`
    return `${base}${file}`
  }

  private async loadSamplesForPack(ctx: AudioContext, def: InstrumentPackDefinition): Promise<void> {
    const files = new Set<string>()

    if (def.samples) {
      for (const entry of Object.values(def.samples)) {
        files.add(entry.file)
      }
    }
    if (def.root_notes) {
      for (const root of def.root_notes) {
        files.add(root.file)
      }
    }

    await Promise.all(
      [...files].map(async (file) => {
        const key = bufferKey(def.id, file)
        if (this.buffers.has(key)) return
        try {
          const res = await fetch(this.sampleUrl(def, file))
          if (!res.ok) return
          const data = await res.arrayBuffer()
          this.buffers.set(key, await ctx.decodeAudioData(data))
        } catch {
          /* missing file — synth fallback at play time */
        }
      })
    )
  }

  private playBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    when: number,
    gain: number,
    playbackRate = 1
  ): void {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = playbackRate
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(Math.max(gain, 0.0001), when)
    source.connect(gainNode)
    gainNode.connect(ctx.destination)
    source.start(when)
  }

  private playSynthPitched(
    ctx: AudioContext,
    midi: number,
    when: number,
    durationSec: number,
    config: NonNullable<InstrumentPackDefinition['synth']>
  ): void {
    const semitones = config.semitoneOffset ?? 0
    const freq = midiToHz(midi + semitones)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = config.waveform
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    const peak = config.gain ?? 0.2
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.min(durationSec * 0.85, 1.2))
    osc.start(when)
    osc.stop(when + Math.min(durationSec, 1.5) + 0.05)
  }

  private noiseBurst(ctx: AudioContext, when: number, duration: number, peak: number): void {
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(when)
    source.stop(when + duration + 0.05)
  }

  private playSynthDrumVoice(ctx: AudioContext, voice: MusicNotationDrumVoice, when: number): void {
    switch (voice) {
      case 'kick': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(150, when)
        osc.frequency.exponentialRampToValueAtTime(48, when + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.0001, when)
        gain.gain.exponentialRampToValueAtTime(0.7, when + 0.002)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.25)
        osc.start(when)
        osc.stop(when + 0.3)
        break
      }
      case 'snare':
        this.noiseBurst(ctx, when, 0.12, 0.35)
        break
      case 'hihat':
        this.noiseBurst(ctx, when, 0.04, 0.12)
        break
      case 'tom': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(180, when)
        osc.frequency.exponentialRampToValueAtTime(90, when + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.0001, when)
        gain.gain.exponentialRampToValueAtTime(0.4, when + 0.002)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18)
        osc.start(when)
        osc.stop(when + 0.22)
        break
      }
      case 'crash':
        this.noiseBurst(ctx, when, 0.35, 0.25)
        break
      case 'ride':
        this.noiseBurst(ctx, when, 0.08, 0.15)
        break
    }
  }

  private playMelodicRoots(
    ctx: AudioContext,
    def: InstrumentPackDefinition,
    targetMidi: number,
    when: number
  ): boolean {
    const roots = def.root_notes
    if (!roots?.length) return false

    let best = roots[0]
    let bestDist = Infinity
    for (const root of roots) {
      const dist = Math.abs(root.midi - targetMidi)
      if (dist < bestDist) {
        bestDist = dist
        best = root
      }
    }

    const buffer = this.buffers.get(bufferKey(def.id, best.file))
    if (!buffer) return false

    const playbackRate = Math.pow(2, (targetMidi - best.midi) / 12)
    this.playBuffer(ctx, buffer, when, best.gain ?? 0.85, playbackRate)
    return true
  }

  packSamplesLoaded(packId: string): boolean {
    const def = this.packs.get(packId)
    if (!def?.samples) return false
    return Object.values(def.samples).every((entry) => this.buffers.has(bufferKey(packId, entry.file)))
  }

  private playDrumSample(
    ctx: AudioContext,
    def: InstrumentPackDefinition,
    sampleKey: string,
    when: number,
    gainMultiplier = 1
  ): boolean {
    const mapping = def.samples?.[sampleKey]
    if (!mapping) return false
    const buffer = this.buffers.get(bufferKey(def.id, mapping.file))
    if (!buffer) return false
    this.playBuffer(ctx, buffer, when, (mapping.gain ?? 1) * gainMultiplier)
    return true
  }

  private playSynthSequencerDrumVoice(ctx: AudioContext, voice: DrumVoiceId, hit: DrumHit, when: number): void {
    const notationVoice: MusicNotationDrumVoice =
      voice === 'tom_14' || voice === 'tom_16' ? 'tom' : voice
    this.playSynthDrumVoice(ctx, notationVoice, when)
    if (voice === 'snare' && hit === 'ghost') {
      /* ghost snare synth is quieter — scale via a second noise burst would duplicate logic */
    }
  }

  playNote(
    ctx: AudioContext,
    instrument: MusicNotationInstrument,
    options: {
      when: number
      durationSec?: number
      pitch?: MusicNotationPitch
      voice?: MusicNotationDrumVoice
    }
  ): void {
    const packId = packIdForNotationInstrument(instrument)
    let def = this.packs.get(packId)
    if (!def) def = this.packs.get('practice_piano_light')
    if (!def) {
      void this.loadPack(packId).then((loaded) => {
        if (loaded) this.playNote(ctx, instrument, options)
      })
      return
    }

    const { when, durationSec = 0.5, pitch, voice } = options

    if (def.type === 'drumkit' && voice) {
      const sampleKey = NOTATION_DRUM_VOICE_ALIASES[voice] ?? voice
      if (this.playDrumSample(ctx, def, sampleKey, when)) return
      if (def.fallback === 'synth') {
        this.playSynthDrumVoice(ctx, voice, when)
      }
      return
    }

    if (def.type === 'melodic' && pitch) {
      const midi = PITCH_MIDI[pitch]
      if (this.playMelodicRoots(ctx, def, midi, when)) return
      if (def.synth) {
        this.playSynthPitched(ctx, midi, when, durationSec, def.synth)
      }
    }
  }

  /** Play a named sample from a drumkit pack (metronome, etc.) */
  playDrumkitSample(
    ctx: AudioContext,
    packId: string,
    sampleKey: string,
    when: number,
    gainMultiplier = 1
  ): boolean {
    const def = this.packs.get(packId)
    if (!def || def.type !== 'drumkit') return false
    if (this.playDrumSample(ctx, def, sampleKey, when, gainMultiplier)) return true
    if (def.fallback === 'synth') {
      if (packId === METRONOME_PACK_ID) {
        this.playMetronomeSynth(ctx, sampleKey === 'accent', when)
        return true
      }
      this.noiseBurst(ctx, when, 0.03, 0.25)
      return true
    }
    return false
  }

  playSequencerDrumVoice(ctx: AudioContext, voice: DrumVoiceId, hit: DrumHit, when: number): void {
    const def = this.packs.get(DRUM_PACK_ID)
    if (def?.type === 'drumkit') {
      const { sampleKey, gain } = pickDrumPackSample(voice, hit)
      if (this.playDrumSample(ctx, def, sampleKey, when, gain)) return
    }
    if (!def || def.fallback === 'synth') {
      this.playSynthSequencerDrumVoice(ctx, voice, hit, when)
    }
  }

  playMetronomeBeat(ctx: AudioContext, accent: boolean, when: number): void {
    const key = accent ? 'accent' : 'click'
    if (this.playDrumkitSample(ctx, METRONOME_PACK_ID, key, when)) return
    this.playMetronomeSynth(ctx, accent, when)
  }

  private playMetronomeSynth(ctx: AudioContext, accent: boolean, when: number): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = accent ? 1200 : 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(accent ? 0.38 : 0.24, when)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045)
    osc.start(when)
    osc.stop(when + 0.05)
  }
}

let sampler: InstrumentSampler | null = null

export function getInstrumentSampler(): InstrumentSampler {
  if (!sampler) sampler = new InstrumentSampler()
  return sampler
}

export function pitchToMidi(pitch: MusicNotationPitch): number {
  return PITCH_MIDI[pitch]
}

export async function preloadNotationInstruments(
  ctx: AudioContext,
  instruments: MusicNotationInstrument[]
): Promise<void> {
  await getInstrumentSampler().ensurePacks(ctx, resolvePackIdsForInstruments(instruments))
}
