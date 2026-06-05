import type { ReactNode } from 'react'
import type { DrumHit, DrumNotationBlockContent, DrumVoiceId } from '../types/lesson-planning'
import { DRUM_VOICES, stepsInMeasure } from './drum-notation'
import {
  effectiveHead,
  getDrumStaffLayout,
  getStaffVoiceSpec,
  isAccentHit,
  isGhostHit,
  measurePixelWidth,
  staffHeight,
  staffLineY,
  staffPositionY,
  type DrumStaffLayout,
} from './drum-notation-staff'

export type DrumNotationRenderSize = 'full' | 'preview'

interface RenderContext {
  layout: DrumStaffLayout
}

function renderPercussionClef(mx: number, layout: DrumStaffLayout): ReactNode {
  const top = staffLineY(0, layout) - 4
  const bottom = staffLineY(layout.staffLineCount - 1, layout) + 4
  const x = mx + 14
  return (
    <g key={`clef-${mx}`} aria-hidden>
      <line x1={x} y1={top} x2={x} y2={bottom} stroke="currentColor" strokeWidth={2.8} />
      <line x1={x + 5} y1={top} x2={x + 5} y2={bottom} stroke="currentColor" strokeWidth={1.4} />
    </g>
  )
}

function renderCross(x: number, y: number, layout: DrumStaffLayout, opacity: number, key: string) {
  const s = layout.noteRadius * 0.85
  return (
    <g key={key} opacity={opacity}>
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke="currentColor" strokeWidth={layout.strokeWidth + 0.2} />
      <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke="currentColor" strokeWidth={layout.strokeWidth + 0.2} />
    </g>
  )
}

function renderOpenCircle(x: number, y: number, layout: DrumStaffLayout, key: string) {
  return (
    <circle
      key={key}
      cx={x}
      cy={y}
      r={layout.noteRadius}
      fill="none"
      stroke="currentColor"
      strokeWidth={layout.strokeWidth}
    />
  )
}

function renderNoteHead(x: number, y: number, layout: DrumStaffLayout, ghost: boolean, key: string) {
  const r = ghost ? layout.noteRadius * 0.72 : layout.noteRadius
  return (
    <g key={key} opacity={ghost ? 0.55 : 1}>
      {ghost ? (
        <>
          <text x={x - r - 5} y={y + 4} fontSize={layout.noteRadius * 2.2} fill="currentColor" fontFamily="Georgia, serif">
            (
          </text>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.88} fill="none" stroke="currentColor" strokeWidth={layout.strokeWidth * 0.85} />
          <text x={x + r - 1} y={y + 4} fontSize={layout.noteRadius * 2.2} fill="currentColor" fontFamily="Georgia, serif">
            )
          </text>
        </>
      ) : (
        <ellipse cx={x} cy={y} rx={r} ry={r * 0.88} fill="currentColor" />
      )}
    </g>
  )
}

function renderStem(x: number, y: number, direction: 'up' | 'down', layout: DrumStaffLayout, key: string) {
  const len = layout.stemLength
  const y2 = direction === 'up' ? y - len : y + len
  const y1 = direction === 'up' ? y - layout.noteRadius * 0.75 : y + layout.noteRadius * 0.75
  return <line key={key} x1={x} y1={y1} x2={x} y2={y2} stroke="currentColor" strokeWidth={layout.strokeWidth} />
}

function renderAccentMark(x: number, y: number, layout: DrumStaffLayout, key: string) {
  return (
    <text key={key} x={x - layout.noteRadius * 2.4} y={y + 4} fontSize={layout.noteRadius * 2.1} fontWeight={700} fill="currentColor">
      {'>'}
    </text>
  )
}

function renderHit(voice: DrumVoiceId, hit: DrumHit, x: number, ctx: RenderContext): ReactNode[] {
  const spec = getStaffVoiceSpec(voice)
  if (!spec) return []

  const { layout } = ctx
  const y = staffPositionY(spec.staffPosition, layout)
  const head = effectiveHead(spec, hit)
  const ghost = isGhostHit(hit)
  const accent = isAccentHit(hit)
  const key = `${voice}-${x}`
  const nodes: ReactNode[] = []

  if (accent) nodes.push(renderAccentMark(x, y, layout, `${key}-acc`))

  if (head === 'x') {
    nodes.push(renderCross(x, y, layout, ghost ? 0.5 : 1, `${key}-x`))
  } else if (head === 'open') {
    nodes.push(renderOpenCircle(x, y, layout, `${key}-open`))
  } else {
    nodes.push(renderNoteHead(x, y, layout, ghost, `${key}-head`))
  }

  nodes.push(renderStem(x, y, spec.stem, layout, `${key}-stem`))
  return nodes
}

