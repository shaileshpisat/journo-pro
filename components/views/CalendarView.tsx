'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { isOverdue } from '@/lib/predicates'
import { fmtAmt } from '@/lib/formatters'
import Icon from '@/components/ui/Icon'

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function CalendarView() {
  const { state, dispatch } = useAppState()
  const { entries } = state
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()

  const getWeekDays = (offset: number): Date[] => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d)
      day.setDate(d.getDate() + i)
      return day
    })
  }

  const days = getWeekDays(weekOffset)

  const getEntriesForDay = (day: Date) => {
    const ds = fmt(day)
    return entries.filter((e) => e.timestamp.startsWith(ds) || e.actionDate === ds)
  }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text2)', fontFamily: "'DM Mono', monospace" }}>
            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
            {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: <Icon name="chevronLeft" size={14} />, fn: () => setWeekOffset((w) => w - 1) },
              { label: 'Today', fn: () => setWeekOffset(0) },
              { label: <Icon name="chevronRight" size={14} />, fn: () => setWeekOffset((w) => w + 1) },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.fn}
                style={{
                  background: 'var(--color-bg2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 7,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text2)',
                  fontFamily: 'inherit',
                  fontSize: 11,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
        {days.map((day) => {
          const isT = fmt(day) === fmt(today)
          return (
            <div key={fmt(day)} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 99, margin: '0 auto',
                background: isT ? 'var(--color-accent)' : 'transparent',
                color: isT ? '#fff' : 'var(--color-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: isT ? 600 : 400,
              }}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'start' }}>
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day)
          const isT = fmt(day) === fmt(today)
          return (
            <div key={fmt(day)} style={{
              minHeight: 80,
              background: isT ? 'var(--color-accent-light)' : 'var(--color-bg2)',
              borderRadius: 'var(--radius)',
              padding: 8,
              border: `1px solid ${isT ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}>
              {dayEntries.length === 0 && <div style={{ height: 40 }} />}
              {dayEntries.map((e) => {
                const amt = fmtAmt(e.amount, e.amountType)
                const isAction = e.actionDate === fmt(day)
                const overdue = isOverdue(e)
                return (
                  <div
                    key={e.id}
                    onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                    style={{
                      background: '#fff', borderRadius: 6, padding: '5px 7px', marginBottom: 5,
                      border: `1px solid ${overdue ? 'var(--color-red)' : 'var(--color-border)'}`,
                      cursor: 'pointer', fontSize: 11, lineHeight: 1.4,
                    }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)')}
                    onMouseLeave={(ev) => (ev.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {e.text.slice(0, 40)}{e.text.length > 40 ? '…' : ''}
                      </span>
                    </div>
                    {amt && <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: amt.color, fontWeight: 500 }}>{amt.label}</span>}
                    {isAction && !overdue && <span style={{ fontSize: 10, color: 'var(--color-amber)', fontWeight: 500 }}>● action</span>}
                    {overdue && <span style={{ fontSize: 10, color: 'var(--color-red)', fontWeight: 500 }}>● overdue</span>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
