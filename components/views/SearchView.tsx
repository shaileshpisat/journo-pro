'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths, folderMatches } from '@/lib/folderUtils'
import { SearchFilters } from '@/lib/types'
import EntryCard from '@/components/entry/EntryCard'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import Icon from '@/components/ui/Icon'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { isOverdue } from '@/lib/predicates'

export default function SearchView() {
  const { state, dispatch } = useAppState()
  const { entries, searchFilters } = state
  const {
    query, filterEntity, filterFolder, filterTag,
    filterFrom, filterTo, tasksOnly,
  } = searchFilters

  const setFilters = (partial: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: { ...searchFilters, ...partial } })
  }

  const activeEntries = entries.filter((e) => !e.archived)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const allEntities = [...new Set(activeEntries.filter((e) => e.entity).map((e) => e.entity!))].sort()
  const allFolders = getAllFolderPaths(activeEntries).sort()
  const allTags = [...new Set(activeEntries.flatMap((e) => e.tags))].sort()

  const tagFiltered = filterTag.length > 0
  const results = activeEntries
    .filter((e) => {
      if (query && !e.text.toLowerCase().includes(query.toLowerCase()) && !(e.entity || '').toLowerCase().includes(query.toLowerCase())) return false
      if (filterEntity.length > 0 && !filterEntity.includes(e.entity || '')) return false
      if (filterFolder.length > 0 && !filterFolder.some((f) => folderMatches(e.folder, f))) return false
      if (tasksOnly && (!e.isTask || e.isTaskDone)) return false
      if (filterFrom && e.timestamp.slice(0, 10) < filterFrom) return false
      if (filterTo && e.timestamp.slice(0, 10) > filterTo) return false
      return true
    })
    .map((e) => ({
      entry: e,
      tagScore: tagFiltered ? filterTag.filter((t) => e.tags.includes(t)).length : 0,
    }))
    .filter((item) => !tagFiltered || item.tagScore > 0)
    .sort((a, b) => {
      if (tagFiltered && a.tagScore !== b.tagScore) return b.tagScore - a.tagScore
      return b.entry.timestamp > a.entry.timestamp ? 1 : -1
    })

  const hasFilters = filterEntity.length > 0 || filterFolder.length > 0 || filterTag.length > 0 || filterFrom || filterTo
  const activeFilterCount = [filterEntity.length > 0, filterFolder.length > 0, filterTag.length > 0, !!filterFrom, !!filterTo].filter(Boolean).length
  const clearAll = () => setFilters({ query: '', filterEntity: [], filterFolder: [], filterTag: [], filterFrom: '', filterTo: '', tasksOnly: false })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 20 }}>Search</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '9px 14px' }}>
          <Icon name="search" size={15} color="var(--color-text3)" />
          <input
            value={query}
            onChange={(e) => setFilters({ query: e.target.value })}
            placeholder="Search entries…"
            autoFocus
            style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit', fontSize: 14, background: 'transparent', color: 'var(--color-text)' }}
          />
          {query && <span onClick={() => setFilters({ query: '' })} style={{ cursor: 'pointer', color: 'var(--color-text3)', fontSize: 16 }}>×</span>}
        </div>
        <span
          onClick={() => setFilters({ tasksOnly: !tasksOnly })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            userSelect: 'none', fontFamily: 'inherit', fontSize: 12,
            color: tasksOnly ? 'var(--color-accent)' : 'var(--color-text3)',
            fontWeight: tasksOnly ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: 28, height: 14, borderRadius: 99,
              background: tasksOnly ? 'var(--color-accent)' : 'var(--color-bg3)',
              position: 'relative', transition: 'background 0.15s',
            }}
          >
            <span
              style={{
                position: 'absolute', top: 2,
                left: tasksOnly ? 16 : 2,
                width: 10, height: 10, borderRadius: '50%',
                background: '#fff', transition: 'left 0.15s',
              }}
            />
          </span>
          Tasks
        </span>
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
            <SearchableSelect multi value={filterEntity} onChange={(v) => setFilters({ filterEntity: v as string[] })} options={allEntities} allLabel="All entities" placeholder="Search entities…" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Folder</label>
            <SearchableSelect multi value={filterFolder} onChange={(v) => setFilters({ filterFolder: v as string[] })} options={allFolders} allLabel="All folders" placeholder="Search folders…" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Tag</label>
            <SearchableSelect multi value={filterTag} onChange={(v) => setFilters({ filterTag: v as string[] })} options={allTags} allLabel="All tags" placeholder="Search tags…" formatOption={(t) => `#${t}`} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Date range</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={filterFrom} onChange={(e) => setFilters({ filterFrom: e.target.value })} style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 10px', fontFamily: 'inherit', fontSize: 12, background: '#fff', color: 'var(--color-text)', outline: 'none' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>to</span>
              <input type="date" value={filterTo} onChange={(e) => setFilters({ filterTo: e.target.value })} style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 10px', fontFamily: 'inherit', fontSize: 12, background: '#fff', color: 'var(--color-text)', outline: 'none' }} />
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
          {filterEntity.map((e) => <Chip key={e} label={e} icon="entity" bg="var(--color-bg3)" onRemove={() => setFilters({ filterEntity: filterEntity.filter((x) => x !== e) })} small />)}
          {filterFolder.map((f) => <FolderChip key={f} path={f} small />)}
          {filterTag.map((t) => <Chip key={t} label={`#${t}`} icon="tag" bg="var(--color-bg3)" onRemove={() => setFilters({ filterTag: filterTag.filter((x) => x !== t) })} small />)}
          {filterFrom && <Chip label={`From ${filterFrom}`} icon="clock" bg="var(--color-amber-light)" color="var(--color-amber)" onRemove={() => setFilters({ filterFrom: '' })} small />}
          {filterTo && <Chip label={`To ${filterTo}`} icon="clock" bg="var(--color-amber-light)" color="var(--color-amber)" onRemove={() => setFilters({ filterTo: '' })} small />}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          {tasksOnly && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>Tasks only</span>}
          {tagFiltered && <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>sorted by tag match</span>}
          {!tagFiltered && (query || hasFilters) && <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>sorted by date</span>}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text3)', fontSize: 14 }}>
            No entries match your search.
          </div>
        )}
        {results.map(({ entry: e }) => (
            <EntryCard
              key={e.id}
              entry={e}
              onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
              overdue={isOverdue(e)}
              currency={state.currency}
            />
          ))}
      </div>
    </div>
  )
}
