/** Shared fallback while lazy route chunks load */
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="page-loader__spinner" aria-hidden />
      <p className="page-loader__text">Loading…</p>
    </div>
  )
}
