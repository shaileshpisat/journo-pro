'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppState } from '@/context/AppContext'
import { isPeriodTag, formatPeriodLabel, parsePeriodConfig, AmountType } from '@/lib/types'
import { fmtAmt } from '@/lib/formatters'
import Icon from '@/components/ui/Icon'
import SectionHead from '@/components/ui/SectionHead'

const UNIT_LABELS: Record<string, string> = {
  day: 'day(s)',
  week: 'week(s)',
  month: 'month(s)',
  year: 'year(s)',
}

export default function RecurringView() {
  const { state, dispatch } = useAppState()
  const { entries, currency } = state

  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [interval, setInterval] = useState(1)
  const [unit, setUnit] = useState('week')
  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<AmountType>('inflow')
  const [importResult, setImportResult] = useState<{ count: number; warnings: string[] } | null>(null)

  const recurringEntries = useMemo(() => {
    return entries
      .filter((e) => e.tags.includes('recurring'))
      .sort((a, b) => {
        const da = a.actionDate || ''
        const db = b.actionDate || ''
        if (da !== db) return da.localeCompare(db)
        return b.id - a.id
      })
  }, [entries])

  const findPeriodTag = (tags: string[]) => tags.find((t) => isPeriodTag(t))

  const stepDate = (d: Date, dir: 1 | -1, cfg: ReturnType<typeof parsePeriodConfig>) => {
    const n = dir * cfg!.interval
    if (cfg!.unit === 'day') d.setDate(d.getDate() + n)
    else if (cfg!.unit === 'week') d.setDate(d.getDate() + 7 * n)
    else if (cfg!.unit === 'month') d.setMonth(d.getMonth() + n)
    else if (cfg!.unit === 'year') d.setFullYear(d.getFullYear() + n)
  }

  const fmtYMD = (d: Date) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

  const parseImportDate = (raw: string): string => {
    if (!raw) return ''
    const s = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
    m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    return ''
  }

  const todayStr = new Date().toISOString().split('T')[0]

  type Occ = { date: string; completed: boolean; completedAt: string | null; delay: number | null; isCurrent: boolean }

  const nextOccurrences = useMemo(() => {
    const result: { entry: typeof recurringEntries[number]; occs: Occ[] }[] = []

    for (const entry of recurringEntries) {
      const period = findPeriodTag(entry.tags)
      if (!period) continue
      const cfg = parsePeriodConfig(period)
      if (!cfg) continue

      const completedMap = new Map<string, number>()
      for (const h of entry.history || []) {
        if (h.field === 'actionDate' && typeof h.oldValue === 'string')
          completedMap.set(h.oldValue, h.timestamp)
      }
      if (entry.isTaskDone && entry.completedAt && entry.actionDate)
        completedMap.set(entry.actionDate, new Date(entry.completedAt).getTime())

      const cur = entry.actionDate ? new Date(entry.actionDate + 'T00:00:00') : new Date()

      // Walk back up to 4 steps to collect up to 3 completed past dates
      const past: Occ[] = []
      const back = new Date(cur)
      for (let i = 0; i < 4 && past.length < 3; i++) {
        stepDate(back, -1, cfg)
        const ds = fmtYMD(back)
        if (completedMap.has(ds)) {
          const ts = completedMap.get(ds)!
          const completedAt = new Date(ts).toISOString()
          past.unshift({
            date: ds, completed: true, completedAt,
            delay: Math.round((ts - new Date(ds + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)),
            isCurrent: false,
          })
        }
      }

      // Walk forward to fill remaining slots
      const occs: Occ[] = [...past]
      const fwd = new Date(cur)
      if (completedMap.has(entry.actionDate!)) stepDate(fwd, 1, cfg)
      for (let i = 0; i < 10 - past.length; i++) {
        const ds = fmtYMD(fwd)
        const isDone = completedMap.has(ds)
        occs.push({
          date: ds, completed: isDone,
          completedAt: isDone ? new Date(completedMap.get(ds)!).toISOString() : null,
          delay: isDone ? Math.round((completedMap.get(ds)! - new Date(ds + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) : null,
          isCurrent: ds === entry.actionDate && !isDone,
        })
        stepDate(fwd, 1, cfg)
      }

      result.push({ entry, occs })
    }

    result.sort((a, b) => {
      const aNext = a.occs.find((o) => !o.completed)
      const bNext = b.occs.find((o) => !o.completed)
      const aDate = aNext?.date || ''
      const bDate = bNext?.date || ''
      if (aDate !== bDate) return aDate.localeCompare(bDate)
      return a.entry.text.localeCompare(b.entry.text)
    })
    return result
  }, [recurringEntries, entries])

  const groupedOccurrences = useMemo(() => {
    const today: typeof nextOccurrences = []
    const overdue: typeof nextOccurrences = []
    const upcoming: typeof nextOccurrences = []
    for (const item of nextOccurrences) {
      const next = item.occs.find((o) => !o.completed)
      const date = next?.date
      if (!date || date > todayStr) upcoming.push(item)
      else if (date === todayStr) today.push(item)
      else overdue.push(item)
    }
    return { today, overdue, upcoming }
  }, [nextOccurrences, todayStr])

  const renderTile = (entry: typeof recurringEntries[number], occs: Occ[]) => {
    const period = findPeriodTag(entry.tags)
    const [chipColor, chipBg] = period ? chipStyle(period) : ['var(--color-text3)', 'var(--color-bg3)']
    const isEditing = editingId === entry.id
    const amt = fmtAmt(entry.amount, entry.amountType, currency)

    if (isEditing) {
      return (
        <div key={entry.id} style={{
          border: '1px solid var(--color-accent)', borderRadius: 12, padding: 16,
          background: 'var(--color-bg2)', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} style={{
            border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px',
            fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', background: 'var(--color-bg)',
          }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={editActionDate} min={todayStr} onChange={(e) => setEditActionDate(e.target.value)} style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 10px',
              fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--color-bg)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--color-text3)', fontWeight: 500 }}>Every</span>
            <input type="number" min={1} value={editInterval} onChange={(e) => setEditInterval(Math.max(1, Number(e.target.value) || 1))} style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px',
              fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--color-bg)',
              width: 52, textAlign: 'center',
            }} />
            <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 10px',
              fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--color-bg)',
            }}>
              {Object.entries(UNIT_LABELS).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
            </select>
            <input type="number" step="any" min={0} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="0.00" style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 10px',
              fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--color-bg)', width: 80,
            }} />
            <button onClick={() => setEditAmountType(editAmountType === 'inflow' ? 'outflow' : 'inflow')} style={{
              background: editAmountType === 'inflow' ? 'var(--color-green-light)' : 'var(--color-red-light)',
              color: editAmountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)',
              border: `1px solid ${editAmountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)'}`,
              borderRadius: 6, padding: '6px 10px', fontFamily: 'inherit', fontSize: 12,
              fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {editAmountType === 'inflow' ? 'Income' : 'Expense'}
            </button>
          </div>

          {/* Tags */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="tag" size={11} />
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {editOtherTags.map((t) => (
                <span key={t} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--color-bg2)', border: '1px solid var(--color-border)',
                  borderRadius: 99, padding: '2px 8px', fontSize: 12, color: 'var(--color-text2)',
                }}>
                  #{t}
                  <button onClick={() => setEditOtherTags(editOtherTags.filter((x) => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--color-text3)' }}>
                    <Icon name="x" size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editTagInput.trim()) {
                    e.preventDefault()
                    const tag = editTagInput.replace(/^#/, '').trim()
                    if (tag && !editOtherTags.includes(tag)) setEditOtherTags([...editOtherTags, tag])
                    setEditTagInput('')
                  }
                }}
                placeholder="Add tag and press Enter..."
                style={{
                  border: '1px solid var(--color-border)', borderRadius: 6,
                  padding: '6px 10px', fontFamily: 'inherit', fontSize: 13,
                  outline: 'none', background: 'var(--color-bg)', width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Comments */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="messageSquare" size={11} />
              Comments
              {(entry.comments?.length ?? 0) > 0 && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--color-text3)' }}>
                  ({entry.comments.length})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <textarea
                  value={editCommentInput}
                  onChange={(e) => setEditCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && editCommentInput.trim()) {
                      e.preventDefault()
                      dispatch({ type: 'ADD_COMMENT', payload: { entryId: entry.id, comment: { id: Date.now(), text: editCommentInput.trim(), timestamp: new Date().toISOString() } } })
                      setEditCommentInput('')
                    }
                  }}
                  placeholder="Add a comment... (Cmd+Enter to submit)"
                  style={{
                    border: '1px solid var(--color-border)', borderRadius: 6,
                    padding: '6px 10px', fontFamily: 'inherit', fontSize: 13,
                    outline: 'none', background: 'var(--color-bg)', flex: 1, resize: 'none',
                  }}
                  rows={2}
                />
                <button
                  onClick={() => {
                    if (editCommentInput.trim()) {
                      dispatch({ type: 'ADD_COMMENT', payload: { entryId: entry.id, comment: { id: Date.now(), text: editCommentInput.trim(), timestamp: new Date().toISOString() } } })
                      setEditCommentInput('')
                    }
                  }}
                  disabled={!editCommentInput.trim()}
                  style={{
                    background: editCommentInput.trim() ? 'var(--color-accent)' : 'var(--color-bg3)',
                    color: editCommentInput.trim() ? '#fff' : 'var(--color-text3)',
                    border: 'none', borderRadius: 6, padding: '4px 12px',
                    fontFamily: 'inherit', fontSize: 12,
                    cursor: editCommentInput.trim() ? 'pointer' : 'default',
                  }}
                >
                  Add
                </button>
              </div>
              {entry.comments && entry.comments.length > 0 ? (
                [...entry.comments].sort((a, b) => {
                  if (a.isPinned && !b.isPinned) return -1
                  if (!a.isPinned && b.isPinned) return 1
                  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                }).map((c) => (
                  <div key={c.id} style={{
                    padding: '6px 8px',
                    background: c.isPinned ? 'var(--color-accent-light)' : 'var(--color-bg)',
                    borderRadius: 6,
                    borderLeft: c.isPinned ? '3px solid var(--color-accent)' : '3px solid transparent',
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginBottom: 2 }}>
                      {c.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.isPinned && (
                        <span style={{ fontSize: 9, color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Pinned
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace" }}>
                        {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text3)', lineHeight: 1.4 }}>
                  No comments yet.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <button onClick={handleSaveEdit} style={{
              background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6,
              padding: '6px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Save</button>
            <button onClick={cancelEditing} style={{
              background: 'var(--color-bg3)', color: 'var(--color-text)', border: 'none',
              borderRadius: 6, padding: '6px 16px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )
    }

    return (
      <div key={entry.id} style={{
        border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-bg)',
      }}>
        {/* Header: title, period, amount, tags, edit/delete */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 0',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
            {entry.text}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: chipColor, background: chipBg, padding: '2px 8px', borderRadius: 4 }}>
            {period ? formatPeriodLabel(period) : ''}
          </span>
          {amt && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: amt.color }}>
              {amt.label}
            </span>
          )}
          {entry.tags.filter((t) => t !== 'recurring' && !isPeriodTag(t)).map((t) => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 500, color: 'var(--color-text3)',
              background: 'var(--color-bg3)', padding: '2px 7px', borderRadius: 4,
            }}>
              {t}
            </span>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => startEditing(entry)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: 'var(--color-text3)', opacity: 0.4,
            }}>
              <Icon name="edit" size={13} />
            </button>
            <button onClick={() => handleDelete(entry.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: 'var(--color-text3)', opacity: 0.5,
            }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>

        {/* Occurrence columns */}
        <div style={{ padding: '16px 14px 14px', display: 'flex', gap: 0 }}>
          {occs.map((occ, i) => {
            const dt = new Date(occ.date + 'T00:00:00')
            const shortDate = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const completedDate = occ.completedAt
              ? new Date(occ.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : null

            return (
              <div key={occ.date} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '4px 0',
                borderRight: i < occs.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <button
                  onClick={() => !occ.completed && occ.isCurrent && handleAdvance(entry.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: occ.completed || !occ.isCurrent ? 'default' : 'pointer',
                    padding: 0,
                    color: occ.completed ? 'var(--color-green)' : occ.isCurrent ? 'var(--color-text)' : 'var(--color-text3)',
                    opacity: occ.completed ? 1 : occ.isCurrent ? 1 : 0.3,
                  }}
                >
                  <Icon name={occ.completed ? 'checkSquare' : 'square'} size={16} />
                </button>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text2)', fontFamily: "'DM Mono', monospace" }}>
                  {shortDate}
                </span>
                {completedDate && (
                  <span style={{ fontSize: 10, color: 'var(--color-green)', fontFamily: "'DM Mono', monospace" }}>
                    {completedDate}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const buildPeriodTag = () => `every-${interval}-${unit}`

  const handleAdd = () => {
    if (!text.trim()) return
    if (actionDate && actionDate < todayStr) return
    const today = new Date()
    const dateStr = actionDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const amt = amount ? parseFloat(amount) : null
    const entry = {
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      actionDate: dateStr,
      tags: ['recurring', buildPeriodTag()],
      folder: null,
      amount: amt,
      amountType: amt ? amountType : null,
      mentions: [],
      timeLogs: [],
      history: [],
      isTask: true,
      isTaskDone: false,
      completedAt: null,
      archived: false,
      comments: [],
      pghMapping: null,
    }
    dispatch({ type: 'ADD_ENTRY', payload: entry })
    setText('')
    setActionDate('')
    setInterval(1)
    setUnit('week')
    setAmount('')
    setAmountType('inflow')
    setShowForm(false)
  }

  const chipStyle = (tag: string) => {
    const cfg = parsePeriodConfig(tag)
    const u = cfg?.unit || 'week'
    const pair: Record<string, [string, string]> = {
      day: ['var(--color-amber)', 'var(--color-amber-light)'],
      week: ['var(--color-blue)', 'var(--color-blue-light)'],
      month: ['var(--color-green)', 'var(--color-green-light)'],
      year: ['var(--color-brown)', 'var(--color-brown-light)'],
    }
    return pair[u] || ['var(--color-text3)', 'var(--color-bg3)']
  }

  const handleDelete = (id: number) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id })
  }

  const handleAdvance = (id: number) => {
    dispatch({ type: 'ADVANCE_RECURRING', payload: id })
  }

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editActionDate, setEditActionDate] = useState('')
  const [editInterval, setEditInterval] = useState(1)
  const [editUnit, setEditUnit] = useState('week')
  const [editAmount, setEditAmount] = useState('')
  const [editAmountType, setEditAmountType] = useState<AmountType>('inflow')
  const [editOtherTags, setEditOtherTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [editCommentInput, setEditCommentInput] = useState('')

  const allMasterTags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))], [entries])

  const startEditing = (entry: typeof recurringEntries[number]) => {
    setEditingId(entry.id)
    setEditText(entry.text)
    setEditActionDate(entry.actionDate || '')
    const cfg = entry.tags.map((t) => parsePeriodConfig(t)).find(Boolean)
    setEditInterval(cfg?.interval || 1)
    setEditUnit(cfg?.unit || 'week')
    setEditAmount(entry.amount ? String(entry.amount) : '')
    setEditAmountType(entry.amountType || 'inflow')
    setEditOtherTags(entry.tags.filter((t) => !isPeriodTag(t) && t !== 'recurring'))
    setEditTagInput('')
    setEditCommentInput('')
  }

  const handleSaveEdit = () => {
    if (editingId === null || !editText.trim()) return
    if (editActionDate && editActionDate < todayStr) return
    const entry = entries.find((e) => e.id === editingId)
    if (!entry) return
    const amt = editAmount ? parseFloat(editAmount) : null
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        ...entry,
        text: editText.trim(),
        actionDate: editActionDate || entry.actionDate,
        tags: ['recurring', `every-${editInterval}-${editUnit}`, ...editOtherTags],
        amount: amt,
        amountType: amt ? editAmountType : null,
      },
    })
    setEditingId(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const toCsvField = (val: unknown): string => {
    const s = val == null ? '' : String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const parseCsvLine = (line: string): string[] => {
    const fields: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { cur += '"'; i++ }
          else { inQuotes = false }
        } else { cur += ch }
      } else if (ch === ',') { fields.push(cur); cur = '' }
      else if (ch === '"') { inQuotes = true }
      else { cur += ch }
    }
    fields.push(cur)
    return fields
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const rows = [['text', 'actionDate', 'tags', 'amount', 'amountType', 'isTaskDone']]
    for (const e of recurringEntries) {
      rows.push([
        e.text,
        e.actionDate || '',
        e.tags.join(';'),
        e.amount != null ? String(e.amount) : '',
        e.amountType || '',
        e.isTaskDone ? 'true' : 'false',
      ])
    }
    const csv = rows.map((r) => r.map(toCsvField).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recurring-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      const lines = csv.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        setImportResult({ count: 0, warnings: ['No data rows found in CSV.'] })
        return
      }
      const existingByText = new Map<string, typeof recurringEntries[number]>()
      for (const entry of recurringEntries) {
        existingByText.set(entry.text.toLowerCase(), entry)
      }
      const warnings: string[] = []
      let count = 0
      for (let i = 1; i < lines.length; i++) {
        try {
          const fields = parseCsvLine(lines[i])
          const [text, actionDate, tagsStr, amountStr, rawAmountType, isTaskDone] = fields
          if (!text) {
            warnings.push(`Row ${i + 1}: skipped (empty task description)`)
            continue
          }
          let tags = tagsStr ? tagsStr.split(';').filter(Boolean) : ['recurring']
          if (!tags.includes('recurring')) tags.unshift('recurring')
          if (!tags.some((t) => isPeriodTag(t))) {
            tags.push('every-1-week')
          }
          const amount = amountStr ? parseFloat(amountStr) : null
          const validDate = parseImportDate(actionDate || '')
          if (actionDate && !validDate) {
            warnings.push(`Row ${i + 1}: date "${actionDate.trim()}" not recognized, used existing date or today's date instead`)
          }
          const existing = existingByText.get(text.toLowerCase())
          if (existing) {
            dispatch({
              type: 'UPDATE_ENTRY',
              payload: {
                ...existing,
                text: text.trim(),
                actionDate: validDate || existing.actionDate,
                tags,
                amount: amount != null && !isNaN(amount) ? amount : existing.amount,
                amountType: (rawAmountType === 'inflow' || rawAmountType === 'outflow' ? rawAmountType : existing.amountType) as AmountType | null,
                isTaskDone: isTaskDone === 'true',
                completedAt: isTaskDone === 'true' ? (existing.completedAt || new Date().toISOString()) : null,
              },
            })
          } else {
            const entry = {
              id: Date.now() + i,
              text: text.trim(),
              timestamp: new Date().toISOString(),
              actionDate: validDate || todayStr,
              tags,
              folder: null,
              amount: amount != null && !isNaN(amount) ? amount : null,
              amountType: (rawAmountType === 'inflow' || rawAmountType === 'outflow' ? rawAmountType : null) as AmountType | null,
              mentions: [],
              timeLogs: [],
              history: [],
              isTask: true,
              isTaskDone: isTaskDone === 'true',
              completedAt: isTaskDone === 'true' ? new Date().toISOString() : null,
              archived: false,
              comments: [],
              pghMapping: null,
            }
            dispatch({ type: 'ADD_ENTRY', payload: entry })
          }
          count++
        } catch (err) {
          warnings.push(`Row ${i + 1}: error — ${err instanceof Error ? err.message : 'invalid format'}`)
        }
      }
      setImportResult({ count, warnings })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
          Recurring
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-bg3)',
              color: 'var(--color-text)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Icon name="download" size={14} />
            Import
          </button>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-bg3)',
              color: 'var(--color-text)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Icon name="upload" size={14} />
            Export
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: showForm ? 'var(--color-bg3)' : 'var(--color-accent)',
              color: showForm ? 'var(--color-text)' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Icon name="plus" size={14} />
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div style={{
          border: `1px solid ${importResult.warnings.length > 0 ? 'var(--color-amber)' : 'var(--color-green)'}`,
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          background: importResult.warnings.length > 0 ? 'var(--color-amber-light)' : 'var(--color-green-light)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>{importResult.count} entries imported.</strong>
            {importResult.warnings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {importResult.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--color-text2)', marginTop: 2 }}>{w}</div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setImportResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text3)', flexShrink: 0 }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
            background: 'var(--color-bg2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Recurring task description…"
            rows={2}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              background: 'var(--color-bg)',
            }}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text2)', fontWeight: 500 }}>
                Start date:
              </label>
              <input
                type="date"
                value={actionDate}
                min={todayStr}
                onChange={(e) => setActionDate(e.target.value)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  background: 'var(--color-bg)',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text2)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Every
              </label>
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  background: 'var(--color-bg)',
                  width: 56,
                  textAlign: 'center',
                }}
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  background: 'var(--color-bg)',
                }}
              >
                {Object.entries(UNIT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                step="any"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  background: 'var(--color-bg)',
                  width: 88,
                }}
              />
              <button
                onClick={() => setAmountType(amountType === 'inflow' ? 'outflow' : 'inflow')}
                style={{
                  background: amountType === 'inflow' ? 'var(--color-green-light)' : 'var(--color-red-light)',
                  color: amountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)',
                  border: `1px solid ${amountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)'}`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {amountType === 'inflow' ? 'Income' : 'Expense'}
              </button>
            </div>
            <button
              onClick={handleAdd}
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '7px 18px',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tiles */}
      {recurringEntries.length === 0 && (
        <p style={{ color: 'var(--color-text3)', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
          No recurring entries yet. Click "Add" to create one.
        </p>
      )}

      {nextOccurrences.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groupedOccurrences.today.length > 0 && (
            <>
              <SectionHead title="Today" count={groupedOccurrences.today.length} />
              {groupedOccurrences.today.map(({ entry, occs }) => renderTile(entry, occs))}
            </>
          )}
          {groupedOccurrences.overdue.length > 0 && (
            <>
              <SectionHead title="Overdue" count={groupedOccurrences.overdue.length} />
              {groupedOccurrences.overdue.map(({ entry, occs }) => renderTile(entry, occs))}
            </>
          )}
          {groupedOccurrences.upcoming.length > 0 && (
            <>
              <SectionHead title="Upcoming" count={groupedOccurrences.upcoming.length} />
              {groupedOccurrences.upcoming.map(({ entry, occs }) => renderTile(entry, occs))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
