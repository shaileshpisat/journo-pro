'use client'

import { useAppState } from '@/context/AppContext'
import { getAllFolderPaths, buildFolderTree } from '@/lib/folderUtils'
import { isOverdue } from '@/lib/predicates'
import NavItem from './NavItem'
import FolderTreeNode from './FolderTreeNode'
import Icon from '@/components/ui/Icon'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
]

export default function Sidebar() {
  const { state, dispatch } = useAppState()
  const { entries, view, sidebarCollapsed: collapsed } = state

  const folders = getAllFolderPaths(entries)
  const inboxCount = entries.filter((e) => !e.folder).length
  const overdueCount = entries.filter((e) => isOverdue(e)).length
  const tree = buildFolderTree(entries)
  const rootFolders = [...new Set(folders.map((f) => f.split('/')[0]))]

  const setView = (v: string) => {
    dispatch({ type: 'SET_VIEW', payload: v as any })
  }

  return (
    <aside
      style={{
        width: collapsed ? 52 : 'var(--sidebar-w)',
        minWidth: collapsed ? 52 : 'var(--sidebar-w)',
        background: 'var(--color-bg2)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s, min-width 0.2s',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Logo + toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 0' : '16px 14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            journopro
          </span>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text3)',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 6px', flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={{
              ...item,
              badge: item.id === 'inbox' ? inboxCount : undefined,
            }}
            active={view === item.id}
            onClick={() => setView(item.id)}
            collapsed={collapsed}
            overdueCount={item.id === 'inbox' ? overdueCount : 0}
          />
        ))}

        {/* Folders section */}
        {!collapsed && rootFolders.length > 0 && (
          <>
            <div
              style={{
                margin: '14px 6px 6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Folders
              </span>
              <span
                onClick={() => setView('folders')}
                style={{ fontSize: 11, color: 'var(--color-accent)', cursor: 'pointer' }}
              >
                All
              </span>
            </div>
            {tree.map((node) => (
              <FolderTreeNode
                key={node.path}
                node={node}
                entries={entries}
                depth={0}
                variant="sidebar"
              />
            ))}
          </>
        )}
        {collapsed && tree.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {tree.map((node) => (
              <NavItem
                key={node.path}
                item={{ id: `folder:${node.path}`, label: node.name, icon: 'folder' }}
                active={view === `folder:${node.path}`}
                onClick={() => setView(`folder:${node.path}`)}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div style={{ padding: '8px 6px', borderTop: '1px solid var(--color-border)' }}>
        <NavItem
          item={{ id: 'settings', label: 'Settings', icon: 'settings' }}
          active={view === 'settings'}
          onClick={() => setView('settings')}
          collapsed={collapsed}
        />
      </div>
    </aside>
  )
}
