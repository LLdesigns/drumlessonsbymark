import {
  displayName,
  isWebsiteInquiryMessage,
  websiteInquiryLabel,
} from './studio-service'
import type { StudioMessage, StudioStudent } from '../types/studio'
import type { UserProfile } from '../types/user'

export type StudioChatThreadKind = 'student' | 'guest'

export interface StudioChatThread {
  id: string
  kind: StudioChatThreadKind
  /** Student user id when kind === 'student' */
  peerUserId?: string
  /** Anchor inquiry message id when kind === 'guest' */
  inquiryId?: string
  title: string
  subtitle: string
  avatarIcon?: string
  profile?: UserProfile | null
  messages: StudioMessage[]
  lastMessageAt: string
  unreadCount: number
  guestEmail?: string | null
  guestPhone?: string | null
}

export function threadIdForStudent(userId: string): string {
  return `user:${userId}`
}

export function threadIdForGuestInquiry(messageId: string): string {
  return `guest:${messageId}`
}

export function parseGuestInquiryBody(body: string): string {
  const trimmed = body.trim()
  const marker = '\n\n'
  const idx = trimmed.indexOf(marker)
  if (idx === -1) return trimmed
  const afterHeader = trimmed.slice(idx + marker.length)
  const secondBreak = afterHeader.indexOf(marker)
  if (secondBreak === -1) return afterHeader.trim()
  return afterHeader.slice(secondBreak + marker.length).trim() || afterHeader.trim()
}

export function extractPhoneFromText(text: string): string | null {
  const labeled = text.match(/(?:phone|tel|mobile|call)\s*[:#]?\s*([+\d][\d\s().-]{6,})/i)
  if (labeled?.[1]) return labeled[1].replace(/\s+/g, ' ').trim()
  const loose = text.match(/(\+?\d[\d\s().-]{8,}\d)/)
  return loose?.[1]?.trim() ?? null
}

export function guestContactPhone(message: StudioMessage): string | null {
  if (message.guest_phone?.trim()) return message.guest_phone.trim()
  return extractPhoneFromText(message.body)
}

export function formatMessagePreview(message: StudioMessage, maxLen = 56): string {
  let text = message.body
  if (isWebsiteInquiryMessage(message)) {
    text = parseGuestInquiryBody(message.body)
  }
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen - 1)}…`
}

export function relativeThreadTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function countUnread(messages: StudioMessage[], viewerId: string): number {
  return messages.filter((m) => m.recipient_id === viewerId && !m.read_at).length
}

export function buildStudioChatThreads(
  viewerId: string,
  messages: StudioMessage[],
  students: StudioStudent[]
): StudioChatThread[] {
  const studentMap = new Map(students.map((s) => [s.user_id, s]))
  const byStudent = new Map<string, StudioMessage[]>()
  const guestThreads = new Map<string, StudioMessage[]>()

  for (const m of messages) {
    if (isWebsiteInquiryMessage(m) && m.recipient_id === viewerId) {
      const list = guestThreads.get(m.id) ?? []
      list.push(m)
      guestThreads.set(m.id, list)
      continue
    }
    if (isWebsiteInquiryMessage(m)) continue

    const peerId = m.sender_id === viewerId ? m.recipient_id : m.sender_id
    if (!peerId) continue
    const list = byStudent.get(peerId) ?? []
    list.push(m)
    byStudent.set(peerId, list)
  }

  const threads: StudioChatThread[] = []

  for (const [peerId, msgs] of byStudent) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const profile = studentMap.get(peerId) ?? sorted.find((m) => m.sender_id === peerId)?.sender ?? null
    const last = sorted[sorted.length - 1]
    threads.push({
      id: threadIdForStudent(peerId),
      kind: 'student',
      peerUserId: peerId,
      title: displayName(profile ?? undefined),
      subtitle: profile?.email ?? 'Student',
      profile,
      messages: sorted,
      lastMessageAt: last.created_at,
      unreadCount: countUnread(sorted, viewerId),
    })
  }

  for (const [inquiryId, msgs] of guestThreads) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const anchor = sorted[0]
    const name = websiteInquiryLabel(anchor)
    threads.push({
      id: threadIdForGuestInquiry(inquiryId),
      kind: 'guest',
      inquiryId,
      title: name,
      subtitle: anchor.guest_email ?? 'Website inquiry',
      avatarIcon: 'bi-globe2',
      profile: null,
      messages: sorted,
      lastMessageAt: anchor.created_at,
      unreadCount: countUnread(sorted, viewerId),
      guestEmail: anchor.guest_email,
      guestPhone: guestContactPhone(anchor),
    })
  }

  threads.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )

  return threads
}

export function findThreadById(threads: StudioChatThread[], id: string | null): StudioChatThread | null {
  if (!id) return null
  return threads.find((t) => t.id === id) ?? null
}

/** Open a student DM before the first message exists */
export function draftStudentThread(student: StudioStudent): StudioChatThread {
  return {
    id: threadIdForStudent(student.user_id),
    kind: 'student',
    peerUserId: student.user_id,
    title: displayName(student),
    subtitle: student.email ?? 'Student',
    profile: student,
    messages: [],
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  }
}

export function mailtoGuestReply(
  email: string,
  guestName: string,
  inquiryPreview?: string
): string {
  const subject = encodeURIComponent('Re: Drum lessons — Mark\'s Drum Studio')
  const body = encodeURIComponent(
    `Hi ${guestName},\n\nThanks for reaching out through drumlessonsbymark.com.\n\n${
      inquiryPreview ? `You wrote:\n"${inquiryPreview.slice(0, 200)}${inquiryPreview.length > 200 ? '…' : ''}"\n\n` : ''
    }`
  )
  return `mailto:${email}?subject=${subject}&body=${body}`
}

export function telGuestLink(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits}`
}
