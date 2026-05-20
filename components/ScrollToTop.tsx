'use client'

import { useState, useEffect } from 'react'
import { useAppState } from '@/context/AppContext'

export default function ScrollToTop() {
  const { state } = useAppState()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = document.querySelector<HTMLElement>('main')
    if (!el) return
    const onScroll = () => setVisible(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    document.querySelector<HTMLElement>('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: state.activeTimer ? 140 : 28,
        right: 28,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text2)',
        fontSize: 18,
        zIndex: 100,
      }}
      title="Back to top"
    >
      ↑
    </button>
  )
}
