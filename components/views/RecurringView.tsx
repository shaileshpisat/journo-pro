'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppState } from '@/context/AppContext'
import { isPeriodTag, formatPeriodLabel, parsePeriodConfig, AmountType } from '@/lib/types'
import { fmtAmt } from '@/lib/formatters'
import Icon from '@/components/ui/Icon'

const UNIT_LABELS: Record<string, string> = {
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

  const generateOccurrences = (entry: typeof recurringEntries[number], cfg: ReturnType<typeof parsePeriodConfig>) => {
    if (!cfg) return []
    const dates: string[] = []
    const start = entry.actionDate ? new Date(entry.actionDate + 'T00:00:00') : new Date()
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)
    const cur = new Date(start)
    while (cur <= end) {
      dates.push(cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0'))
      const next = new Date(cur)
      if (cfg.unit === 'day') next.setDate(next.getDate() + cfg.interval)
      else if (cfg.unit === 'week') next.setDate(next.getDate() + 7 * cfg.interval)
      else if (cfg.unit === 'month') next.setMonth(next.getMonth() + cfg.interval)
      else if (cfg.unit === 'year') next.setFullYear(next.getFullYear() + cfg.interval)
      cur.setTime(next.getTime())
    }
    return dates
  }

  const monthTiles = useMemo(() => {
    const tiles: {
      monthKey: string
      monthLabel: string
      entry: typeof recurringEntries[number]
      dates: string[]
      occStatus: { date: string; completed: boolean; completedAt: string | null; delay: number | null }[]
    }[] = []

    for (const entry of recurringEntries) {
      const period = findPeriodTag(entry.tags)
      if (!period) continue
      const cfg = parsePeriodConfig(period)
      if (!cfg) continue

      const allDates = generateOccurrences(entry, cfg)
      const completionFromHistory = new Map<string, number>()
      for (const h of entry.history || []) {
        if (h.field === 'actionDate' && typeof h.oldValue === 'string') {
          completionFromHistory.set(h.oldValue, h.timestamp)
        }
      }

      const byMonth = new Map<string, string[]>()
      for (const d of allDates) {
        const key = d.slice(0, 7)
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key)!.push(d)
      }

      for (const [monthKey, dates] of byMonth) {
        const occStatus = dates.map((date) => {
          let completed = false
          let completedAt: string | null = null
          let delay: number | null = null

          if (date === entry.actionDate && entry.isTaskDone && entry.completedAt) {
            completed = true
            completedAt = entry.completedAt
          } else if (completionFromHistory.has(date)) {
            completed = true
            completedAt = new Date(completionFromHistory.get(date)!).toISOString()
          }

          if (completed && completedAt) {
            const sched = new Date(date + 'T00:00:00').getTime()
            const done = new Date(completedAt).getTime()
            delay = Math.round((done - sched) / (1000 * 60 * 60 * 24))
          }

          return { date, completed, completedAt, delay }
        })

        const mon = new Date(monthKey + '-01')
        const monthLabel = mon.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        tiles.push({ monthKey, monthLabel, entry, dates, occStatus })
      }
    }

    tiles.sort((a, b) => {
      const mc = a.monthKey.localeCompare(b.monthKey)
      if (mc !== 0) return mc
      return a.entry.id - b.entry.id
    })
    return tiles
  }, [recurringEntries, entries])

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
      week: ['var(--color-accent)', 'var(--color-accent-light)'],
      month: ['var(--color-green)', 'var(--color-green-light)'],
      year: ['var(--color-red)', 'var(--color-red-light)'],
    }
    return pair[u] || ['var(--color-text3)', 'var(--color-bg3)']
  }

  const handleDelete = (id: number) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id })
  }

  const handleAdvance = (id: number) => {
    dispatch({ type: 'ADVANCE_RECURRING', payload: id })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editActionDate, setEditActionDate] = useState('')
  const [editInterval, setEditInterval] = useState(1)
  const [editUnit, setEditUnit] = useState('week')
  const [editAmount, setEditAmount] = useState('')
  const [editAmountType, setEditAmountType] = useState<AmountType>('inflow')

  const startEditing = (entry: typeof recurringEntries[number]) => {
    setEditingId(entry.id)
    setEditText(entry.text)
    setEditActionDate(entry.actionDate || '')
    const cfg = entry.tags.map((t) => parsePeriodConfig(t)).find(Boolean)
    setEditInterval(cfg?.interval || 1)
    setEditUnit(cfg?.unit || 'week')
    setEditAmount(entry.amount ? String(entry.amount) : '')
    setEditAmountType(entry.amountType || 'inflow')
  }

  const handleSaveEdit = () => {
    if (editingId === null || !editText.trim()) return
    if (editActionDate && editActionDate < todayStr) return
    const entry = entries.find((e) => e.id === editingId)
    if (!entry) return
    const amt = editAmount ? parseFloat(editAmount) : null
    const otherTags = entry.tags.filter((t) => !isPeriodTag(t) && t !== 'recurring')
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        ...entry,
        text: editText.trim(),
        actionDate: editActionDate || entry.actionDate,
        tags: ['recurring', `every-${editInterval}-${editUnit}`, ...otherTags],
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
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split(/\r?\n/).filter((l) => l.trim())
        if (lines.length < 2) return
        for (let i = 1; i < lines.length; i++) {
          const fields = parseCsvLine(lines[i])
          const [text, actionDate, tagsStr, amountStr, rawAmountType, isTaskDone] = fields
          if (!text) continue
          const tags = tagsStr ? tagsStr.split(';').filter(Boolean) : ['recurring']
          const amount = amountStr ? parseFloat(amountStr) : null
          const entry = {
            id: Date.now() + i,
            text: text || '',
            timestamp: new Date().toISOString(),
            actionDate: actionDate || null,
            tags,
            folder: null,
            amount: amount != null && !isNaN(amount) ? amount : null,
            amountType: (rawAmountType === 'inflow' || rawAmountType === 'outflow' ? rawAmountType : null) as AmountType | null,
            mentions: [],
            timeLogs: [],
            history: [],
            isTask: true,
            isTaskDone: isTaskDone === 'true',
            completedAt: null,
            archived: false,
            comments: [],
            pghMapping: null,
          }
          dispatch({ type: 'ADD_ENTRY', payload: entry })
        }
      } catch {
        /* ignore invalid file */
      }
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

      {monthTiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {monthTiles.map((tile) => {
            const entry = tile.entry
            const period = findPeriodTag(entry.tags)
            const [chipColor, chipBg] = period ? chipStyle(period) : ['var(--color-text3)', 'var(--color-bg3)']
            const isEditing = editingId === entry.id
            const amt = fmtAmt(entry.amount, entry.amountType, currency)

            if (isEditing) {
              return (
                <div key={entry.id + '-' + tile.monthKey} style={{
                  border: '1px solid var(--color-accent)',
                  borderRadius: 12,
                  padding: 16,
                  background: 'var(--color-bg2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
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
                    <input type="number" min={1} value={editInterval}
                      onChange={(e) => setEditInterval(Math.max(1, Number(e.target.value) || 1))} style={{
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
                    <input type="number" step="any" min={0} value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)} placeholder="0.00" style={{
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
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
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
              <div key={entry.id + '-' + tile.monthKey} style={{
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                background: 'var(--color-bg)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Tile header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px 0',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.text}>
                      {entry.text}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: chipColor, background: chipBg, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.03em' }}>
                        {period ? formatPeriodLabel(period) : ''}
                      </span>
                      {amt && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: amt.color }}>
                          {amt.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => startEditing(entry)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'var(--color-text3)', opacity: 0.4, flexShrink: 0,
                    }}>
                      <Icon name="edit" size={13} />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'var(--color-text3)', opacity: 0.5, flexShrink: 0,
                    }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                {/* Month label */}
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  padding: '10px 14px 6px',
                  letterSpacing: '0.02em',
                }}>
                  {tile.monthLabel}
                </div>

                {/* Occurrence rows */}
                <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tile.occStatus.map((occ) => {
                    const isCurrent = occ.date === entry.actionDate
                    const dt = new Date(occ.date + 'T00:00:00')
                    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' })

                    return (
                      <div key={occ.date} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: isCurrent ? 'var(--color-bg2)' : 'transparent',
                        border: isCurrent ? '1px solid var(--color-accent)' : '1px solid transparent',
                      }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            fontFamily: "'DM Mono', monospace",
                            minWidth: 24,
                          }}>
                            {dayName}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: 'var(--color-text2)',
                            fontFamily: "'DM Mono', monospace",
                          }}>
                            {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {occ.completed ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-green)' }}>
                              ✓
                            </span>
                            {occ.delay !== null && (
                              <span style={{
                                fontSize: 11,
                                color: occ.delay <= 0 ? 'var(--color-green)' : 'var(--color-red)',
                                fontFamily: "'DM Mono', monospace",
                              }}>
                                {occ.delay <= 0 ? 'on time' : `+${occ.delay}d`}
                              </span>
                            )}
                          </div>
                        ) : (
                          isCurrent ? (
                            <button onClick={() => handleAdvance(entry.id)} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: 'var(--color-accent)', color: '#fff', border: 'none',
                              borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit',
                              fontSize: 11, fontWeight: 500, cursor: 'pointer',
                            }}>
                              <Icon name="check" size={12} />
                              Done
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>—</span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
