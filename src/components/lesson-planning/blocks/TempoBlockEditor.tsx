interface TempoBlockEditorProps {
  startingBpm: number
  targetBpm: number
  notes?: string
  minutesPerStep?: number
  onChange: (patch: {
    starting_bpm?: number
    target_bpm?: number
    notes?: string
    minutes_per_step?: number
  }) => void
}

export default function TempoBlockEditor({
  startingBpm,
  targetBpm,
  notes,
  minutesPerStep,
  onChange,
}: TempoBlockEditorProps) {
  const start = startingBpm || 60
  const goal = targetBpm || 90
  const delta = goal - start
  const steps = Math.max(1, Math.abs(Math.ceil(delta / 5)))

  return (
    <div className="block-tempo">
      <p className="block-tempo__intro">
        Set where the student <strong>starts</strong> and where they should <strong>finish</strong> for this section.
        Use small jumps (5–10 BPM) in the practice room.
      </p>

      <div className="block-tempo__visual">
        <div className="block-tempo__node block-tempo__node--start">
          <span>Start</span>
          <strong>{start}</strong>
          <small>BPM</small>
        </div>
        <div className="block-tempo__arrow">
          <div className="block-tempo__arrow-line" />
          {delta > 0 ? (
            <span className="block-tempo__arrow-label">+{delta} BPM · ~{steps} steps</span>
          ) : delta < 0 ? (
            <span className="block-tempo__arrow-label">{delta} BPM</span>
          ) : (
            <span className="block-tempo__arrow-label">Hold tempo</span>
          )}
        </div>
        <div className="block-tempo__node block-tempo__node--goal">
          <span>Goal</span>
          <strong>{goal}</strong>
          <small>BPM</small>
        </div>
      </div>

      <div className="block-tempo__sliders">
        <div className="lesson-builder__field">
          <label>Starting tempo</label>
          <div className="block-tempo__slider-row">
            <input
              type="range"
              min={40}
              max={240}
              value={start}
              onChange={(e) => {
                const v = Number(e.target.value)
                onChange({ starting_bpm: v, target_bpm: Math.max(v, goal) })
              }}
            />
            <input
              type="number"
              min={40}
              max={300}
              value={start}
              className="block-tempo__bpm-input"
              onChange={(e) => {
                const v = Number(e.target.value)
                onChange({ starting_bpm: v, target_bpm: Math.max(v, goal) })
              }}
            />
          </div>
        </div>
        <div className="lesson-builder__field">
          <label>Goal tempo</label>
          <div className="block-tempo__slider-row">
            <input
              type="range"
              min={40}
              max={240}
              value={goal}
              onChange={(e) => onChange({ target_bpm: Number(e.target.value) })}
            />
            <input
              type="number"
              min={40}
              max={300}
              value={goal}
              className="block-tempo__bpm-input"
              onChange={(e) => onChange({ target_bpm: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="lesson-builder__field-row">
        <div className="lesson-builder__field">
          <label>Minutes per step (optional)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={minutesPerStep ?? 3}
            onChange={(e) => onChange({ minutes_per_step: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="lesson-builder__field">
        <label>Focus for this tempo work</label>
        <textarea
          rows={2}
          value={notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="e.g. Stay relaxed at 80 before bumping to 90…"
        />
      </div>
    </div>
  )
}
