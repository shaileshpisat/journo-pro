'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'

export default function RecurringTagPicker() {
  const { state, dispatch } = useAppState()
  const { pendingRecurring } = state

  if (pendingRecurring.length === 0) return null

  const [selections, setSelections] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {}
    for (const p of pendingRecurring) {
      init[p.entryId] = p.periodTags[0]
    }
    return init
  })

  const handleConfirm = () => {
    for (const p of pendingRecurring) {
      dispatch({ type: 'RESOLVE_RECURRING', payload: { entryId: p.entryId, selectedTag: selections[p.entryId] } })
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          width: 420,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, marginTop: 0 }}>
          Choose recurring period
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text2)', marginBottom: 20, lineHeight: 1.5 }}>
          Some tasks have multiple period tags. Pick one to keep &mdash; the others will be removed.
        </p>

        {pendingRecurring.map((p) => (
          <div
            key={p.entryId}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--color-text)' }}>
              {p.text.slice(0, 120)}
              {p.text.length > 120 ? '…' : ''}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text3)', margin: '0 0 6px' }}>
              Current action date: {p.actionDate}
            </p>
            <select
              value={selections[p.entryId]}
              onChange={(e) => setSelections((s) => ({ ...s, [p.entryId]: e.target.value }))}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 10px',
                fontFamily: 'inherit',
                fontSize: 13,
                outline: 'none',
                background: 'var(--color-bg)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {p.periodTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleConfirm}
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
