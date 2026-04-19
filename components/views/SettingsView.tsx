'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths } from '@/lib/folderUtils'
import Icon from '@/components/ui/Icon'

export default function SettingsView() {
  const { state, dispatch } = useAppState()
  const { entries } = state
  const [tab, setTab] = useState<'entities' | 'tags' | 'folders'>('entities')
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const allEntities = [...new Set(entries.filter((e) => e.entity).map((e) => e.entity!))]
  const allTags = [...new Set(entries.flatMap((e) => e.tags))]
  const allFolders = [...new Set(entries.filter((e) => e.folder).map((e) => e.folder!))]

  const tabs = [
    { id: 'entities' as const, label: 'Entities', icon: 'entity', list: allEntities },
    { id: 'tags' as const, label: 'Tags', icon: 'tag', list: allTags },
    { id: 'folders' as const, label: 'Folders', icon: 'folder', list: allFolders },
  ]
  const active = tabs.find((t) => t.id === tab)!

  const getCount = (item: string) => {
    if (tab === 'entities') return entries.filter((e) => e.entity === item).length
    if (tab === 'tags') return entries.filter((e) => e.tags.includes(item)).length
    return entries.filter((e) => e.folder === item).length
  }

  const handleSaveEdit = () => {
    if (!editId || editVal === editId) {
      setEditId(null)
      setEditVal('')
      return
    }

    const updatedEntries = entries.map((e) => {
      if (tab === 'entities' && e.entity === editId) return { ...e, entity: editVal }
      if (tab === 'folders' && e.folder === editId) return { ...e, folder: editVal }
      if (tab === 'tags' && e.tags.includes(editId)) {
        return { ...e, tags: e.tags.map((t) => (t === editId ? editVal : t)) }
      }
      return e
    })

    dispatch({ type: 'SET_ENTRIES', payload: updatedEntries })
    setEditId(null)
    setEditVal('')
  }

  const handleAdd = () => {
    if (!editVal) return
    
    const updatedEntries = [...entries]
    const newId = Math.floor(Math.random() * 1000000)
    if (tab === 'entities') {
      updatedEntries.push({
        id: newId,
        text: '',
        timestamp: new Date().toISOString(),
        actionDate: null,
        entity: editVal,
        tags: [],
        folder: null,
        amount: 0,
        amountType: 'inflow',
        timeLogs: []
      })
    } else if (tab === 'tags') {
      updatedEntries.push({
        id: newId,
        text: '',
        timestamp: new Date().toISOString(),
        actionDate: null,
        entity: null,
        tags: [editVal],
        folder: null,
        amount: 0,
        amountType: 'inflow',
        timeLogs: []
      })
    } else if (tab === 'folders') {
      updatedEntries.push({
        id: newId,
        text: '',
        timestamp: new Date().toISOString(),
        actionDate: null,
        entity: null,
        tags: [],
        folder: editVal,
        amount: 0,
        amountType: 'inflow',
        timeLogs: []
      })
    }

    dispatch({ type: 'SET_ENTRIES', payload: updatedEntries })
    setEditId(null)
    setEditVal('')
  }

  const startEdit = (item: string) => {
    setEditId(item)
    setEditVal(item)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditVal('')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>Settings</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text3)', marginBottom: 28 }}>
        Manage master lists used across your journal entries.
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-bg2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setEditId(null); setEditVal('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? 'var(--color-text)' : 'var(--color-text2)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon name={t.icon} size={13} color={tab === t.id ? 'var(--color-accent)' : 'var(--color-text3)'} />
            {t.label}
            <span style={{ fontSize: 11, fontWeight: 600, background: tab === t.id ? 'var(--color-accent-light)' : 'var(--color-bg3)', color: tab === t.id ? 'var(--color-accent)' : 'var(--color-text3)', borderRadius: 99, padding: '0 6px', lineHeight: 1.8 }}>{t.list.length}</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Info row */}
        <div style={{ padding: '12px 16px', background: 'var(--color-bg2)', borderBottom: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text3)' }}>
          {active.list.length === 0
            ? `No ${active.label.toLowerCase()} yet. Add entries with @entity, #tag, or /folder syntax.`
            : `${active.list.length} ${active.label.toLowerCase()} derived from your entries.`}
        </div>

        {active.list.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text3)', fontSize: 13 }}>
            No {active.label.toLowerCase()} found yet.
          </div>
        )}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder={`Add new ${active.label.toLowerCase()}...`}
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={{
              flex: 1, padding: '6px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 6, outline: 'none',
            }}
          />
          <button 
            onClick={handleAdd} 
            style={{ padding: '6px 12px', fontSize: 12, background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
          >
            Add
          </button>
        </div>
        {active.list.map((item, i) => {
          const isEditing = editId === item
          return (
            <div
              key={item}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderBottom: i < active.list.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={active.icon} size={13} color="var(--color-accent)" />
              </div>
              {isEditing ? (
                <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    style={{
                      flex: 1, padding: '4px 8px', fontSize: 14, border: '1px solid var(--color-accent)', borderRadius: 4, outline: 'none',
                    }}
                  />
                  <button onClick={handleSaveEdit} style={{ padding: '4px 8px', fontSize: 12, background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: '4px 8px', fontSize: 12, background: 'var(--color-bg3)', color: 'var(--color-text)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => startEdit(item)}
                    style={{ flex: 1, fontSize: 14, color: 'var(--color-text)', cursor: 'pointer' }}
                  >
                    {tab === 'tags' ? `#${item}` : item}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                    {getCount(item)} entries
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
