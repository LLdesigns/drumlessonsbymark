import React from 'react'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

/**
 * Tabs - Tab navigation component
 * 
 * @example
 * <Tabs
 *   items={[
 *     { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
 *   ]}
 *   activeTab="tab1"
 *   onTabChange={setActiveTab}
 * />
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  className = ''
}) => {
  const activeTabData = items.find(item => item.id === activeTab) || items[0]

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border-default)'
      }}>
        {items.map((item) => {
          const isActive = item.id === activeTab
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                flex: 1,
                padding: 'var(--space-4)',
                background: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                transition: 'var(--transition-base)'
              }}
              aria-selected={isActive}
              role="tab"
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {activeTabData?.content}
      </div>
    </div>
  )
}

Tabs.displayName = 'Tabs'

