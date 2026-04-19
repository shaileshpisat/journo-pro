import { Entry, TimerState } from '@/lib/types'
import { fmtTime, fmtAmt } from '@/lib/formatters'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

interface TodayTimelineProps {
  entries: Entry[]
  onClick: (entry: Entry) => void
  activeTimer?: TimerState | null
  onTimerToggle?: (entry: Entry) => void
}

export default function TodayTimeline({ entries, onClick, activeTimer, onTimerToggle }: TodayTimelineProps) {
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const byHour: Record<number, Entry[]> = {}
  sorted.forEach((e) => {
    const h = new Date(e.timestamp).getHours()
    if (!byHour[h]) byHour[h] = []
    byHour[h].push(e)
  })
  const hours = Object.keys(byHour)
    .map(Number)
    .sort((a, b) => a - b)
  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12} ${ampm}`
  }

  return (
    <div>
      {hours.map((h) => (
        <div key={h} style={{ display: 'flex', gap: 0 }}>
          <div style={{ width: 52, flexShrink: 0, paddingTop: 3 }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text3)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {fmtHour(h)}
            </span>
          </div>
          <div
            style={{
              width: 1,
              background: 'var(--color-border)',
              flexShrink: 0,
              marginRight: 14,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 7,
                left: -3.5,
                width: 8,
                height: 8,
                borderRadius: 99,
                background: 'var(--color-accent)',
                border: '2px solid var(--color-bg)',
              }}
            />
          </div>
          <div style={{ flex: 1, paddingBottom: 14 }}>
            {byHour[h].map((e) => {
              const amt = fmtAmt(e.amount, e.amountType)
              const isActive = activeTimer?.entryId === e.id
              return (
                <div
                  key={e.id}
                  onClick={() => onClick(e)}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    padding: '9px 13px',
                    marginBottom: 6,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'
                    ev.currentTarget.style.borderColor = '#ccc'
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.boxShadow = 'none'
                    ev.currentTarget.style.borderColor = 'var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.45, flex: 1, margin: 0 }}>
                      {e.text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {amt && (
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12,
                            fontWeight: 500,
                            color: amt.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {amt.label}
                        </span>
                      )}
                      {onTimerToggle && (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation()
                            onTimerToggle(e)
                          }}
                          style={{
                            background: isActive ? 'var(--color-red-light)' : 'var(--color-bg2)',
                            border: `1px solid ${isActive ? 'var(--color-red)' : 'var(--color-border)'}`,
                            borderRadius: 6,
                            padding: '3px 6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: isActive ? 'var(--color-red)' : 'var(--color-text3)',
                          }}
                        >
                          <Icon name={isActive ? 'pause' : 'stopwatch'} size={12} />
                          {isActive && <span style={{ fontSize: 11, fontWeight: 500 }}>Running</span>}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text3)',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {fmtTime(e.timestamp)}
                    </span>
                    {e.entity && <Chip icon="entity" label={e.entity} small />}
                    {e.folder && <FolderChip path={e.folder} small />}
                    {e.tags.map((t) => (
                      <Chip key={t} label={`#${t}`} small />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
