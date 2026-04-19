import Icon from './Icon'

interface FolderChipProps {
  path: string | null
  small?: boolean
}

export default function FolderChip({ path, small }: FolderChipProps) {
  if (!path) return null
  const label = path.split('/').join(' / ')
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
        color: 'var(--color-accent)',
        background: 'var(--color-accent-light)',
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      <Icon name="folder" size={11} />
      {label}
    </span>
  )
}
