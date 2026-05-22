import { useEffect, useMemo, useState } from 'react'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import {
  displayName,
  fetchStudioMessages,
  fetchTeacherStudents,
  markMessageRead,
  sendStudioMessage,
} from '../../../lib/studio-service'
import { notifyMessageReceived } from '../../../lib/notify-studio'
import { markMessagingActivity } from '../../../lib/pwa'
import type { StudioMessage, StudioStudent } from '../../../types/studio'

export default function MarkMessages() {
  const { user, userRole, userProfile } = useAuthStore()
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [messageType, setMessageType] = useState<StudioMessage['message_type']>('chat')

  useEffect(() => {
    if (!user?.id) return
    Promise.all([fetchStudioMessages(user.id), fetchTeacherStudents(user.id, userRole)]).then(([m, s]) => {
      setMessages(m)
      setStudents(s)
      if (s.length && !selectedStudentId) setSelectedStudentId(s[0].user_id)
    })
  }, [user?.id])

  const thread = useMemo(() => {
    if (!selectedStudentId || !user?.id) return []
    return messages.filter(
      (m) =>
        (m.sender_id === user.id && m.recipient_id === selectedStudentId) ||
        (m.sender_id === selectedStudentId && m.recipient_id === user.id)
    )
  }, [messages, selectedStudentId, user?.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !selectedStudentId || !body.trim()) return
    const trimmed = body.trim()
    await sendStudioMessage({
      sender_id: user.id,
      recipient_id: selectedStudentId,
      body: trimmed,
      message_type: messageType,
    })
    markMessagingActivity()
    await notifyMessageReceived(selectedStudentId, userProfile, trimmed, 'student')
    setBody('')
    const updated = await fetchStudioMessages(user.id)
    setMessages(updated)
  }

  useEffect(() => {
    if (!user?.id) return
    thread.forEach((m) => {
      if (m.recipient_id === user.id && !m.read_at) markMessageRead(m.id)
    })
  }, [thread, user?.id])

  const selectedStudent = students.find((s) => s.user_id === selectedStudentId)

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title="Messages"
        subtitle="Stay connected with students and parents — reminders, encouragement, and lesson follow-ups."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', minHeight: 420 }}>
        <aside className="studio-card" style={{ padding: '0.5rem' }}>
          {students.map((s) => (
            <button
              key={s.user_id}
              type="button"
              onClick={() => setSelectedStudentId(s.user_id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.65rem 0.75rem',
                border: 'none',
                borderRadius: 8,
                background: selectedStudentId === s.user_id ? 'var(--studio-accent-soft)' : 'transparent',
                color: 'var(--studio-text)',
                cursor: 'pointer',
                fontWeight: selectedStudentId === s.user_id ? 600 : 400,
              }}
            >
              {displayName(s)}
            </button>
          ))}
        </aside>

        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="studio-label" style={{ marginBottom: '0.75rem' }}>
            Conversation with {selectedStudent ? displayName(selectedStudent) : '…'}
          </p>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', maxHeight: 320 }}>
            {thread.length === 0 ? (
              <p className="studio-journal">Start the conversation — a quick note goes a long way.</p>
            ) : (
              thread.map((m) => {
                const isMine = m.sender_id === user?.id
                return (
                  <div
                    key={m.id}
                    style={{
                      textAlign: isMine ? 'right' : 'left',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        maxWidth: '85%',
                        padding: '0.6rem 0.9rem',
                        borderRadius: 12,
                        background: isMine ? 'var(--studio-accent-soft)' : 'var(--studio-bg)',
                        border: '1px solid var(--studio-border)',
                      }}
                    >
                      {m.message_type !== 'chat' ? (
                        <span className="studio-badge" style={{ marginRight: '0.35rem' }}>
                          {m.message_type}
                        </span>
                      ) : null}
                      {m.body}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={handleSend}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {(['chat', 'reminder', 'encouragement'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.75rem',
                    background: messageType === t ? 'var(--studio-accent-soft)' : undefined,
                  }}
                  onClick={() => setMessageType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              className="studio-textarea"
              placeholder="Write a message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
            <button type="submit" className="studio-btn studio-btn--primary" style={{ marginTop: '0.5rem' }}>
              Send
            </button>
          </form>
        </div>
      </div>
    </MarkStudioLayout>
  )
}
