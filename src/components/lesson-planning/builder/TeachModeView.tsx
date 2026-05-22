import LessonBlockRenderer from '../LessonBlockRenderer'
import { getBlockMeta, getBlockTitle, type EditableBlock } from '../../../lib/lesson-builder-utils'

interface TeachModeViewProps {
  title: string
  blocks: EditableBlock[]
  onExit: () => void
}

export default function TeachModeView({ title, blocks, onExit }: TeachModeViewProps) {
  return (
    <div className="teach-mode">
      <header className="teach-mode__header">
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--lb-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Teach Mode
          </p>
          <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.15rem' }}>{title || 'Untitled lesson'}</h1>
        </div>
        <button type="button" className="lesson-builder__btn" onClick={onExit}>
          <i className="bi bi-x-lg" /> Exit
        </button>
      </header>
      <div className="teach-mode__content">
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--lb-muted)', textAlign: 'center' }}>No blocks in this lesson yet.</p>
        ) : (
          blocks.map((block) => {
            const meta = getBlockMeta(block.block_type)
            return (
              <section key={block.id} className="teach-mode__block">
                <h2>
                  <i className={`bi ${meta?.icon ?? 'bi-square'}`} style={{ marginRight: '0.5rem' }} />
                  {getBlockTitle(block)}
                </h2>
                <LessonBlockRenderer
                  block={{
                    id: block.id,
                    template_id: block.id,
                    sort_order: block.sort_order,
                    block_type: block.block_type,
                    content: block.content,
                    created_at: '',
                    updated_at: '',
                  }}
                  mode="teacher"
                />
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
