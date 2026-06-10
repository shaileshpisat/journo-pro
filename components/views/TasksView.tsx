'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import { toLocalDateStr } from '@/lib/predicates'
import EntryCard from '@/components/entry/EntryCard'
import SectionHead from '@/components/ui/SectionHead'
import Icon from '@/components/ui/Icon'

function getDateKey(task: Entry): string {
  return task.actionDate || toLocalDateStr(task.timestamp)
}

function groupByDate(tasks: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>()
  for (const t of tasks) {
    const key = getDateKey(t)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

export default function TasksView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimers } = state
  const [query, setQuery] = useState('')
  const [futureWeeksShown, setFutureWeeksShown] = useState(0)

  const tasks = entries.filter((e) => e.isTask && !e.archived)

  const filtered = query
    ? tasks.filter((e) => e.text.toLowerCase().includes(query.toLowerCase()))
    : tasks

  const active = filtered.filter((e) => !e.isTaskDone)
  const completed = filtered.filter((e) => e.isTaskDone)

  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`
  const current = active.filter((e) => !e.actionDate || e.actionDate <= tomorrowStr)
  const futureAll = active
    .filter((e) => e.actionDate && e.actionDate > tomorrowStr)
    .sort((a, b) => a.actionDate!.localeCompare(b.actionDate!))

  const futureWeeks = useMemo(() => {
    const weeks: [string, Entry[]][][] = []
    let cur: [string, Entry[]][] | null = null
    let weekEnd = ''
    for (const t of futureAll) {
      const ds = t.actionDate!
      if (!cur || ds > weekEnd) {
        cur = []
        weeks.push(cur)
        const d = new Date(ds)
        d.setDate(d.getDate() + 6)
        weekEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      let dayGroup = cur.find(([k]) => k === ds)
      if (!dayGroup) {
        dayGroup = [ds, []]
        cur.push(dayGroup)
      }
      dayGroup[1].push(t)
    }
    return weeks
  }, [futureAll])

  const activeGroups = useMemo(() => groupByDate(current), [current])
  const completedGroups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const t of completed) {
      const key = t.completedAt ? toLocalDateStr(t.completedAt) : getDateKey(t)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [completed])

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimers.some((t) => t.entryId === entry.id)) return
    dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, segments: [{ startedAt: Date.now(), description: '' }] } })
  }

  const handleTaskToggle = (entry: Entry) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', payload: entry.id })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
          Tasks
        </h2>
        <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>
          {active.length} open · {completed.length} done
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: '1.5px solid var(--color-border)',
          borderRadius: 10,
          padding: '9px 14px',
          marginBottom: 24,
        }}
      >
        <Icon name="search" size={15} color="var(--color-text3)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            fontFamily: 'inherit',
            fontSize: 14,
            background: 'transparent',
            color: 'var(--color-text)',
          }}
        />
        {query && (
          <span
            onClick={() => setQuery('')}
            style={{ cursor: 'pointer', color: 'var(--color-text3)', fontSize: 16 }}
          >
            ×
          </span>
        )}
      </div>

      {activeGroups.map(([dateKey, group]) => (
        <div key={dateKey} style={{ marginBottom: 24 }}>
          <SectionHead title={fmtDate(dateKey)} count={group.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {group.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                timerActive={activeTimers.some((t) => t.entryId === e.id)}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
                currency={state.currency}
              />
            ))}
          </div>
        </div>
      ))}

      {futureWeeks.length > futureWeeksShown && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <button
            onClick={() => setFutureWeeksShown((w) => w + 1)}
            style={{
              background: 'var(--color-bg2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '8px 20px',
              fontFamily: 'inherit',
              fontSize: 13,
              color: 'var(--color-text2)',
              cursor: 'pointer',
            }}
          >
            Show future entries for a week
          </button>
        </div>
      )}
      {futureWeeksShown > 0 && futureWeeks.slice(0, futureWeeksShown).map((week, wi) => (
        <div key={`fw-${wi}`} style={{ marginBottom: wi + 1 < futureWeeksShown ? 24 : 0 }}>
          {week.map(([dateKey, group]) => (
            <div key={dateKey} style={{ marginBottom: 16 }}>
              <SectionHead title={fmtDate(dateKey)} count={group.length} />
              <div style={{ display: 'grid', gap: 8 }}>
                {group.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                    timerActive={activeTimers.some((t) => t.entryId === e.id)}
                    onTimerToggle={handleTimerToggle}
                    onTaskToggle={handleTaskToggle}
                    currency={state.currency}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {completedGroups.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Completed" count={completed.length} />
          {completedGroups.map(([dateKey, group]) => (
            <div key={dateKey} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {fmtDate(dateKey)}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {group.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                    timerActive={activeTimers.some((t) => t.entryId === e.id)}
                    onTimerToggle={handleTimerToggle}
                    onTaskToggle={handleTaskToggle}
                    currency={state.currency}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text3)', fontSize: 14 }}>
          {query ? 'No tasks match your search.' : 'No tasks yet. Mark an entry as a task to get started.'}
        </div>
      )}
    </div>
  )
}
