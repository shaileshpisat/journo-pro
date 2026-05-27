import { useState, useRef } from 'react'
import { Entry, Comment } from '@/lib/types'
import { fmtTime, fmtDate, fmtAmt, fmtDuration } from '@/lib/formatters'
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
  onTaskToggle?: (entry: Entry) => void
  onArchive?: (entry: Entry) => void
  currency?: string
}

function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function EntryCard({
  entry,
  onClick,
  compact,
  overdue,
  minimal,
  timerActive,
  onTimerToggle,
  onTaskToggle,
  onArchive,
  currency = '$',
}: EntryCardProps) {
  const [hovered, setHovered] = useState(false)
  const [commentHovered, setCommentHovered] = useState(false)
  const amt = fmtAmt(entry.amount, entry.amountType, currency)
  const lastComment: Comment | undefined = entry.comments?.[entry.comments.length - 1]
  const totalTracked = entry.timeLogs ? entry.timeLogs.reduce((s, l) => s + l.duration, 0) : 0

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
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
          {onTaskToggle && entry.isTask && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTaskToggle(entry)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '1px 0 0 0',
                color: entry.isTaskDone ? 'var(--color-accent)' : 'var(--color-text3)',
                flexShrink: 0,
              }}
            >
              <Icon name={entry.isTaskDone ? 'checkSquare' : 'square'} size={14} />
            </button>
          )}
          <p
            style={{
              fontSize: 13,
              color: entry.isTaskDone ? 'var(--color-text3)' : 'var(--color-text)',
              lineHeight: 1.45,
              margin: 0,
              textDecoration: entry.isTaskDone ? 'line-through' : 'none',
            }}
          >
            {entry.text}
          </p>
        </div>
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
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive(entry)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 4px',
                color: hovered ? 'var(--color-text3)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
              }}
              title={entry.archived ? 'Restore' : 'Archive'}
            >
              <Icon name="archive" size={13} />
            </button>
          )}
          {onTimerToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTimerToggle(entry)
              }}
              style={{
                background: timerActive ? 'var(--color-red-light)' : totalTracked > 0 ? 'var(--color-accent-light)' : 'var(--color-bg2)',
                border: `1px solid ${timerActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 6,
                padding: totalTracked > 0 && !timerActive ? '3px 8px' : '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: timerActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-text3)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                fontWeight: timerActive || totalTracked > 0 ? 500 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {timerActive ? (
                <>
                  <Icon name="pause" size={12} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>Running</span>
                </>
              ) : totalTracked > 0 ? (
                <>{fmtDuration(totalTracked)}</>
              ) : (
                <Icon name="stopwatch" size={12} />
              )}
            </button>
          )}
          <div
            onMouseEnter={() => setCommentHovered(true)}
            onMouseLeave={() => setCommentHovered(false)}
            style={{ position: 'relative' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick(entry)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 4px',
                color: hovered ? 'var(--color-text3)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <Icon name="messageSquare" size={12} />
              {(entry.comments?.length ?? 0) > 0 && <span>{entry.comments.length}</span>}
            </button>
            {commentHovered && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: 6,
                  background: '#1a1a18',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 11,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                }}
              >
                {lastComment ? (
                  <>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{lastComment.text}</div>
                    <div style={{ opacity: 0.6, fontFamily: "'DM Mono', monospace" }}>
                      {new Date(lastComment.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {fmtAge(lastComment.timestamp)}
                    </div>
                  </>
                ) : (
                  <span style={{ opacity: 0.6 }}>No comments</span>
                )}
              </div>
            )}
          </div>
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
            {entry.isTaskDone && entry.completedAt && (
              <Chip
                icon="check"
                label={'Done ' + (entry.completedAt.split('T')[0] === new Date().toISOString().split('T')[0] ? fmtTime(entry.completedAt) : fmtDate(entry.completedAt))}
                bg="var(--color-accent-light)"
                color="var(--color-accent)"
                small
              />
            )}
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
            {entry.isTaskDone && entry.completedAt && (
              <Chip
                icon="check"
                label={'Done ' + (entry.completedAt.split('T')[0] === new Date().toISOString().split('T')[0] ? fmtTime(entry.completedAt) : fmtDate(entry.completedAt))}
                bg="var(--color-accent-light)"
                color="var(--color-accent)"
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
