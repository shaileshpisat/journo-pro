interface SectionHeadProps {
  title: string
  count?: number
  action?: { label: string; fn: () => void }
}

export default function SectionHead({ title, count, action }: SectionHeadProps) {
  return (
    <div className="flex justify-between items-center mb-2.5">
      <div className="flex items-center gap-2">
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text2)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: count > 0 ? 'var(--color-red)' : 'var(--color-bg3)',
              color: count > 0 ? '#fff' : 'var(--color-text3)',
              borderRadius: 99,
              padding: '1px 7px',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {count}
          </span>
        )}
      </div>
      {action && (
        <span
          onClick={action.fn}
          style={{ fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500 }}
        >
          {action.label}
        </span>
      )}
    </div>
  )
}
