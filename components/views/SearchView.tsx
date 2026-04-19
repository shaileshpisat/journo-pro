'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths, folderMatches } from '@/lib/folderUtils'
import EntryCard from '@/components/entry/EntryCard'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'
import { isOverdue } from '@/lib/predicates'

export default function SearchView() {
  const { state, dispatch } = useAppState()
  const { entries } = state

  const [query, setQuery] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterFolder, setFilterFolder] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allEntities = [...new Set(entries.filter((e) => e.entity).map((e) => e.entity!))].sort()
  const allFolders = getAllFolderPaths(entries).sort()
  const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort()

  const results = entries.filter((e) => {
    if (query && !e.text.toLowerCase().includes(query.toLowerCase()) && !(e.entity || '').toLowerCase().includes(query.toLowerCase())) return false
    if (filterEntity && e.entity !== filterEntity) return false
    if (filterFolder && !folderMatches(e.folder, filterFolder)) return false
    if (filterTag && !e.tags.includes(filterTag)) return false
    if (filterFrom && e.timestamp.slice(0, 10) < filterFrom) return false
    if (filterTo && e.timestamp.slice(0, 10) > filterTo) return false
    return true
  })

  const hasFilters = filterEntity || filterFolder || filterTag || filterFrom || filterTo
  const activeFilterCount = [filterEntity, filterFolder, filterTag, filterFrom, filterTo].filter(Boolean).length
  const clearAll = () => { setFilterEntity(''); setFilterFolder(''); setFilterTag(''); setFilterFrom(''); setFilterTo('') }

  const selectStyle: React.CSSProperties = { flex: 1, border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 10px', fontFamily: 'inherit', fontSize: 12, background: '#fff', color: 'var(--color-text)', outline: 'none' }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 20 }}>Search</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '9px 14px' }}>
          <Icon name="search" size={15} color="var(--color-text3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries…"
            autoFocus
            style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit', fontSize: 14, background: 'transparent', color: 'var(--color-text)' }}
          />
          {query && <span onClick={() => setQuery('')} style={{ cursor: 'pointer', color: 'var(--color-text3)', fontSize: 16 }}>×</span>}
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          style={{
            background: filtersOpen || hasFilters ? 'var(--color-accent-light)' : 'var(--color-bg2)',
            border: `1px solid ${filtersOpen || hasFilters ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            color: hasFilters ? 'var(--color-accent)' : 'var(--color-text2)', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 99, width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Entity</label>
            <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} style={selectStyle}>
              <option value="">All entities</option>
              {allEntities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Folder</label>
            <select value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)} style={selectStyle}>
              <option value="">All folders</option>
              {allFolders.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Tag</label>
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={selectStyle}>
              <option value="">All tags</option>
              {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Date range</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={{ ...selectStyle, flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>to</span>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={{ ...selectStyle, flex: 1 }} />
            </div>
          </div>
          {hasFilters && (
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: 'var(--color-red)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Clear all filters</button>
            </div>
          )}
        </div>
      )}

      {hasFilters && !filtersOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {filterEntity && <Chip label={filterEntity} icon="entity" bg="var(--color-bg3)" onRemove={() => setFilterEntity('')} small />}
          {filterFolder && <FolderChip path={filterFolder} small />}
          {filterTag && <Chip label={`#${filterTag}`} icon="tag" bg="var(--color-bg3)" onRemove={() => setFilterTag('')} small />}
          {filterFrom && <Chip label={`From ${filterFrom}`} icon="clock" bg="var(--color-amber-light)" color="var(--color-amber)" onRemove={() => setFilterFrom('')} small />}
          {filterTo && <Chip label={`To ${filterTo}`} icon="clock" bg="var(--color-amber-light)" color="var(--color-amber)" onRemove={() => setFilterTo('')} small />}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
        {(query || hasFilters) && <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>sorted by date</span>}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text3)', fontSize: 14 }}>
            No entries match your search.
          </div>
        )}
        {[...results]
          .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
          .map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
              overdue={isOverdue(e)}
            />
          ))}
      </div>
    </div>
  )
}
