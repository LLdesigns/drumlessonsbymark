import {
  CHECKLIST_TASK_TYPES,
  normalizeLessonTextHtml,
  parseStickingPattern,
} from '../../lib/block-content-utils'
import { normalizeDrumNotationContent, notationHasNotes } from '../../lib/drum-notation'
import {
  embedVideoUrl,
  skillLevelLabel,
} from '../../lib/lesson-planning-constants'
import { getBlockLabel, resolveLinkedBlockId, type LessonBlockRef } from '../../lib/practice-task-utils'
import type {
  AssignedLessonBlock,
  BlockProgressKind,
  ChecklistBlockContent,
  DrumNotationBlockContent,
  LessonTemplateBlock,
  PracticeTaskCompletion,
  RudimentBlockContent,
  StudentBlockProgress,
  TempoBlockContent,
} from '../../types/lesson-planning'
import LessonVideoPlayer from './LessonVideoPlayer'
import PracticeTaskCheck from './PracticeTaskCheck'
import DrumNotationView from './blocks/DrumNotationView'
import MusicNotationStudentView from './blocks/MusicNotationStudentView'
import { normalizeMusicNotationContent } from '../../lib/music-notation'

type Block = LessonTemplateBlock | AssignedLessonBlock

interface LessonBlockRendererProps {
  block: Block
  mode?: 'teacher' | 'student'
  readOnly?: boolean
  completions?: PracticeTaskCompletion[]
  blockProgress?: StudentBlockProgress[]
  allBlocks?: LessonBlockRef[]
  onToggleTask?: (blockId: string, itemId: string, completed: boolean) => void
  onScrollToBlock?: (blockId: string) => void
  onBlockProgress?: (blockId: string, kind: BlockProgressKind, payload?: Record<string, unknown>) => void
  togglingTaskId?: string | null
}

