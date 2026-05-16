'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { isOverdue } from '@/lib/predicates'
import { Entry } from '@/lib/types'
import EntryCard from '@/components/entry/EntryCard'
import Icon from '@/components/ui/Icon'

export default function EntitiesView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimer } = state
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)

  const activeEntries = entries.filter((e) => !e.archived)

  const entityMap = new Map<string, number>()
  activeEntries.forEach((e) => {
    if (e.entity) {
      entityMap.set(e.entity, (entityMap.get(e.entity) || 0) + 1)
    }
  })
  const entities = Array.from(entityMap.entries()).sort((a, b) => b[1] - a[1])

  const entityEntries = selectedEntity
    ? activeEntries.filter((e) => e.entity === selectedEntity)
    : []

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

  if (!selectedEntity) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>Entities</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text3)', marginBottom: 24 }}>
          Click an entity to see its entries.
        </p>
        {entities.length === 0 && (
          <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>
            No entities yet. Use @EntityName in an entry to create one.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {entities.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setSelectedEntity(name)}
              style={{
                background: 'var(--color-bg3)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: count > 5 ? 15 : count > 2 ? 14 : 13,
                fontWeight: count > 3 ? 600 : 400,
                color: 'var(--color-text)',
              }}
            >
              <Icon name="entity" size={14} color="var(--color-accent)" />
              {name}
              <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>{count}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const totalIn = entityEntries
    .filter((e) => e.amountType === 'inflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const totalOut = entityEntries
    .filter((e) => e.amountType === 'outflow')
    .reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <button
            onClick={() => setSelectedEntity(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text3)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <Icon name="arrowLeft" size={18} />
          </button>
          <Icon name="entity" size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
            {selectedEntity}
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
            {entityEntries.length} entries
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {entityEntries.length === 0 && (
          <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>No entries for this entity.</p>
        )}
        {entityEntries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
            overdue={isOverdue(e)}
            timerActive={activeTimer?.entryId === e.id}
            onTimerToggle={handleTimerToggle}
            onTaskToggle={handleTaskToggle}
          />
        ))}
      </div>
    </div>
  )
}
