'use client'

import { useAppState } from '@/context/AppContext'
import { buildFolderTree } from '@/lib/folderUtils'
import FolderTreeNode from '@/components/layout/FolderTreeNode'

export default function FoldersView() {
  const { state } = useAppState()
  const { entries } = state
  const tree = buildFolderTree(entries)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>Folders</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text3)', marginBottom: 24 }}>
        Click a folder to see its entries. Use Move to reorganize.
      </p>
      {tree.length === 0 && (
        <p style={{ color: 'var(--color-text3)', fontSize: 14 }}>
          No folders yet. Add /foldername to an entry to create one.
        </p>
      )}
      <div>
        {tree.map((node) => (
          <FolderTreeNode key={node.path} node={node} entries={entries} depth={0} variant="view" />
        ))}
      </div>
    </div>
  )
}
