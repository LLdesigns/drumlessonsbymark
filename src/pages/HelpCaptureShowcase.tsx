import { useMemo } from 'react'
import CanvasBlockCard from '../components/lesson-planning/builder/CanvasBlockCard'
import CanvasViewToggle from '../components/lesson-planning/builder/CanvasViewToggle'
import BlockPickerToolbar from '../components/lesson-planning/builder/BlockPickerToolbar'
import LessonCanvasEmptyState from '../components/lesson-planning/builder/LessonCanvasEmptyState'
import LessonStudentPracticeView from '../components/lesson-planning/LessonStudentPracticeView'
import RichTextEditor from '../components/lesson-planning/blocks/RichTextEditor'
import {
  autoLayoutBentoBlocks,
  bentoGridExtent,
  getCanvasLayout,
  gridPlacementStyle,
  patchBlockLayout,
} from '../lib/lesson-builder-canvas-layout'
import type { EditableBlock } from '../lib/lesson-builder-utils'
import type { LessonBlockContent } from '../types/lesson-planning'
import '../lib/lesson-builder.css'
import '../lib/lesson-planning.css'

const noop = () => {}

const SAMPLE_BLOCKS: EditableBlock[] = [
  {
    id: 'cap-text',
    block_type: 'text',
    sort_order: 0,
    content: {
      displayTitle: 'Before you watch',
      body: '<p class="lesson-rich-text__lead">Focus on <strong>hi-hat spacing</strong> and keep the kick on beats 1 and 3.</p><ul><li>Tune your kit</li><li>Watch twice before playing</li></ul>',
    } as LessonBlockContent,
  },
  {
    id: 'cap-video',
    block_type: 'video',
    sort_order: 1,
    content: {
      displayTitle: 'Groove demo',
      title: 'Verse groove',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    } as LessonBlockContent,
  },
  {
    id: 'cap-tempo',
    block_type: 'tempo',
    sort_order: 2,
    content: {
      displayTitle: 'Tempo build',
      starting_bpm: 70,
      target_bpm: 100,
      minutes_per_step: 3,
      notes: 'Clean doubles before each bump.',
    } as LessonBlockContent,
  },
  {
    id: 'cap-checklist',
    block_type: 'checklist',
    sort_order: 3,
    content: {
      displayTitle: "This week's practice",
      instructions: 'Complete each task before your next lesson.',
      items: [
        { id: 't1', label: 'Play verse groove at 80 BPM', task_type: 'practice' },
        { id: 't2', label: 'Watch demo video twice', task_type: 'watch' },
        { id: 't3', label: 'Record full take with metronome', task_type: 'record' },
      ],
    } as LessonBlockContent,
  },
]

const BENTO_BLOCKS = autoLayoutBentoBlocks(
  SAMPLE_BLOCKS.map((block, index) => {
    if (index === 0) return patchBlockLayout(block, { gridCol: 1, gridRow: 1, colSpan: 6, rowSpan: 1 })
    if (index === 1) return patchBlockLayout(block, { gridCol: 7, gridRow: 1, colSpan: 6, rowSpan: 1 })
    if (index === 2) return patchBlockLayout(block, { gridCol: 1, gridRow: 2, colSpan: 4, rowSpan: 1 })
    return patchBlockLayout(block, { gridCol: 5, gridRow: 2, colSpan: 8, rowSpan: 1 })
  })
)

function CaptureFrame({
  id,
  label,
  width,
  children,
}: {
  id: string
  label: string
  width?: number
  children: React.ReactNode
}) {
  return (
    <section className="help-capture__section">
      <p className="help-capture__label">{label}</p>
      <div
        id={id}
        className="help-capture__frame"
        style={width ? { width: `${width}px` } : undefined}
      >
        {children}
      </div>
    </section>
  )
}

