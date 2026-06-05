import { detectVideoSource, embedVideoUrl } from '../../../lib/lesson-planning-constants'
import { normalizeDrumNotationContent } from '../../../lib/drum-notation'
import { normalizeMusicNotationContent } from '../../../lib/music-notation'
import { uploadStudioMedia } from '../../../lib/studio-media-service'
import type { EditableBlock } from '../../../lib/lesson-builder-utils'
import type { ChecklistBlockContent, LessonBlockContent, RudimentBlockContent } from '../../../types/lesson-planning'
import type { LessonBlockRef } from '../../../lib/practice-task-utils'
import ChecklistBlockEditor from '../blocks/ChecklistBlockEditor'
import DrumNotationBuilder from '../blocks/DrumNotationBuilder'
import MusicNotationBuilder from '../blocks/MusicNotationBuilder'
import RichTextEditor from '../blocks/RichTextEditor'
import RudimentStickingBuilder from '../blocks/RudimentStickingBuilder'
import TempoBlockEditor from '../blocks/TempoBlockEditor'

interface CanvasBlockEditorProps {
  block: EditableBlock
  userId: string
  siblingBlocks: LessonBlockRef[]
  onUpdate: (content: LessonBlockContent) => void
}

export default function CanvasBlockEditor({ block, userId, siblingBlocks, onUpdate }: CanvasBlockEditorProps) {
  const c = block.content as unknown as Record<string, unknown>

  const set = (patch: Record<string, unknown>) => {
    onUpdate({ ...c, ...patch } as LessonBlockContent)
  }

  const handleUpload = async (file: File, field: 'url') => {
    const url = await uploadStudioMedia(userId, file)
    const patch: Record<string, unknown> = { [field]: url }
    if (block.block_type === 'video') {
      patch.source = file.type.startsWith('video/') ? 'upload' : detectVideoSource(url)
    }
    set(patch)
  }

  return (
    <div className="canvas-block__editor" onClick={(e) => e.stopPropagation()}>
      {block.block_type !== 'notation' ? (
        <div className="lesson-builder__field">
          <label>Block title</label>
          <input
            value={String(c.displayTitle ?? '')}
            onChange={(e) => set({ displayTitle: e.target.value })}
            placeholder={
              block.block_type === 'text'
                ? 'e.g. Before you watch'
                : block.block_type === 'sequencer'
                  ? 'e.g. Verse groove'
                  : 'e.g. Groove demonstration'
            }
          />
        </div>
      ) : null}

      {block.block_type === 'text' ? (
        <div className="lesson-builder__field">
          <label>Written tutorial</label>
          <p className="lesson-builder__field-hint">
            Explain what the student should learn and what to watch for — this text complements your video blocks.
          </p>
          <RichTextEditor
            key={block.id}
            value={String(c.body ?? '')}
            onChange={(body) =>
              onUpdate({
                ...(block.content as unknown as Record<string, unknown>),
                body,
              } as LessonBlockContent)
            }
            placeholder="Introduce the concept, break it into steps, highlight key points, then point them to the demo video…"
          />
        </div>
      ) : null}

      {block.block_type === 'video' ? (
        <>
          <div className="lesson-builder__field">
            <label>Video URL</label>
            <input
              value={String(c.url ?? '')}
              onChange={(e) => set({ url: e.target.value, source: detectVideoSource(e.target.value) })}
              placeholder="YouTube, Vimeo, or link"
            />
          </div>
          <div className="lesson-builder__field">
            <label>Or upload</label>
            <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'url')} />
          </div>
          {c.url && embedVideoUrl(String(c.url)) ? (
            <div className="lesson-video-embed" style={{ marginTop: '0.5rem' }}>
              <iframe src={embedVideoUrl(String(c.url))!} title={String(c.displayTitle || 'Video')} allowFullScreen />
            </div>
          ) : null}
        </>
      ) : null}

      {block.block_type === 'audio' ? (
        <>
          <div className="lesson-builder__field">
            <label>Audio file</label>
            <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'url')} />
          </div>
          {c.url ? <audio controls src={String(c.url)} style={{ width: '100%', marginTop: '0.5rem' }} /> : null}
        </>
      ) : null}

      {block.block_type === 'sequencer' ? (
        <DrumNotationBuilder
          content={normalizeDrumNotationContent(c)}
          onChange={(notation) =>
            onUpdate({
              ...(block.content as unknown as Record<string, unknown>),
              ...notation,
            } as LessonBlockContent)
          }
        />
      ) : null}

      {block.block_type === 'notation' ? (
        <MusicNotationBuilder
          content={normalizeMusicNotationContent(c)}
          onChange={(notation) =>
            onUpdate({
              ...(block.content as unknown as Record<string, unknown>),
              ...notation,
              displayTitle: notation.title,
            } as LessonBlockContent)
          }
        />
      ) : null}

      {block.block_type === 'notation_image' ? (
        <>
          <div className="lesson-builder__field">
            <label>Upload image</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'url')} />
          </div>
          <div className="lesson-builder__field">
            <label>Caption</label>
            <input value={String(c.caption ?? '')} onChange={(e) => set({ caption: e.target.value })} placeholder="Optional label under the image" />
          </div>
          {c.url ? <img src={String(c.url)} alt="" className="lesson-notation-img" style={{ marginTop: '0.5rem' }} /> : null}
        </>
      ) : null}

      {block.block_type === 'tempo' ? (
        <TempoBlockEditor
          startingBpm={Number(c.starting_bpm ?? 60)}
          targetBpm={Number(c.target_bpm ?? 90)}
          notes={String(c.notes ?? '')}
          minutesPerStep={c.minutes_per_step != null ? Number(c.minutes_per_step) : undefined}
          onChange={(patch) => set(patch as Record<string, unknown>)}
        />
      ) : null}

      {block.block_type === 'rudiment' ? (
        <RudimentStickingBuilder
          name={String(c.name ?? '')}
          stickingPattern={String(c.sticking_pattern ?? '')}
          stickingHands={(c as unknown as RudimentBlockContent).sticking_hands}
          tempoGoal={c.tempo_goal != null ? Number(c.tempo_goal) : undefined}
          notes={String(c.notes ?? '')}
          onChange={(patch) => set(patch as Record<string, unknown>)}
        />
      ) : null}

      {block.block_type === 'checklist' ? (
        <ChecklistBlockEditor
          currentBlockId={block.id}
          siblingBlocks={siblingBlocks}
          instructions={String((c as unknown as ChecklistBlockContent).instructions ?? '')}
          items={(c as unknown as ChecklistBlockContent).items ?? []}
          onChange={(patch) => set(patch as Record<string, unknown>)}
        />
      ) : null}

      {block.block_type === 'resource_link' ? (
        <>
          <div className="lesson-builder__field">
            <label>Link label</label>
            <input value={String(c.label ?? '')} onChange={(e) => set({ label: e.target.value })} placeholder="Drumless track" />
          </div>
          <div className="lesson-builder__field">
            <label>URL</label>
            <input value={String(c.url ?? '')} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="lesson-builder__field">
            <label>Type</label>
            <select value={String(c.link_type ?? 'link')} onChange={(e) => set({ link_type: e.target.value })}>
              <option value="link">General link</option>
              <option value="youtube">YouTube</option>
              <option value="sheet_music">Sheet music / PDF</option>
              <option value="drumless">Drumless track</option>
            </select>
          </div>
        </>
      ) : null}
    </div>
  )
}
