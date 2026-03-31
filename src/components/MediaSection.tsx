const VIDEOS = [
  { id: '_XBFlOTAInY', index: '01', title: 'Drum lesson media video 1' },
  { id: 'WiKfV8emz80', index: '02', title: 'Drum lesson media video 2' },
  { id: 'OZ_pyTGl1VQ', index: '03', title: 'Drum lesson media video 3' },
  { id: 'XpBR_dxXTLw', index: '04', title: 'Drum lesson media video 4' },
] as const

const MediaSection = () => {
  return (
    <section id="media-section" className="media-section" aria-label="Media library">
      <div className="media-section-inner">
        <header className="media-section-header">
          <h2 className="media-section-title">Media</h2>
          <p className="media-section-subtitle">
            Performances and clips — watch on the page or open on YouTube.
          </p>
        </header>
        <div className="media-library-grid">
          {VIDEOS.map((v) => (
            <article key={v.id} className="media-library-card">
              <div className="media-library-meta">
                <span className="media-library-index">{v.index}</span>
                <span className="media-library-badge">Video</span>
              </div>
              <div className="media-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MediaSection
