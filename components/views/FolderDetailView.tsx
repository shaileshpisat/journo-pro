'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { folderMatches } from '@/lib/folderUtils'
import { Entry } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import TodayTimeline, { HistoryRowData } from '@/components/entry/TodayTimeline'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

interface FolderDetailViewProps {
  folderName: string
}

function groupByDate(entries: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = e.timestamp.split('T')[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

export default function FolderDetailView({ folderName }: FolderDetailViewProps) {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state
  const [tasksOnly, setTasksOnly] = useState(false)
  const [showChanges, setShowChanges] = useState(true)

  const activeEntries = entries.filter((e) => !e.archived)
  const folderEntries = activeEntries.filter((e) => folderMatches(e.folder, folderName))
  const visibleEntries = tasksOnly ? folderEntries.filter((e) => e.isTask) : folderEntries

  const totalIn = folderEntries
    .filter((e) => e.amountType === 'inflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const totalOut = folderEntries
    .filter((e) => e.amountType === 'outflow')
    .reduce((s, e) => s + (e.amount || 0), 0)

  const dateGroups = useMemo(() => groupByDate(visibleEntries), [visibleEntries])

  const historyByDate = useMemo(() => {
    const map = new Map<string, HistoryRowData[]>()
    folderEntries.forEach((e) => {
      if (!e.history) return
      e.history.forEach((h) => {
        const dateKey = new Date(h.timestamp).toISOString().split('T')[0]
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push({ history: h, entryText: e.text, timestamp: h.timestamp })
      })
    })
    for (const items of map.values()) {
      items.sort((a, b) => a.timestamp - b.timestamp)
    }
    return map
  }, [folderEntries])

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimer?.entryId === entry.id) {
      dispatch({ type: 'SET_TIMER', payload: null })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
  }

  const handleTaskToggle = (entry: Entry) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', payload: entry.id })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <Icon name="folder" size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
            <FolderChip path={folderName} />
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {totalIn > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--color-green)' }}>
              +${totalIn.toLocaleString()}
            </span>
          )}
          {totalOut > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--color-red)' }}>
              −${totalOut.toLocaleString()}
            </span>
          )}
          <span style={{ fontSize: 13, color: 'var(--color-text3)' }}>
            {folderEntries.length} entries
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              onClick={() => setTasksOnly((v) => !v)}
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
                  background: tasksOnly ? 'var(--color-accent)' : 'var(--color-bg3)',
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: tasksOnly ? 16 : 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </span>
              Tasks
            </span>
          </div>
        </div>
      </div>

      {visibleEntries.length === 0 ? (
        <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>
          {tasksOnly ? 'No tasks in this folder.' : 'No entries in this folder.'}
        </p>
      ) : (
        dateGroups.map(([dateKey, group]) => (
          <div key={dateKey} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {fmtDate(dateKey)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)' }}>
                {group.length} {group.length === 1 ? 'entry' : 'entries'}
              </span>
              {(historyByDate.get(dateKey)?.length ?? 0) > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)' }}>
                  {historyByDate.get(dateKey)!.length} changes
                </span>
              )}
              {(historyByDate.get(dateKey)?.length ?? 0) > 0 && (
                <span
                  onClick={() => setShowChanges((v) => !v)}
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 14,
                      borderRadius: 99,
                      background: showChanges ? 'var(--color-accent)' : 'var(--color-bg3)',
                      position: 'relative',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: showChanges ? 16 : 2,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.15s',
                      }}
                    />
                  </span>
                  Changes
                </span>
              )}
            </div>
            <TodayTimeline
              entries={group}
              historyItems={showChanges ? historyByDate.get(dateKey) : undefined}
              onClick={(e) => dispatch({ type: 'SELECT_ENTRY', payload: e })}
              activeTimer={activeTimer}
              onTimerToggle={handleTimerToggle}
              onTaskToggle={handleTaskToggle}
            />
          </div>
        ))
      )}
    </div>
  )
}
