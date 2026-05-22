import { useEffect, useMemo, useState } from 'react'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import NewChatModal from '../../../components/studio/messages/NewChatModal'
import StudioChatPane from '../../../components/studio/messages/StudioChatPane'
import StudioChatThreadList, { type ThreadFilter } from '../../../components/studio/messages/StudioChatThreadList'
import { useAuthStore } from '../../../store/auth'
import {
  buildStudioChatThreads,
  draftStudentThread,
  findThreadById,
} from '../../../lib/studio-messages'
import '../../../lib/studio-messages.css'
import {
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
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [messageType, setMessageType] = useState<StudioMessage['message_type']>('chat')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ThreadFilter>('all')
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowPane, setMobileShowPane] = useState(false)

  const threads = useMemo(
    () => (user?.id ? buildStudioChatThreads(user.id, messages, students) : []),
    [user?.id, messages, students]
  )

  const existingThreadIds = useMemo(() => new Set(threads.map((t) => t.id)), [threads])

  const selectedThread = useMemo(() => {
    const existing = findThreadById(threads, selectedThreadId)
    if (existing) return existing
    if (!selectedThreadId?.startsWith('user:')) return null
    const peerId = selectedThreadId.slice('user:'.length)
    const student = students.find((s) => s.user_id === peerId)
    return student ? draftStudentThread(student) : null
  }, [threads, selectedThreadId, students])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([fetchStudioMessages(user.id), fetchTeacherStudents(user.id, userRole)]).then(
      ([m, s]) => {
        setMessages(m)
        setStudents(s)
        setSelectedThreadId((current) => {
          if (current && buildStudioChatThreads(user.id, m, s).some((t) => t.id === current)) {
            return current
          }
          const built = buildStudioChatThreads(user.id, m, s)
          return built[0]?.id ?? null
        })
      }
    )
  }, [user?.id, userRole])

  useEffect(() => {
    if (!user?.id || !selectedThread) return
    selectedThread.messages.forEach((m) => {
      if (m.recipient_id === user.id && !m.read_at) markMessageRead(m.id)
    })
  }, [selectedThread, user?.id])

  const refreshMessages = async () => {
    if (!user?.id) return
    const updated = await fetchStudioMessages(user.id)
    setMessages(updated)
    return updated
  }

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId)
    setMobileShowPane(true)
  }

  const handleNewChatStart = (threadIds: string[]) => {
    if (threadIds.length === 0) return
    setSelectedThreadId(threadIds[0])
    setMobileShowPane(true)
    if (threadIds.length > 1) {
      setFilter('students')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !selectedThread || selectedThread.kind !== 'student' || !selectedThread.peerUserId) {
      return
    }
    if (!body.trim()) return
    const trimmed = body.trim()
    setSending(true)
    try {
      await sendStudioMessage({
        sender_id: user.id,
        recipient_id: selectedThread.peerUserId,
        body: trimmed,
        message_type: messageType,
      })
      markMessagingActivity()
      await notifyMessageReceived(selectedThread.peerUserId, userProfile, trimmed, 'student')
      setBody('')
      await refreshMessages()
    } finally {
      setSending(false)
    }
  }

  return (
    <MarkStudioLayout>
      <StudioPageHeader
        title="Messages"
        subtitle="Direct chats with students and inquiries from the website contact form."
      />

      <div className={`studio-chat ${mobileShowPane ? 'studio-chat--show-pane' : ''}`}>
        <StudioChatThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          filter={filter}
          search={search}
          onSelect={handleSelectThread}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onNewChat={() => setShowNewChat(true)}
        />

        <StudioChatPane
          thread={selectedThread}
          viewerId={user?.id ?? ''}
          messageType={messageType}
          body={body}
          sending={sending}
          showBack={mobileShowPane}
          onBack={() => setMobileShowPane(false)}
          onBodyChange={setBody}
          onMessageTypeChange={setMessageType}
          onSend={handleSend}
        />
      </div>

      {showNewChat ? (
        <NewChatModal
          students={students}
          existingThreadIds={existingThreadIds}
          onStart={handleNewChatStart}
          onClose={() => setShowNewChat(false)}
        />
      ) : null}
    </MarkStudioLayout>
  )
}
