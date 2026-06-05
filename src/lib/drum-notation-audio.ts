import type { DrumHit, DrumNotationBlockContent, DrumVoiceId } from '../types/lesson-planning'
import { DRUM_VOICES, stepsInMeasure } from './drum-notation'
import { DRUM_PACK_ID, METRONOME_PACK_ID } from './drum-pack-playback'
import { ensureMusicAudio, getMusicAudioContext } from './music-notation-audio'
import { getInstrumentSampler } from './instrument-sampler'

export async function ensureDrumAudio(): Promise<AudioContext> {
  const ctx = await ensureMusicAudio()
  await getInstrumentSampler().ensurePacks(ctx, [DRUM_PACK_ID, METRONOME_PACK_ID])
  return ctx
}

export function playDrumVoice(voice: DrumVoiceId, hit: DrumHit = true, when?: number) {
  if (typeof window === 'undefined') return
  const ctx = getMusicAudioContext()
  if (!ctx || ctx.state !== 'running') return
  getInstrumentSampler().playSequencerDrumVoice(ctx, voice, hit, when ?? ctx.currentTime)
}

export async function previewDrumVoice(voice: DrumVoiceId) {
  await ensureDrumAudio()
  playDrumVoice(voice, true)
}

export interface PlayNotationOptions {
  bpm?: number
  /** Percentage of bpm (student practice speed). Default 100. */
  speedPercent?: number
  loop?: boolean
  metronome?: boolean
  countInBars?: 0 | 1 | 2
  signal?: AbortSignal
  onStep?: (globalStepIndex: number) => void
  onCountInBeat?: (beatIndex: number, totalBeats: number) => void
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const id = window.setTimeout(() => resolve(), ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

async function playCountIn(
  ctx: AudioContext,
  beatsPerMeasure: number,
  countInBars: number,
  bpm: number,
  startAt: number,
  signal?: AbortSignal,
  onCountInBeat?: (beatIndex: number, totalBeats: number) => void
): Promise<number> {
  const totalBeats = beatsPerMeasure * countInBars
  if (totalBeats <= 0) return 0

  const beatMs = 60_000 / bpm
  const beatSec = beatMs / 1000
  const sampler = getInstrumentSampler()

  for (let b = 0; b < totalBeats; b++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const when = startAt + b * beatSec
    sampler.playMetronomeBeat(ctx, b % beatsPerMeasure === 0, when)
    onCountInBeat?.(b, totalBeats)
    await wait(beatMs, signal)
  }

  return totalBeats * beatSec
}

export async function playNotationSequence(content: DrumNotationBlockContent, options: PlayNotationOptions = {}) {
  const ctx = await ensureDrumAudio()
  const sampler = getInstrumentSampler()
  const baseBpm = options.bpm ?? content.playback_bpm ?? 90
  const speedPercent = options.speedPercent ?? 100
  const bpm = Math.round((baseBpm * speedPercent) / 100)
  const spb = content.steps_per_beat
  const stepMs = 60_000 / bpm / spb
  const loop = options.loop ?? content.playback_loop ?? true
  const metronome = options.metronome ?? content.playback_metronome !== false
  const countInBars = options.countInBars ?? content.playback_count_in ?? 1
  let firstPass = true

  do {
    const startAt = ctx.currentTime + 0.05
    let grooveStart = startAt

    if (firstPass && countInBars > 0) {
      const countInSec = await playCountIn(
        ctx,
        content.beats_per_measure,
        countInBars,
        bpm,
        startAt,
        options.signal,
        options.onCountInBeat
      )
      grooveStart = startAt + countInSec
      firstPass = false
    } else {
      firstPass = false
    }

    let globalIndex = 0

    for (const measure of content.measures) {
      for (let si = 0; si < measure.steps.length; si++) {
        if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')

        const step = measure.steps[si] ?? {}
        const when = grooveStart + globalIndex * (stepMs / 1000)
        options.onStep?.(globalIndex)

        if (metronome && si % spb === 0) {
          const beatInMeasure = Math.floor(si / spb)
          sampler.playMetronomeBeat(ctx, beatInMeasure === 0, when)
        }

        for (const voice of DRUM_VOICES) {
          const hit = step[voice.id]
          if (hit) sampler.playSequencerDrumVoice(ctx, voice.id, hit, when)
        }

        globalIndex++
        await wait(stepMs, options.signal)
      }
    }
  } while (loop && !options.signal?.aborted)
}

export function totalNotationSteps(content: DrumNotationBlockContent): number {
  const perMeasure = stepsInMeasure(content.beats_per_measure, content.steps_per_beat)
  return content.measures.length * perMeasure
}
