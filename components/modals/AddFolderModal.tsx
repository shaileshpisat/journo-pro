'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths } from '@/lib/folderUtils'

export default function AddFolderModal() {
  const { state, dispatch } = useAppState()
  const entry = state.addFolderEntry
  if (!entry) return null

  const [folderInput, setFolderInput] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const existingFolders = useMemo(() => getAllFolderPaths(state.entries), [state.entries])

  const suggestions = useMemo(() => {
    if (!folderInput.trim()) return []
    const q = folderInput.trim().toLowerCase()
    return existingFolders.filter((f) => f.toLowerCase().includes(q))
  }, [existingFolders, folderInput])

  const confirm = (folder?: string) => {
    const name = folder ?? folderInput.trim()
    if (name) {
      const now = Date.now()
      dispatch({
        type: 'UPDATE_ENTRY',
        payload: {
          ...entry,
          folder: name,
          text: `Folder ${name} is created`,
          history: [...(entry.history || []), { timestamp: now, field: 'folder', oldValue: entry.folder, newValue: name }],
        },
      })
    }
    dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: null })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && selectedIndex >= 0) {
        confirm(suggestions[selectedIndex])
      } else {
        confirm()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Escape') {
      setFolderInput('')
      setSelectedIndex(-1)
    }
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
        zIndex: 1000,
      }}
      onClick={() => dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: null })}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          width: 340,
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>Add to folder</h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text2)',
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          {entry.text.slice(0, 80)}
          {entry.text.length > 80 ? '…' : ''}
        </p>
        <div style={{ position: 'relative' }}>
          <input
            value={folderInput}
            onChange={(e) => {
              setFolderInput(e.target.value)
              setSelectedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Folder name (e.g. Clients)"
            autoFocus
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '8px 12px',
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
              width: '100%',
              marginBottom: 4,
              background: 'var(--color-bg)',
              boxSizing: 'border-box',
            }}
          />
          {suggestions.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '4px 0',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                background: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                maxHeight: 180,
                overflowY: 'auto',
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
              }}
            >
              {suggestions.map((folder, i) => (
                <li
                  key={folder}
                  onClick={() => confirm(folder)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: i === selectedIndex ? 'var(--color-bg2)' : 'transparent',
                    color: 'var(--color-text)',
                  }}
                >
                  {folder}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: null })}
            style={{
              background: 'var(--color-bg2)',
              color: 'var(--color-text2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '7px 14px',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => confirm()}
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
            Add folder
          </button>
        </div>
      </div>
    </div>
  )
}
