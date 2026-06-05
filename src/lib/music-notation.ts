import type {

  MusicNotationBlockContent,

  MusicNotationClef,

  MusicNotationDrumVoice,

  MusicNotationDuration,

  MusicNotationInstrument,

  MusicNotationKeySignature,

  MusicNotationMeasure,

  MusicNotationNote,

  MusicNotationPitch,

  MusicNotationTimeSignature,

  MusicNotationTrack,

} from '../types/lesson-planning'



export const MUSIC_NOTATION_INSTRUMENTS: { value: MusicNotationInstrument; label: string }[] = [

  { value: 'piano', label: 'Piano' },

  { value: 'guitar', label: 'Guitar' },

  { value: 'bass', label: 'Bass' },

  { value: 'drums', label: 'Drums' },

  { value: 'voice', label: 'Voice' },

]



export const MUSIC_TIME_SIGNATURES: MusicNotationTimeSignature[] = ['4/4', '3/4', '6/8']



export const MUSIC_KEY_SIGNATURES: MusicNotationKeySignature[] = [

  'C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb',

]



export const MUSIC_NOTATION_DURATIONS: MusicNotationDuration[] = [

  'whole', 'half', 'quarter', 'eighth', 'sixteenth',

]



export const MUSIC_NOTATION_PITCHES: MusicNotationPitch[] = [

  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',

]



export const MUSIC_DRUM_VOICES: { value: MusicNotationDrumVoice; label: string }[] = [

  { value: 'kick', label: 'Kick' },

  { value: 'snare', label: 'Snare' },

  { value: 'hihat', label: 'Hi-Hat' },

  { value: 'tom', label: 'Tom' },

  { value: 'crash', label: 'Crash' },

  { value: 'ride', label: 'Ride' },

]



export const MEASURES_PER_SYSTEM_OPTIONS = [2, 3, 4, 6, 8] as const



export const DURATION_TOOLS = [

  { id: 'select' as const, label: 'Select', icon: 'bi-cursor' },

  { id: 'whole' as const, label: 'Whole', icon: 'bi-circle' },

  { id: 'half' as const, label: 'Half', icon: 'bi-circle-half' },

  { id: 'quarter' as const, label: 'Quarter', icon: 'bi-music-note' },

  { id: 'eighth' as const, label: 'Eighth', icon: 'bi-music-note-beamed' },

  { id: 'sixteenth' as const, label: '16th', icon: 'bi-music-note-list' },

  { id: 'rest' as const, label: 'Rest', icon: 'bi-pause' },

]



export type MusicNotationEditorTool = (typeof DURATION_TOOLS)[number]['id']



const INSTRUMENT_LABELS: Record<MusicNotationInstrument, string> = {

  piano: 'Piano',

  guitar: 'Guitar',

  bass: 'Bass',

  drums: 'Drums',

  voice: 'Voice',

}



export const DEFAULT_CLEF: Record<MusicNotationInstrument, MusicNotationClef> = {

  piano: 'treble',

  guitar: 'treble',

  bass: 'bass',

  drums: 'percussion',

  voice: 'treble',

}



const DURATION_BEATS: Record<MusicNotationDuration, number> = {

  whole: 4,

  half: 2,

  quarter: 1,

  eighth: 0.5,

  sixteenth: 0.25,

}



const DEFAULT_MEASURES_PER_SYSTEM = 4

const DEFAULT_MEASURE_COUNT = 4



export function durationToBeats(duration: MusicNotationDuration): number {

  return DURATION_BEATS[duration]

}



export function isDrumsInstrument(instrument: MusicNotationInstrument): boolean {

  return instrument === 'drums'

}



