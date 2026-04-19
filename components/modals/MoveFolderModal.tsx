'use client'

import { useState } from 'react'
import { FolderNode, Entry } from '@/lib/types'
import { getAllFolderPaths } from '@/lib/folderUtils'
import { useAppState } from '@/context/AppContext'
import FolderChip from '@/components/ui/FolderChip'

interface MoveFolderModalProps {
  node: FolderNode
  entries: Entry[]
  onClose: () => void
}

export default function MoveFolderModal({ node, entries, onClose }: MoveFolderModalProps) {
  const { dispatch } = useAppState()
  const allPaths = getAllFolderPaths(entries).filter(
    (p) => p !== node.path && !p.startsWith(node.path + '/')
  )
  const [selected, setSelected] = useState('')

  const handleMove = () => {
    const oldName = node.path.split('/').pop()!
    const newPath = selected ? `${selected}/${oldName}` : oldName
    dispatch({ type: 'MOVE_FOLDER', payload: { oldPath: node.path, newPath } })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          width: 360,
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, marginTop: 0 }}>
          Move &quot;{node.name}&quot;
        </h3>
        <p style={{ fontSize: 12, color: 'var(--color-text3)', marginBottom: 16 }}>
          Select destination folder or leave empty to make it a root folder.
        </p>
        <div
          style={{
            display: 'grid',
            gap: 6,
            maxHeight: 240,
            overflowY: 'auto',
            marginBottom: 16,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              border: `1px solid ${selected === '' ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: selected === '' ? 'var(--color-accent-light)' : '#fff',
            }}
          >
            <input
              type="radio"
              name="dest"
              value=""
              checked={selected === ''}
              onChange={() => setSelected('')}
            />
            <span style={{ fontSize: 13 }}>Root (no parent)</span>
          </label>
          {allPaths.map((p) => (
            <label
              key={p}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${selected === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: selected === p ? 'var(--color-accent-light)' : '#fff',
              }}
            >
              <input
                type="radio"
                name="dest"
                value={p}
                checked={selected === p}
                onChange={() => setSelected(p)}
              />
              <FolderChip path={p} small />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-bg2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '7px 14px',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--color-text2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Move here
          </button>
        </div>
      </div>
    </div>
  )
}
