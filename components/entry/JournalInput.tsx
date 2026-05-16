'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Entry } from '@/lib/types'
import { parseEntry } from '@/lib/parser'
import { fmtDate } from '@/lib/formatters'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icon'
import { useAppState } from '@/context/AppContext'

interface SuggestionState {
  trigger: '@' | '#' | '/'
  query: string
  start: number
  end: number
}

function getSuggestion(text: string, cursorPos: number): SuggestionState | null {
  if (cursorPos < 1) return null
  const beforeCursor = text.slice(0, cursorPos)

  const atIdx = beforeCursor.lastIndexOf('@')
  const hashIdx = beforeCursor.lastIndexOf('#')
  const slashIdx = beforeCursor.lastIndexOf('/')

  let trigger: '@' | '#' | '/' | null = null
  let triggerIdx = -1

  if (atIdx > hashIdx && atIdx > slashIdx && atIdx >= 0) {
    const charBefore = atIdx > 0 ? beforeCursor[atIdx - 1] : ' '
    if (/\s/.test(charBefore)) {
      const between = beforeCursor.slice(atIdx + 1)
      if (/^[\w]+$/.test(between)) {
        trigger = '@'
        triggerIdx = atIdx
      }
    }
  } else if (hashIdx > slashIdx && hashIdx >= 0) {
    const charBefore = hashIdx > 0 ? beforeCursor[hashIdx - 1] : ' '
    if (/\s/.test(charBefore)) {
      const between = beforeCursor.slice(hashIdx + 1)
      if (/^[\w]*$/.test(between)) {
        trigger = '#'
        triggerIdx = hashIdx
      }
    }
  } else if (slashIdx >= 0) {
    const charBefore = slashIdx > 0 ? beforeCursor[slashIdx - 1] : ' '
    if (/\s/.test(charBefore)) {
      const between = beforeCursor.slice(slashIdx + 1)
      if (/^[\w\s/]*$/.test(between)) {
        trigger = '/'
        triggerIdx = slashIdx
      }
    }
  }

  if (!trigger) return null

  return {
    trigger,
    query: text.slice(triggerIdx + 1, cursorPos),
    start: triggerIdx,
    end: cursorPos,
  }
}

export default function JournalInput() {
  const { state, dispatch } = useAppState()
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [markTask, setMarkTask] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const parsed = useMemo(() => {
    if (text.trim().length > 2) return parseEntry(text)
    return {}
  }, [text])

  const allEntities = useMemo(
    () => [...new Set(state.entries.filter((e) => e.entity).map((e) => e.entity!))],
    [state.entries]
  )
  const allTags = useMemo(
    () => [...new Set(state.entries.flatMap((e) => e.tags))],
    [state.entries]
  )
  const allFolders = useMemo(
    () => [...new Set(state.entries.filter((e) => e.folder).map((e) => e.folder!))],
    [state.entries]
  )

  const suggestions = useMemo(() => {
    if (!suggestion) return []
    const list =
      suggestion.trigger === '@' ? allEntities :
      suggestion.trigger === '#' ? allTags :
      allFolders
    const q = suggestion.query.toLowerCase()
    return q ? list.filter((item) => item.toLowerCase().includes(q)) : list
  }, [suggestion, allEntities, allTags, allFolders])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setSuggestion(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectSuggestion = useCallback(
    (value: string) => {
      if (!suggestion) return
      const newText =
        text.slice(0, suggestion.start) +
        suggestion.trigger + value +
        text.slice(suggestion.end)
      setText(newText)
      setSuggestion(null)
      setTimeout(() => {
        if (ref.current) {
          const pos = suggestion.start + 1 + value.length
          ref.current.selectionStart = pos
          ref.current.selectionEnd = pos
          ref.current.focus()
        }
      })
    },
    [suggestion, text]
  )

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    setText(el.value)
    setSuggestion(getSuggestion(el.value, el.selectionStart))
    setSelectedIndex(0)
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
        history: [],
        isTask: markTask,
      isTaskDone: false,
      archived: false,
    }
    dispatch({ type: 'ADD_ENTRY', payload: entry })
    setText('')
    setMarkTask(false)
    setSuggestion(null)
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
          position: 'relative',
          background: '#fff',
          border: `1.5px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 14,
          padding: '14px 18px',
          boxShadow: focused ? '0 4px 24px rgba(0,0,0,0.08)' : '0 1px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.18s',
        }}
      >
        <div style={{ position: 'relative' }}>
          <textarea
            ref={ref}
            value={text}
            onChange={handleInput}
            onClick={() => {
              if (ref.current) {
                setSuggestion(getSuggestion(text, ref.current.selectionStart))
                setSelectedIndex(0)
              }
            }}
            onKeyUp={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) && ref.current) {
                setSuggestion(getSuggestion(text, ref.current.selectionStart))
                setSelectedIndex(0)
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit()
                return
              }

              if (suggestion && suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedIndex((prev) => Math.max(prev - 1, 0))
                  return
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  selectSuggestion(suggestions[selectedIndex])
                  return
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setSuggestion(null)
                  return
                }
              }
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

          {suggestion && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '100%',
                marginTop: 4,
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                zIndex: 100,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {suggestions.map((item, i) => (
                <div
                  key={item}
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(item) }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    padding: '7px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: i === selectedIndex ? 'var(--color-accent-light)' : 'transparent',
                    color: i === selectedIndex ? 'var(--color-accent)' : 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: 'var(--color-text3)', fontSize: 12 }}>{suggestion.trigger}</span>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button
            onClick={() => setMarkTask((p) => !p)}
            style={{
              background: markTask ? 'var(--color-accent-light)' : 'var(--color-bg2)',
              border: `1px solid ${markTask ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 8,
              padding: '5px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              fontSize: 12,
              color: markTask ? 'var(--color-accent)' : 'var(--color-text3)',
              fontWeight: markTask ? 500 : 400,
            }}
          >
            <Icon name={markTask ? 'checkSquare' : 'square'} size={13} />
            Task
          </button>
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
