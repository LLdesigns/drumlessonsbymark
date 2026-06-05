import type { HelpBlock } from '../../../lib/lesson-builder-help-content'

function HelpBlockView({ block }: { block: HelpBlock }) {
  switch (block.type) {
    case 'h3':
      return <h3 className="builder-help__h3">{block.text}</h3>
    case 'p':
      return <p className="builder-help__p">{block.text}</p>
    case 'ul':
      return (
        <ul className="builder-help__list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="builder-help__list builder-help__list--ordered">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )
    case 'tip':
      return (
        <aside className="builder-help__tip">
          {block.title ? <strong>{block.title}</strong> : null}
          <p>{block.text}</p>
        </aside>
      )
    case 'img':
      return (
        <figure className="builder-help__figure">
          <img src={block.src} alt={block.alt} className="builder-help__img" loading="lazy" />
          {block.caption ? <figcaption className="builder-help__caption">{block.caption}</figcaption> : null}
        </figure>
      )
    default:
      return null
  }
}

interface LessonBuilderHelpPageProps {
  title: string
  icon?: string
  blocks: HelpBlock[]
}

export default function LessonBuilderHelpPage({ title, icon, blocks }: LessonBuilderHelpPageProps) {
  return (
    <article className="builder-help__article">
      <header className="builder-help__article-head">
        <div className="builder-help__article-head-main">
          {icon ? <i className={`bi ${icon} builder-help__article-icon`} aria-hidden /> : null}
          <h2>{title}</h2>
        </div>
      </header>
      <div className="builder-help__article-body">
        {blocks.map((block, i) => (
          <HelpBlockView key={`${block.type}-${i}`} block={block} />
        ))}
      </div>
    </article>
  )
}
