import { useEffect, useMemo, useState } from 'react'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import { useAuthStore } from '../../../store/auth'
import {
  fetchStudioMessages,
  getStudentTeacherId,
  markMessageRead,
  sendStudioMessage,
} from '../../../lib/studio-service'
import { notifyMessageReceived } from '../../../lib/notify-studio'
import { markMessagingActivity } from '../../../lib/pwa'
import type { StudioMessage } from '../../../types/studio'

export default function StudentMessages() {
  const { user, userProfile } = useAuthStore()
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [body, setBody] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const tid = await getStudentTeacherId(user.id)
      setTeacherId(tid)
      setMessages(await fetchStudioMessages(user.id))
    }
    load()
  }, [user?.id])

  const thread = useMemo(() => {
    if (!teacherId || !user?.id) return []
    return messages.filter(
      (m) =>
        (m.sender_id === user.id && m.recipient_id === teacherId) ||
        (m.sender_id === teacherId && m.recipient_id === user.id)
    )
  }, [messages, teacherId, user?.id])

  useEffect(() => {
    if (!user?.id) return
    thread.forEach((m) => {
      if (m.recipient_id === user.id && !m.read_at) markMessageRead(m.id)
    })
  }, [thread, user?.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !teacherId || !body.trim()) return
    const trimmed = body.trim()
    await sendStudioMessage({
      sender_id: user.id,
      recipient_id: teacherId,
      body: trimmed,
      message_type: 'chat',
    })
    markMessagingActivity()
    await notifyMessageReceived(teacherId, userProfile, trimmed, 'studio')
    setBody('')
    setMessages(await fetchStudioMessages(user.id))
  }

  return (
    <StudentStudioLayout>
      <StudioPageHeader
        title="Messages"
        subtitle="Chat with Mark — questions, updates, or just saying hi."
      />

      <div className="studio-card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        {!teacherId ? (
          <p className="studio-subtext">Your teacher connection is being set up.</p>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', maxHeight: 360 }}>
              {thread.length === 0 ? (
                <p className="studio-journal">Say hello to Mark — he&apos;d love to hear from you.</p>
              ) : (
                thread.map((m) => {
                  const isMine = m.sender_id === user?.id
                  return (
                    <div key={m.id} style={{ textAlign: isMine ? 'right' : 'left', marginBottom: '0.65rem' }}>
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
                        {m.body}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            <form onSubmit={handleSend}>
              <textarea
                className="studio-textarea"
                placeholder="Message Mark..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
              <button type="submit" className="studio-btn studio-btn--primary" style={{ marginTop: '0.5rem' }}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </StudentStudioLayout>
  )
}
