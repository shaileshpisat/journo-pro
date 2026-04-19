'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  allLabel?: string
  formatOption?: (option: string) => string
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  allLabel = 'All',
  formatOption,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

  const display = value ? (formatOption ? formatOption(value) : value) : allLabel

  const selectValue = (v: string) => {
    onChange(v)
    setOpen(false)
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
      if (activeIndex === 0) selectValue('')
      else {
        const pick = filtered[activeIndex - 1]
        if (pick !== undefined) selectValue(pick)
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
    color: value ? 'var(--color-text)' : 'var(--color-text3)',
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
        {value && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
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
            {filtered.length === 0 && (
              <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--color-text3)', textAlign: 'center' }}>
                No matches
              </div>
            )}
            {filtered.map((o, i) => {
              const idx = i + 1
              const selected = o === value
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
                    fontWeight: selected ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatOption ? formatOption(o) : o}
                  </span>
                  {selected && <Icon name="check" size={12} color="var(--color-accent)" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
