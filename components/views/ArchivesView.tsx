'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { Entry } from '@/lib/types'
import EntryCard from '@/components/entry/EntryCard'
import Icon from '@/components/ui/Icon'

export default function ArchivesView() {
  const { state, dispatch } = useAppState()
  const { entries } = state
  const [query, setQuery] = useState('')

  const archived = entries.filter((e) => e.archived)

  const results = query
    ? archived.filter((e) =>
        e.text.toLowerCase().includes(query.toLowerCase())
      )
    : archived

  const handleArchive = (entry: Entry) => {
    if (entry.archived) {
      dispatch({ type: 'RESTORE_ENTRY', payload: entry.id })
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="archive" size={20} color="var(--color-text2)" />
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
            Archives
          </h2>
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>
          {archived.length} archived
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
          placeholder="Search archived entries…"
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

      <div style={{ display: 'grid', gap: 8 }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text3)', fontSize: 14 }}>
            {query ? 'No archived entries match your search.' : 'No archived entries yet.'}
          </div>
        )}
        {[...results]
          .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
          .map((e) => (
            <div key={e.id} style={{ position: 'relative' }}>
              <EntryCard
                entry={e}
                onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                onArchive={handleArchive}
              />
            </div>
          ))}
      </div>
    </div>
  )
}
