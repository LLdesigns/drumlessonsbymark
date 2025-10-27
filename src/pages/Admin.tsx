import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'

interface ContactMessage {
  id: string
  first_name: string
  last_name: string
  email: string
  message: string
  created_at: string
  type: string
  read: boolean
}

const Admin = () => {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setMessages(data || [])
      setUnreadCount(data?.filter(msg => !msg.read).length || 0)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ read: true })
        .eq('id', messageId)

      if (error) throw error

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--primary-bg)',
        color: 'var(--primary-text)'
      }}>
        <div>Please log in to access the admin panel.</div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--primary-bg)', 
      color: 'var(--primary-text)',
      padding: '2rem'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--secondary)'
      }}>
        <h1 style={{ margin: 0, color: 'var(--primary)' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={fetchMessages}
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-bg)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              🔔
            </button>
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ff6b6b',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'var(--secondary)',
              color: 'var(--primary-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        <h2 style={{ marginBottom: '1.5rem' }}>Contact Messages ({messages.length})</h2>
        
        {loading ? (
          <div>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            background: 'var(--secondary-bg)',
            borderRadius: '8px'
          }}>
            No messages yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  background: message.read ? 'var(--secondary-bg)' : 'var(--tertiary)',
                  border: message.read ? '1px solid var(--secondary)' : '2px solid var(--primary)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => markAsRead(message.id)}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: message.read ? 'var(--primary-text)' : 'var(--primary)',
                    fontSize: '1.1rem'
                  }}>
                    {message.first_name} {message.last_name}
                  </h3>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--primary-text)',
                    opacity: 0.7
                  }}>
                    {new Date(message.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ 
                  color: 'var(--primary-text)',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  {message.email}
                </div>
                <div style={{ 
                  color: 'var(--primary-text)',
                  lineHeight: '1.5'
                }}>
                  {message.message}
                </div>
                {!message.read && (
                  <div style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-bg)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    display: 'inline-block',
                    marginTop: '0.5rem'
                  }}>
                    NEW
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Admin
