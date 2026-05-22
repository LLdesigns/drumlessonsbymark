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
  /** Studio portal styling (scrollable tabs on mobile) */
  variant?: 'default' | 'studio'
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
  className = '',
  variant = 'default',
}) => {
  const activeTabData = items.find(item => item.id === activeTab) || items[0]
  const isStudio = variant === 'studio'

  return (
    <div className={isStudio ? `studio-tabs ${className}`.trim() : className}>
      <div
        className={isStudio ? 'studio-tabs__nav' : undefined}
        role="tablist"
        style={
          isStudio
            ? undefined
            : {
                display: 'flex',
                borderBottom: '1px solid var(--color-border-default)',
              }
        }
      >
        {items.map((item) => {
          const isActive = item.id === activeTab
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={isStudio ? `studio-tabs__tab${isActive ? ' studio-tabs__tab--active' : ''}` : undefined}
              style={
                isStudio
                  ? undefined
                  : {
                      flex: 1,
                      padding: 'var(--space-4)',
                      background: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                      border: 'none',
                      borderBottom: isActive
                        ? '2px solid var(--color-brand-primary)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: isActive
                        ? 'var(--font-weight-semibold)'
                        : 'var(--font-weight-normal)',
                      transition: 'var(--transition-base)',
                    }
              }
              aria-selected={isActive}
              role="tab"
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className={isStudio ? 'studio-tabs__panel' : undefined} role="tabpanel">
        {activeTabData?.content}
      </div>
    </div>
  )
}

Tabs.displayName = 'Tabs'

