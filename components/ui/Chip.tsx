import Icon from './Icon'

interface ChipProps {
  icon?: string
  label: string
  color?: string
  bg?: string
  onRemove?: () => void
  small?: boolean
}

export default function Chip({ icon, label, color, bg, onRemove, small }: ChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: small ? '2px 7px' : '3px 9px',
        borderRadius: 99,
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        color: color || 'var(--color-text2)',
        background: bg || 'var(--color-bg3)',
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      {icon && <Icon name={icon} size={11} />}
      {label}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: 'pointer', opacity: 0.5, marginLeft: 1 }}>
          ×
        </span>
      )}
    </span>
  )
}
