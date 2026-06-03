'use client'

import { useMemo, useState } from 'react'
import { useAppState } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import type { Entry, TimeLog } from '@/lib/types'

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getColor(entry: Entry): string {
  const colors = [
    'var(--color-accent)',
    '#4A90D9',
    '#50B86C',
    '#E8734A',
    '#9B59B6',
    '#1ABC9C',
    '#F39C12',
    '#E74C3C',
  ]
  let hash = 0
  for (let i = 0; i < entry.id.toString().length; i++) {
    hash = ((hash << 5) - hash) + entry.id.toString().charCodeAt(i)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface HourBlock {
  entry: Entry
  log: TimeLog
  startHour: number
  endHour: number
  startMinute: number
  durationMinutes: number
}

function assignColumns(
  dayBlocks: HourBlock[]
): Map<string, { col: number; totalCols: number }> {
  const sorted = [...dayBlocks].sort(
    (a, b) => (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
  )
  const colEnds: number[] = []
  const result = new Map<string, { col: number; totalCols: number }>()
  sorted.forEach((block) => {
    const blockStart = block.startHour * 60 + block.startMinute
    const blockEnd = block.endHour * 60
    const key = `${block.entry.id}-${block.log.startedAt}`
    let col = colEnds.findIndex((end) => end <= blockStart)
    if (col === -1) {
      col = colEnds.length
      colEnds.push(0)
    }
    colEnds[col] = Math.max(colEnds[col], blockEnd)
    result.set(key, { col, totalCols: 0 })
  })
  const totalCols = Math.max(colEnds.length, 1)
  result.forEach((v) => { v.totalCols = totalCols })
  return result
}

export default function ParallelView() {
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
  const dayStrs = new Set(days.map(fmt))
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const blocks = useMemo(() => {
    const result: HourBlock[] = []
    entries.forEach((e) => {
      if (!e.timeLogs) return
      e.timeLogs.forEach((log) => {
        const logDate = new Date(log.startedAt)
        if (!dayStrs.has(fmt(logDate))) return
        const startHour = logDate.getHours()
        const startMinute = logDate.getMinutes()
        const durationMinutes = log.duration / 60000
        const endMinute = startHour * 60 + startMinute + durationMinutes
        const endHour = Math.min(Math.ceil(endMinute / 60), 24)
        result.push({ entry: e, log, startHour, endHour, startMinute, durationMinutes })
      })
    })
    return result
  }, [entries, dayStrs])

  const blockPositions = useMemo(() => {
    const byDay = new Map<string, HourBlock[]>()
    blocks.forEach((b) => {
      const dayKey = fmt(new Date(b.log.startedAt))
      if (!byDay.has(dayKey)) byDay.set(dayKey, [])
      byDay.get(dayKey)!.push(b)
    })
    const result = new Map<string, { col: number; totalCols: number }>()
    byDay.forEach((dayBlocks) => {
      const positions = assignColumns(dayBlocks)
      positions.forEach((pos, key) => result.set(key, pos))
    })
    return result
  }, [blocks])

  const fmtHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12} ${period}`
  }

  return (
    <div style={{ padding: '40px clamp(12px, 2vw, 40px) 80px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Parallel</h2>
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        gap: '2px',
        fontSize: 11,
      }}>
        <div key="spacer" />
        {days.map((day) => {
          const isT = fmt(day) === fmt(today)
          return (
            <div key={'h' + fmt(day)} style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: 99, margin: '2px auto 0',
                background: isT ? 'var(--color-accent)' : 'transparent',
                color: isT ? '#fff' : 'var(--color-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: isT ? 600 : 400,
              }}>
                {day.getDate()}
              </div>
            </div>
          )
        })}

        {hours.flatMap((hour) => [
          <div key={'t' + hour} style={{
            color: 'var(--color-text3)', fontSize: 10, textAlign: 'right', paddingRight: 8,
            paddingTop: 2, fontFamily: "'DM Mono', monospace", height: 32, boxSizing: 'border-box',
          }}>
            {fmtHour(hour)}
          </div>,
          ...days.map((day) => {
            const isT = fmt(day) === fmt(today)
            const dayBlocks = blocks.filter(
              (b) => fmt(new Date(b.log.startedAt)) === fmt(day) && b.startHour <= hour && b.endHour > hour
            )
            return (
              <div
                key={'c' + fmt(day) + '-' + hour}
                style={{
                  background: isT ? 'var(--color-accent-light)' : 'var(--color-bg2)',
                  borderRadius: 3, minHeight: 32, position: 'relative',
                  border: '1px solid',
                  borderColor: isT ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                {dayBlocks.map((b) => {
                  const topPct = b.startHour === hour ? (b.startMinute / 60) * 100 : 0
                  const hPct = b.startHour === hour
                    ? Math.max(12.5, b.durationMinutes / 60 * 100 - topPct)
                    : 12.5
                  const pos = blockPositions.get(`${b.entry.id}-${b.log.startedAt}`) ?? { col: 0, totalCols: 1 }
                  return (
                    <div
                      key={b.entry.id + '-' + b.log.startedAt}
                      onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: b.entry })}
                      title={b.entry.text}
                      style={{
                        position: 'absolute', top: `${topPct}%`,
                        left: `${(pos.col / pos.totalCols) * 100 + 0.5}%`,
                        width: `${(1 / pos.totalCols) * 100 - 1}%`,
                        height: `${hPct}%`, background: getColor(b.entry), borderRadius: 3,
                        opacity: 0.7, cursor: 'pointer', zIndex: 10,
                        display: 'flex', alignItems: 'center', overflow: 'hidden',
                        whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        padding: '0 4px', color: '#fff', fontSize: 9, fontWeight: 600, lineHeight: 1,
                      }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.opacity = '1')}
                      onMouseLeave={(ev) => (ev.currentTarget.style.opacity = '0.7')}
                    >
                      {hPct > 25 ? b.entry.text : ''}
                    </div>
                  )
                })}
              </div>
            )
          }),
        ])}
      </div>
    </div>
  )
}
