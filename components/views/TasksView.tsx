'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import EntryCard from '@/components/entry/EntryCard'
import SectionHead from '@/components/ui/SectionHead'
import Icon from '@/components/ui/Icon'

function getDateKey(task: Entry): string {
  return task.actionDate || task.timestamp.split('T')[0]
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
  const { entries, activeTimer } = state
  const [query, setQuery] = useState('')

  const tasks = entries.filter((e) => e.isTask && !e.archived)

  const filtered = query
    ? tasks.filter((e) => e.text.toLowerCase().includes(query.toLowerCase()))
    : tasks

  const active = filtered.filter((e) => !e.isTaskDone)
  const completed = filtered.filter((e) => e.isTaskDone)

  const activeGroups = useMemo(() => groupByDate(active), [active])
  const completedGroups = useMemo(() => groupByDate(completed), [completed])

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimer?.entryId === entry.id) {
      const duration = Date.now() - activeTimer.startedAt + (activeTimer.baseElapsed || 0)
      dispatch({ type: 'LOG_TIME', payload: { entryId: entry.id, log: { startedAt: activeTimer.startedAt, duration } } })
    } else if (activeTimer) {
      const duration = Date.now() - activeTimer.startedAt + (activeTimer.baseElapsed || 0)
      dispatch({ type: 'LOG_TIME', payload: { entryId: activeTimer.entryId, log: { startedAt: activeTimer.startedAt, duration } } })
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
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
                timerActive={activeTimer?.entryId === e.id}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
                currency={state.currency}
              />
            ))}
          </div>
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
                    timerActive={activeTimer?.entryId === e.id}
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
