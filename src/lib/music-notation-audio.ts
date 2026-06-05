import type { MusicNotationBlockContent } from '../types/lesson-planning'
import type { PlaybackEvent } from './music-notation'
import { getTracks } from './music-notation'
import { getInstrumentSampler, preloadNotationInstruments } from './instrument-sampler'

let sharedCtx: AudioContext | null = null

export async function ensureMusicAudio(): Promise<AudioContext> {
  if (typeof window === 'undefined') throw new Error('Audio unavailable')
  if (!sharedCtx) sharedCtx = new AudioContext()
  if (sharedCtx.state === 'suspended') await sharedCtx.resume()
  await getInstrumentSampler().ensureCorePack(sharedCtx)
  return sharedCtx
}

export async function prepareMusicAudioForContent(content: MusicNotationBlockContent): Promise<AudioContext> {
  const ctx = await ensureMusicAudio()
  const instruments = [...new Set(getTracks(content).map((t) => t.instrument))]
  await preloadNotationInstruments(ctx, instruments)
  return ctx
}

export function playNotationEvent(
  ctx: AudioContext,
  event: PlaybackEvent,
  when: number,
  speedPercent = 100
): void {
  const speed = speedPercent / 100
  const { note, instrument } = event
  if (note.type === 'rest') return

  void getInstrumentSampler().playNote(ctx, instrument, {
    when,
    durationSec: event.durationSec / speed,
    pitch: note.pitch,
    voice: note.voice,
  })
}

export function getMusicAudioContext(): AudioContext | null {
  return sharedCtx
}

export function stopMusicAudio(): void {
  if (sharedCtx) {
    void sharedCtx.close()
    sharedCtx = null
  }
}
