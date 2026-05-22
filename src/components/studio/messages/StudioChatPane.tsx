import { useEffect, useRef } from 'react'
import StudioAvatar from '../StudioAvatar'
import {
  mailtoGuestReply,
  parseGuestInquiryBody,
  telGuestLink,
  type StudioChatThread,
} from '../../../lib/studio-messages'
import { isWebsiteInquiryMessage } from '../../../lib/studio-service'
import type { StudioMessage } from '../../../types/studio'

interface StudioChatPaneProps {
  thread: StudioChatThread | null
  viewerId: string
  messageType: StudioMessage['message_type']
  body: string
  sending?: boolean
  showBack?: boolean
  onBack?: () => void
  onBodyChange: (v: string) => void
  onMessageTypeChange: (t: StudioMessage['message_type']) => void
  onSend: (e: React.FormEvent) => void
  /** Student portal: single thread with teacher, no type picker */
  composerMode?: 'teacher' | 'student'
}

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function StudioChatPane({
  thread,
  viewerId,
  messageType,
  body,
  sending,
  showBack,
  onBack,
  onBodyChange,
  onMessageTypeChange,
  onSend,
  composerMode = 'teacher',
}: StudioChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread?.id, thread?.messages.length])

  if (!thread) {
    return (
      <main className="studio-chat__pane studio-chat__pane--empty">
        <i className="bi bi-chat-dots" style={{ fontSize: '2.5rem', opacity: 0.35, marginBottom: '0.75rem' }} />
        <p style={{ margin: 0, fontWeight: 600 }}>Select a conversation</p>
        <p className="studio-subtext" style={{ marginTop: '0.35rem', maxWidth: 280 }}>
          Student chats, co-teacher messages, and website sign-up inquiries all appear here.
        </p>
      </main>
    )
  }

  const isGuest = thread.kind === 'guest'
  const anchor = isGuest ? thread.messages[0] : null
  const guestName = anchor ? thread.title : ''
  const guestEmail = thread.guestEmail?.trim()
  const guestPhone = thread.guestPhone?.trim()
  const inquiryText = anchor ? parseGuestInquiryBody(anchor.body) : ''

  return (
    <main className="studio-chat__pane">
      <header className="studio-chat__pane-head">
        {showBack ? (
          <button type="button" className="studio-chat__back" onClick={onBack} aria-label="Back to conversations">
            <i className="bi bi-chevron-left" />
          </button>
        ) : null}
        {isGuest ? (
          <div className="studio-chat__thread-avatar studio-chat__thread-avatar--guest" aria-hidden>
            <i className="bi bi-globe2" />
          </div>
        ) : (
          <StudioAvatar profile={thread.profile} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="studio-chat__pane-title">{thread.title}</h3>
          <p className="studio-chat__pane-sub">
            {isGuest ? (
              <>
                From landing page
                {guestEmail ? ` · ${guestEmail}` : ''}
              </>
            ) : (
              thread.subtitle
            )}
          </p>
        </div>
        {isGuest && guestEmail ? (
          <div className="studio-chat__guest-actions">
            <a href={mailtoGuestReply(guestEmail, guestName, inquiryText)} className="studio-btn studio-btn--primary" style={{ fontSize: '0.8rem' }}>
              <i className="bi bi-envelope" /> Email
            </a>
            {guestPhone ? (
              <a href={telGuestLink(guestPhone)} className="studio-btn studio-btn--outline" style={{ fontSize: '0.8rem' }}>
                <i className="bi bi-telephone" /> Call
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="studio-chat__messages" ref={scrollRef}>
        {thread.messages.length === 0 ? (
          <p className="studio-journal">No messages in this thread yet.</p>
        ) : (
          thread.messages.map((m) => {
            const isMine = Boolean(m.sender_id && m.sender_id === viewerId)
            const isInquiry = isWebsiteInquiryMessage(m)
            const bubbleText = isInquiry ? parseGuestInquiryBody(m.body) : m.body
            const senderLabel = isInquiry
              ? `${guestName}${guestEmail ? ` · ${guestEmail}` : ''}`
              : isMine
                ? 'You'
                : thread.title

            return (
              <div
                key={m.id}
                className={`studio-chat__bubble-row ${isMine ? 'studio-chat__bubble-row--mine' : 'studio-chat__bubble-row--theirs'}`}
              >
                <span className="studio-chat__bubble-meta">
                  {senderLabel} · {formatBubbleTime(m.created_at)}
                </span>
                <div
                  className={`studio-chat__bubble ${isMine ? 'studio-chat__bubble--mine' : 'studio-chat__bubble--theirs'} ${isInquiry ? 'studio-chat__bubble--inquiry' : ''}`}
                >
                  {isInquiry ? <span className="studio-chat__bubble-tag">Website inquiry</span> : null}
                  {!isInquiry && m.message_type !== 'chat' ? (
                    <span className="studio-badge" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.65rem' }}>
                      {m.message_type}
                    </span>
                  ) : null}
                  {bubbleText}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isGuest ? (
        <div className="studio-chat__guest-panel">
          <p>
            Replies are sent outside the app — use <strong>Email</strong> or <strong>Call</strong> to reach this person on
            your phone. Their message stays here for your records.
          </p>
          {guestEmail ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <a href={mailtoGuestReply(guestEmail, guestName, inquiryText)} className="studio-btn studio-btn--primary">
                <i className="bi bi-envelope" /> Reply by email
              </a>
              {guestPhone ? (
                <a href={telGuestLink(guestPhone)} className="studio-btn studio-btn--outline">
                  <i className="bi bi-telephone" /> Call {guestPhone}
                </a>
              ) : null}
              <button
                type="button"
                className="studio-btn studio-btn--ghost"
                onClick={() => navigator.clipboard?.writeText(guestEmail)}
              >
                <i className="bi bi-clipboard" /> Copy email
              </button>
            </div>
          ) : (
            <p className="studio-subtext" style={{ margin: 0 }}>No email on file for this inquiry.</p>
          )}
        </div>
      ) : (
        <form className="studio-chat__composer" onSubmit={onSend}>
          {composerMode === 'teacher' ? (
            <div className="studio-chat__composer-types">
              {(['chat', 'reminder', 'encouragement'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={messageType === t ? 'is-active' : ''}
                  onClick={() => onMessageTypeChange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}
          <div className="studio-chat__composer-row">
            <textarea
              className="studio-textarea"
              placeholder={composerMode === 'student' ? 'Message Mark…' : 'Write a message…'}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <button type="submit" className="studio-btn studio-btn--primary" disabled={sending || !body.trim()}>
              <i className="bi bi-send" />
            </button>
          </div>
        </form>
      )}
    </main>
  )
}
