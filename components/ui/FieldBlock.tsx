import Icon from './Icon'

interface FieldBlockProps {
  label: string
  icon: string
  value?: string | null
  color?: string
  mono?: boolean
  children?: React.ReactNode
}

export default function FieldBlock({ label, icon, value, color, mono, children }: FieldBlockProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg2)',
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text3)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 5,
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <Icon name={icon} size={11} />
        {label}
      </div>
      {value ? (
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: color || 'var(--color-text)',
            fontFamily: mono ? "'DM Mono', monospace" : 'inherit',
          }}
        >
          {value}
        </span>
      ) : children ? (
        children
      ) : (
        <span style={{ fontSize: 13, color: 'var(--color-text3)' }}>—</span>
      )}
    </div>
  )
}
