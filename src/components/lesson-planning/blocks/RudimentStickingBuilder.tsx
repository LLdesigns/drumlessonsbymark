import { useMemo, useState } from 'react'
import {
  formatStickingPattern,
  parseStickingPattern,
  RUDIMENT_PRESETS,
  type StickingHand,
} from '../../../lib/block-content-utils'

interface RudimentStickingBuilderProps {
  name: string
  stickingPattern: string
  stickingHands?: StickingHand[]
  tempoGoal?: number
  notes?: string
  onChange: (patch: {
    name?: string
    sticking_pattern?: string
    sticking_hands?: StickingHand[]
    tempo_goal?: number
    notes?: string
  }) => void
}

export default function RudimentStickingBuilder({
  name,
  stickingPattern,
  stickingHands,
  tempoGoal,
  notes,
  onChange,
}: RudimentStickingBuilderProps) {
  const hands = useMemo(() => {
    if (stickingHands?.length) return stickingHands
    return parseStickingPattern(stickingPattern)
  }, [stickingHands, stickingPattern])

  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const syncHands = (next: StickingHand[]) => {
    onChange({
      sticking_hands: next,
      sticking_pattern: formatStickingPattern(next),
    })
  }

  const append = (hand: StickingHand) => syncHands([...hands, hand])

  const removeAt = (index: number) => syncHands(hands.filter((_, i) => i !== index))

  const moveHand = (from: number, to: number) => {
    if (from === to) return
    const next = [...hands]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    syncHands(next)
  }

  return (
    <div className="block-rudiment">
      <div className="lesson-builder__field">
        <label>Rudiment name</label>
        <input value={name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Paradiddle" />
      </div>

      <div className="block-rudiment__section">
        <label className="block-rudiment__label">Sticking pattern</label>
        <p className="block-rudiment__help">Tap R / L / K to add strokes. Drag chips to reorder. Double-click to remove.</p>

        <div className="block-rudiment__palette">
          {(['R', 'L', 'K'] as StickingHand[]).map((hand) => (
            <button
              key={hand}
              type="button"
              className={`block-rudiment__hand-btn block-rudiment__hand-btn--${hand.toLowerCase()}`}
              onClick={() => append(hand)}
              title={hand === 'K' ? 'Kick (bass drum)' : hand === 'R' ? 'Right hand' : 'Left hand'}
            >
              {hand}
            </button>
          ))}
          <button type="button" className="lesson-builder__btn" style={{ marginLeft: 'auto' }} onClick={() => syncHands([])}>
            Clear
          </button>
        </div>

        <div className="block-rudiment__presets">
          <span className="block-rudiment__presets-label">Presets:</span>
          {RUDIMENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="block-rudiment__preset-chip"
              onClick={() => syncHands(preset.hands)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={`block-rudiment__strip ${hands.length === 0 ? 'block-rudiment__strip--empty' : ''}`}>
          {hands.length === 0 ? (
            <span className="block-rudiment__empty">Add strokes from R · L · K above</span>
          ) : (
            hands.map((hand, index) => (
              <span
                key={`${index}-${hand}`}
                className={`block-rudiment__chip block-rudiment__chip--${hand.toLowerCase()} ${dragIndex === index ? 'block-rudiment__chip--dragging' : ''}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex != null) moveHand(dragIndex, index)
                  setDragIndex(null)
                }}
                onDoubleClick={() => removeAt(index)}
                title="Drag to reorder · double-click to remove"
              >
                {hand}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="lesson-builder__field">
        <label>Tempo goal (BPM)</label>
        <div className="block-tempo__slider-row">
          <input
            type="range"
            min={40}
            max={220}
            step={1}
            value={tempoGoal ?? 80}
            onChange={(e) => onChange({ tempo_goal: Number(e.target.value) })}
          />
          <input
            type="number"
            min={40}
            max={300}
            value={tempoGoal ?? 80}
            onChange={(e) => onChange({ tempo_goal: Number(e.target.value) })}
            className="block-tempo__bpm-input"
          />
        </div>
      </div>

      <div className="lesson-builder__field">
        <label>Coaching notes</label>
        <textarea
          rows={2}
          value={notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Accent the first note, stay relaxed…"
        />
      </div>
    </div>
  )
}
