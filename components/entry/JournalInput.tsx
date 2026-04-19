'use client'

import { useState, useRef, useEffect } from 'react'
import { Entry } from '@/lib/types'
import { parseEntry } from '@/lib/parser'
import { fmtDate } from '@/lib/formatters'
import Chip from '@/components/ui/Chip'
import { useAppState } from '@/context/AppContext'

export default function JournalInput() {
  const { dispatch } = useAppState()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<Partial<Entry>>({})
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (text.trim().length > 2) setParsed(parseEntry(text))
    else setParsed({})
  }, [text])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    setText(el.value)
  }

  const handleSubmit = () => {
    if (!text.trim()) return
    const entry: Entry = {
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      tags: parsed.tags || [],
      folder: parsed.folder || null,
      actionDate: parsed.actionDate || null,
      amount: parsed.amount || null,
      amountType: parsed.amountType || null,
      entity: parsed.entity || null,
      timeLogs: [],
    }
    dispatch({ type: 'ADD_ENTRY', payload: entry })
    setText('')
    setParsed({})
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.focus()
    }
  }

  const hasChips =
    parsed.entity ||
    (parsed.tags && parsed.tags.length) ||
    parsed.folder ||
    parsed.amount ||
    parsed.actionDate

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
      <div
        style={{
          background: '#fff',
          border: `1.5px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 14,
          padding: '14px 18px',
          boxShadow: focused ? '0 4px 24px rgba(0,0,0,0.08)' : '0 1px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.18s',
        }}
      >
        <textarea
          ref={ref}
          value={text}
          onChange={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          placeholder="What's on your mind? Use @entity, #tag, /folder, $amount, tomorrow…"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 15,
            color: 'var(--color-text)',
            background: 'transparent',
            lineHeight: 1.55,
            minHeight: 52,
            maxHeight: 120,
            overflow: 'hidden',
          }}
          rows={2}
        />
        {hasChips && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {parsed.entity && (
              <Chip icon="entity" label={parsed.entity} bg="var(--color-bg2)" color="var(--color-text2)" />
            )}
            {parsed.folder && (
              <Chip
                icon="folder"
                label={parsed.folder}
                bg="var(--color-accent-light)"
                color="var(--color-accent)"
              />
            )}
            {parsed.actionDate && (
              <Chip
                icon="clock"
                label={fmtDate(parsed.actionDate)}
                bg="var(--color-amber-light)"
                color="var(--color-amber)"
              />
            )}
            {parsed.amount && (
              <Chip
                icon="amount"
                label={`${parsed.amountType === 'inflow' ? '+' : parsed.amountType === 'outflow' ? '−' : ''}$${parsed.amount.toLocaleString()}`}
                bg={
                  parsed.amountType === 'inflow'
                    ? 'var(--color-green-light)'
                    : parsed.amountType === 'outflow'
                      ? 'var(--color-red-light)'
                      : 'var(--color-bg3)'
                }
                color={
                  parsed.amountType === 'inflow'
                    ? 'var(--color-green)'
                    : parsed.amountType === 'outflow'
                      ? 'var(--color-red)'
                      : 'var(--color-text2)'
                }
              />
            )}
            {(parsed.tags || []).map((t) => (
              <Chip key={t} icon="tag" label={`#${t}`} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleSubmit}
            style={{
              background: text.trim() ? 'var(--color-accent)' : 'var(--color-bg3)',
              color: text.trim() ? '#fff' : 'var(--color-text3)',
              border: 'none',
              borderRadius: 8,
              padding: '7px 18px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Add entry ⌘↵
          </button>
        </div>
      </div>
      <p
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-text3)',
          marginTop: 8,
        }}
      >
        All entries go to Inbox · Use @entity #tag /folder $amount
      </p>
    </div>
  )
}
