# Play It Pro — Audio Assets

App-bundlable sample packs: **raw audio + JSON maps + Web Audio playback** (not VST/AU/Kontakt).

## Layout

```
public/audio/
├── drums/                    # teropa/drumkit (MIT) — drum sequencer + notation drums
├── metronome/                # Generated click/accent WAVs
├── packs/
│   ├── practice_piano_light/ # Melodic root samples (replace with FreePats CC0)
│   ├── practice_bass/
│   ├── clean_guitar/
│   ├── orchestra/            # v2 expansion placeholder
│   └── rock/                 # v2 expansion placeholder
└── instruments/
    ├── manifest.json         # Bundled core + expansion URLs
    └── packs/*.json          # Instrument pack definitions
```

## Setup

Download drum samples and generate teaching tones:

```bash
npm run setup:audio
```

This pulls [teropa/drumkit](https://github.com/teropa/drumkit) MP3s and creates metronome + melodic root WAVs.

## Pack format

Each pack is a JSON file in `instruments/packs/` pointing at sample files via `baseUrl`.

- **drumkit** — `samples` map with `file`, optional `midi`, `gain`
- **melodic** — `root_notes[]` with nearest-root pitch shifting at playback

## Replacing with CC0 libraries

| Instrument | Suggested CC0 source |
|------------|---------------------|
| Drums | VCSL / teropa drumkit (already used) |
| Piano | FreePats Acoustic Grand Piano |
| Guitar/bass | Karoryfer Shinyguitar |
| Orchestra (v2) | VSCO 2 CE |

Drop files into the pack folder, update filenames in the pack JSON if needed, and update the `license` field.

## Code

| Module | Role |
|--------|------|
| `src/lib/instrument-sampler.ts` | Web Audio playback engine |
| `src/lib/instrument-registry.ts` | Notation instrument → pack ID |
| `src/lib/drum-pack-playback.ts` | Sequencer voice → sample key |
| `src/lib/instrument-pack-manager.ts` | v2 expansion pack loader |
| `src/lib/music-notation-audio.ts` | Sheet music playback |
| `src/lib/drum-notation-audio.ts` | Drum grid + metronome playback |