export function newId(prefix: string): string {

  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`

}



export function newMeasure(): MusicNotationMeasure {

  return { id: newId('measure'), notes: [] }

}



export function newTrack(instrument: MusicNotationInstrument, measureCount = DEFAULT_MEASURE_COUNT): MusicNotationTrack {

  return {

    id: newId('track'),

    name: INSTRUMENT_LABELS[instrument],

    instrument,

    clef: DEFAULT_CLEF[instrument],

    measures: Array.from({ length: measureCount }, () => newMeasure()),

  }

}



export function defaultMusicNotationContent(): MusicNotationBlockContent {

  return {

    title: 'Notation',

    instrument: 'piano',

    tempo: 90,

    timeSignature: '4/4',

    keySignature: 'C',

    caption: '',

    notationData: {

      version: 1,

      measuresPerSystem: DEFAULT_MEASURES_PER_SYSTEM,

      tracks: [newTrack('piano')],

    },

    playback_loop: false,

  }

}



function normalizeNote(raw: unknown, instrument: MusicNotationInstrument): MusicNotationNote | null {

  if (!raw || typeof raw !== 'object') return null

  const n = raw as Record<string, unknown>

  const duration = MUSIC_NOTATION_DURATIONS.includes(n.duration as MusicNotationDuration)

    ? (n.duration as MusicNotationDuration)

    : 'quarter'

  const type = n.type === 'rest' ? 'rest' : 'note'

  const startBeat = typeof n.startBeat === 'number' && n.startBeat >= 1 ? n.startBeat : 1



  const note: MusicNotationNote = {

    id: typeof n.id === 'string' ? n.id : newId('note'),

    type,

    duration,

    startBeat,

  }



  if (type === 'note') {

    if (isDrumsInstrument(instrument)) {

      note.voice = MUSIC_DRUM_VOICES.find((v) => v.value === n.voice)?.value ?? 'snare'

    } else {

      note.pitch = MUSIC_NOTATION_PITCHES.includes(n.pitch as MusicNotationPitch)

        ? (n.pitch as MusicNotationPitch)

        : 'C4'

    }

  }



  return note

}



function normalizeMeasure(raw: unknown, instrument: MusicNotationInstrument): MusicNotationMeasure {

  if (!raw || typeof raw !== 'object') return newMeasure()

  const m = raw as Record<string, unknown>

  const notes = Array.isArray(m.notes)

    ? m.notes

        .map((n) => normalizeNote(n, instrument))

        .filter((n): n is MusicNotationNote => n !== null)

    : []

  return {

    id: typeof m.id === 'string' ? m.id : newId('measure'),

    notes,

  }

}



function syncTrackMeasureCounts(tracks: MusicNotationTrack[]): MusicNotationTrack[] {

  const maxMeasures = Math.max(1, ...tracks.map((t) => t.measures.length))

  return tracks.map((track) => {

    if (track.measures.length >= maxMeasures) return track

    const extra = Array.from({ length: maxMeasures - track.measures.length }, () => newMeasure())

    return { ...track, measures: [...track.measures, ...extra] }

  })

}



export function normalizeMusicNotationContent(raw: unknown): MusicNotationBlockContent {

  const defaults = defaultMusicNotationContent()

  if (!raw || typeof raw !== 'object') return defaults



  const c = raw as Record<string, unknown>

  const instrument = MUSIC_NOTATION_INSTRUMENTS.some((i) => i.value === c.instrument)

    ? (c.instrument as MusicNotationInstrument)

    : defaults.instrument

  const timeSignature = MUSIC_TIME_SIGNATURES.includes(c.timeSignature as MusicNotationTimeSignature)

    ? (c.timeSignature as MusicNotationTimeSignature)

    : defaults.timeSignature

  const keySignature = MUSIC_KEY_SIGNATURES.includes(c.keySignature as MusicNotationKeySignature)

    ? (c.keySignature as MusicNotationKeySignature)

    : defaults.keySignature



  let tracks: MusicNotationTrack[] = [newTrack(instrument)]

  let measuresPerSystem = DEFAULT_MEASURES_PER_SYSTEM

  const nd = c.notationData

  if (nd && typeof nd === 'object') {

    const data = nd as Record<string, unknown>

    if (typeof data.measuresPerSystem === 'number' && data.measuresPerSystem >= 2) {

      measuresPerSystem = data.measuresPerSystem

    }

    if (Array.isArray(data.tracks) && data.tracks.length > 0) {

      tracks = data.tracks.map((t) => {

        const tr = t as Record<string, unknown>

        const trInstrument = MUSIC_NOTATION_INSTRUMENTS.some((inst) => inst.value === tr.instrument)

          ? (tr.instrument as MusicNotationInstrument)

          : instrument

        let measures = Array.isArray(tr.measures)

          ? tr.measures.map((m) => normalizeMeasure(m, trInstrument))

          : [newMeasure()]

        if (measures.length === 0) measures = [newMeasure()]

        return {

          id: typeof tr.id === 'string' ? tr.id : newId('track'),

          name: typeof tr.name === 'string' ? tr.name : INSTRUMENT_LABELS[trInstrument],

          instrument: trInstrument,

          clef:

            tr.clef === 'treble' || tr.clef === 'bass' || tr.clef === 'percussion'

              ? tr.clef

              : DEFAULT_CLEF[trInstrument],

          measures,

        }

      })

      tracks = syncTrackMeasureCounts(tracks)

    }

  }



  return {

    title: typeof c.title === 'string' ? c.title : defaults.title,

    instrument: tracks[0]?.instrument ?? instrument,

    tempo: typeof c.tempo === 'number' ? Math.min(240, Math.max(40, c.tempo)) : defaults.tempo,

    timeSignature,

    keySignature,

    caption: typeof c.caption === 'string' ? c.caption : '',

    notationData: { version: 1, tracks, measuresPerSystem },

    playback_loop: c.playback_loop === true,

  }

}



export function instrumentLabel(instrument: MusicNotationInstrument): string {

  return INSTRUMENT_LABELS[instrument]

}



export function beatsPerMeasure(timeSignature: MusicNotationTimeSignature): number {

  switch (timeSignature) {

    case '3/4':

      return 3

    case '6/8':

      return 6

    default:

      return 4

  }

}



export function getTracks(content: MusicNotationBlockContent): MusicNotationTrack[] {

  return content.notationData.tracks.length > 0

    ? content.notationData.tracks

    : [newTrack(content.instrument)]

}



export function getPrimaryTrack(content: MusicNotationBlockContent): MusicNotationTrack {

  return getTracks(content)[0] ?? newTrack(content.instrument)

}



export function getMeasuresPerSystem(content: MusicNotationBlockContent): number {

  return content.notationData.measuresPerSystem ?? DEFAULT_MEASURES_PER_SYSTEM

}



export function updateTracks(

  content: MusicNotationBlockContent,

  tracks: MusicNotationTrack[]

): MusicNotationBlockContent {

  const synced = syncTrackMeasureCounts(tracks)

  return {

    ...content,

    instrument: synced[0]?.instrument ?? content.instrument,

    notationData: { ...content.notationData, tracks: synced },

  }

}



export function updateTrackAt(

  content: MusicNotationBlockContent,

  trackIndex: number,

  track: MusicNotationTrack

): MusicNotationBlockContent {

  const tracks = getTracks(content).map((t, i) => (i === trackIndex ? track : t))

  return updateTracks(content, tracks)

}



export function setMeasuresPerSystem(

  content: MusicNotationBlockContent,

  measuresPerSystem: number

): MusicNotationBlockContent {

  return {

    ...content,

    notationData: {

      ...content.notationData,

      measuresPerSystem: Math.max(2, Math.min(8, measuresPerSystem)),

    },

  }

}



export function addTrack(

  content: MusicNotationBlockContent,

  instrument: MusicNotationInstrument = 'piano'

): MusicNotationBlockContent {

  const existing = getTracks(content)

  const measureCount = Math.max(1, ...existing.map((t) => t.measures.length))

  return updateTracks(content, [...existing, newTrack(instrument, measureCount)])

}



export function removeTrack(content: MusicNotationBlockContent, trackIndex: number): MusicNotationBlockContent {

  const tracks = getTracks(content)

  if (tracks.length <= 1) return content

  return updateTracks(

    content,

    tracks.filter((_, i) => i !== trackIndex)

  )

}



export function setTrackInstrument(

  content: MusicNotationBlockContent,

  trackIndex: number,

  instrument: MusicNotationInstrument

): MusicNotationBlockContent {

  const track = getTracks(content)[trackIndex]

  if (!track) return content

  return updateTrackAt(content, trackIndex, {

    ...track,

    instrument,

    name: INSTRUMENT_LABELS[instrument],

    clef: DEFAULT_CLEF[instrument],

    measures: track.measures.map((m) => ({

      ...m,

      notes: m.notes.map((n) => {

        if (n.type === 'rest') return n

        if (isDrumsInstrument(instrument)) {

          return { ...n, voice: n.voice ?? 'snare', pitch: undefined }

        }

        return { ...n, pitch: n.pitch ?? 'C4', voice: undefined }

      }),

    })),

  })

}



export function snapStartBeat(beat: number, duration: MusicNotationDuration, beatsInMeasure: number): number {

  const step = durationToBeats(duration)

  const snapped = Math.round((beat - 1) / step) * step + 1

  const maxStart = Math.max(1, beatsInMeasure - step + 1)

  return Math.min(Math.max(1, snapped), maxStart)

}



function notesAtSameBeatConflict(
  track: MusicNotationTrack,
  incoming: Pick<MusicNotationNote, 'type' | 'pitch' | 'voice'>,
  existing: MusicNotationNote,
  snappedBeat: number
): boolean {
  if (existing.startBeat !== snappedBeat) return false
  if (incoming.type === 'rest' || existing.type === 'rest') return true
  if (isDrumsInstrument(track.instrument)) {
    return (existing.voice ?? 'snare') === (incoming.voice ?? 'snare')
  }
  return (existing.pitch ?? 'C4') === (incoming.pitch ?? 'C4')
}



function mapAllTracks(

  content: MusicNotationBlockContent,

  fn: (track: MusicNotationTrack, index: number) => MusicNotationTrack

): MusicNotationBlockContent {

  return updateTracks(content, getTracks(content).map(fn))

}



export function addMeasure(content: MusicNotationBlockContent): MusicNotationBlockContent {

  return mapAllTracks(content, (track) => ({

    ...track,

    measures: [...track.measures, newMeasure()],

  }))

}



export function duplicateMeasure(content: MusicNotationBlockContent, index: number): MusicNotationBlockContent {

  return mapAllTracks(content, (track) => {

    const source = track.measures[index]

    if (!source) return track

    const copy: MusicNotationMeasure = {

      id: newId('measure'),

      notes: source.notes.map((n) => ({ ...n, id: newId('note') })),

    }

    const measures = [...track.measures]

    measures.splice(index + 1, 0, copy)

    return { ...track, measures }

  })

}



export function deleteMeasure(content: MusicNotationBlockContent, index: number): MusicNotationBlockContent {

  const tracks = getTracks(content)

  if (tracks[0]?.measures.length <= 1) return content

  return mapAllTracks(content, (track) => ({

    ...track,

    measures: track.measures.filter((_, i) => i !== index),

  }))

}



export function clearMeasure(content: MusicNotationBlockContent, index: number): MusicNotationBlockContent {

  return mapAllTracks(content, (track) => ({

    ...track,

    measures: track.measures.map((m, i) => (i === index ? { ...m, notes: [] } : m)),

  }))

}



export function upsertNote(

  content: MusicNotationBlockContent,

  trackIndex: number,

  measureIndex: number,

  note: Omit<MusicNotationNote, 'id'> & { id?: string }

): MusicNotationBlockContent {

  const track = getTracks(content)[trackIndex]

  if (!track) return content

  const beatsInMeasure = beatsPerMeasure(content.timeSignature)
  const snapped = snapStartBeat(note.startBeat, note.duration, beatsInMeasure)

  const measures = track.measures.map((m, mi) => {

    if (mi !== measureIndex) return m

    const id = note.id ?? newId('note')

    const entry: MusicNotationNote = { ...note, id, startBeat: snapped }

    const filtered = m.notes.filter(
      (n) => n.id !== id && !notesAtSameBeatConflict(track, entry, n, snapped)
    )

    return { ...m, notes: [...filtered, entry].sort((a, b) => a.startBeat - b.startBeat) }

  })

  return updateTrackAt(content, trackIndex, { ...track, measures })

}



export function deleteNote(

  content: MusicNotationBlockContent,

  trackIndex: number,

  measureIndex: number,

  noteId: string

): MusicNotationBlockContent {

  const track = getTracks(content)[trackIndex]

  if (!track) return content

  const measures = track.measures.map((m, mi) =>

    mi === measureIndex ? { ...m, notes: m.notes.filter((n) => n.id !== noteId) } : m

  )

  return updateTrackAt(content, trackIndex, { ...track, measures })

}

export function deleteNotes(
  content: MusicNotationBlockContent,
  noteIds: readonly string[]
): MusicNotationBlockContent {
  if (noteIds.length === 0) return content
  const idSet = new Set(noteIds)
  let result = content
  getTracks(content).forEach((track, trackIndex) => {
    const measures = track.measures.map((m) => ({
      ...m,
      notes: m.notes.filter((n) => !idSet.has(n.id)),
    }))
    const changed = measures.some((m, i) => m.notes.length !== track.measures[i].notes.length)
    if (changed) {
      result = updateTrackAt(result, trackIndex, { ...track, measures })
    }
  })
  return result
}

export function getAllNoteIds(content: MusicNotationBlockContent): string[] {
  const ids: string[] = []
  getTracks(content).forEach((track) => {
    track.measures.forEach((measure) => {
      measure.notes.forEach((note) => ids.push(note.id))
    })
  })
  return ids
}

export function moveNoteGroup(
  content: MusicNotationBlockContent,
  noteIds: readonly string[],
  primaryNoteId: string,
  to: {
    trackIndex: number
    measureIndex: number
    startBeat: number
    pitch?: MusicNotationPitch
    voice?: MusicNotationDrumVoice
  }
): MusicNotationBlockContent | null {
  const primary = findNote(content, primaryNoteId)
  if (!primary || !noteIds.includes(primaryNoteId)) return null

  const primaryMoved = moveNote(
    content,
    {
      trackIndex: primary.trackIndex,
      measureIndex: primary.measureIndex,
      noteId: primaryNoteId,
    },
    to
  )
  if (!primaryMoved) return null

  const dTrack = to.trackIndex - primary.trackIndex
  const dMeasure = to.measureIndex - primary.measureIndex
  const dBeat = to.startBeat - primary.note.startBeat
  const beatsInMeasure = beatsPerMeasure(content.timeSignature)

  let result = primaryMoved
  for (const noteId of noteIds) {
    if (noteId === primaryNoteId) continue
    const found = findNote(content, noteId)
    if (!found) continue

    const targetTrackIndex = found.trackIndex + dTrack
    const targetMeasureIndex = found.measureIndex + dMeasure
    const targetTrack = getTracks(result)[targetTrackIndex]
    if (!targetTrack || targetMeasureIndex < 0 || targetMeasureIndex >= targetTrack.measures.length) {
      continue
    }

    const moved = moveNote(
      result,
      {
        trackIndex: found.trackIndex,
        measureIndex: found.measureIndex,
        noteId,
      },
      {
        trackIndex: targetTrackIndex,
        measureIndex: targetMeasureIndex,
        startBeat: snapStartBeat(found.note.startBeat + dBeat, found.note.duration, beatsInMeasure),
        pitch: found.note.pitch,
        voice: found.note.voice,
      }
    )
    if (moved) result = moved
  }

  return result
}



export function canPlaceNote(
  content: MusicNotationBlockContent,
  trackIndex: number,
  measureIndex: number,
  note: Pick<MusicNotationNote, 'id' | 'duration' | 'startBeat' | 'type'>
): boolean {
  const track = getTracks(content)[trackIndex]
  if (!track || measureIndex < 0 || measureIndex >= track.measures.length) return false

  const beatsInMeasure = beatsPerMeasure(content.timeSignature)
  const snapped = snapStartBeat(note.startBeat, note.duration, beatsInMeasure)
  const span = durationToBeats(note.duration)
  if (snapped + span - 1 > beatsInMeasure + 0.001) return false

  const measure = track.measures[measureIndex]
  const incoming = { ...note, startBeat: snapped }
  return !measure.notes.some(
    (n) => n.id !== note.id && notesAtSameBeatConflict(track, incoming, n, snapped)
  )
}



export function moveNote(
  content: MusicNotationBlockContent,
  from: { trackIndex: number; measureIndex: number; noteId: string },
  to: {
    trackIndex: number
    measureIndex: number
    startBeat: number
    pitch?: MusicNotationPitch
    voice?: MusicNotationDrumVoice
  }
): MusicNotationBlockContent | null {
  const found = findNote(content, from.noteId)
  if (!found || found.trackIndex !== from.trackIndex || found.measureIndex !== from.measureIndex) {
    return null
  }

  const note = found.note
  const tracks = getTracks(content)
  const targetTrack = tracks[to.trackIndex]
  if (!targetTrack || to.measureIndex < 0 || to.measureIndex >= targetTrack.measures.length) {
    return null
  }

  const beatsInMeasure = beatsPerMeasure(content.timeSignature)
  const snappedBeat = snapStartBeat(to.startBeat, note.duration, beatsInMeasure)

  let updated: MusicNotationNote = { ...note, startBeat: snappedBeat }

  if (note.type === 'note') {
    if (isDrumsInstrument(targetTrack.instrument)) {
      if (!to.voice) return null
      updated = { ...updated, voice: to.voice, pitch: undefined }
    } else {
      if (!to.pitch) return null
      updated = { ...updated, pitch: to.pitch, voice: undefined }
    }
  }

  if (!canPlaceNote(content, to.trackIndex, to.measureIndex, updated)) {
    return null
  }

  if (from.trackIndex === to.trackIndex && from.measureIndex === to.measureIndex) {
    return upsertNote(content, from.trackIndex, from.measureIndex, updated)
  }

  const without = deleteNote(content, from.trackIndex, from.measureIndex, from.noteId)
  return upsertNote(without, to.trackIndex, to.measureIndex, { ...updated, id: note.id })
}



export function findNote(

  content: MusicNotationBlockContent,

  noteId: string

): { trackIndex: number; measureIndex: number; note: MusicNotationNote } | null {

  const tracks = getTracks(content)

  for (let ti = 0; ti < tracks.length; ti++) {

    for (let mi = 0; mi < tracks[ti].measures.length; mi++) {

      const note = tracks[ti].measures[mi].notes.find((n) => n.id === noteId)

      if (note) return { trackIndex: ti, measureIndex: mi, note }

    }

  }

  return null

}



export interface PlaybackEvent {

  trackIndex: number

  instrument: MusicNotationInstrument

  measureIndex: number

  startBeat: number

  globalBeat: number

  note: MusicNotationNote

  timeSec: number

  durationSec: number

}



export function buildPlaybackEvents(content: MusicNotationBlockContent): PlaybackEvent[] {

  const tracks = getTracks(content)

  const bpm = content.tempo

  const secPerBeat = 60 / bpm

  const beatsInMeasure = beatsPerMeasure(content.timeSignature)

  const events: PlaybackEvent[] = []



  tracks.forEach((track, trackIndex) => {

    track.measures.forEach((measure, measureIndex) => {

      measure.notes.forEach((note) => {

        const globalBeat = measureIndex * beatsInMeasure + note.startBeat

        events.push({

          trackIndex,

          instrument: track.instrument,

          measureIndex,

          startBeat: note.startBeat,

          globalBeat,

          note,

          timeSec: (globalBeat - 1) * secPerBeat,

          durationSec: durationToBeats(note.duration) * secPerBeat,

        })

      })

    })

  })



  return events.sort((a, b) => a.timeSec - b.timeSec)

}



export function totalDurationSec(content: MusicNotationBlockContent): number {

  const events = buildPlaybackEvents(content)

  if (events.length === 0) {

    const track = getPrimaryTrack(content)

    const bpm = content.tempo

    return (track.measures.length * beatsPerMeasure(content.timeSignature) * 60) / bpm

  }

  const last = events[events.length - 1]

  return last.timeSec + last.durationSec

}



export function notationHasEntries(content: MusicNotationBlockContent): boolean {

  return getTracks(content).some((t) => t.measures.some((m) => m.notes.length > 0))

}



/** @deprecated Use updateTrackAt */

export function updatePrimaryTrack(

  content: MusicNotationBlockContent,

  track: MusicNotationTrack

): MusicNotationBlockContent {

  return updateTrackAt(content, 0, track)

}


