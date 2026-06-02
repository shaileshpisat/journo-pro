'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useAppState } from '@/context/AppContext'
import { folderMatches } from '@/lib/folderUtils'
import { Entry } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import TodayTimeline, { HistoryRowData, TimeLogRowData } from '@/components/entry/TodayTimeline'
import Chip from '@/components/ui/Chip'
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
  const { entries, activeTimers } = state
  const [tasksOnly, setTasksOnly] = useState(false)
  const [showChanges, setShowChanges] = useState(true)
  const [showTimeTracking, setShowTimeTracking] = useState(true)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestOpen, setTagSuggestOpen] = useState(false)
  const tagRef = useRef<HTMLDivElement>(null)

  const activeEntries = entries.filter((e) => !e.archived)
  const folderEntries = activeEntries.filter((e) => folderMatches(e.folder, folderName))
  const visibleEntries = tasksOnly ? folderEntries.filter((e) => e.isTask && !e.isTaskDone) : folderEntries

  const totalIn = folderEntries
    .filter((e) => e.amountType === 'inflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const totalOut = folderEntries
    .filter((e) => e.amountType === 'outflow')
    .reduce((s, e) => s + (e.amount || 0), 0)

  const folderTagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    folderEntries.forEach((e) => e.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)))
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag))
  }, [folderEntries])

  const tagSuggestions = useMemo(
    () =>
      tagInput
        ? folderTagCounts.filter((t) => t.tag.toLowerCase().includes(tagInput.toLowerCase()) && !filterTags.includes(t.tag))
        : folderTagCounts.filter((t) => !filterTags.includes(t.tag)),
    [tagInput, folderTagCounts, filterTags]
  )

  const taggedEntries = filterTags.length > 0
    ? visibleEntries.filter((e) => filterTags.every((t) => e.tags.includes(t)))
    : visibleEntries

  const showTagSuggest = tagSuggestOpen && tagSuggestions.length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const timeTrackingByDate = useMemo(() => {
    const map = new Map<string, TimeLogRowData[]>()
    folderEntries.forEach((e) => {
      if (!e.timeLogs) return
      e.timeLogs.forEach((log) => {
        const dateKey = new Date(log.startedAt).toISOString().split('T')[0]
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push({ entryText: e.text, entryId: e.id, ...log })
      })
    })
    for (const items of map.values()) {
      items.sort((a, b) => a.startedAt - b.startedAt)
    }
    return map
  }, [folderEntries])

  const dateGroups = useMemo(() => groupByDate(taggedEntries), [taggedEntries])

  const totalHistoryCount = useMemo(
    () => [...historyByDate.values()].reduce((s, items) => s + items.length, 0),
    [historyByDate]
  )

  const totalTimeTrackingCount = useMemo(
    () => [...timeTrackingByDate.values()].reduce((s, items) => s + items.length, 0),
    [timeTrackingByDate]
  )

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimers.some((t) => t.entryId === entry.id)) return
    dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, segments: [{ startedAt: Date.now(), description: '' }] } })
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
              {`+${state.currency}${totalIn.toLocaleString()}`}
            </span>
          )}
          {totalOut > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--color-red)' }}>
              {`−${state.currency}${totalOut.toLocaleString()}`}
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

      {/* Tag filter */}
      {folderTagCounts.length > 0 && (
        <div ref={tagRef} style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {folderTagCounts.map(({ tag, count }) => {
              const active = filterTags.includes(tag)
              return (
                <span
                  key={tag}
                  onClick={() =>
                    setFilterTags((p) => (active ? p.filter((x) => x !== tag) : [...p, tag]))
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 500,
                    color: active ? '#fff' : 'var(--color-text2)',
                    background: active ? 'var(--color-accent)' : 'var(--color-bg3)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.6,
                    transition: 'all 0.15s',
                  }}
                >
                  #{tag}
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      lineHeight: 1,
                      padding: '1px 4px',
                      borderRadius: 4,
                      background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-bg2)',
                    }}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setFilterTags((p) => p.filter((x) => x !== tag))
                      }}
                      style={{ cursor: 'pointer', opacity: 0.7, marginLeft: 1 }}
                    >
                      ×
                    </span>
                  )}
                </span>
              )
            })}
            <div style={{ position: 'relative', minWidth: 100 }}>
              <input
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagSuggestOpen(true) }}
                onFocus={() => setTagSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagSuggestions.length > 0) {
                    const { tag } = tagSuggestions[0]
                    if (!filterTags.includes(tag)) {
                      setFilterTags((p) => [...p, tag])
                      setTagInput('')
                    }
                  }
                }}
                placeholder="Add tag…"
                style={{
                  border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 12,
                  background: 'transparent', color: 'var(--color-text)', width: '100%',
                }}
              />
              {showTagSuggest && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid var(--color-border)',
                    borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  {tagSuggestions.map(({ tag, count }) => (
                    <div
                      key={tag}
                      onClick={() => {
                        setFilterTags((p) => [...p, tag])
                        setTagInput('')
                        setTagSuggestOpen(true)
                      }}
                      style={{
                        padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                        color: 'var(--color-text)', fontFamily: "'DM Mono', monospace",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      #<span style={{ fontWeight: 500 }}>{tag}</span>{' '}
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          opacity: 0.5,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {taggedEntries.length === 0 ? (
        <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>
          {tasksOnly ? 'No tasks' : 'No entries'}{filterTags.length > 0 ? ' match the selected tags.' : ' in this folder.'}
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {(totalHistoryCount > 0 || totalTimeTrackingCount > 0) && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                {totalHistoryCount > 0 && (
                  <span
                    onClick={() => setShowChanges((v) => !v)}
                    style={{
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
                {totalTimeTrackingCount > 0 && (
                  <span
                    onClick={() => setShowTimeTracking((v) => !v)}
                    style={{
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
                        background: showTimeTracking ? 'var(--color-accent)' : 'var(--color-bg3)',
                        position: 'relative',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: showTimeTracking ? 16 : 2,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.15s',
                        }}
                      />
                    </span>
                    Time
                  </span>
                )}
              </div>
            )}
          </div>
          {dateGroups.map(([dateKey, group]) => (
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
              </div>
              <TodayTimeline
                entries={group}
                historyItems={showChanges ? historyByDate.get(dateKey) : undefined}
                timeTrackingItems={showTimeTracking ? timeTrackingByDate.get(dateKey) : []}
                onClick={(e) => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                activeTimers={activeTimers}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
                currency={state.currency}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
