'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import { toLocalDateStr, todayLocalStr } from '@/lib/predicates'
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

function groupByFolder(tasks: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>()
  for (const t of tasks) {
    const key = t.folder || 'Uncategorized'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export default function TasksView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimers } = state
  const [query, setQuery] = useState('')
  const [showFuture, setShowFuture] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [groupBy, setGroupBy] = useState<'date' | 'folder'>('date')

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

  const activeGroups = useMemo(
    () => {
      const entries = showFuture ? [...current, ...futureAll] : current
      return groupBy === 'date' ? groupByDate(entries) : groupByFolder(entries)
    },
    [showFuture, current, futureAll, groupBy],
  )
  const completedGroups = useMemo(() => {
    if (groupBy === 'date') {
      const map = new Map<string, Entry[]>()
      for (const t of completed) {
        const key = t.completedAt ? toLocalDateStr(t.completedAt) : getDateKey(t)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(t)
      }
      return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    }
    return groupByFolder(completed)
  }, [completed, groupBy])

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimers.some((t) => t.entryId === entry.id)) return
    dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, segments: [{ startedAt: Date.now(), description: '' }] } })
  }

  const handleTaskToggle = (entry: Entry) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', payload: entry.id })
  }

  const handleSetActionDate = (entry: Entry) => {
    dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, actionDate: todayLocalStr() } })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
          Tasks
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>
            {active.length} open · {completed.length} done · {futureAll.length} future
          </span>
          {futureAll.length > 0 && (
            <span
              onClick={() => setShowFuture((v) => !v)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 14,
                  borderRadius: 99,
                  background: showFuture ? 'var(--color-accent)' : 'var(--color-bg3)',
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: showFuture ? 16 : 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </span>
              Show future
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg3)', borderRadius: 8, padding: 2 }}>
          <span
            onClick={() => setGroupBy('date')}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              color: groupBy === 'date' ? '#fff' : 'var(--color-text3)',
              background: groupBy === 'date' ? 'var(--color-accent)' : 'transparent',
              transition: '0.12s',
              userSelect: 'none',
            }}
          >
            Date
          </span>
          <span
            onClick={() => setGroupBy('folder')}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              color: groupBy === 'folder' ? '#fff' : 'var(--color-text3)',
              background: groupBy === 'folder' ? 'var(--color-accent)' : 'transparent',
              transition: '0.12s',
              userSelect: 'none',
            }}
          >
            Folder
          </span>
        </div>
        <span
          onClick={() => setShowCompleted((v) => !v)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: 28,
              height: 14,
              borderRadius: 99,
              background: showCompleted ? 'var(--color-accent)' : 'var(--color-bg3)',
              position: 'relative',
              transition: 'background 0.15s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: showCompleted ? 16 : 2,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.15s',
              }}
            />
          </span>
          Show completed
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
          <SectionHead title={groupBy === 'folder' ? dateKey : fmtDate(dateKey)} count={group.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {group.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                timerActive={activeTimers.some((t) => t.entryId === e.id)}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
                onSetActionDate={handleSetActionDate}
                currency={state.currency}
              />
            ))}
          </div>
        </div>
      ))}

      {showCompleted && completedGroups.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Completed" count={completed.length} />
          {completedGroups.map(([key, group]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {groupBy === 'folder' ? key : fmtDate(key)}
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
                    onSetActionDate={handleSetActionDate}
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
