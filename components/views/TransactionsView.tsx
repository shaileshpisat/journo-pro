'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry } from '@/lib/types'
import { fmtAmt, fmtDate } from '@/lib/formatters'
import EntryCard from '@/components/entry/EntryCard'
import SectionHead from '@/components/ui/SectionHead'
import Icon from '@/components/ui/Icon'

export default function TransactionsView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state
  const [groupBy, setGroupBy] = useState<'date' | 'folder'>('date')

  const activeEntries = entries.filter((e) => !e.archived && e.amount !== null)

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

  const groupedByDate = activeEntries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const dateKey = entry.actionDate || new Date(entry.timestamp).toISOString().split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(entry)
    return acc
  }, {})

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => (a > b ? -1 : 1))

  const groupedByFolder = activeEntries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const folderKey = entry.folder || 'Unorganized'
    if (!acc[folderKey]) acc[folderKey] = []
    acc[folderKey].push(entry)
    return acc
  }, {})

  const sortedFolderKeys = Object.keys(groupedByFolder).sort((a, b) => {
    if (a === 'Unorganized') return 1
    if (b === 'Unorganized') return -1
    return a.localeCompare(b)
  })

  const totalInflow = activeEntries
    .filter((e) => e.amountType === 'inflow')
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const totalOutflow = activeEntries
    .filter((e) => e.amountType === 'outflow')
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const net = totalInflow - totalOutflow

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
            Transactions
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text3)', marginTop: 2 }}>
            All entries with amounts
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            background: 'var(--color-bg2)',
            borderRadius: 8,
            padding: 3,
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => setGroupBy('date')}
            style={{
              background: groupBy === 'date' ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: groupBy === 'date' ? 'var(--color-text)' : 'var(--color-text3)',
              cursor: 'pointer',
              boxShadow: groupBy === 'date' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            By Date
          </button>
          <button
            onClick={() => setGroupBy('folder')}
            style={{
              background: groupBy === 'folder' ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: groupBy === 'folder' ? 'var(--color-text)' : 'var(--color-text3)',
              cursor: 'pointer',
              boxShadow: groupBy === 'folder' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            By Folder
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 4 }}>Inflow</div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--color-green)',
            }}
          >
            {`+${state.currency}${totalInflow.toLocaleString()}`}
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 4 }}>Outflow</div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--color-red)',
            }}
          >
            {`−${state.currency}${totalOutflow.toLocaleString()}`}
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 4 }}>Net</div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 18,
              fontWeight: 500,
              color: net >= 0 ? 'var(--color-green)' : 'var(--color-red)',
            }}
          >
            {`${net >= 0 ? '+' : '−'}${state.currency}${Math.abs(net).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Grouped entries */}
      {groupBy === 'date' ? (
        sortedDateKeys.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--color-text3)',
              fontSize: 14,
            }}
          >
            <Icon name="transactions" size={32} />
            <p style={{ marginTop: 12 }}>No transactions yet</p>
          </div>
        ) : (
          sortedDateKeys.map((dateKey) => {
            const dateEntries = groupedByDate[dateKey]
            const dateIn = dateEntries
              .filter((e) => e.amountType === 'inflow')
              .reduce((s, e) => s + (e.amount || 0), 0)
            const dateOut = dateEntries
              .filter((e) => e.amountType === 'outflow')
              .reduce((s, e) => s + (e.amount || 0), 0)

            return (
              <div key={dateKey} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionHead title={fmtDate(dateKey)} count={dateEntries.length} />
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                    {dateIn > 0 && (
                      <span style={{ color: 'var(--color-green)' }}>{`+${state.currency}${dateIn.toLocaleString()}`}</span>
                    )}
                    {dateOut > 0 && (
                      <span style={{ color: 'var(--color-red)' }}>{`−${state.currency}${dateOut.toLocaleString()}`}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {dateEntries.map((e) => (
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
            )
          })
        )
      ) : sortedFolderKeys.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--color-text3)',
            fontSize: 14,
          }}
        >
          <Icon name="transactions" size={32} />
          <p style={{ marginTop: 12 }}>No transactions yet</p>
        </div>
      ) : (
        sortedFolderKeys.map((folderKey) => {
          const folderEntries = groupedByFolder[folderKey]
          const folderIn = folderEntries
            .filter((e) => e.amountType === 'inflow')
            .reduce((s, e) => s + (e.amount || 0), 0)
          const folderOut = folderEntries
            .filter((e) => e.amountType === 'outflow')
            .reduce((s, e) => s + (e.amount || 0), 0)

          return (
            <div key={folderKey} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <SectionHead title={folderKey} count={folderEntries.length} />
                <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                  {folderIn > 0 && (
                    <span style={{ color: 'var(--color-green)' }}>{`+${state.currency}${folderIn.toLocaleString()}`}</span>
                  )}
                  {folderOut > 0 && (
                    <span style={{ color: 'var(--color-red)' }}>{`−${state.currency}${folderOut.toLocaleString()}`}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {folderEntries.map((e) => (
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
          )
        })
      )}
    </div>
  )
}
