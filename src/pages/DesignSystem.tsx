import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { 
  TextField, 
  Textarea, 
  Button, 
  Card, 
  Badge, 
  Select 
} from '../components/ui'

const DesignSystem = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState<string>('colors')
  const [usageSections, setUsageSections] = useState<Record<string, boolean>>({})

  const toggleUsageSection = (sectionId: string) => {
    setUsageSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Redirect if not authenticated (admin only)
  if (!user) {
    navigate('/login')
    return null
  }

  const tabs = [
    { id: 'colors', label: 'Color' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shape', label: 'Shape' },
    { id: 'typography', label: 'Typography' },
    { id: 'components', label: 'Components' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      padding: 'var(--space-8)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: 'var(--space-8)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border-default)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)'
          }}>
            <div>
              <h1 style={{
                margin: 0,
                color: 'var(--color-brand-primary)',
                fontSize: 'var(--font-size-6xl)',
                fontFamily: 'var(--font-family-display)'
              }}>
                Design System
              </h1>
              <p style={{
                margin: 'var(--space-2) 0 0 0',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)'
              }}>
                Complete component library and design tokens reference
              </p>
            </div>
            <Link to="/admin/dashboard">
              <Button variant="secondary">
                ← Back to Admin
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-6)'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                style={{
                  background: selectedTab === tab.id 
                    ? 'var(--color-brand-primary)' 
                    : 'transparent',
                  color: selectedTab === tab.id 
                    ? 'var(--color-text-on-primary)' 
                    : 'var(--color-text-primary)',
                  border: `1px solid ${selectedTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
                  borderRadius: 'var(--radius-base)',
                  padding: 'var(--space-2) var(--space-4)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--font-size-base)',
                  transition: 'all var(--transition-base)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {/* Colors Section */}
          {selectedTab === 'colors' && (
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-4xl)',
                marginBottom: 'var(--space-6)',
                color: 'var(--color-brand-primary)'
              }}>
                Color Palette
              </h2>

              <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                {/* Brand Colors */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Brand Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <div style={{
                        background: 'var(--color-brand-primary)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Primary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-brand-primary</code><br/>
                        #ffb800
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-brand-primary-hover)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Primary Hover</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-brand-primary-hover</code><br/>
                        #e6a700
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-brand-secondary)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Secondary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-brand-secondary</code><br/>
                        #1a0a3c
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-brand-tertiary)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Tertiary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-brand-tertiary</code><br/>
                        #2a174d
                      </div>
                    </div>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('brand-colors')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['brand-colors'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['brand-colors'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['brand-colors'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.button-primary {
  background: var(--color-brand-primary);
}

.button-primary:hover {
  background: var(--color-brand-primary-hover);
}`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Background Colors */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Background Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border-default)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Primary BG</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-primary</code><br/>
                        #0a071a
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Secondary BG</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-secondary</code><br/>
                        #1a0a3c
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border-default)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Tertiary BG</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-tertiary</code><br/>
                        #2a174d
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-input)',
                        border: '1px solid var(--color-border-default)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Input BG</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-input</code><br/>
                        #060111
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-overlay)',
                        border: '1px solid var(--color-border-default)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'var(--color-bg-primary)',
                          opacity: 0.5
                        }}></div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Overlay</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-overlay</code><br/>
                        rgba(255, 255, 255, 0.01)
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-input-error)',
                        border: '1px solid var(--color-error)',
                        height: '100px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Input Error BG</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-bg-input-error</code><br/>
                        rgba(255, 107, 107, 0.1)
                      </div>
                    </div>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('background-colors')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['background-colors'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['background-colors'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['background-colors'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.page-container {
  background: var(--color-bg-primary);
}

.card {
  background: var(--color-bg-secondary);
}

.input-field {
  background: var(--color-bg-input);
}

.input-field.error {
  background: var(--color-bg-input-error);
}`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Text Colors */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Text Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}>
                          Primary Text
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Primary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-text-primary</code><br/>
                        #f7f7fa
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
                          Secondary Text
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Secondary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-text-secondary</code><br/>
                        rgba(247, 247, 250, 0.7)
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-base)' }}>
                          Tertiary Text
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Tertiary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-text-tertiary</code><br/>
                        rgba(247, 247, 250, 0.5)
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-brand-primary)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <div style={{ color: 'var(--color-text-on-primary)', fontSize: 'var(--font-size-base)' }}>
                          On Primary
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>On Primary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-text-on-primary</code><br/>
                        #181818
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border-default)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <div style={{ color: 'var(--color-text-on-dark)', fontSize: 'var(--font-size-base)' }}>
                          On Dark
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>On Dark</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-text-on-dark</code><br/>
                        #fff
                      </div>
                    </div>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('text-colors')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['text-colors'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['text-colors'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['text-colors'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.heading {
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-secondary);
}

.caption {
  color: var(--color-text-tertiary);
}

.button-text {
  color: var(--color-text-on-primary);
}`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Border Colors */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Border Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: 'var(--border-width-base) solid var(--color-border-default)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Default</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-border-default</code><br/>
                        #2a174d
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: 'var(--border-width-base) solid var(--color-border-focus)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Focus</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-border-focus</code><br/>
                        #EFCC18
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: 'var(--border-width-base) solid var(--color-border-error)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Error</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-border-error</code><br/>
                        #ff6b6b
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: 'var(--border-width-base) solid var(--color-border-primary)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Primary</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-border-primary</code><br/>
                        #ffb800
                      </div>
                    </div>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('border-colors')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['border-colors'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['border-colors'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['border-colors'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.input {
  border: var(--border-width-base) solid var(--color-border-default);
}

.input:focus {
  border-color: var(--color-border-focus);
}

.input.error {
  border-color: var(--color-border-error);
}`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Semantic Colors */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Semantic Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <div style={{
                        background: 'var(--color-success)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Success</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-success</code><br/>
                        #22c55e
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-success-light)',
                        border: '1px solid var(--color-success)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Success Light</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-success-light</code>
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-warning)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Warning</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-warning</code><br/>
                        #f59e0b
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-warning-light)',
                        border: '1px solid var(--color-warning)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Warning Light</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-warning-light</code>
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-error)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Error</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-error</code><br/>
                        #ff6b6b
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-error-light)',
                        border: '1px solid var(--color-error)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Error Light</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-error-light</code>
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-info)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Info</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-info</code><br/>
                        #3b82f6
                      </div>
                    </div>
                    <div>
                      <div style={{
                        background: 'var(--color-info-light)',
                        border: '1px solid var(--color-info)',
                        height: '80px',
                        borderRadius: 'var(--radius-base)',
                        marginBottom: 'var(--space-2)'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Info Light</strong><br/>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>--color-info-light</code>
                      </div>
                    </div>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('semantic-colors')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['semantic-colors'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['semantic-colors'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['semantic-colors'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.alert-success {
  background: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success);
}

.alert-error {
  background: var(--color-error-light);
  border-color: var(--color-error);
  color: var(--color-error);
}`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>
              </div>
            </section>
          )}

          {/* Spacing Section */}
          {selectedTab === 'spacing' && (
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-4xl)',
                marginBottom: 'var(--space-6)',
                color: 'var(--color-brand-primary)'
              }}>
                Spacing
              </h2>
              <p style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--font-size-lg)'
              }}>
                Consistent spacing scale for margins, padding, and gaps throughout the application.
              </p>

              <Card padding="lg">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 'var(--space-4)'
                }}>
                  {[
                    { token: 'space-0', value: '0', px: '0px', desc: 'No spacing' },
                    { token: 'space-1', value: '0.25rem', px: '4px', desc: 'Minimal spacing' },
                    { token: 'space-2', value: '0.5rem', px: '8px', desc: 'Tight spacing' },
                    { token: 'space-3', value: '0.75rem', px: '12px', desc: 'Compact spacing' },
                    { token: 'space-4', value: '1rem', px: '16px', desc: 'Base spacing' },
                    { token: 'space-5', value: '1.25rem', px: '20px', desc: '' },
                    { token: 'space-6', value: '1.5rem', px: '24px', desc: 'Comfortable spacing' },
                    { token: 'space-8', value: '2rem', px: '32px', desc: 'Section spacing' },
                    { token: 'space-10', value: '2.5rem', px: '40px', desc: '' },
                    { token: 'space-12', value: '3rem', px: '48px', desc: 'Large spacing' },
                    { token: 'space-16', value: '4rem', px: '64px', desc: 'XL spacing' },
                    { token: 'space-20', value: '5rem', px: '80px', desc: 'XXL spacing' },
                    { token: 'space-24', value: '6rem', px: '96px', desc: 'Maximum spacing' }
                  ].map((item) => (
                    <div key={item.token} style={{
                      background: 'var(--color-bg-secondary)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-base)',
                      border: '1px solid var(--color-border-default)'
                    }}>
                      <div style={{
                        background: 'var(--color-brand-primary)',
                        height: `var(--${item.token})`,
                        marginBottom: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '4px'
                      }}></div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-1)' }}>
                          {item.token}
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>
                          {item.value}
                        </div>
                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                          {item.px}
                        </div>
                        {item.desc && (
                          <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
                            {item.desc}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="lg" style={{ marginTop: 'var(--space-6)' }}>
                <button
                  onClick={() => toggleUsageSection('spacing')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: usageSections['spacing'] ? 'var(--space-4)' : 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}
                >
                  <h3 style={{ margin: 0 }}>Usage</h3>
                  <i className={`bi ${usageSections['spacing'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                </button>
                {usageSections['spacing'] && (
                  <div style={{
                    background: 'var(--color-bg-input)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-base)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.component {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  gap: var(--space-2);
}`}
                    </pre>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* Shape Section */}
          {selectedTab === 'shape' && (
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-4xl)',
                marginBottom: 'var(--space-6)',
                color: 'var(--color-brand-primary)'
              }}>
                Shape
              </h2>
              <p style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--font-size-lg)'
              }}>
                Border radius and border width tokens for consistent component shapes.
              </p>

              <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                {/* Border Radius */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Border Radius</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    {[
                      { token: 'radius-none', value: '0', px: '0px' },
                      { token: 'radius-sm', value: '0.125rem', px: '2px' },
                      { token: 'radius-md', value: '0.375rem', px: '6px' },
                      { token: 'radius-base', value: '0.5rem', px: '8px', desc: 'Default for buttons, inputs' },
                      { token: 'radius-lg', value: '0.75rem', px: '12px' },
                      { token: 'radius-xl', value: '1rem', px: '16px' },
                      { token: 'radius-2xl', value: '1.5rem', px: '24px' },
                      { token: 'radius-3xl', value: '2rem', px: '32px' },
                      { token: 'radius-full', value: '9999px', px: 'Full circle' }
                    ].map((item) => (
                      <div key={item.token}>
                        <div style={{
                          background: 'var(--color-brand-primary)',
                          height: '80px',
                          borderRadius: `var(--${item.token})`,
                          marginBottom: 'var(--space-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-on-primary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          Sample
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                            {item.token}
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>
                            {item.value}
                          </div>
                          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                            {item.px}
                          </div>
                          {item.desc && (
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Border Width */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Border Width</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    {[
                      { token: 'border-width-none', value: '0', px: '0px' },
                      { token: 'border-width-thin', value: '1px', px: '1px' },
                      { token: 'border-width-base', value: '2px', px: '2px', desc: 'Default for inputs' },
                      { token: 'border-width-thick', value: '3px', px: '3px' },
                      { token: 'border-width-thicker', value: '4px', px: '4px' }
                    ].map((item) => (
                      <div key={item.token}>
                        <div style={{
                          background: 'var(--color-bg-secondary)',
                          border: `var(--${item.token}) solid var(--color-brand-primary)`,
                          height: '60px',
                          borderRadius: 'var(--radius-base)',
                          marginBottom: 'var(--space-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          Border
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                            {item.token}
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>
                            {item.value}
                          </div>
                          {item.desc && (
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Shadows */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Shadows</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    {[
                      { token: 'shadow-none', value: 'none', desc: 'No shadow' },
                      { token: 'shadow-sm', value: '0 2px 8px rgba(0, 0, 0, 0.08)', desc: 'Small shadow' },
                      { token: 'shadow-md', value: '0 4px 12px rgba(0, 0, 0, 0.1)', desc: 'Medium shadow' },
                      { token: 'shadow-lg', value: '0 8px 24px rgba(0, 0, 0, 0.12)', desc: 'Large shadow' },
                      { token: 'shadow-xl', value: '0 12px 48px rgba(0, 0, 0, 0.15)', desc: 'Extra large shadow' },
                      { token: 'shadow-primary', value: '0 2px 8px rgba(255, 184, 0, 0.08)', desc: 'Primary color shadow' }
                    ].map((item) => (
                      <div key={item.token}>
                        <div style={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border-default)',
                          height: '80px',
                          borderRadius: 'var(--radius-base)',
                          marginBottom: 'var(--space-2)',
                          boxShadow: `var(--${item.token})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          Shadow
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                            {item.token}
                          </div>
                          {item.desc && (
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Transitions */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Transitions</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    {[
                      { token: 'transition-fast', value: '0.15s ease-in-out', desc: 'Fast transitions' },
                      { token: 'transition-base', value: '0.2s ease-in-out', desc: 'Base transitions (default)' },
                      { token: 'transition-slow', value: '0.3s ease-in-out', desc: 'Slow transitions' },
                      { token: 'transition-slower', value: '0.5s ease-in-out', desc: 'Slower transitions' }
                    ].map((item) => (
                      <div key={item.token}>
                        <div style={{
                          background: 'var(--color-brand-primary)',
                          height: '80px',
                          borderRadius: 'var(--radius-base)',
                          marginBottom: 'var(--space-2)',
                          transition: `all var(--${item.token})`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-on-primary)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        >
                          Hover Me
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                            {item.token}
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>
                            {item.value}
                          </div>
                          {item.desc && (
                            <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Usage Example */}
                <Card padding="lg">
                  <button
                    onClick={() => toggleUsageSection('shape')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: usageSections['shape'] ? 'var(--space-4)' : 0,
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Usage</h3>
                    <i className={`bi ${usageSections['shape'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                  </button>
                  {usageSections['shape'] && (
                    <div style={{
                      background: 'var(--color-bg-input)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-base)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--font-size-sm)',
                      overflow: 'auto'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.button {
  border-radius: var(--radius-base);
  border: var(--border-width-base) solid var(--color-border-default);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
}

.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transition: var(--transition-fast);
}`}
                      </pre>
                    </div>
                  )}
                </Card>
              </div>
            </section>
          )}

          {/* Typography Section */}
          {selectedTab === 'typography' && (
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-4xl)',
                marginBottom: 'var(--space-6)',
                color: 'var(--color-brand-primary)'
              }}>
                Typography
              </h2>

              <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Font Families</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Display (Jost)
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: 'var(--font-size-4xl)'
                      }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Body (Jost)
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: 'var(--font-size-base)'
                      }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Button (Montserrat)
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-button)',
                        fontSize: 'var(--font-size-base)'
                      }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Accent (Unbounded - 300)
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-accent)',
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-light)'
                      }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Font Sizes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)' }}>XS: 0.75rem (12px)</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>SM: 0.875rem (14px)</div>
                    <div style={{ fontSize: 'var(--font-size-base)' }}>Base: 1rem (16px)</div>
                    <div style={{ fontSize: 'var(--font-size-lg)' }}>LG: 1.1rem (17.6px)</div>
                    <div style={{ fontSize: 'var(--font-size-xl)' }}>XL: 1.15rem (18.4px)</div>
                    <div style={{ fontSize: 'var(--font-size-2xl)' }}>2XL: 1.2rem (19.2px)</div>
                    <div style={{ fontSize: 'var(--font-size-3xl)' }}>3XL: 1.5rem (24px)</div>
                    <div style={{ fontSize: 'var(--font-size-4xl)' }}>4XL: 1.6rem (25.6px)</div>
                    <div style={{ fontSize: 'var(--font-size-5xl)' }}>5XL: 2rem (32px)</div>
                    <div style={{ fontSize: 'var(--font-size-6xl)' }}>6XL: 2.2rem (35.2px)</div>
                    <div style={{ fontSize: 'var(--font-size-7xl)' }}>7XL: 2.4rem (38.4px)</div>
                    <div style={{ fontSize: 'var(--font-size-8xl)' }}>8XL: 4rem (64px)</div>
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Font Weights</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ fontWeight: 'var(--font-weight-light)' }}>Light (300)</div>
                    <div style={{ fontWeight: 'var(--font-weight-normal)' }}>Normal (400)</div>
                    <div style={{ fontWeight: 'var(--font-weight-medium)' }}>Medium (500)</div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Semibold (600)</div>
                    <div style={{ fontWeight: 'var(--font-weight-bold)' }}>Bold (700)</div>
                    <div style={{ fontWeight: 'var(--font-weight-black)' }}>Black (900)</div>
                  </div>
                </Card>

                {/* Typography Usage */}
                <Card padding="lg">
                  <button
                    onClick={() => toggleUsageSection('typography')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: usageSections['typography'] ? 'var(--space-4)' : 0,
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Usage</h3>
                    <i className={`bi ${usageSections['typography'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                  </button>
                  {usageSections['typography'] && (
                    <div style={{
                      background: 'var(--color-bg-input)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-base)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--font-size-sm)',
                      overflow: 'auto'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`.heading {
  font-family: var(--font-family-display);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.body-text {
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
}

.button-text {
  font-family: var(--font-family-button);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}`}
                      </pre>
                    </div>
                  )}
                </Card>
              </div>
            </section>
          )}

          {/* Components Section */}
          {selectedTab === 'components' && (
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-4xl)',
                marginBottom: 'var(--space-6)',
                color: 'var(--color-brand-primary)'
              }}>
                Components
              </h2>

              <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
                {/* Buttons */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Buttons</h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    alignItems: 'center'
                  }}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="tertiary">Tertiary</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                    <Button variant="primary" loading>Loading</Button>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    alignItems: 'center',
                    marginTop: 'var(--space-4)'
                  }}>
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('buttons')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['buttons'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['buttons'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['buttons'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { Button } from './ui'

<Button variant="primary">Submit</Button>
<Button variant="secondary" size="lg">Cancel</Button>
<Button variant="tertiary" disabled>Disabled</Button>
<Button variant="primary" loading>Processing...</Button>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Text Fields */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Text Fields</h3>
                  <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '500px' }}>
                    <TextField
                      name="basic"
                      placeholder="Basic text field"
                    />
                    <TextField
                      name="with-label"
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                    <TextField
                      name="with-error"
                      label="With Error"
                      placeholder="This field has an error"
                      error="This field is required"
                    />
                    <TextField
                      name="with-helper"
                      label="With Helper Text"
                      placeholder="Enter your name"
                      helperText="This is helper text"
                    />
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('text-fields')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['text-fields'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['text-fields'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['text-fields'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { TextField } from './ui'

<TextField
  name="email"
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
/>

<TextField
  name="username"
  label="Username"
  error="Username is required"
  helperText="Choose a unique username"
/>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Textarea */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Textarea</h3>
                  <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '500px' }}>
                    <Textarea
                      name="basic-textarea"
                      placeholder="Basic textarea"
                      rows={4}
                      size="md"
                    />
                    <Textarea
                      name="textarea-with-label"
                      label="Message"
                      placeholder="Enter your message"
                      rows={5}
                      helperText="Minimum 10 characters"
                      size="md"
                    />
                  </div>
                  <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Size Variants</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '500px' }}>
                    <Textarea
                      name="textarea-sm"
                      placeholder="Small textarea"
                      rows={3}
                      size="sm"
                    />
                    <Textarea
                      name="textarea-md"
                      placeholder="Medium textarea (default)"
                      rows={4}
                      size="md"
                    />
                    <Textarea
                      name="textarea-lg"
                      placeholder="Large textarea"
                      rows={5}
                      size="lg"
                    />
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('textarea')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['textarea'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['textarea'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['textarea'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { Textarea } from './ui'

<Textarea
  name="message"
  label="Message"
  placeholder="Enter your message"
  rows={5}
  size="md"
  helperText="Minimum 10 characters"
/>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Select */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Select</h3>
                  <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '500px' }}>
                    <Select
                      name="basic-select"
                      label="Status (Primary)"
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'pending', label: 'Pending' }
                      ]}
                    />
                    <Select
                      name="secondary-select"
                      label="Status (Secondary)"
                      variant="secondary"
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'pending', label: 'Pending' }
                      ]}
                    />
                    <Select
                      name="select-with-error"
                      label="Category"
                      error="Please select a category"
                      options={[
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' }
                      ]}
                    />
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('select')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['select'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['select'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['select'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { Select } from './ui'

<Select
  name="status"
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
  variant="secondary"
/>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Badges */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Badges</h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    alignItems: 'center'
                  }}>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    alignItems: 'center',
                    marginTop: 'var(--space-4)'
                  }}>
                    <Badge variant="primary" size="sm">Small</Badge>
                    <Badge variant="primary" size="md">Medium</Badge>
                    <Badge variant="primary" size="lg">Large</Badge>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('badges')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['badges'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['badges'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['badges'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { Badge } from './ui'

<Badge variant="primary">New</Badge>
<Badge variant="success" size="sm">Active</Badge>
<Badge variant="error">Error</Badge>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>

                {/* Cards */}
                <Card padding="lg">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Cards</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-4)'
                  }}>
                    <Card padding="md">
                      <h4 style={{ marginTop: 0 }}>Default Card</h4>
                      <p>Card content goes here</p>
                    </Card>
                    <Card padding="md" variant="outlined">
                      <h4 style={{ marginTop: 0 }}>Outlined Card</h4>
                      <p>Card with outline variant</p>
                    </Card>
                    <Card padding="md" variant="elevated">
                      <h4 style={{ marginTop: 0 }}>Elevated Card</h4>
                      <p>Card with elevation</p>
                    </Card>
                  </div>
                  
                  <Card padding="md" style={{ marginTop: 'var(--space-4)', background: 'var(--color-bg-secondary)' }}>
                    <button
                      onClick={() => toggleUsageSection('cards')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: usageSections['cards'] ? 'var(--space-3)' : 0,
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Usage</h4>
                      <i className={`bi ${usageSections['cards'] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                    {usageSections['cards'] && (
                      <div style={{
                        background: 'var(--color-bg-input)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import { Card } from './ui'

<Card padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

<Card padding="lg" variant="outlined">
  <h3>Outlined Card</h3>
</Card>`}
                        </pre>
                      </div>
                    )}
                  </Card>
                </Card>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}

export default DesignSystem

