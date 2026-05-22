interface StudioPageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function StudioPageHeader({ title, subtitle, action }: StudioPageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h2 className="studio-card__title" style={{ marginBottom: subtitle ? '0.35rem' : 0 }}>{title}</h2>
        {subtitle ? <p className="studio-subtext" style={{ marginTop: '0.35rem' }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
