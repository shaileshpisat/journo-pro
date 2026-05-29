import { useState } from 'react'
import { Entry, TimerState, EntryHistory, TimeLog } from '@/lib/types'
import { fmtTime, fmtAmt, fmtDate, fmtDuration } from '@/lib/formatters'
import { isOverdue } from '@/lib/predicates'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

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

export interface HistoryRowData {
  history: EntryHistory
  entryText: string
  timestamp: number
}

export interface TimeLogRowData {
  entryText: string
  entryId: number
  startedAt: number
  duration: number
  description?: string
}

interface TodayTimelineProps {
  entries: Entry[]
  historyItems?: HistoryRowData[]
  timeTrackingItems?: TimeLogRowData[]
  onClick: (entry: Entry) => void
  activeTimer?: TimerState | null
  onTimerToggle?: (entry: Entry) => void
  onTaskToggle?: (entry: Entry) => void
  currency?: string
}

function fmtHistField(field: string): string {
  const map: Record<string, string> = {
    text: 'Text',
    folder: 'Folder',
    actionDate: 'Action date',
    entity: 'Entity',
    amount: 'Amount',
    amountType: 'Type',
    tags: 'Tags',
    isTask: 'Task',
    isTaskDone: 'Done',
    archived: 'Archive',
    commentAdded: 'Comment added',
    commentEdited: 'Comment edited',
  }
  return map[field] || field
}

function fmtHistValue(field: string, val: unknown, currency = '$'): string {
  if (val === null || val === undefined) return '—'
  if (field === 'amount') return `${currency}${Number(val).toLocaleString()}`
  if (field === 'amountType') return val as string
  if (field === 'isTask') return val ? 'yes' : 'no'
  if (field === 'isTaskDone') return val ? 'done' : 'undone'
  if (field === 'archived') return val ? 'archived' : 'restored'
  if (field === 'actionDate') return val as string
  if (Array.isArray(val)) return `[${(val as string[]).join(', ')}]`
  return String(val).slice(0, 50)
}

