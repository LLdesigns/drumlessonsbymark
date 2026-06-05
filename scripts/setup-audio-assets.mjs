/**
 * Downloads teropa/drumkit samples (MIT) and generates metronome + melodic root WAVs.
 * Run: node scripts/setup-audio-assets.mjs
 */
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', 'public', 'audio')

const DRUMKIT_BASE =
  'https://raw.githubusercontent.com/teropa/drumkit/master/src/assets'

const DRUM_FILES = [
  'kick.mp3',
  'snare.mp3',
  'snare2.mp3',
  'snare3.mp3',
  'hatClosed.mp3',
  'hatOpen.mp3',
  'tomHigh.mp3',
  'tomMid.mp3',
  'tomLow.mp3',
  'crash.mp3',
  'ride.mp3',
]

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`)
  ensureDir(dirname(dest))
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
  console.log('  downloaded', dest.replace(ROOT, ''))
}

function writeWav(dest, samples, sampleRate = 44100) {
  const numSamples = samples.length
  const buffer = Buffer.alloc(44 + numSamples * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(numSamples * 2, 40)
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2)
  }
  ensureDir(dirname(dest))
  writeFileSync(dest, buffer)
  console.log('  generated', dest.replace(ROOT, ''))
}

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function renderTone(options) {
  const {
    midi,
    durationSec = 1.2,
    sampleRate = 44100,
    waveform = 'sine',
    harmonics = [1],
    attack = 0.01,
    decay = 0.4,
    sustain = 0.35,
    release = 0.35,
  } = options
  const len = Math.floor(durationSec * sampleRate)
  const out = new Float32Array(len)
  const freq = midiToHz(midi)
  const attackSamples = Math.floor(attack * sampleRate)
  const decaySamples = Math.floor(decay * sampleRate)
  const releaseSamples = Math.floor(release * sampleRate)
  const sustainStart = attackSamples + decaySamples
  const releaseStart = Math.max(sustainStart, len - releaseSamples)

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate
    let sample = 0
    for (const h of harmonics) {
      const phase = 2 * Math.PI * freq * h * t
      if (waveform === 'saw') sample += Math.sin(phase) / h
      else if (waveform === 'square') sample += (Math.sin(phase) > 0 ? 1 : -1) / h
      else sample += Math.sin(phase) / h
    }
    sample /= harmonics.length

    let env = 0
    if (i < attackSamples) env = i / Math.max(1, attackSamples)
    else if (i < sustainStart) {
      const d = (i - attackSamples) / Math.max(1, decaySamples)
      env = 1 - d * (1 - sustain)
    } else if (i < releaseStart) env = sustain
    else {
      const r = (i - releaseStart) / Math.max(1, releaseSamples)
      env = sustain * (1 - r)
    }
    out[i] = sample * env * 0.85
  }
  return out
}

function renderClick(freq, durationSec, peak) {
  const sampleRate = 44100
  const len = Math.floor(durationSec * sampleRate)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 80)
    out[i] = Math.sin(2 * Math.PI * freq * t) * env * peak
  }
  return out
}

async function setupDrums() {
  console.log('\nDrum samples (teropa/drumkit, MIT)')
  const dir = join(ROOT, 'drums')
  ensureDir(dir)
  for (const file of DRUM_FILES) {
    const dest = join(dir, file)
    if (existsSync(dest)) {
      console.log('  skip (exists)', file)
      continue
    }
    await download(`${DRUMKIT_BASE}/${file}`, dest)
  }
}

function setupMetronome() {
  console.log('\nMetronome clicks (generated)')
  const dir = join(ROOT, 'metronome')
  writeWav(join(dir, 'click.wav'), renderClick(880, 0.045, 0.55))
  writeWav(join(dir, 'accent.wav'), renderClick(1200, 0.055, 0.85))
}

function setupMelodicPacks() {
  console.log('\nMelodic root samples (generated teaching tones — replace with CC0 later)')

  const pianoDir = join(ROOT, 'packs', 'practice_piano_light')
  writeWav(
    join(pianoDir, 'piano_C4.wav'),
    renderTone({ midi: 60, harmonics: [1, 2, 3, 4], waveform: 'sine', decay: 0.5, release: 0.8 })
  )
  writeWav(
    join(pianoDir, 'piano_E4.wav'),
    renderTone({ midi: 64, harmonics: [1, 2, 3, 4], waveform: 'sine', decay: 0.5, release: 0.8 })
  )
  writeWav(
    join(pianoDir, 'piano_G4.wav'),
    renderTone({ midi: 67, harmonics: [1, 2, 3, 4], waveform: 'sine', decay: 0.5, release: 0.8 })
  )

  const bassDir = join(ROOT, 'packs', 'practice_bass')
  writeWav(
    join(bassDir, 'bass_E3.wav'),
    renderTone({ midi: 52, harmonics: [1, 2, 3], waveform: 'saw', decay: 0.25, release: 0.3 })
  )
  writeWav(
    join(bassDir, 'bass_A3.wav'),
    renderTone({ midi: 57, harmonics: [1, 2, 3], waveform: 'saw', decay: 0.25, release: 0.3 })
  )

  const guitarDir = join(ROOT, 'packs', 'clean_guitar')
  writeWav(
    join(guitarDir, 'guitar_E4.wav'),
    renderTone({ midi: 64, harmonics: [1, 2, 3, 5], waveform: 'saw', attack: 0.002, decay: 0.15, release: 0.5 })
  )
  writeWav(
    join(guitarDir, 'guitar_A4.wav'),
    renderTone({ midi: 69, harmonics: [1, 2, 3, 5], waveform: 'saw', attack: 0.002, decay: 0.15, release: 0.5 })
  )
}

async function main() {
  console.log('Play It Pro — audio asset setup')
  console.log('Output:', ROOT)
  await setupDrums()
  setupMetronome()
  setupMelodicPacks()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
