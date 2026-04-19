import { useState } from 'react'
import Icon from '@/components/ui/Icon'

interface NavItemProps {
  item: { id: string; label: string; icon: string; badge?: number }
  active: boolean
  onClick: () => void
  collapsed: boolean
  overdueCount?: number
}

export default function NavItem({ item, active, onClick, collapsed, overdueCount = 0 }: NavItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      title={collapsed ? item.label : ''}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: collapsed ? '8px 0' : '7px 10px',
        borderRadius: 7,
        cursor: 'pointer',
        marginBottom: 2,
        background: active ? '#fff' : hovered ? 'var(--color-bg3)' : 'transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text2)',
        fontWeight: active ? 500 : 400,
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.12s',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
      }}
    >
      <Icon name={item.icon} size={15} color={active ? 'var(--color-accent)' : 'currentColor'} />
      {!collapsed && (
        <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: overdueCount > 0 ? 'var(--color-red)' : 'var(--color-bg3)',
            color: overdueCount > 0 ? '#fff' : 'var(--color-text3)',
            borderRadius: 99,
            padding: '0 6px',
            minWidth: 18,
            textAlign: 'center',
            lineHeight: 1.7,
          }}
        >
          {item.badge}
        </span>
      )}
      {collapsed && overdueCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: 99,
            background: 'var(--color-red)',
          }}
        />
      )}
    </div>
  )
}
