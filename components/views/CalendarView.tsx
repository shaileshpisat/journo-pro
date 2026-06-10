'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { isOverdue } from '@/lib/predicates'
import { fmtAmt, fmtDate, fmtTime } from '@/lib/formatters'
import Icon from '@/components/ui/Icon'

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarView() {
  const { state, dispatch } = useAppState()
  const { entries } = state
  const activeEntries = entries.filter((e) => !e.archived)
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
    return activeEntries
      .filter((e) => e.timestamp.startsWith(ds) || e.actionDate === ds)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  const getProductiveHour = (): { hour: number; totalMinutes: number } | null => {
    const dayStrs = new Set(days.map(fmt))
    const hourTotals: Record<number, number> = {}
    activeEntries.forEach((e) => {
      if (!e.timeLogs) return
      e.timeLogs.forEach((log) => {
        const logDate = new Date(log.startedAt)
        if (dayStrs.has(fmt(logDate))) {
          const h = logDate.getHours()
          hourTotals[h] = (hourTotals[h] || 0) + log.duration
        }
      })
    })
    const entries = Object.entries(hourTotals)
    if (entries.length === 0) return null
    const best = entries.reduce((a, b) => (a[1] > b[1] ? a : b))
    return { hour: Number(best[0]), totalMinutes: Math.round(best[1] / 60000) }
  }

  const productiveHour = getProductiveHour()

  const fmtHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12} ${period}`
  }

  return (
    <div style={{ padding: '40px clamp(12px, 2vw, 40px) 80px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
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

      {productiveHour && (
        <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--color-text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="stopwatch" size={12} />
          Most productive hour: <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtHour(productiveHour.hour)}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--color-text3)' }}>
            ({productiveHour.totalMinutes} min tracked)
          </span>
        </div>
      )}

      {/* Day headers + columns in a single grid so columns stay in sync */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((day) => {
          const isT = fmt(day) === fmt(today)
          return (
            <div key={'h' + fmt(day)} style={{ textAlign: 'center' }}>
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
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day)
          const ds = fmt(day)
          const olderEntries = dayEntries.filter((e) => !e.timestamp.startsWith(ds))
          const todayEntries = dayEntries.filter((e) => e.timestamp.startsWith(ds))
          const isT = ds === fmt(today)

          const renderEntry = (e: typeof dayEntries[number]) => {
            const amt = fmtAmt(e.amount, e.amountType, state.currency)
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
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, alignItems: 'center' }}>
                  <span style={{
                    color: e.isTaskDone ? 'var(--color-text3)' : 'var(--color-text)',
                    textDecoration: e.isTaskDone ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {e.text.slice(0, 40)}{e.text.length > 40 ? '…' : ''}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>{fmtTime(e.timestamp)}</span>
                  {e.isTaskDone && <Icon name="checkSquare" size={10} color="var(--color-accent)" />}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {amt && <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: amt.color, fontWeight: 500 }}>{amt.label}</span>}
                  {e.actionDate && <span style={{ fontSize: 10, color: overdue ? 'var(--color-red)' : 'var(--color-amber)', fontWeight: 500 }}>{fmtDate(e.actionDate)}</span>}
                </div>
              </div>
            )
          }

          return (
            <div key={'b' + ds} style={{
              minHeight: 80,
              background: isT ? 'var(--color-accent-light)' : 'var(--color-bg2)',
              borderRadius: 'var(--radius)',
              padding: 8,
              border: `1px solid ${isT ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}>
              {dayEntries.length === 0 && <div style={{ height: 40 }} />}
              {olderEntries.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  {olderEntries.map(renderEntry)}
                </div>
              )}
              {olderEntries.length > 0 && todayEntries.length > 0 && (
                <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 0 8px', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    background: 'var(--color-bg2)', padding: '0 6px',
                    fontSize: 9, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>Recent</span>
                </div>
              )}
              {todayEntries.length > 0 && todayEntries.map(renderEntry)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
