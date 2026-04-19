'use client'

import { useAppState } from '@/context/AppContext'
import { folderMatches } from '@/lib/folderUtils'
import { isOverdue } from '@/lib/predicates'
import { Entry } from '@/lib/types'
import EntryCard from '@/components/entry/EntryCard'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'

interface FolderDetailViewProps {
  folderName: string
}

export default function FolderDetailView({ folderName }: FolderDetailViewProps) {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state

  const folderEntries = entries.filter((e) => folderMatches(e.folder, folderName))
  const totalIn = folderEntries
    .filter((e) => e.amountType === 'inflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const totalOut = folderEntries
    .filter((e) => e.amountType === 'outflow')
    .reduce((s, e) => s + (e.amount || 0), 0)

  const handleTimerToggle = (entry: Entry) => {
    if (activeTimer?.entryId === entry.id) {
      dispatch({ type: 'SET_TIMER', payload: null })
    } else {
      dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
    }
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
        <div style={{ display: 'flex', gap: 12 }}>
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
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {folderEntries.length === 0 && (
          <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>No entries in this folder.</p>
        )}
        {folderEntries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
            overdue={isOverdue(e)}
            timerActive={activeTimer?.entryId === e.id}
            onTimerToggle={handleTimerToggle}
          />
        ))}
      </div>
    </div>
  )
}
