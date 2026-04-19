'use client'

import { useAppState } from '@/context/AppContext'
import { isOverdue } from '@/lib/predicates'
import { Entry } from '@/lib/types'
import EntryCard from '@/components/entry/EntryCard'
import SectionHead from '@/components/ui/SectionHead'

export default function InboxView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state

  const noFolder = entries.filter((e) => !e.folder && !isOverdue(e))
  const overdue = entries.filter((e) => isOverdue(e))
  const withActionDate = entries.filter((e) => e.folder && e.actionDate && !isOverdue(e))

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimer?.entryId === entry.id) {
      dispatch({ type: 'SET_TIMER', payload: null })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Inbox</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text3)', marginTop: 2 }}>
            Entries without a folder resurface weekly
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: overdue.length > 0 ? 'var(--color-red)' : 'var(--color-bg3)',
            color: overdue.length > 0 ? '#fff' : 'var(--color-text3)',
            borderRadius: 99,
            padding: '4px 12px',
          }}
        >
          {overdue.length} overdue
        </span>
      </div>

      {/* Overdue — horizontal scroll */}
      {overdue.length > 0 && (
        <div
          style={{
            marginBottom: 28,
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

      {/* Upcoming */}
      {withActionDate.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead title="Upcoming" count={withActionDate.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {withActionDate.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                timerActive={activeTimer?.entryId === e.id}
                onTimerToggle={handleTimerToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unorganized */}
      {noFolder.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead title="Unorganized" count={noFolder.length} />
          <div style={{ display: 'grid', gap: 8 }}>
            {noFolder.map((e) => (
              <div key={e.id} style={{ position: 'relative' }}>
                <EntryCard
                  entry={e}
                  onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                  timerActive={activeTimer?.entryId === e.id}
                  onTimerToggle={handleTimerToggle}
                />
                <button
                  onClick={() => dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: e })}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'var(--color-accent-light)',
                    color: 'var(--color-accent)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  + Folder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
