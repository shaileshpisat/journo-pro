'use client'

import { useState } from 'react'
import { FolderNode, Entry } from '@/lib/types'
import { folderMatches } from '@/lib/folderUtils'
import { useAppState } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import MoveFolderModal from '@/components/modals/MoveFolderModal'

interface FolderTreeNodeProps {
  node: FolderNode
  entries: Entry[]
  depth?: number
}

export default function FolderTreeNode({ node, entries, depth = 0 }: FolderTreeNodeProps) {
  const { dispatch } = useAppState()
  const [open, setOpen] = useState(depth < 2)
  const [hovered, setHovered] = useState(false)
  const [showMove, setShowMove] = useState(false)

  const totalCount = entries.filter((e) => folderMatches(e.folder, node.path)).length
  const totalIn = entries
    .filter((e) => folderMatches(e.folder, node.path) && e.amountType === 'inflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const totalOut = entries
    .filter((e) => folderMatches(e.folder, node.path) && e.amountType === 'outflow')
    .reduce((s, e) => s + (e.amount || 0), 0)
  const hasChildren = node.children.length > 0

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 10,
          marginBottom: 4,
          background: hovered ? '#fff' : 'transparent',
          border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`,
          boxShadow: hovered ? '0 1px 6px rgba(0,0,0,0.05)' : 'none',
          transition: 'all 0.12s',
          cursor: 'pointer',
        }}
      >
        <span
          onClick={() => hasChildren && setOpen((o) => !o)}
          style={{ width: 16, display: 'flex', alignItems: 'center', color: 'var(--color-text3)', flexShrink: 0 }}
        >
          {hasChildren ? (
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
          ) : (
            <span style={{ width: 12 }} />
          )}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            background: 'var(--color-accent-light)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="folder" size={14} color="var(--color-accent)" />
        </div>
        <div style={{ flex: 1 }} onClick={() => dispatch({ type: 'SET_VIEW', payload: `folder:${node.path}` })}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{node.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text3)' }}>
            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
            {hasChildren ? ` · ${node.children.length} sub-folders` : ''}
          </div>
        </div>
        {!hovered && (
          <div style={{ textAlign: 'right' }}>
            {totalIn > 0 && (
              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--color-green)' }}>
                +${totalIn.toLocaleString()}
              </div>
            )}
            {totalOut > 0 && (
              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--color-red)' }}>
                −${totalOut.toLocaleString()}
              </div>
            )}
          </div>
        )}
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMove(true)
            }}
            style={{
              background: 'var(--color-bg2)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '3px 10px',
              fontFamily: 'inherit',
              fontSize: 11,
              color: 'var(--color-text2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Move
          </button>
        )}
      </div>

      {showMove && (
        <MoveFolderModal
          node={node}
          entries={entries}
          onClose={() => setShowMove(false)}
        />
      )}

      {open && hasChildren && (
        <div
          style={{
            borderLeft: '1px dashed var(--color-border)',
            marginLeft: 22,
            paddingLeft: 4,
          }}
        >
          {node.children.map((child) => (
            <FolderTreeNode key={child.path} node={child} entries={entries} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
