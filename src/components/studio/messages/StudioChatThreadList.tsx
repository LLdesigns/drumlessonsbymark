import StudioAvatar from '../StudioAvatar'
import { formatMessagePreview, relativeThreadTime, type StudioChatThread } from '../../../lib/studio-messages'
import type { StudioMessage } from '../../../types/studio'

export type ThreadFilter = 'all' | 'students' | 'website'

interface StudioChatThreadListProps {
  threads: StudioChatThread[]
  selectedThreadId: string | null
  filter: ThreadFilter
  search: string
  onSelect: (threadId: string) => void
  onFilterChange: (filter: ThreadFilter) => void
  onSearchChange: (q: string) => void
  onNewChat: () => void
}

function matchesSearch(thread: StudioChatThread, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const hay = `${thread.title} ${thread.subtitle} ${formatMessagePreview(thread.messages[thread.messages.length - 1] as StudioMessage)}`.toLowerCase()
  return hay.includes(needle)
}

export default function StudioChatThreadList({
  threads,
  selectedThreadId,
  filter,
  search,
  onSelect,
  onFilterChange,
  onSearchChange,
  onNewChat,
}: StudioChatThreadListProps) {
  const filtered = threads.filter((t) => {
    if (filter === 'students' && t.kind !== 'student') return false
    if (filter === 'website' && t.kind !== 'guest') return false
    return matchesSearch(t, search)
  })

  return (
    <aside className="studio-chat__list">
      <div className="studio-chat__list-head">
        <h2>Messages</h2>
        <button type="button" className="studio-btn studio-btn--primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={onNewChat}>
          <i className="bi bi-plus-lg" /> New
        </button>
      </div>

      <div className="studio-chat__search">
        <input
          type="search"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      <div className="studio-chat__filters" role="tablist" aria-label="Filter conversations">
        {(
          [
            ['all', 'All'],
            ['students', 'Students'],
            ['website', 'Website'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`studio-chat__filter ${filter === key ? 'studio-chat__filter--active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="studio-chat__threads">
        {filtered.length === 0 ? (
          <p className="studio-subtext" style={{ padding: '0.75rem 0.5rem', margin: 0 }}>
            {search.trim() ? 'No matches.' : 'No conversations yet. Start a new chat with a student.'}
          </p>
        ) : (
          filtered.map((thread) => {
            const last = thread.messages[thread.messages.length - 1]
            const preview = last
              ? formatMessagePreview(last)
              : thread.kind === 'guest'
                ? 'Website inquiry'
                : 'Start a conversation'
            return (
              <button
                key={thread.id}
                type="button"
                className={`studio-chat__thread ${selectedThreadId === thread.id ? 'studio-chat__thread--active' : ''}`}
                onClick={() => onSelect(thread.id)}
              >
                {thread.kind === 'guest' ? (
                  <div className="studio-chat__thread-avatar studio-chat__thread-avatar--guest" aria-hidden>
                    <i className={`bi ${thread.avatarIcon ?? 'bi-globe2'}`} />
                  </div>
                ) : (
                  <StudioAvatar profile={thread.profile} size="md" />
                )}
                <div className="studio-chat__thread-body">
                  <div className="studio-chat__thread-top">
                    <span className="studio-chat__thread-name">
                      {thread.title}
                      {thread.kind === 'guest' ? (
                        <span className="studio-badge" style={{ marginLeft: '0.35rem', fontSize: '0.6rem' }}>
                          Website
                        </span>
                      ) : null}
                    </span>
                    <span className="studio-chat__thread-time">{relativeThreadTime(thread.lastMessageAt)}</span>
                  </div>
                  <p className="studio-chat__thread-preview">
                    {preview}
                    {thread.unreadCount > 0 ? (
                      <span className="studio-chat__thread-badge">{thread.unreadCount}</span>
                    ) : null}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
