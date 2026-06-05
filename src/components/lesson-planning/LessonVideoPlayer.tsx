import { useCallback, useRef } from 'react'

interface LessonVideoPlayerProps {
  url: string
  embedUrl?: string | null
  title?: string
  onEngaged?: () => void
  onViewed?: () => void
}

const VIEW_THRESHOLD = 0.8

export default function LessonVideoPlayer({
  url,
  embedUrl,
  title = 'Lesson video',
  onEngaged,
  onViewed,
}: LessonVideoPlayerProps) {
  const viewedRef = useRef(false)
  const engagedRef = useRef(false)

  const markViewed = useCallback(() => {
    if (viewedRef.current) return
    viewedRef.current = true
    onViewed?.()
  }, [onViewed])

  const markEngaged = useCallback(() => {
    if (engagedRef.current) return
    engagedRef.current = true
    onEngaged?.()
  }, [onEngaged])

  if (embedUrl) {
    return (
      <div
        className="lesson-video-embed lesson-video-embed--trackable"
        onPointerDown={markEngaged}
        onFocus={markEngaged}
      >
        <iframe src={embedUrl} title={title} allowFullScreen />
        <p className="lesson-video-embed__hint studio-subtext">
          Watch the video, then check off the linked task when you are done.
        </p>
      </div>
    )
  }

  return (
    <video
      src={url}
      controls
      style={{ width: '100%', borderRadius: 8, marginTop: '0.5rem' }}
      onPlay={markEngaged}
      onEnded={markViewed}
      onTimeUpdate={(e) => {
        const el = e.currentTarget
        if (el.duration > 0 && el.currentTime / el.duration >= VIEW_THRESHOLD) {
          markViewed()
        }
      }}
    />
  )
}
