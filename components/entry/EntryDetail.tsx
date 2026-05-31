'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry, EntryHistory } from '@/lib/types'
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
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const suggestions = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={fieldInputStyle}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
          background: '#fff', border: '1px solid var(--color-border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          zIndex: 100, maxHeight: 160, overflowY: 'auto',
        }}>
          {suggestions.map((o) => (
            <div
              key={o}
              onMouseDown={() => { onChange(o); setOpen(false) }}
              style={{ padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)' }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MentionEditor({
  mentions,
  onChange,
  masterMentions,
}: {
  mentions: string[]
  onChange: (mentions: string[]) => void
  masterMentions: string[]
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = masterMentions.filter(
    (m) => !mentions.includes(m) && m.toLowerCase().includes(input.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const add = (raw: string) => {
    const mention = raw.replace(/^@/, '').trim()
    if (mention && !mentions.includes(mention)) onChange([...mentions, mention])
    setInput('')
    setOpen(false)
  }

  const remove = (mention: string) => onChange(mentions.filter((m) => m !== mention))

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="entity" size={11} />
        Mentions
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {mentions.map((m) => (
          <span
            key={m}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--color-bg2)', border: '1px solid var(--color-border)',
              borderRadius: 99, padding: '2px 8px', fontSize: 12, color: 'var(--color-text2)',
            }}
          >
            @{m}
            <button
              onClick={() => remove(m)}
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
          placeholder="Search or add mention…"
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
            {suggestions.map((m) => (
              <div
                key={m}
                onMouseDown={() => add(m)}
                style={{ padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)' }}
              >
                @{m}
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [editingActionDate, setEditingActionDate] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [text, setText] = useState(entry.text)
  const [folder, setFolder] = useState(entry.folder || '')
  const [actionDate, setActionDate] = useState(entry.actionDate || '')
  const [mentions, setMentions] = useState(entry.mentions ?? [])
  const [amount, setAmount] = useState(entry.amount != null ? String(entry.amount) : '')
  const [amountType, setAmountType] = useState(entry.amountType || 'inflow')
  const [tags, setTags] = useState(entry.tags)
  const actionDateInputRef = useRef<HTMLInputElement>(null)

  const allMasterMentions = [...new Set(state.entries.flatMap((e) => e.mentions ?? []))]
  const allMasterTags = [...new Set(state.entries.flatMap((e) => e.tags))]
  const allFolders = [...new Set(state.entries.filter((e) => e.folder).map((e) => e.folder!))]
  const amt = fmtAmt(entry.amount, entry.amountType, state.currency)
  const timerActive = state.activeTimer?.entryId === entry.id
  const totalTracked = entry.timeLogs ? entry.timeLogs.reduce((s, l) => s + l.duration, 0) : 0

  const save = () => {
    const parsedAmount = amount !== '' ? parseFloat(amount) : null
    const changes: EntryHistory[] = []
    const now = Date.now()

    const addChange = (field: string, oldValue: unknown, newValue: unknown) => {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ timestamp: now, field, oldValue, newValue })
      }
    }

    addChange('text', entry.text, text)
    addChange('folder', entry.folder, folder || null)
    addChange('actionDate', entry.actionDate, actionDate || null)
    addChange('mentions', entry.mentions, mentions)
    addChange('amount', entry.amount, parsedAmount)
    addChange('amountType', entry.amountType, parsedAmount != null ? amountType : null)
    addChange('tags', entry.tags, tags)

    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        ...entry,
        text,
        tags,
        folder: folder || null,
        actionDate: actionDate || null,
        mentions,
        amount: parsedAmount,
        amountType: parsedAmount != null ? amountType : null,
        history: [...(entry.history || []), ...changes],
      },
    })
    setEditing(false)
  }

  const handleAddComment = () => {
    if (!commentInput.trim()) return
    dispatch({
      type: 'ADD_COMMENT',
      payload: {
        entryId: entry.id,
        comment: {
          id: Date.now(),
          text: commentInput.trim(),
          timestamp: new Date().toISOString(),
        },
      },
    })
    setCommentInput('')
  }

  const saveActionDateInline = (newDate: string) => {
    setActionDate(newDate)
    setEditingActionDate(false)
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        ...entry,
        actionDate: newDate || null,
        history: [...(entry.history || []), ...(newDate !== (entry.actionDate || '')
          ? [{ timestamp: Date.now(), field: 'actionDate', oldValue: entry.actionDate, newValue: newDate || null }]
          : [])],
      },
    })
  }

  const handleTimerToggle = () => {
    if (timerActive && state.activeTimer) {
      const duration = Date.now() - state.activeTimer.startedAt + (state.activeTimer.baseElapsed || 0)
      dispatch({
        type: 'LOG_TIME',
        payload: { entryId: entry.id, log: { startedAt: state.activeTimer.startedAt, duration } },
      })
    } else if (state.activeTimer) {
      const duration = Date.now() - state.activeTimer.startedAt + (state.activeTimer.baseElapsed || 0)
      dispatch({
        type: 'LOG_TIME',
        payload: { entryId: state.activeTimer.entryId, log: { startedAt: state.activeTimer.startedAt, duration } },
      })
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--color-text3)' }}>
            {new Date(entry.timestamp).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}{' '}· {fmtTime(entry.timestamp)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div
            onClick={() =>
              entry.isTask
                ? dispatch({ type: 'TOGGLE_TASK_DONE', payload: entry.id })
                : dispatch({ type: 'MARK_TASK', payload: entry.id })
            }
            style={{
              width: 36, height: 20, borderRadius: 99,
              background: entry.isTask ? 'var(--color-accent)' : 'var(--color-bg3)',
              cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 99, background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              position: 'absolute', top: 2,
              left: entry.isTask ? 18 : 2,
              transition: 'left 0.15s',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
            Task
          </span>
          {entry.isTaskDone && entry.completedAt && (
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 500, marginLeft: 2 }}>
              Completed {entry.completedAt.split('T')[0] === new Date().toISOString().split('T')[0] ? fmtTime(entry.completedAt) : fmtDate(entry.completedAt)}
            </span>
          )}
          <button
              onClick={handleTimerToggle}
              style={{
                background: timerActive ? 'var(--color-red-light)' : totalTracked > 0 ? 'var(--color-accent-light)' : 'var(--color-bg2)',
                border: `1px solid ${timerActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                display: 'flex', gap: 5, alignItems: 'center',
                fontFamily: timerActive || totalTracked > 0 ? "'DM Mono', monospace" : 'inherit',
                fontSize: 12,
                color: timerActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-text2)',
                fontWeight: timerActive || totalTracked > 0 ? 500 : 400,
              }}
            >
              {timerActive ? (
                <><Icon name="pause" size={13} /> Stop timer</>
              ) : totalTracked > 0 ? (
                <><Icon name="stopwatch" size={13} /> {fmtDuration(totalTracked)}</>
              ) : (
                <><Icon name="stopwatch" size={13} /> Start timer</>
              )}
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
            <button
              onClick={() =>
                entry.archived
                  ? dispatch({ type: 'RESTORE_ENTRY', payload: entry.id })
                  : dispatch({ type: 'ARCHIVE_ENTRY', payload: entry.id })
              }
              style={{
                background: entry.archived ? 'var(--color-accent-light)' : 'var(--color-bg2)',
                border: `1px solid ${entry.archived ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', gap: 5, alignItems: 'center',
                fontFamily: 'inherit', fontSize: 12,
                color: entry.archived ? 'var(--color-accent)' : 'var(--color-text2)',
              }}
            >
              <Icon name="archive" size={13} />
              {entry.archived ? 'Restore' : 'Archive'}
            </button>
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
          <p style={{
            fontSize: 16, lineHeight: 1.6, marginBottom: 20,
            color: entry.isTaskDone ? 'var(--color-text3)' : 'var(--color-text)',
            textDecoration: entry.isTaskDone ? 'line-through' : 'none',
          }}>
            {entry.text}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FieldBlock label="Folder" icon="folder" value={editing ? null : entry.folder} color="var(--color-accent)">
            {editing && (
              <EntityPicker value={folder} onChange={setFolder} options={allFolders} placeholder="Search folder…" />
            )}
          </FieldBlock>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            <FieldBlock
              label="Action date" icon="clock"
              value={editing || editingActionDate ? null : entry.actionDate ? fmtDate(entry.actionDate) : null}
              color="var(--color-amber)"
              onValueClick={!editing ? () => {
                setEditingActionDate(true)
                setTimeout(() => actionDateInputRef.current?.showPicker?.(), 50)
              } : undefined}
            >
              {(editing || editingActionDate) && (
                <input
                  ref={editingActionDate ? actionDateInputRef : undefined}
                  type="date" value={actionDate}
                  onChange={(e) => {
                    if (editing) {
                      setActionDate(e.target.value)
                    } else {
                      saveActionDateInline(e.target.value)
                    }
                  }}
                  onBlur={() => { if (editingActionDate) setEditingActionDate(false) }}
                  style={fieldInputStyle}
                  autoFocus={editingActionDate}
                />
              )}
            </FieldBlock>
          </div>
        </div>

        <MentionEditor
          mentions={mentions}
          onChange={(newMentions) => {
            setMentions(newMentions)
            if (!editing) {
              dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, mentions: newMentions, tags } })
            }
          }}
          masterMentions={allMasterMentions}
        />

        <TagEditor
          tags={tags}
          onChange={(newTags) => {
            setTags(newTags)
            if (!editing) {
              dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, mentions, tags: newTags } })
            }
          }}
          masterTags={allMasterTags}
        />

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
                <div key={i} style={{ padding: '5px 8px', background: 'var(--color-bg2)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text2)' }}>
                      {new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(log.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--color-text)', fontWeight: 500 }}>
                      {fmtDuration(log.duration)}
                    </span>
                  </div>
                  {log.description && (
                    <div style={{ fontSize: 11, color: 'var(--color-text3)', marginTop: 3, lineHeight: 1.4 }}>
                      {log.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="messageSquare" size={11} />
            Comments
            {(entry.comments?.length ?? 0) > 0 && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--color-text3)' }}>
                ({entry.comments.length})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {entry.comments && entry.comments.length > 0 ? (
              [...entry.comments].reverse().map((c) => {
                const canEdit = Date.now() - new Date(c.timestamp).getTime() < 4 * 60 * 60 * 1000
                const isEditing = editingCommentId === c.id
                return (
                  <div key={c.id} style={{ padding: '8px 10px', background: 'var(--color-bg2)', borderRadius: 8 }}>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          style={{ ...fieldInputStyle, marginBottom: 6, resize: 'none' }}
                          rows={3}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: 'var(--color-text3)', padding: '2px 6px' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (editingCommentText.trim()) {
                                dispatch({ type: 'EDIT_COMMENT', payload: { entryId: entry.id, commentId: c.id, text: editingCommentText.trim() } })
                                setEditingCommentId(null)
                              }
                            }}
                            style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.45, marginBottom: 4, whiteSpace: 'pre-wrap' }}>
                          {c.text}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace" }}>
                            {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-text3)', display: 'flex' }}
                            >
                              <Icon name="edit" size={10} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            ) : (
              <div style={{ fontSize: 12, color: 'var(--color-text3)', lineHeight: 1.4 }}>
                No comments yet.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && commentInput.trim()) { e.preventDefault(); handleAddComment() } }}
              placeholder="Add a comment..."
              style={{ ...fieldInputStyle, flex: 1, resize: 'none' }}
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentInput.trim()}
              style={{
                background: commentInput.trim() ? 'var(--color-accent)' : 'var(--color-bg3)',
                color: commentInput.trim() ? '#fff' : 'var(--color-text3)',
                border: 'none', borderRadius: 6, padding: '4px 12px',
                fontFamily: 'inherit', fontSize: 12,
                cursor: commentInput.trim() ? 'pointer' : 'default',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {entry.history && entry.history.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={11} />
              History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...entry.history].reverse().map((h, i) => {
                const fmtOld = h.field === 'amount' ? fmtAmt(Number(h.oldValue), entry.amountType, state.currency)?.label : String(h.oldValue ?? '—')
                const fmtNew = h.field === 'amount' ? fmtAmt(Number(h.newValue), entry.amountType, state.currency)?.label : String(h.newValue ?? '—')
                const fieldLabel = h.field === 'actionDate' ? 'Action date' : h.field === 'amountType' ? 'Amount type' : h.field === 'commentAdded' ? 'Comment added' : h.field === 'commentEdited' ? 'Comment edited' : h.field.charAt(0).toUpperCase() + h.field.slice(1)
                return (
                  <div key={i} style={{ padding: '5px 8px', background: 'var(--color-bg2)', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500 }}>{fieldLabel}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                        {new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(h.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{fmtOld}</span>
                      <span style={{ color: 'var(--color-text3)' }}>→</span>
                      <span style={{ fontWeight: 500 }}>{fmtNew}</span>
                    </div>
                  </div>
                )
              })}
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
