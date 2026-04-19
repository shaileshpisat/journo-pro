'use client'

import { useAppState } from '@/context/AppContext'
import { isToday, isOverdue } from '@/lib/predicates'
import { fmtAmt } from '@/lib/formatters'
import JournalInput from '@/components/entry/JournalInput'
import EntryCard from '@/components/entry/EntryCard'
import TodayTimeline from '@/components/entry/TodayTimeline'
import SectionHead from '@/components/ui/SectionHead'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function HomeView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state

  const todayEntries = entries.filter((e) => isToday(e.timestamp)).slice(0, 6)
  const todayAction = entries.filter(
    (e) => e.actionDate === todayStr() && !isToday(e.timestamp)
  )
  const overdue = entries.filter((e) => isOverdue(e))

  const todayTags = [...new Set(todayEntries.flatMap((e) => e.tags))]
  const todayFolders = [...new Set(todayEntries.filter((e) => e.folder).map((e) => e.folder!))]
  const todayEntities = [...new Set(todayEntries.filter((e) => e.entity).map((e) => e.entity!))]
  const hasSummary = todayTags.length || todayFolders.length || todayEntities.length

  const handleTimerToggle = (entry: import('@/lib/types').Entry) => {
    if (activeTimer?.entryId === entry.id) {
      dispatch({ type: 'SET_TIMER', payload: null })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
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
          />
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
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
