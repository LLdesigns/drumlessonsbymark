import type {
  DrumHit,
  DrumNotationBlockContent,
  DrumNotationMeasure,
  DrumStep,
  DrumVoiceId,
} from '../types/lesson-planning'

export type DrumVoiceKind = 'cymbal' | 'snare' | 'tom' | 'kick'

export interface DrumVoiceMeta {
  id: DrumVoiceId
  label: string
  short: string
  kind: DrumVoiceKind
}

/** Top-to-bottom kit order in the editor grid */
export const DRUM_VOICES: DrumVoiceMeta[] = [
  { id: 'crash', label: 'Crash cymbal', short: 'Cr', kind: 'cymbal' },
  { id: 'ride', label: 'Ride cymbal', short: 'Rd', kind: 'cymbal' },
  { id: 'hihat', label: 'Hi-hat', short: 'HH', kind: 'cymbal' },
  { id: 'snare', label: 'Snare', short: 'SN', kind: 'snare' },
  { id: 'tom', label: 'Tom', short: 'T1', kind: 'tom' },
  { id: 'tom_14', label: 'Tom 14"', short: '14"', kind: 'tom' },
  { id: 'tom_16', label: 'Tom 16"', short: '16"', kind: 'tom' },
  { id: 'kick', label: 'Kick', short: 'BD', kind: 'kick' },
]

const VOICE_IDS = new Set(DRUM_VOICES.map((v) => v.id))

export function getDrumVoiceMeta(id: DrumVoiceId): DrumVoiceMeta | undefined {
  return DRUM_VOICES.find((v) => v.id === id)
}

export function stepsInMeasure(beatsPerMeasure: number, stepsPerBeat: number): number {
  return Math.max(1, beatsPerMeasure) * Math.max(1, stepsPerBeat)
}

export function emptySteps(beatsPerMeasure: number, stepsPerBeat: number): DrumStep[] {
  return Array.from({ length: stepsInMeasure(beatsPerMeasure, stepsPerBeat) }, () => ({}))
}

export function newMeasure(beatsPerMeasure: number, stepsPerBeat: number): DrumNotationMeasure {
  return { id: crypto.randomUUID(), steps: emptySteps(beatsPerMeasure, stepsPerBeat) }
}

export function cloneMeasure(measure: DrumNotationMeasure): DrumNotationMeasure {
  return {
    id: crypto.randomUUID(),
    steps: measure.steps.map((step) => ({ ...step })),
  }
}

export function duplicateMeasureAt(measures: DrumNotationMeasure[], index: number): DrumNotationMeasure[] {
  if (index < 0 || index >= measures.length) return measures
  const copy = cloneMeasure(measures[index])
  return [...measures.slice(0, index + 1), copy, ...measures.slice(index + 1)]
}

export function insertMeasureAt(
  measures: DrumNotationMeasure[],
  index: number,
  measure: DrumNotationMeasure
): DrumNotationMeasure[] {
  const at = Math.max(0, Math.min(index + 1, measures.length))
  return [...measures.slice(0, at), measure, ...measures.slice(at)]
}

export function defaultDrumNotationContent(): DrumNotationBlockContent {
  return {
    beats_per_measure: 4,
    steps_per_beat: 4,
    measures: [newMeasure(4, 4)],
    caption: '',
    playback_bpm: 90,
    playback_loop: true,
    playback_metronome: true,
    playback_count_in: 1,
  }
}

export function normalizeDrumNotationContent(raw: unknown): DrumNotationBlockContent {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<DrumNotationBlockContent>
  const beats = c.beats_per_measure === 3 ? 3 : 4
  const stepsPerBeat: 2 | 4 = c.steps_per_beat === 2 ? 2 : 4
  const stepCount = stepsInMeasure(beats, stepsPerBeat)

  const measures: DrumNotationMeasure[] = (c.measures ?? []).length
    ? (c.measures ?? []).map((m) => ({
        id: m.id || crypto.randomUUID(),
        steps: normalizeSteps(m.steps, stepCount),
      }))
    : [newMeasure(beats, stepsPerBeat)]

  const playback_bpm =
    typeof c.playback_bpm === 'number' && c.playback_bpm >= 40 && c.playback_bpm <= 240
      ? Math.round(c.playback_bpm)
      : 90

  const playback_count_in: 0 | 1 | 2 =
    c.playback_count_in === 0 || c.playback_count_in === 2 ? c.playback_count_in : 1

  return {
    beats_per_measure: beats,
    steps_per_beat: stepsPerBeat,
    measures,
    caption: c.caption ?? '',
    playback_bpm,
    playback_loop: c.playback_loop !== false,
    playback_metronome: c.playback_metronome !== false,
    playback_count_in,
  }
}