function MockSidebar({ activeId }: { activeId?: string }) {
  const titles = ['Before you watch', 'Groove demo', 'Tempo build', "This week's practice"]
  const icons = ['bi-text-left', 'bi-play-btn', 'bi-speedometer2', 'bi-check2-square']
  return (
    <aside className="lesson-builder__sidebar">
      <div className="lesson-builder__sidebar-head">
        <span className="lesson-builder__badge">Template</span>
        <p className="lesson-builder__sidebar-title">Rock Groove Basics</p>
      </div>
      <p className="lesson-builder__outline-label">Lesson blocks</p>
      <div className="lesson-builder__outline">
        {titles.map((title, i) => (
          <div
            key={title}
            className={`lesson-builder__outline-item${activeId === SAMPLE_BLOCKS[i]?.id ? ' lesson-builder__outline-item--active' : ''}`}
          >
            <span className="lesson-builder__outline-num">{i + 1}</span>
            <i className={`bi ${icons[i]} lesson-builder__outline-icon`} />
            <span className="lesson-builder__outline-text">{title}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function MockInspector() {
  return (
    <aside className="lesson-builder__inspector">
      <div className="lesson-builder__inspector-tabs">
        <button type="button" aria-selected="true">
          Lesson
        </button>
        <button type="button" aria-selected="false">
          Blocks
        </button>
      </div>
      <div className="lesson-builder__inspector-body lesson-builder__scroll">
        <div className="lesson-builder__field">
          <label>Title</label>
          <input type="text" defaultValue="Rock Groove Basics" readOnly />
        </div>
        <div className="lesson-builder__field">
          <label>Lesson goal</label>
          <textarea defaultValue="Play a clean rock groove at 100 BPM with consistent hi-hat." readOnly rows={2} />
        </div>
        <div className="lesson-builder__field">
          <label>Student instructions</label>
          <textarea defaultValue="Work through each block in order. Use a metronome." readOnly rows={2} />
        </div>
        <div className="lesson-builder__field">
          <label>Practice assignment</label>
          <textarea defaultValue="Record the full groove at goal tempo by Friday." readOnly rows={2} />
        </div>
      </div>
    </aside>
  )
}

export default function HelpCaptureShowcase() {
  const bentoRowCount = useMemo(() => bentoGridExtent(BENTO_BLOCKS), [])

  const practiceBlocks = SAMPLE_BLOCKS.map((b) => ({
    id: b.id,
    template_id: b.id,
    sort_order: b.sort_order,
    block_type: b.block_type,
    content: b.content,
    created_at: '',
    updated_at: '',
  }))

  const bentoPracticeBlocks = BENTO_BLOCKS.map((b) => ({
    id: b.id,
    template_id: b.id,
    sort_order: b.sort_order,
    block_type: b.block_type,
    content: b.content,
    created_at: '',
    updated_at: '',
  }))

  return (
    <div className="help-capture">
      <header className="help-capture__header">
        <h1>Lesson Builder — Help Screenshot Capture</h1>
        <p>Internal page for Playwright. Not linked in production navigation.</p>
      </header>

      <CaptureFrame id="capture-workspace-layout" label="Full builder layout" width={1280}>
        <div className="lesson-builder" style={{ height: 640 }}>
          <header className="lesson-builder__header lesson-builder__header--two-col">
            <div className="lesson-builder__header-left">
              <span className="lesson-builder__back">
                <i className="bi bi-arrow-left" />
              </span>
              <div className="lesson-builder__title-wrap">
                <h1 className="lesson-builder__title">Rock Groove Basics</h1>
                <p className="lesson-builder__meta">beginner · Grooves · 45 min</p>
              </div>
            </div>
            <div className="lesson-builder__header-right">
              <span className="lesson-builder__save-status">
                <i className="bi bi-check-circle-fill" /> Saved
              </span>
              <button type="button" className="lesson-builder__btn lesson-builder__btn--primary">
                Save Lesson
              </button>
              <button type="button" className="lesson-builder__btn lesson-builder__btn--preview">
                <i className="bi bi-eye" /> Student preview
              </button>
              <button type="button" className="lesson-builder__btn">
                <i className="bi bi-question-circle" /> Help
              </button>
            </div>
          </header>
          <div className="lesson-builder__body">
            <MockSidebar activeId="cap-text" />
            <div className="lesson-builder__editor-zone">
              <main className="lesson-builder__canvas-wrap">
                <div className="lesson-builder__canvas-chrome">
                  <CanvasViewToggle mode="stack" onChange={noop} />
                  <p className="lesson-builder__canvas-chrome-hint">Drag the grip to reorder</p>
                </div>
                <div className="lesson-builder__canvas-scroll lesson-builder__scroll">
                  <div className="lesson-builder__canvas-inner">
                    <div className="lesson-builder__canvas lesson-builder__canvas--wide">
                      <div className="lesson-builder__stack-slot">
                        <CanvasBlockCard
                          block={SAMPLE_BLOCKS[0]}
                          index={0}
                          selected
                          collapsed={false}
                          previewMode={false}
                          userId="capture"
                          onContentUpdate={noop}
                          onSelect={noop}
                          onToggleCollapse={noop}
                          onDuplicate={noop}
                          onDelete={noop}
                          onDragStart={noop}
                          onDragOver={noop}
                          onDrop={noop}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lesson-builder__canvas-dock">
                  <BlockPickerToolbar onAddBlock={noop} />
                </div>
              </main>
              <MockInspector />
            </div>
          </div>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-canvas-chrome-stack" label="Stack / Bento toggle (Stack active)" width={520}>
        <div className="lesson-builder__canvas-chrome" style={{ width: '100%' }}>
          <CanvasViewToggle mode="stack" onChange={noop} />
          <p className="lesson-builder__canvas-chrome-hint">Drag the grip to reorder</p>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-canvas-chrome-bento" label="Stack / Bento toggle (Bento active)" width={520}>
        <div className="lesson-builder__canvas-chrome" style={{ width: '100%' }}>
          <CanvasViewToggle mode="bento" onChange={noop} />
          <p className="lesson-builder__canvas-chrome-hint">Drag to rearrange · use the width icon to resize</p>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-floating-toolbar" label="Floating block toolbar" width={900}>
        <div className="help-capture__toolbar-stage">
          <BlockPickerToolbar onAddBlock={noop} />
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-stack-canvas" label="Stack canvas with blocks" width={920}>
        <div className="lesson-builder__canvas lesson-builder__canvas--wide">
          {SAMPLE_BLOCKS.slice(0, 3).map((block, index) => (
            <div key={block.id} className="lesson-builder__stack-slot">
              <CanvasBlockCard
                block={block}
                index={index}
                selected={index === 0}
                collapsed={false}
                previewMode={false}
                userId={index === 0 ? 'capture' : undefined}
                onContentUpdate={index === 0 ? noop : undefined}
                onSelect={noop}
                onToggleCollapse={noop}
                onDuplicate={noop}
                onDelete={noop}
                onDragStart={noop}
                onDragOver={noop}
                onDrop={noop}
              />
            </div>
          ))}
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-bento-canvas" label="Bento grid canvas" width={1000}>
        <div className="lesson-builder__bento-canvas">
          <div
            className="lesson-builder__bento-grid"
            style={{ gridTemplateRows: `repeat(${bentoRowCount}, minmax(140px, auto))` }}
          >
            {BENTO_BLOCKS.map((block, index) => (
              <div
                key={block.id}
                className="lesson-builder__bento-slot"
                style={gridPlacementStyle(getCanvasLayout(BENTO_BLOCKS, index))}
              >
                <CanvasBlockCard
                  block={block}
                  index={index}
                  selected={index === 1}
                  collapsed={false}
                  previewMode={false}
                  bentoMode
                  layout={getCanvasLayout(BENTO_BLOCKS, index)}
                  onResize={noop}
                  onSelect={noop}
                  onToggleCollapse={noop}
                  onDuplicate={noop}
                  onDelete={noop}
                  onDragStart={noop}
                  onDragOver={noop}
                  onDrop={noop}
                />
              </div>
            ))}
          </div>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-block-selected" label="Selected block (inline editor)" width={720}>
        <CanvasBlockCard
          block={SAMPLE_BLOCKS[0]}
          index={0}
          selected
          collapsed={false}
          previewMode={false}
          userId="capture"
          onContentUpdate={noop}
          onSelect={noop}
          onToggleCollapse={noop}
          onDuplicate={noop}
          onDelete={noop}
          onDragStart={noop}
          onDragOver={noop}
          onDrop={noop}
        />
      </CaptureFrame>

      <CaptureFrame id="capture-sidebar-outline" label="Sidebar block outline" width={260}>
        <MockSidebar activeId="cap-video" />
      </CaptureFrame>

      <CaptureFrame id="capture-inspector-panel" label="Lesson details inspector" width={300}>
        <MockInspector />
      </CaptureFrame>

      <CaptureFrame id="capture-empty-canvas" label="Empty canvas with starters" width={880}>
        <div className="lesson-builder__canvas-empty-wrap">
          <LessonCanvasEmptyState
            showStarters
            isDropTarget={false}
            onAddBlock={noop}
            onPaletteDragStart={noop}
            onPaletteDragEnd={noop}
          />
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-rich-text-toolbar" label="Rich text editor toolbar" width={760}>
        <div className="help-capture__rich-text-stage">
          <RichTextEditor
            value='<p>Write your tutorial here…</p>'
            onChange={noop}
            placeholder="Written tutorial"
          />
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-student-preview" label="Student preview (Stack)" width={720}>
        <div className="studio-app studio-app--student">
          <div className="lp-hub lp-practice-flow">
            <LessonStudentPracticeView
              title="Rock Groove Basics"
              lessonGoal="Play a clean rock groove at 100 BPM."
              studentInstructions="Work through each block in order."
              practiceAssignment="Record the full groove at goal tempo."
              category="Grooves"
              skillLevel="beginner"
              estimatedDurationMinutes={45}
              authorName="Mark"
              blocks={practiceBlocks}
              readOnly
              previewMode
              layoutMode="stack"
            />
          </div>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-student-bento" label="Student view (Bento grid)" width={900}>
        <div className="studio-app studio-app--student">
          <div className="lp-hub lp-practice-flow">
            <LessonStudentPracticeView
              title="Rock Groove Basics"
              lessonGoal="Play a clean rock groove at 100 BPM."
              blocks={bentoPracticeBlocks}
              readOnly
              layoutMode="bento"
            />
          </div>
        </div>
      </CaptureFrame>

      <CaptureFrame id="capture-help-copy-button" label="Help guide — Copy all for AI" width={640}>
        <div className="builder-help" style={{ position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden' }}>
          <header className="builder-help__header">
            <div className="builder-help__header-title">
              <i className="bi bi-book" aria-hidden />
              <span>Lesson Builder Guide</span>
            </div>
            <div className="builder-help__header-actions">
              <button type="button" className="builder-help__copy-ai lesson-builder__btn lesson-builder__btn--primary">
                <i className="bi bi-clipboard" aria-hidden />
                Copy all for AI
              </button>
              <button type="button" className="lesson-builder__btn">
                <i className="bi bi-x-lg" /> Close
              </button>
            </div>
          </header>
        </div>
      </CaptureFrame>
    </div>
  )
}
