import type { UserProfile } from '../../types/user'

interface StudioAvatarProps {
  profile?: UserProfile | null
  size?: 'md' | 'lg'
  fallback?: string
}

export default function StudioAvatar({ profile, size = 'md', fallback = '?' }: StudioAvatarProps) {
  const initials = profile
    ? [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join('') || fallback
    : fallback

  return (
    <div className={`studio-avatar ${size === 'lg' ? 'studio-avatar--lg' : ''}`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" />
      ) : (
        initials
      )}
    </div>
  )
}
