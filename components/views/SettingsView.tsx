'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths } from '@/lib/folderUtils'
import Icon from '@/components/ui/Icon'

export default function SettingsView() {
  const { state } = useAppState()
  const { entries } = state
  const [tab, setTab] = useState<'entities' | 'tags' | 'folders'>('entities')
  const [newVal, setNewVal] = useState('')
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
            onClick={() => { setTab(t.id); setNewVal(''); setEditId(null) }}
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
        {active.list.map((item, i) => (
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
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)' }}>
              {tab === 'tags' ? `#${item}` : item}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
              {getCount(item)} entries
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
