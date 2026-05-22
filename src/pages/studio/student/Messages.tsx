import { useEffect, useMemo, useState } from 'react'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import StudioChatPane from '../../../components/studio/messages/StudioChatPane'
import { useAuthStore } from '../../../store/auth'
import {
  fetchStudioMessages,
  getStudentTeacherId,
  markMessageRead,
  sendStudioMessage,
} from '../../../lib/studio-service'
import { notifyMessageReceived } from '../../../lib/notify-studio'
import { markMessagingActivity } from '../../../lib/pwa'
import type { StudioChatThread } from '../../../lib/studio-messages'
import '../../../lib/studio-messages.css'
import type { StudioMessage } from '../../../types/studio'

export default function StudentMessages() {
  const { user, userProfile } = useAuthStore()
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const tid = await getStudentTeacherId(user.id)
      setTeacherId(tid)
      setMessages(await fetchStudioMessages(user.id))
    }
    load()
  }, [user?.id])

  const threadMessages = useMemo(() => {
    if (!teacherId || !user?.id) return []
    return messages
      .filter(
        (m) =>
          (m.sender_id === user.id && m.recipient_id === teacherId) ||
          (m.sender_id === teacherId && m.recipient_id === user.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [messages, teacherId, user?.id])

  const thread: StudioChatThread | null = useMemo(() => {
    if (!teacherId) return null
    const last = threadMessages[threadMessages.length - 1]
    return {
      id: `user:${teacherId}`,
      kind: 'student',
      peerUserId: teacherId,
      title: 'Mark',
      subtitle: 'Your teacher',
      profile: null,
      messages: threadMessages,
      lastMessageAt: last?.created_at ?? new Date().toISOString(),
      unreadCount: threadMessages.filter((m) => m.recipient_id === user?.id && !m.read_at).length,
    }
  }, [teacherId, threadMessages, user?.id])

  useEffect(() => {
    if (!user?.id) return
    threadMessages.forEach((m) => {
      if (m.recipient_id === user.id && !m.read_at) markMessageRead(m.id)
    })
  }, [threadMessages, user?.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !teacherId || !body.trim()) return
    const trimmed = body.trim()
    setSending(true)
    try {
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
    } finally {
      setSending(false)
    }
  }

  return (
    <StudentStudioLayout>
      <StudioPageHeader title="Messages" subtitle="Chat with Mark — questions, updates, or scheduling." />

      <div className="studio-chat" style={{ gridTemplateColumns: '1fr' }}>
        <StudioChatPane
          thread={thread}
          viewerId={user?.id ?? ''}
          messageType="chat"
          body={body}
          sending={sending}
          onBodyChange={setBody}
          onMessageTypeChange={() => {}}
          onSend={handleSend}
          composerMode="student"
        />
      </div>
    </StudentStudioLayout>
  )
}
