'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppState } from '@/context/AppContext'
import { fmtElapsed } from '@/lib/formatters'

export default function FloatingTimer() {
  const { state, dispatch } = useAppState()
  const timer = state.activeTimer
  const [elapsed, setElapsed] = useState(0)
  const [description, setDescription] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => {
      setElapsed(Date.now() - timer.startedAt + (timer.baseElapsed || 0))
    }, 200)
    setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearInterval(id)
  }, [timer])

  if (!timer) return null
  const entry = state.entries.find((e) => e.id === timer.entryId)

  const stop = () => {
    const duration = Date.now() - timer.startedAt + (timer.baseElapsed || 0)
    dispatch({
      type: 'LOG_TIME',
      payload: {
        entryId: timer.entryId,
        log: {
          startedAt: timer.startedAt,
          duration,
          description: description.trim() || undefined,
        },
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      stop()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'var(--color-text)',
        color: '#fff',
        borderRadius: 14,
        padding: '12px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        zIndex: 2000,
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 320,
        maxWidth: 480,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="animate-pulse-dot"
          style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--color-red)', flexShrink: 0 }}
        />
        <span
          style={{
            flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {entry ? entry.text.slice(0, 48) + (entry.text.length > 48 ? '…' : '') : 'Timer running'}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 15,
            fontWeight: 500, letterSpacing: '0.04em', flexShrink: 0,
          }}
        >
          {fmtElapsed(elapsed)}
        </span>
        <button
          onClick={stop}
          style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
            padding: '5px 12px', color: '#fff', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          Stop
        </button>
      </div>
      <input
        ref={inputRef}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What are you working on?"
        style={{
          width: '100%',
          marginTop: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '6px 10px',
          fontFamily: 'inherit',
          fontSize: 12,
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
