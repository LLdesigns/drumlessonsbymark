interface LessonPlanningSchemaBannerProps {
  message: string
}

export default function LessonPlanningSchemaBanner({ message }: LessonPlanningSchemaBannerProps) {
  return (
    <div
      className="lp-schema-banner"
      role="alert"
      style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.25rem',
        borderRadius: 12,
        border: '1px solid rgba(255, 100, 100, 0.35)',
        background: 'rgba(255, 80, 80, 0.08)',
        color: 'var(--studio-text, #f7f7fa)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
        <i className="bi bi-database-exclamation" style={{ marginRight: '0.35rem' }} />
        Database setup required
      </strong>
      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>
      <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
        Open Supabase → SQL Editor → run{' '}
        <code style={{ fontSize: '0.8rem' }}>supabase/sql/LESSON_PLANNING_RUN_IN_SUPABASE.sql</code>
        {' '}(see comments at top of that file for prerequisites).
      </p>
    </div>
  )
}
