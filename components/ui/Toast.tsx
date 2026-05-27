'use client'

import { useEffect } from 'react'
import { useAppState } from '@/context/AppContext'

export default function Toast() {
  const { state, dispatch } = useAppState()
  const msg = state.toast

  useEffect(() => {
    if (!msg) return
    const id = setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3000)
    return () => clearTimeout(id)
  }, [msg, dispatch])

  if (!msg) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        animation: 'toast-in 0.25s ease-out',
      }}
    >
      <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>!</span>
      {msg}
    </div>
  )
}
