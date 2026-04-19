import { useState } from 'react'
import { Entry } from '@/lib/types'
import { fmtTime, fmtDate, fmtAmt } from '@/lib/formatters'
import { isOverdue } from '@/lib/predicates'
import { TimerState } from '@/lib/types'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

interface EntryCardProps {
  entry: Entry
  onClick: (entry: Entry) => void
  compact?: boolean
  overdue?: boolean
  minimal?: boolean
  timerActive?: boolean
  onTimerToggle?: (entry: Entry) => void
}

export default function EntryCard({
  entry,
  onClick,
  compact,
  overdue,
  minimal,
  timerActive,
  onTimerToggle,
}: EntryCardProps) {
  const [hovered, setHovered] = useState(false)
  const amt = fmtAmt(entry.amount, entry.amountType)

  return (
    <div
      onClick={() => onClick(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${overdue ? 'var(--color-red)' : hovered ? '#ccc' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius)',
        padding: minimal ? '8px 12px' : compact ? '10px 14px' : '13px 16px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.45, flex: 1, margin: 0 }}>
          {entry.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!minimal && amt && (
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
              onClick={(e) => {
                e.stopPropagation()
                onTimerToggle(entry)
              }}
              style={{
                background: timerActive ? 'var(--color-red-light)' : 'var(--color-bg2)',
                border: `1px solid ${timerActive ? 'var(--color-red)' : 'var(--color-border)'}`,
                borderRadius: 6,
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: timerActive ? 'var(--color-red)' : 'var(--color-text3)',
              }}
            >
              <Icon name={timerActive ? 'pause' : 'stopwatch'} size={12} />
              {timerActive && (
                <span style={{ fontSize: 11, fontWeight: 500 }}>Running</span>
              )}
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, alignItems: 'center' }}>
        {minimal ? (
          <>
            {entry.actionDate && (
              <Chip
                icon="clock"
                label={fmtDate(entry.actionDate)}
                bg={overdue ? 'var(--color-red-light)' : 'var(--color-amber-light)'}
                color={overdue ? 'var(--color-red)' : 'var(--color-amber)'}
                small
              />
            )}
            {entry.entity && <Chip icon="entity" label={entry.entity} small />}
          </>
        ) : (
          <>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text3)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {fmtTime(entry.timestamp)}
            </span>
            {entry.entity && <Chip icon="entity" label={entry.entity} small />}
            {entry.folder && <FolderChip path={entry.folder} small />}
            {entry.actionDate && (
              <Chip
                icon="clock"
                label={fmtDate(entry.actionDate)}
                bg={overdue ? 'var(--color-red-light)' : 'var(--color-amber-light)'}
                color={overdue ? 'var(--color-red)' : 'var(--color-amber)'}
                small
              />
            )}
            {entry.tags.map((t) => (
              <Chip key={t} label={`#${t}`} small />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