function normalizeSteps(steps: DrumStep[] | undefined, count: number): DrumStep[] {
  const base = Array.isArray(steps) ? steps.slice(0, count) : []
  while (base.length < count) base.push({})
  return base.map((step) => {
    const next: DrumStep = {}
    for (const key of Object.keys(step ?? {}) as DrumVoiceId[]) {
      if (!VOICE_IDS.has(key)) continue
      const hit = step?.[key]
      if (hit === true || hit === 'accent' || hit === 'open' || hit === 'ghost') {
        next[key] = hit
      }
    }
    return next
  })
}

export function resizeMeasures(
  content: DrumNotationBlockContent,
  beatsPerMeasure: number,
  stepsPerBeat: 2 | 4
): DrumNotationBlockContent {
  const stepCount = stepsInMeasure(beatsPerMeasure, stepsPerBeat)
  return {
    ...content,
    beats_per_measure: beatsPerMeasure,
    steps_per_beat: stepsPerBeat,
    measures: content.measures.map((m) => ({
      ...m,
      steps: normalizeSteps(m.steps, stepCount),
    })),
  }
}

export function cycleHit(voice: DrumVoiceId, current?: DrumHit): DrumHit | undefined {
  const meta = getDrumVoiceMeta(voice)
  if (meta?.kind === 'snare') {
    if (!current) return true
    if (current === true) return 'accent'
    if (current === 'accent') return 'ghost'
    return undefined
  }
  if (voice === 'hihat' || voice === 'ride') {
    if (!current) return true
    if (current === true) return 'open'
    return undefined
  }
  return current ? undefined : true
}

export function measureHasNotes(measure: DrumNotationMeasure): boolean {
  return measure.steps.some((step) => DRUM_VOICES.some((v) => step[v.id]))
}

export function notationHasNotes(content: DrumNotationBlockContent): boolean {
  return content.measures.some(measureHasNotes)
}

export interface DrumGroovePreset {
  id: string
  label: string
  description: string
  build: (beats: number, stepsPerBeat: 2 | 4) => DrumNotationMeasure[]
}

function setStep(steps: DrumStep[], index: number, voice: DrumVoiceId, hit: DrumHit = true) {
  if (index < 0 || index >= steps.length) return
  steps[index] = { ...steps[index], [voice]: hit }
}

export const DRUM_GROOVE_PRESETS: DrumGroovePreset[] = [
  {
    id: 'basic-rock',
    label: 'Basic rock',
    description: 'Kick on 1 & 3, snare on 2 & 4, hi-hat eighths',
    build: (beats, stepsPerBeat) => {
      const steps = emptySteps(beats, stepsPerBeat)
      const spb = stepsPerBeat
      for (let beat = 0; beat < beats; beat++) {
        const base = beat * spb
        if (beat === 0 || beat === 2) setStep(steps, base, 'kick')
        if (beat === 1 || beat === 3) setStep(steps, base, 'snare')
        for (let sub = 0; sub < spb; sub++) {
          setStep(steps, base + sub, 'hihat')
        }
      }
      return [{ id: crypto.randomUUID(), steps }]
    },
  },
  {
    id: 'half-time',
    label: 'Half-time feel',
    description: 'Snare on beat 3, kick on 1, hi-hat eighths',
    build: (beats, stepsPerBeat) => {
      const steps = emptySteps(beats, stepsPerBeat)
      const spb = stepsPerBeat
      setStep(steps, 0, 'kick')
      setStep(steps, 2 * spb, 'snare')
      for (let beat = 0; beat < beats; beat++) {
        const base = beat * spb
        setStep(steps, base, 'hihat')
        if (stepsPerBeat >= 2) setStep(steps, base + spb / 2, 'hihat')
        if (stepsPerBeat >= 4) {
          setStep(steps, base + 1, 'hihat')
          setStep(steps, base + 3, 'hihat')
        }
      }
      return [{ id: crypto.randomUUID(), steps }]
    },
  },
  {
    id: 'empty',
    label: 'Empty bar',
    description: 'Clear measure grid',
    build: (beats, stepsPerBeat) => [newMeasure(beats, stepsPerBeat)],
  },
]

export function beatLabel(index: number, stepsPerBeat: number): string {
  const beat = Math.floor(index / stepsPerBeat) + 1
  const sub = index % stepsPerBeat
  if (stepsPerBeat === 2) return sub === 0 ? String(beat) : '&'
  if (sub === 0) return String(beat)
  if (sub === 2) return 'e'
  if (sub === 1) return 'e'
  return 'a'
}

export function globalStepIndex(measureIndex: number, stepIndex: number, stepsPerMeasure: number): number {
  return measureIndex * stepsPerMeasure + stepIndex
}
