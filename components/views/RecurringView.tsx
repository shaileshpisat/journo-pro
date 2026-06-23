'use client'

import { useState, useMemo } from 'react'
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

  const monthGroups = useMemo(() => {
    const groups: { label: string; entries: typeof recurringEntries }[] = []
    const map = new Map<string, typeof recurringEntries>()

    for (const entry of recurringEntries) {
      const date = entry.actionDate
        ? new Date(entry.actionDate + 'T00:00:00')
        : new Date(entry.timestamp)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }

    const sortedKeys = Array.from(map.keys()).sort()
    for (const key of sortedKeys) {
      const [y, m] = key.split('-')
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
      groups.push({ label, entries: map.get(key)! })
    }

    return groups
  }, [recurringEntries])

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

  const findPeriodTag = (tags: string[]) => tags.find((t) => isPeriodTag(t))

  const handleDelete = (id: number) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id })
  }

  const handleToggleDone = (id: number) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', payload: id })
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

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
          Recurring
        </h1>
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

      {/* Month groups */}
      {monthGroups.length === 0 && (
        <p style={{ color: 'var(--color-text3)', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
          No recurring entries yet. Click "Add" to create one.
        </p>
      )}

      {monthGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 12px',
            }}
          >
            {group.label}
          </h2>
          {group.entries.map((entry) => {
            const period = findPeriodTag(entry.tags)
            const [chipColor, chipBg] = period ? chipStyle(period) : ['var(--color-text3)', 'var(--color-bg3)']
            const isEditing = editingId === entry.id
            const amt = fmtAmt(entry.amount, entry.amountType, currency)
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: isEditing ? 'flex-start' : 'center',
                  gap: 12,
                  padding: isEditing ? 16 : '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isEditing ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  marginBottom: 8,
                  background: isEditing ? 'var(--color-bg2)' : 'var(--color-bg)',
                  flexDirection: isEditing ? 'column' : 'row',
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
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
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="date"
                        value={editActionDate}
                        min={todayStr}
                        onChange={(e) => setEditActionDate(e.target.value)}
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
                      <span style={{ fontSize: 12, color: 'var(--color-text3)', fontWeight: 500 }}>Every</span>
                      <input
                        type="number"
                        min={1}
                        value={editInterval}
                        onChange={(e) => setEditInterval(Math.max(1, Number(e.target.value) || 1))}
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          outline: 'none',
                          background: 'var(--color-bg)',
                          width: 52,
                          textAlign: 'center',
                        }}
                      />
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
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
                        {Object.entries(UNIT_LABELS).map(([k, l]) => (
                          <option key={k} value={k}>{l}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          outline: 'none',
                          background: 'var(--color-bg)',
                          width: 80,
                        }}
                      />
                      <button
                        onClick={() => setEditAmountType(editAmountType === 'inflow' ? 'outflow' : 'inflow')}
                        style={{
                          background: editAmountType === 'inflow' ? 'var(--color-green-light)' : 'var(--color-red-light)',
                          color: editAmountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)',
                          border: `1px solid ${editAmountType === 'inflow' ? 'var(--color-green)' : 'var(--color-red)'}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {editAmountType === 'inflow' ? 'Income' : 'Expense'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          background: 'var(--color-accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 16px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          background: 'var(--color-bg3)',
                          color: 'var(--color-text)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 16px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleDone(entry.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        color: entry.isTaskDone ? 'var(--color-green)' : 'var(--color-text3)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={entry.isTaskDone ? 'checkSquare' : 'square'} size={16} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          color: entry.isTaskDone ? 'var(--color-text3)' : 'var(--color-text)',
                          textDecoration: entry.isTaskDone ? 'line-through' : 'none',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={entry.text}
                      >
                        {entry.text}
                      </span>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        {entry.actionDate && (
                          <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                            {new Date(entry.actionDate + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        {amt && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: amt.color }}>
                            {amt.label}
                          </span>
                        )}
                        {period && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              color: chipColor,
                              background: chipBg,
                              padding: '2px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.03em',
                            }}
                          >
                            {formatPeriodLabel(period)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(entry)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: 'var(--color-text3)',
                        opacity: 0.4,
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: 'var(--color-text3)',
                        opacity: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
