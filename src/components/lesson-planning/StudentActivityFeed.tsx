import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  buildLessonTitleMap,
  formatActivityEvent,
  formatRelativeTime,
  type ActivityFeedItem,
} from '../../lib/activity-feed'
import type { AssignedLesson, StudentActivityEvent } from '../../types/lesson-planning'

interface StudentActivityFeedProps {
  events: StudentActivityEvent[]
  lessons: AssignedLesson[]
  emptyMessage?: string
  limit?: number
}

export default function StudentActivityFeed({
  events,
  lessons,
  emptyMessage = 'No practice activity logged yet.',
  limit = 25,
}: StudentActivityFeedProps) {
  const titleMap = useMemo(() => buildLessonTitleMap(lessons), [lessons])

  const items: ActivityFeedItem[] = useMemo(
    () => events.slice(0, limit).map((e) => formatActivityEvent(e, titleMap)),
    [events, limit, titleMap]
  )

  if (items.length === 0) {
    return <p className="studio-subtext" style={{ margin: 0 }}>{emptyMessage}</p>
  }

  return (
    <ul className="studio-activity-feed">
      {items.map((item) => (
        <li key={item.id} className="studio-activity-feed__item">
          <span className="studio-activity-feed__icon" aria-hidden="true">
            <i className={`bi ${item.icon}`} />
          </span>
          <div className="studio-activity-feed__body">
            <p className="studio-activity-feed__label">{item.label}</p>
            {item.detail ? <p className="studio-activity-feed__detail">{item.detail}</p> : null}
            {item.lessonId ? (
              <Link
                to={`/studio/lesson-planning/assigned/${item.lessonId}`}
                className="studio-activity-feed__lesson-link"
              >
                {item.lessonTitle ?? 'View lesson'}
              </Link>
            ) : null}
          </div>
          <time className="studio-activity-feed__time" dateTime={item.occurredAt}>
            {formatRelativeTime(item.occurredAt)}
          </time>
        </li>
      ))}
    </ul>
  )
}
