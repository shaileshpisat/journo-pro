'use client'

import { useState } from 'react'
import { useAppState } from '@/context/AppContext'

export default function AddFolderModal() {
  const { state, dispatch } = useAppState()
  const entry = state.addFolderEntry
  if (!entry) return null

  const [folderInput, setFolderInput] = useState('')

  const confirm = () => {
    if (folderInput.trim()) {
      dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, folder: folderInput.trim() } })
    }
    dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: null })
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
        <input
          value={folderInput}
          onChange={(e) => setFolderInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm()}
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
            marginBottom: 14,
            background: 'var(--color-bg)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
            onClick={confirm}
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
