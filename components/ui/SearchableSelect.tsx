'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

interface SearchableSelectProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  options: string[]
  placeholder?: string
  allLabel?: string
  formatOption?: (option: string) => string
  multi?: boolean
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  allLabel = 'All',
  formatOption,
  multi,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected: string[] = multi ? (value as string[]) : (value ? [value as string] : [])
  const hasValue = multi ? (selected.length > 0) : !!value

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const display = multi
    ? selected.length === 0
      ? allLabel
      : `${selected.length} selected`
    : value
      ? (formatOption ? formatOption(value as string) : value as string)
      : allLabel

  const selectValue = (v: string) => {
    if (multi) {
      const arr = value as string[]
      if (v === '') {
        onChange([])
      } else {
        const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
        onChange(next)
      }
    } else {
      onChange(v)
      setOpen(false)
    }
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (multi) onChange([])
    else onChange('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex === 0) {
        if (multi) onChange([])
        else onChange('')
        if (!multi) setOpen(false)
      } else {
        const pick = filtered[activeIndex - 1]
        if (pick !== undefined) {
          if (multi) {
            const arr = value as string[]
            const next = arr.includes(pick) ? arr.filter((x) => x !== pick) : [...arr, pick]
            onChange(next)
          } else {
            onChange(pick)
            setOpen(false)
          }
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLDivElement>(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontFamily: 'inherit',
    fontSize: 12,
    background: '#fff',
    color: hasValue ? 'var(--color-text)' : 'var(--color-text3)',
    outline: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    textAlign: 'left',
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={triggerStyle}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
        {hasValue && (
          <span
            role="button"
            onClick={clearAll}
            style={{ color: 'var(--color-text3)', fontSize: 14, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}
          >
            ×
          </span>
        )}
        <Icon name="chevronDown" size={11} color="var(--color-text3)" />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Icon name="search" size={13} color="var(--color-text3)" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: 12,
                background: 'transparent',
                color: 'var(--color-text)',
              }}
            />
          </div>
          <div ref={listRef} style={{ maxHeight: 220, overflowY: 'auto', padding: 4 }}>
            {!multi && (
              <div
                data-idx={0}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => selectValue('')}
                style={{
                  padding: '7px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderRadius: 6,
                  background: activeIndex === 0 ? 'var(--color-bg2)' : 'transparent',
                  color: 'var(--color-text3)',
                }}
              >
                {allLabel}
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--color-text3)', textAlign: 'center' }}>
                No matches
              </div>
            )}
            {filtered.map((o, i) => {
              const idx = i + 1
              const sel = selected.includes(o)
              return (
                <div
                  key={o}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectValue(o)}
                  style={{
                    padding: '7px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: activeIndex === idx ? 'var(--color-bg2)' : 'transparent',
                    color: 'var(--color-text)',
                    fontWeight: sel ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {multi && (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: sel ? 'var(--color-accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {sel && <Icon name="check" size={9} color="#fff" />}
                    </span>
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatOption ? formatOption(o) : o}
                  </span>
                  {!multi && sel && <Icon name="check" size={12} color="var(--color-accent)" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