function renderCymbalBeams(
  measureSteps: DrumNotationBlockContent['measures'][0]['steps'],
  stepCount: number,
  mx: number,
  ctx: RenderContext
): ReactNode[] {
  const { layout } = ctx
  const cymbalIds: DrumVoiceId[] = ['hihat', 'ride', 'crash']
  const nodes: ReactNode[] = []

  for (const voiceId of cymbalIds) {
    const spec = getStaffVoiceSpec(voiceId)
    if (!spec) continue
    const beamY =
      spec.stem === 'down'
        ? staffPositionY(spec.staffPosition, layout) + layout.stemLength - 3
        : staffPositionY(spec.staffPosition, layout) - layout.stemLength + 3

    let runStart: number | null = null
    const flushRun = (runEnd: number) => {
      if (runStart == null || runEnd - runStart < 1) {
        runStart = null
        return
      }
      const x1 = mx + layout.measurePad + runStart * layout.stepWidth + layout.stepWidth / 2
      const x2 = mx + layout.measurePad + runEnd * layout.stepWidth + layout.stepWidth / 2
      nodes.push(
        <line
          key={`beam-${voiceId}-${mx}-${runStart}`}
          x1={x1}
          y1={beamY}
          x2={x2}
          y2={beamY}
          stroke="currentColor"
          strokeWidth={layout.strokeWidth + 0.6}
        />
      )
      runStart = null
    }

    for (let si = 0; si < stepCount; si++) {
      const hit = measureSteps[si]?.[voiceId]
      if (hit) {
        if (runStart == null) runStart = si
      } else if (runStart != null) {
        flushRun(si - 1)
      }
    }
    if (runStart != null) flushRun(stepCount - 1)
  }

  return nodes
}

export function buildDrumNotationSvg(
  content: DrumNotationBlockContent,
  options: {
    size?: DrumNotationRenderSize
    activeStep?: number | null
  } = {}
): { width: number; height: number; elements: ReactNode[] } {
  const size = options.size ?? 'full'
  const layout = getDrumStaffLayout(size)
  const beats = content.beats_per_measure
  const spb = content.steps_per_beat
  const stepCount = stepsInMeasure(beats, spb)
  const measureWidth = measurePixelWidth(stepCount, layout)
  const height = staffHeight(layout)
  const width = content.measures.length * measureWidth + 16
  const ctx: RenderContext = { layout }
  const nodes: ReactNode[] = []

  content.measures.forEach((measure, mi) => {
    const mx = mi * measureWidth + 8
    const staffBottom = staffLineY(layout.staffLineCount - 1, layout)

    for (let i = 0; i < layout.staffLineCount; i++) {
      nodes.push(
        <line
          key={`staff-${mi}-${i}`}
          x1={mx + 8}
          y1={staffLineY(i, layout)}
          x2={mx + measureWidth - 8}
          y2={staffLineY(i, layout)}
          stroke="currentColor"
          strokeWidth={layout.strokeWidth * 0.65}
          opacity={0.55}
        />
      )
    }

    if (mi === 0) {
      nodes.push(renderPercussionClef(mx, layout))
      nodes.push(
        <text
          key="ts-top"
          x={mx + 28}
          y={staffLineY(1, layout) + 5}
          fontSize={size === 'preview' ? 13 : 16}
          fontWeight={700}
          fill="currentColor"
        >
          {beats}
        </text>,
        <text
          key="ts-bottom"
          x={mx + 28}
          y={staffLineY(3, layout) + 5}
          fontSize={size === 'preview' ? 13 : 16}
          fontWeight={700}
          fill="currentColor"
        >
          4
        </text>
      )
    }

    nodes.push(
      <line
        key={`bar-start-${mi}`}
        x1={mx + 8}
        y1={layout.staffTop - 10}
        x2={mx + 8}
        y2={staffBottom + 14}
        stroke="currentColor"
        strokeWidth={layout.strokeWidth + 0.3}
      />
    )

    for (let si = 0; si < stepCount; si++) {
      const step = measure.steps[si] ?? {}
      const x = mx + layout.measurePad + si * layout.stepWidth + layout.stepWidth / 2
      const gStep = mi * stepCount + si

      if (options.activeStep === gStep) {
        nodes.push(
          <rect
            key={`active-${mi}-${si}`}
            x={x - layout.stepWidth / 2 + 2}
            y={layout.staffTop - 12}
            width={layout.stepWidth - 4}
            height={staffBottom - layout.staffTop + 32}
            fill="var(--lb-accent, #a78bfa)"
            opacity={0.1}
            rx={3}
          />
        )
      }

      for (const voice of DRUM_VOICES) {
        const hit = step[voice.id]
        if (hit) nodes.push(...renderHit(voice.id, hit, x, ctx))
      }

      if (si % spb === 0 && spb >= 2) {
        const beatNum = Math.floor(si / spb) + 1
        nodes.push(
          <text
            key={`beat-${mi}-${si}`}
            x={x}
            y={staffBottom + 24}
            textAnchor="middle"
            fontSize={size === 'preview' ? 10 : 11}
            fill="currentColor"
            opacity={0.5}
          >
            {beatNum}
          </text>
        )
      }
    }

    nodes.push(...renderCymbalBeams(measure.steps, stepCount, mx, ctx))

    const isFinal = mi === content.measures.length - 1
    nodes.push(
      <line
        key={`bar-end-${mi}`}
        x1={mx + measureWidth - 8}
        y1={layout.staffTop - 10}
        x2={mx + measureWidth - 8}
        y2={staffBottom + 14}
        stroke="currentColor"
        strokeWidth={isFinal ? layout.strokeWidth + 0.8 : layout.strokeWidth + 0.3}
      />
    )
    if (isFinal) {
      nodes.push(
        <line
          key={`bar-end-heavy-${mi}`}
          x1={mx + measureWidth - 4}
          y1={layout.staffTop - 10}
          x2={mx + measureWidth - 4}
          y2={staffBottom + 14}
          stroke="currentColor"
          strokeWidth={layout.strokeWidth + 0.3}
        />
      )
    }
  })

  return { width, height, elements: nodes }
}
