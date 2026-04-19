'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppState } from '@/context/AppContext'
import { fmtTime, fmtDate, fmtAmt, fmtElapsed, fmtDuration } from '@/lib/formatters'
import { isOverdue } from '@/lib/predicates'
import Icon from '@/components/ui/Icon'
import Chip from '@/components/ui/Chip'
import FieldBlock from '@/components/ui/FieldBlock'

const fieldInputStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: '4px 8px',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  background: 'var(--color-bg)',
}

function EntityPicker({
  value,
  onChange,
  options,
  placeholder = 'Search…',
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (val: string) => {
    onChange(val)
    setSearch(val)
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setSearch('')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={fieldInputStyle}
        />
        {value && (
          <button
            onClick={clear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--color-text3)' }}
          >
            <Icon name="x" size={12} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 2,
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          zIndex: 100,
          maxHeight: 180,
          overflowY: 'auto',
        }}>
          {filtered.map((o) => (
            <div
              key={o}
              onMouseDown={() => select(o)}
              style={{
                padding: '7px 12px',
                fontSize: 13,
                cursor: 'pointer',
                background: o === value ? 'var(--color-accent-light)' : 'transparent',
                color: o === value ? 'var(--color-accent)' : 'var(--color-text)',
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TagEditor({
  tags,
  onChange,
  masterTags,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  masterTags: string[]
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = masterTags.filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const add = (raw: string) => {
    const tag = raw.replace(/^#/, '').trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setInput('')
    setOpen(false)
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="tag" size={11} />
        Tags
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--color-bg2)', border: '1px solid var(--color-border)',
              borderRadius: 99, padding: '2px 8px', fontSize: 12, color: 'var(--color-text2)',
            }}
          >
            #{t}
            <button
              onClick={() => remove(t)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--color-text3)' }}
            >
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
      </div>
      <div ref={ref} style={{ position: 'relative', display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
          placeholder="Search or add tag…"
          style={{ ...fieldInputStyle, flex: 1 }}
        />
        <button
          onClick={() => add(input)}
          style={{
            background: 'var(--color-accent)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
          }}
        >
          Add
        </button>
        {open && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            zIndex: 100, maxHeight: 160, overflowY: 'auto',
          }}>
            {suggestions.map((t) => (
              <div
                key={t}
                onMouseDown={() => add(t)}
                style={{ padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)' }}
              >
                #{t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EntryDetail() {
  const { state, dispatch } = useAppState()
  const entry = state.selectedEntry
  if (!entry) return null

  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(entry.text)
  const [folder, setFolder] = useState(entry.folder || '')
  const [actionDate, setActionDate] = useState(entry.actionDate || '')
  const [entity, setEntity] = useState(entry.entity || '')
  const [amount, setAmount] = useState(entry.amount != null ? String(entry.amount) : '')
  const [amountType, setAmountType] = useState(entry.amountType || 'inflow')
  const [tags, setTags] = useState(entry.tags)

  const allEntities = [...new Set(state.entries.filter((e) => e.entity).map((e) => e.entity!))]
  const allMasterTags = [...new Set(state.entries.flatMap((e) => e.tags))]
  const allFolders = [...new Set(state.entries.filter((e) => e.folder).map((e) => e.folder!))]
  const amt = fmtAmt(entry.amount, entry.amountType)
  const timerActive = state.activeTimer?.entryId === entry.id

  const save = () => {
    const parsedAmount = amount !== '' ? parseFloat(amount) : null
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        ...entry,
        text,
        tags,
        folder: folder || null,
        actionDate: actionDate || null,
        entity: entity || null,
        amount: parsedAmount,
        amountType: parsedAmount != null ? amountType : null,
      },
    })
    setEditing(false)
  }

  const handleTimerToggle = () => {
    if (timerActive && state.activeTimer) {
      const duration = Date.now() - state.activeTimer.startedAt + (state.activeTimer.baseElapsed || 0)
      dispatch({
        type: 'LOG_TIME',
        payload: { entryId: entry.id, log: { startedAt: state.activeTimer.startedAt, duration } },
      })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
      <button
        onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: null })}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--color-text2)', fontFamily: 'inherit', fontSize: 13, marginBottom: 24, padding: 0,
        }}
      >
        <Icon name="arrowLeft" size={15} />
        Back
      </button>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--color-text3)' }}>
            {new Date(entry.timestamp).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}{' '}· {fmtTime(entry.timestamp)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleTimerToggle}
              style={{
                background: timerActive ? 'var(--color-red-light)' : 'var(--color-bg2)',
                border: `1px solid ${timerActive ? 'var(--color-red)' : 'var(--color-border)'}`,
                borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                display: 'flex', gap: 5, alignItems: 'center',
                fontFamily: 'inherit', fontSize: 12,
                color: timerActive ? 'var(--color-red)' : 'var(--color-text2)',
                fontWeight: timerActive ? 500 : 400,
              }}
            >
              <Icon name={timerActive ? 'pause' : 'stopwatch'} size={13} />
              {timerActive ? 'Stop timer' : 'Start timer'}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                background: 'var(--color-bg2)', border: '1px solid var(--color-border)',
                borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', gap: 5, alignItems: 'center',
                fontFamily: 'inherit', fontSize: 12, color: 'var(--color-text2)',
              }}
            >
              <Icon name="edit" size={13} />
              Edit
            </button>
          </div>
        </div>

        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%', border: '1.5px solid var(--color-accent)', outline: 'none',
              borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15,
              color: 'var(--color-text)', lineHeight: 1.55, resize: 'none',
              background: 'var(--color-bg)', marginBottom: 12,
            }}
            rows={4}
          />
        ) : (
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 20 }}>
            {entry.text}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldBlock label="Entity" icon="entity" value={editing ? null : entry.entity} color="var(--color-text2)">
            {editing && (
              <EntityPicker value={entity} onChange={setEntity} options={allEntities} placeholder="Search entity…" />
            )}
          </FieldBlock>
          <FieldBlock
            label="Amount" icon="amount"
            value={editing ? null : amt ? amt.label : null}
            color={amt ? amt.color : undefined}
            mono
          >
            {editing && (
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="number" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ ...fieldInputStyle, flex: 1 }}
                />
                <select
                  value={amountType}
                  onChange={(e) => setAmountType(e.target.value as 'inflow' | 'outflow')}
                  style={{ ...fieldInputStyle, width: 'auto' }}
                >
                  <option value="inflow">In</option>
                  <option value="outflow">Out</option>
                </select>
              </div>
            )}
          </FieldBlock>
          <FieldBlock label="Folder" icon="folder" value={editing ? null : entry.folder} color="var(--color-accent)">
            {editing && (
              <EntityPicker value={folder} onChange={setFolder} options={allFolders} placeholder="Search folder…" />
            )}
          </FieldBlock>
          <FieldBlock
            label="Action date" icon="clock"
            value={editing ? null : entry.actionDate ? fmtDate(entry.actionDate) : null}
            color="var(--color-amber)"
          >
            {editing && (
              <input
                type="date" value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                style={fieldInputStyle}
              />
            )}
          </FieldBlock>
        </div>

        {editing ? (
          <TagEditor tags={tags} onChange={setTags} masterTags={allMasterTags} />
        ) : entry.tags.length > 0 ? (
          <div style={{
            marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6,
            paddingTop: 14, borderTop: '1px solid var(--color-border)',
          }}>
            {entry.tags.map((t) => (
              <Chip key={t} icon="tag" label={`#${t}`} />
            ))}
          </div>
        ) : null}

        {entry.timeLogs && entry.timeLogs.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="stopwatch" size={11} />
                Time tracked
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--color-text2)', fontWeight: 600 }}>
                {fmtDuration(entry.timeLogs.reduce((s, l) => s + l.duration, 0))} total
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entry.timeLogs.map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--color-bg2)', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text2)' }}>
                    {new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {new Date(log.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--color-text)', fontWeight: 500 }}>
                    {fmtDuration(log.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {editing && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                background: 'var(--color-bg2)', color: 'var(--color-text2)',
                border: '1px solid var(--color-border)', borderRadius: 8,
                padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              style={{
                background: 'var(--color-accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