function HistoryRow({ history, entryText, timestamp, currency = '$' }: { history: EntryHistory; entryText: string; timestamp: number; currency?: string }) {
  return (
    <div style={{
      background: 'transparent',
      borderRadius: 8,
      padding: '6px 13px',
      marginBottom: 6,
      fontSize: 12,
      lineHeight: 1.4,
      border: '1px dashed var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Icon name="edit" size={11} color="var(--color-text3)" />
        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
          {fmtHistField(history.field)}
        </span>
        <span style={{ color: 'var(--color-text3)' }}>·</span>
        <span style={{ color: 'var(--color-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {entryText.slice(0, 40)}{entryText.length > 40 ? '…' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 17 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
          {new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
        <span style={{ color: 'var(--color-text3)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          {fmtHistValue(history.field, history.oldValue, currency)}
          <span style={{ margin: '0 4px', color: 'var(--color-accent)' }}>→</span>
          {fmtHistValue(history.field, history.newValue, currency)}
        </span>
      </div>
    </div>
  )
}

function TimeRow({ entryText, startedAt, duration, description }: TimeLogRowData) {
  return (
    <div style={{
      background: 'transparent',
      borderRadius: 8,
      padding: '6px 13px',
      marginBottom: 6,
      fontSize: 12,
      lineHeight: 1.4,
      border: '1px dashed var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Icon name="stopwatch" size={11} color="var(--color-accent)" />
          <span style={{ fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entryText.slice(0, 40)}{entryText.length > 40 ? '…' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 17 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
            {new Date(startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
          {description && (
            <span style={{ fontSize: 11, color: 'var(--color-text3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {description}
            </span>
          )}
        </div>
      </div>
      <div style={{
        flexShrink: 0,
        background: 'var(--color-accent-light)',
        borderRadius: 8,
        padding: '8px 16px',
        textAlign: 'center',
        minWidth: 70,
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--color-accent)',
        }}>
          {fmtDuration(duration)}
        </span>
      </div>
    </div>
  )
}

export default function TodayTimeline({ entries, historyItems, timeTrackingItems, onClick, activeTimer, onTimerToggle, onTaskToggle, currency = '$' }: TodayTimelineProps) {
  const [commentHoveredId, setCommentHoveredId] = useState<number | null>(null)
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const byHour: Record<number, Entry[]> = {}
  sorted.forEach((e) => {
    const h = new Date(e.timestamp).getHours()
    if (!byHour[h]) byHour[h] = []
    byHour[h].push(e)
  })

  const histByHour: Record<number, HistoryRowData[]> = {}
  if (historyItems) {
    const sortedHist = [...historyItems].sort((a, b) => a.timestamp - b.timestamp)
    sortedHist.forEach((item) => {
      const h = new Date(item.timestamp).getHours()
      if (!histByHour[h]) histByHour[h] = []
      histByHour[h].push(item)
    })
  }

  const timeByHour: Record<number, TimeLogRowData[]> = {}
  if (timeTrackingItems) {
    const sortedTime = [...timeTrackingItems].sort((a, b) => a.startedAt - b.startedAt)
    sortedTime.forEach((item) => {
      const h = new Date(item.startedAt).getHours()
      if (!timeByHour[h]) timeByHour[h] = []
      timeByHour[h].push(item)
    })
  }

  const allHours = new Set([...Object.keys(byHour).map(Number), ...Object.keys(histByHour).map(Number), ...Object.keys(timeByHour).map(Number)])
  const hours = [...allHours].sort((a, b) => a - b)

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
            {[
              ...(byHour[h]?.map(e => ({ type: 'entry' as const, ts: new Date(e.timestamp).getTime(), data: e })) || []),
              ...(histByHour[h]?.map(item => ({ type: 'history' as const, ts: item.timestamp, data: item })) || []),
              ...(timeByHour[h]?.map(item => ({ type: 'time' as const, ts: item.startedAt, data: item })) || []),
            ].sort((a, b) => a.ts - b.ts).map((item) => {
              if (item.type === 'entry') {
                const e = item.data
                const amt = fmtAmt(e.amount, e.amountType, currency)
                const isActive = activeTimer?.entryId === e.id
                const totalTracked = e.timeLogs ? e.timeLogs.reduce((s, l) => s + l.duration, 0) : 0
                const lastComment = e.comments?.[e.comments.length - 1]
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
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                        {onTaskToggle && e.isTask && (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation()
                              onTaskToggle(e)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '1px 0 0 0',
                              color: e.isTaskDone ? 'var(--color-accent)' : 'var(--color-text3)',
                              flexShrink: 0,
                            }}
                          >
                            <Icon name={e.isTaskDone ? 'checkSquare' : 'square'} size={13} />
                          </button>
                        )}
                        <p style={{
                          fontSize: 13,
                          color: e.isTaskDone ? 'var(--color-text3)' : 'var(--color-text)',
                          lineHeight: 1.45,
                          margin: 0,
                          textDecoration: e.isTaskDone ? 'line-through' : 'none',
                        }}>
                          {e.text}
                        </p>
                      </div>
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
                              background: isActive ? 'var(--color-red-light)' : totalTracked > 0 ? 'var(--color-accent-light)' : 'var(--color-bg2)',
                              border: `1px solid ${isActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                              borderRadius: 6,
                              padding: totalTracked > 0 && !isActive ? '3px 8px' : '3px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: isActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-text3)',
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11,
                              fontWeight: isActive || totalTracked > 0 ? 500 : 400,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isActive ? (
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
                          onMouseEnter={() => setCommentHoveredId(e.id)}
                          onMouseLeave={() => setCommentHoveredId(null)}
                          style={{ position: 'relative' }}
                        >
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation()
                              onClick(e)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '3px 4px',
                              color: 'var(--color-text3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            <Icon name="messageSquare" size={12} />
                            {(e.comments?.length ?? 0) > 0 && <span>{e.comments.length}</span>}
                          </button>
                          {commentHoveredId === e.id && (
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
                    {e.actionDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: isOverdue(e) ? 'var(--color-red)' : 'var(--color-amber)', fontWeight: 500 }}>
                        <Icon name="clock" size={11} />
                        {fmtDate(e.actionDate)}
                      </div>
                    )}
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
              }
              if (item.type === 'history') {
                const hist = item.data
                return <HistoryRow key={`h-${hist.timestamp}`} history={hist.history} entryText={hist.entryText} timestamp={hist.timestamp} currency={currency} />
              }
              const t = item.data
              return <TimeRow key={`t-${t.startedAt}`} entryText={t.entryText} entryId={t.entryId} startedAt={t.startedAt} duration={t.duration} description={t.description} />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
