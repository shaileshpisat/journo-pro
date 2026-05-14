'use client'

import { useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { isToday, isOverdue } from '@/lib/predicates'
import { fmtTime, fmtAmt } from '@/lib/formatters'
import { EntryHistory } from '@/lib/types'
import JournalInput from '@/components/entry/JournalInput'
import EntryCard from '@/components/entry/EntryCard'
import TodayTimeline from '@/components/entry/TodayTimeline'
import SectionHead from '@/components/ui/SectionHead'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function fmtHistField(field: string): string {
  const map: Record<string, string> = {
    text: 'Text',
    folder: 'Folder',
    actionDate: 'Action date',
    entity: 'Entity',
    amount: 'Amount',
    amountType: 'Type',
    tags: 'Tags',
    isTask: 'Task',
    isTaskDone: 'Done',
    archived: 'Archive',
  }
  return map[field] || field
}

function fmtHistValue(field: string, val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (field === 'amount') return `$${Number(val).toLocaleString()}`
  if (field === 'amountType') return val as string
  if (field === 'isTask') return val ? 'yes' : 'no'
  if (field === 'isTaskDone') return val ? 'done' : 'undone'
  if (field === 'archived') return val ? 'archived' : 'restored'
  if (field === 'actionDate') return val as string
  if (Array.isArray(val)) return `[${(val as string[]).join(', ')}]`
  return String(val).slice(0, 50)
}

function HistoryRow({ history, entryText }: { history: EntryHistory; entryText: string }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '8px 13px',
      marginBottom: 6,
      fontSize: 12,
      lineHeight: 1.4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Icon name="edit" size={11} color="var(--color-text3)" />
        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
          {fmtHistField(history.field)}
        </span>
        <span style={{ color: 'var(--color-text3)' }}>·</span>
        <span style={{ color: 'var(--color-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {entryText.slice(0, 40)}{entryText.length > 40 ? '…' : ''}
        </span>
      </div>
      <div style={{ color: 'var(--color-text3)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
        {fmtHistValue(history.field, history.oldValue)}
        <span style={{ margin: '0 4px', color: 'var(--color-accent)' }}>→</span>
        {fmtHistValue(history.field, history.newValue)}
      </div>
    </div>
  )
}

export default function HomeView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state

  const activeEntries = entries.filter((e) => !e.archived)
  const todayEntries = activeEntries.filter((e) => isToday(e.timestamp)).slice(0, 6)
  const todayAction = activeEntries.filter(
    (e) => e.actionDate === todayStr() && !isToday(e.timestamp)
  )
  const overdue = activeEntries.filter((e) => isOverdue(e))

  const todayTags = [...new Set(todayEntries.flatMap((e) => e.tags))]
  const todayFolders = [...new Set(todayEntries.filter((e) => e.folder).map((e) => e.folder!))]
  const todayEntities = [...new Set(todayEntries.filter((e) => e.entity).map((e) => e.entity!))]
  const hasSummary = todayTags.length || todayFolders.length || todayEntities.length

  const todayHistory = useMemo(() => {
    const today = todayStr()
    const items: { history: EntryHistory; entryText: string; timestamp: number }[] = []
    state.entries.forEach((e) => {
      if (!e.history) return
      e.history.forEach((h) => {
        if (new Date(h.timestamp).toISOString().split('T')[0] === today) {
          items.push({ history: h, entryText: e.text, timestamp: h.timestamp })
        }
      })
    })
    return items.sort((a, b) => a.timestamp - b.timestamp)
  }, [state.entries])

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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--color-text3)',
          marginBottom: 6,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <h1
        style={{
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 300,
          color: 'var(--color-text)',
          marginBottom: 32,
          letterSpacing: '-0.03em',
        }}
      >
        What&apos;s happening?
      </h1>

      <JournalInput />

      {/* Today summary pills */}
      {todayEntries.length > 0 && hasSummary && (
        <div
          style={{
            maxWidth: 680,
            margin: '16px auto 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            padding: '14px 18px',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}
        >
          {todayEntities.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                Entities
              </span>
              {todayEntities.map((e) => (
                <Chip key={e} icon="entity" label={e} small />
              ))}
            </div>
          )}
          {todayFolders.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                Folders
              </span>
              {todayFolders.map((f) => (
                <FolderChip key={f} path={f} small />
              ))}
            </div>
          )}
          {todayTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                Tags
              </span>
              {todayTags.map((t) => (
                <Chip key={t} icon="tag" label={`#${t}`} small />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Today timeline */}
      {todayEntries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <SectionHead title="Added today" count={todayEntries.length} />
          <TodayTimeline
            entries={todayEntries}
            onClick={(e) => dispatch({ type: 'SELECT_ENTRY', payload: e })}
            activeTimer={activeTimer}
            onTimerToggle={handleTimerToggle}
            onTaskToggle={handleTaskToggle}
          />
        </div>
      )}

      {/* Today changes */}
      {todayHistory.length > 0 && (
        <div style={{ marginTop: todayEntries.length > 0 ? 32 : 40 }}>
          <SectionHead title="Changed today" count={todayHistory.length} />
          <div>
            {todayHistory.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 0 }}>
                <div style={{ width: 52, flexShrink: 0, paddingTop: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text3)', fontFamily: "'DM Mono', monospace" }}>
                    {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div style={{ width: 1, background: 'var(--color-border)', flexShrink: 0, marginRight: 14, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 7, left: -3.5, width: 8, height: 8, borderRadius: 99, background: 'var(--color-text3)', border: '2px solid var(--color-bg)' }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 10 }}>
                  <HistoryRow history={item.history} entryText={item.entryText} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action today */}
      {todayAction.length > 0 && (
        <div
          style={{
            marginTop: 32,
            padding: 16,
            background: 'var(--color-amber-light)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-amber)',
          }}
        >
          <SectionHead title="Action today" count={todayAction.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {todayAction.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                minimal
                timerActive={activeTimer?.entryId === e.id}
                onTimerToggle={handleTimerToggle}
                onTaskToggle={handleTaskToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Needs action */}
      {overdue.length > 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--color-red-light)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-red)',
          }}
        >
          <SectionHead title="Needs action" count={overdue.length} />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[...overdue]
              .sort((a, b) => (a.actionDate! > b.actionDate! ? 1 : -1))
              .map((e) => (
                <div key={e.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                  <EntryCard
                    entry={e}
                    onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                    overdue
                    minimal
                    timerActive={activeTimer?.entryId === e.id}
                    onTimerToggle={handleTimerToggle}
                    onTaskToggle={handleTaskToggle}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
