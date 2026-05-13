'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import EntryCard from '@/components/entry/EntryCard'
import SectionHead from '@/components/ui/SectionHead'
import Icon from '@/components/ui/Icon'

export default function TasksView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state
  const [query, setQuery] = useState('')

  const tasks = entries.filter((e) => e.isTask)

  const filtered = query
    ? tasks.filter((e) => e.text.toLowerCase().includes(query.toLowerCase()))
    : tasks

  const active = filtered.filter((e) => !e.isTaskDone)
  const completed = filtered.filter((e) => e.isTaskDone)

  const handleTimerToggle = (entry: import('@/lib/types').Entry) => {
    if (activeTimer?.entryId === entry.id) {
      dispatch({ type: 'SET_TIMER', payload: null })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
  }

  const handleTaskToggle = (entry: import('@/lib/types').Entry) => {
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

      {active.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionHead title="Active" count={active.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {active.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                timerActive={activeTimer?.entryId === e.id}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
              />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <SectionHead title="Completed" count={completed.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {completed.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                timerActive={activeTimer?.entryId === e.id}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
              />
            ))}
          </div>
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
