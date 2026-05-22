import { useMemo, useState } from 'react'
import StudioAvatar from '../StudioAvatar'
import { useModalBodyLock } from '../../../hooks/useModalBodyLock'
import { displayName } from '../../../lib/studio-service'
import { threadIdForStudent } from '../../../lib/studio-messages'
import type { StudioStudent } from '../../../types/studio'

interface NewChatModalProps {
  students: StudioStudent[]
  existingThreadIds: Set<string>
  onStart: (threadIds: string[]) => void
  onClose: () => void
}

export default function NewChatModal({
  students,
  existingThreadIds,
  onStart,
  onClose,
}: NewChatModalProps) {
  useModalBodyLock(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const name = displayName(s).toLowerCase()
      const email = (s.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [students, search])

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleStart = () => {
    const ids = [...selected].map((uid) => threadIdForStudent(uid))
    if (ids.length === 0) return
    onStart(ids)
    onClose()
  }

  return (
    <div
      className="studio-app studio-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-title"
      onClick={onClose}
    >
      <div className="studio-modal studio-modal--md studio-chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="studio-modal__header">
          <h2 id="new-chat-title" className="studio-modal__title">
            New message
          </h2>
          <button type="button" className="studio-modal__close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="studio-modal__body studio-chat-modal__body">
          <p className="studio-subtext studio-modal__intro" style={{ marginTop: 0 }}>
            Select one or more students. Each student gets their own conversation.
          </p>
          <input
            type="search"
            className="studio-input"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
          <div className="studio-chat-modal__list">
            {filtered.length === 0 ? (
              <p className="studio-subtext">
                {students.length === 0
                  ? 'Add students from the Students page first.'
                  : 'No students match your search.'}
              </p>
            ) : (
              filtered.map((s) => {
                const checked = selected.has(s.user_id)
                const hasThread = existingThreadIds.has(threadIdForStudent(s.user_id))
                return (
                  <label key={s.user_id} className="studio-chat-modal__pick">
                    <input type="checkbox" checked={checked} onChange={() => toggle(s.user_id)} />
                    <StudioAvatar profile={s} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block' }}>{displayName(s)}</strong>
                      <span className="studio-subtext" style={{ fontSize: '0.78rem' }}>
                        {s.email ?? 'Student'}
                        {hasThread ? ' · existing chat' : ''}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>
          <div className="studio-modal__actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="studio-btn studio-btn--primary"
              disabled={selected.size === 0}
              onClick={handleStart}
            >
              {selected.size <= 1 ? 'Open chat' : `Open ${selected.size} chats`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
