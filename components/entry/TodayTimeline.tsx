import { Entry, TimerState, EntryHistory } from '@/lib/types'
import { fmtTime, fmtAmt } from '@/lib/formatters'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

export interface HistoryRowData {
  history: EntryHistory
  entryText: string
  timestamp: number
}

interface TodayTimelineProps {
  entries: Entry[]
  historyItems?: HistoryRowData[]
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

export default function TodayTimeline({ entries, historyItems, onClick, activeTimer, onTimerToggle, onTaskToggle, currency = '$' }: TodayTimelineProps) {
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

  const allHours = new Set([...Object.keys(byHour).map(Number), ...Object.keys(histByHour).map(Number)])
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
            {byHour[h]?.map((e) => {
              const amt = fmtAmt(e.amount, e.amountType, currency)
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
            {histByHour[h]?.map((item, i) => (
              <HistoryRow key={`h-${i}`} history={item.history} entryText={item.entryText} timestamp={item.timestamp} currency={currency} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