export default function LessonBlockRenderer({
  block,
  mode = 'student',
  readOnly = false,
  completions = [],
  blockProgress = [],
  allBlocks = [],
  onToggleTask,
  onScrollToBlock,
  onBlockProgress,
  togglingTaskId = null,
}: LessonBlockRendererProps) {
  const c = block.content as unknown as Record<string, unknown>
  const isStudentView = mode === 'student'
  const track = (kind: BlockProgressKind, payload?: Record<string, unknown>) => {
    if (isStudentView && onBlockProgress) onBlockProgress(block.id, kind, payload)
  }

  switch (block.block_type) {
    case 'text': {
      const body = String(c.body ?? '')
      const html = normalizeLessonTextHtml(body)
      if (!html) return null
      return (
        <div className="lesson-block-render lesson-block-render--text">
          <div
            className="lesson-rich-text lesson-rich-text--student"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )
    }

    case 'notation_image': {
      const url = String(c.url ?? '')
      if (!url) return null
      return (
        <div className="lesson-block-render">
          <img src={url} alt={String(c.caption || 'Lesson image')} className="lesson-notation-img" />
          {c.caption ? <p className="studio-subtext" style={{ marginTop: '0.35rem' }}>{String(c.caption)}</p> : null}
        </div>
      )
    }

    case 'sequencer': {
      const notation = normalizeDrumNotationContent(c as unknown as DrumNotationBlockContent)
      if (!notationHasNotes(notation)) return null
      return (
        <div className="lesson-block-render lesson-block-render--notation">
          <DrumNotationView
            content={notation}
            showPlayback
            onPlaybackStarted={() => track('played', { source: 'notation_playback' })}
          />
        </div>
      )
    }

    case 'notation': {
      const music = normalizeMusicNotationContent(c)
      return (
        <div className="lesson-block-render lesson-block-render--music-notation">
          <MusicNotationStudentView
            content={music}
            showPlayback
            showTitle={!isStudentView}
            showSheetTitle={!isStudentView}
            onPlaybackStarted={() => track('played', { source: 'music_notation_playback' })}
          />
        </div>
      )
    }

    case 'video': {
      const url = String(c.url ?? '')
      if (!url) return null
      const embed = embedVideoUrl(url)
      return (
        <div className="lesson-block-render">
          {c.title ? <p className="studio-heading" style={{ fontSize: '0.95rem' }}>{String(c.title)}</p> : null}
          <LessonVideoPlayer
            url={url}
            embedUrl={embed}
            title={String(c.title || 'Lesson video')}
            onEngaged={() => track('viewed', { source: 'video_engaged' })}
            onViewed={() => track('viewed', { source: 'video_completed' })}
          />
          {!embed ? (
            <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--studio-accent)', marginTop: '0.35rem', display: 'inline-block' }}>
              Open video →
            </a>
          ) : null}
        </div>
      )
    }

    case 'audio': {
      const url = String(c.url ?? '')
      if (!url) return null
      return (
        <div className="lesson-block-render">
          {c.title ? <p className="studio-subtext">{String(c.title)}</p> : null}
          <audio
            src={url}
            controls
            style={{ width: '100%', marginTop: '0.35rem' }}
            onPlay={() => track('viewed', { source: 'audio_play' })}
            onEnded={() => track('viewed', { source: 'audio_completed' })}
          />
        </div>
      )
    }

    case 'tempo': {
      const t = c as unknown as TempoBlockContent
      return (
        <div className="lesson-block-render lesson-block-render--tempo">
          <div className="block-tempo__visual block-tempo__visual--compact">
            {t.starting_bpm != null ? (
              <div className="lesson-bpm-pill">
                <span>Start</span>
                <strong>{t.starting_bpm}</strong>
              </div>
            ) : null}
            {t.starting_bpm != null && t.target_bpm != null ? (
              <span className="block-tempo__arrow-mini">→</span>
            ) : null}
            {t.target_bpm != null ? (
              <div className="lesson-bpm-pill lesson-bpm-pill--goal">
                <span>Goal</span>
                <strong>{t.target_bpm}</strong>
              </div>
            ) : null}
          </div>
          {mode === 'student' && t.current_bpm != null ? (
            <p className="studio-subtext" style={{ marginTop: '0.35rem' }}>
              Your current tempo: <strong>{t.current_bpm} BPM</strong>
            </p>
          ) : null}
          {t.minutes_per_step ? (
            <p className="studio-subtext">Spend ~{t.minutes_per_step} min at each step before increasing.</p>
          ) : null}
          {t.notes ? <p className="studio-journal">{t.notes}</p> : null}
        </div>
      )
    }

    case 'rudiment': {
      const r = c as unknown as RudimentBlockContent
      const hands = r.sticking_hands?.length ? r.sticking_hands : parseStickingPattern(r.sticking_pattern)
      return (
        <div className="lesson-block-render">
          <p className="studio-heading" style={{ fontSize: '1rem' }}>{r.name || 'Rudiment'}</p>
          {hands.length > 0 ? (
            <div className="lesson-sticking lesson-sticking--chips">
              {hands.map((hand, i) => (
                <span key={i} className={`block-rudiment__chip block-rudiment__chip--${hand.toLowerCase()}`}>
                  {hand}
                </span>
              ))}
            </div>
          ) : r.sticking_pattern ? (
            <div className="lesson-sticking">{r.sticking_pattern}</div>
          ) : null}
          {r.tempo_goal ? <p className="studio-subtext" style={{ marginTop: '0.5rem' }}>Tempo goal: {r.tempo_goal} BPM</p> : null}
          {r.notes ? <p className="studio-subtext" style={{ marginTop: '0.35rem' }}>{r.notes}</p> : null}
        </div>
      )
    }

    case 'checklist': {
      const checklist = c as unknown as ChecklistBlockContent
      const items = checklist.items ?? []
      const doneCount = items.filter((item) =>
        completions.some((co) => co.block_id === block.id && co.item_id === item.id)
      ).length
      const canToggle = isStudentView && !!onToggleTask && !readOnly

      return (
        <div className="lesson-block-render lesson-block-render--checklist">
          <div className="lesson-checklist-header">
            <p className="studio-label" style={{ margin: 0 }}>Practice tasks</p>
            {items.length > 0 && isStudentView ? (
              <span className="lesson-checklist-progress" aria-live="polite">
                {doneCount} of {items.length} done
              </span>
            ) : null}
          </div>
          {checklist.instructions ? (
            <p className="studio-subtext lesson-checklist-instructions">{checklist.instructions}</p>
          ) : null}
          {items.length === 0 ? (
            <p className="studio-subtext" style={{ margin: 0 }}>No tasks in this list yet.</p>
          ) : (
            <ul className="lesson-checklist-list">
              {items.map((item) => {
                const done = completions.some((co) => co.block_id === block.id && co.item_id === item.id)
                const typeMeta = CHECKLIST_TASK_TYPES.find((t) => t.value === (item.task_type ?? 'practice'))
                const taskKey = `${block.id}:${item.id}`
                const isToggling = togglingTaskId === taskKey
                const linkedId = resolveLinkedBlockId(item.linked_block_id, allBlocks)
                const linkedBlock = linkedId ? allBlocks.find((b) => b.id === linkedId) : undefined
                const linkedProgress = linkedId
                  ? blockProgress.filter((p) => p.block_id === linkedId)
                  : []

                return (
                  <li
                    key={item.id}
                    className={`lesson-checklist-item${done ? ' lesson-checklist-item--done' : ''}${isToggling ? ' lesson-checklist-item--busy' : ''}`}
                  >
                    {isStudentView ? (
                      <PracticeTaskCheck
                        checked={done}
                        label={item.label}
                        disabled={!canToggle || isToggling}
                        onChange={(checked) => onToggleTask?.(block.id, item.id, checked)}
                      />
                    ) : (
                      <span className="lesson-checklist-item__icon" aria-hidden="true">
                        <i className={`bi ${typeMeta?.icon ?? 'bi-check2-square'}`} />
                      </span>
                    )}
                    <div className="lesson-checklist-item__body">
                      <span className="lesson-checklist-item__label">{item.label}</span>
                      {item.hint ? <small className="lesson-checklist-item__hint">{item.hint}</small> : null}
                      {linkedBlock && isStudentView ? (
                        <button
                          type="button"
                          className="lesson-checklist-item__link"
                          onClick={() => linkedId && onScrollToBlock?.(linkedId)}
                        >
                          <i className="bi bi-arrow-down-circle" /> Go to {getBlockLabel(linkedBlock)}
                        </button>
                      ) : null}
                      {item.auto_complete && linkedBlock && !done && isStudentView ? (
                        <small className="lesson-checklist-item__auto-hint">
                          {linkedProgress.length > 0
                            ? 'Linked block engaged — checking off…'
                            : 'Checks off when you complete the linked block'}
                        </small>
                      ) : null}
                    </div>
                    {done && isStudentView ? (
                      <span className="lesson-checklist-item__done-badge" aria-hidden="true">
                        <i className="bi bi-check-circle-fill" />
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )
    }

    case 'resource_link': {
      const label = String(c.label || c.url || 'Resource')
      const url = String(c.url || '')
      if (!url) return null
      return (
        <div className="lesson-block-render">
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--studio-accent)' }}>
            <i className="bi bi-link-45deg" /> {label}
          </a>
        </div>
      )
    }

    default:
      return null
  }
}

export function LessonMetaBadges({
  category,
  skillLevel,
  duration,
}: {
  category?: string | null
  skillLevel?: string | null
  duration?: number | null
}) {
  return (
    <div className="lesson-template-card__meta">
      {category ? <span className="studio-badge">{category}</span> : null}
      {skillLevel ? <span className="studio-badge">{skillLevelLabel(skillLevel as 'beginner')}</span> : null}
      {duration ? <span className="studio-badge">{duration} min</span> : null}
    </div>
  )
}
