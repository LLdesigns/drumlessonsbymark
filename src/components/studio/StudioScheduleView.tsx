import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ScheduledLesson } from '../../types/studio'
import {
  WEEKDAYS,
  formatLessonDateLong,
  formatLessonTimeShort,
  getCalendarWeeks,
  getMonthLabel,
  groupLessonsByDay,
  isSameDay,
  lessonStatusClass,
  parseDateKey,
  startOfDay,
  toDateKey,
  toDatetimeLocalValue,
} from '../../lib/schedule-calendar'
import '../../lib/studio-schedule.css'

export type ScheduleViewMode = 'calendar' | 'list'

export interface ScheduleLessonLabel {
  lesson: ScheduledLesson
  primary: string
  secondary?: string
}

interface StudioScheduleViewProps {
  lessons: ScheduledLesson[]
  loading?: boolean
  variant: 'teacher' | 'student'
  getLessonLabel: (lesson: ScheduledLesson) => ScheduleLessonLabel
  onScheduleDay?: (startsAtLocal: string, date: Date) => void
  onCancelLesson?: (lessonId: string) => void
  onRescheduleLesson?: (lessonId: string, newStartsAtIso: string) => void
  onCompleteLesson?: (lessonId: string) => void
  emptyHint?: string
}

export default function StudioScheduleView({
  lessons,
  loading,
  variant,
  getLessonLabel,
  onScheduleDay,
  onCancelLesson,
  onRescheduleLesson,
  onCompleteLesson,
  emptyHint = 'Your calendar is open — pick a day or add a lesson.',
}: StudioScheduleViewProps) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('calendar')
  const [monthOffset, setMonthOffset] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => toDateKey(today))
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [rescheduleValue, setRescheduleValue] = useState('')
  const [mobileSheet, setMobileSheet] = useState<'closed' | 'day' | 'lesson'>('closed')
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const byDay = useMemo(() => groupLessonsByDay(lessons), [lessons])
  const weeks = useMemo(
    () => getCalendarWeeks(monthOffset.year, monthOffset.month),
    [monthOffset.year, monthOffset.month]
  )

  const selectedDate = parseDateKey(selectedDateKey)
  const selectedDayLessons = byDay.get(selectedDateKey) ?? []
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null

  const upcomingList = useMemo(() => {
    const now = Date.now()
    return [...lessons]
      .filter((l) => l.status !== 'cancelled' && new Date(l.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [lessons])

  const pastList = useMemo(() => {
    const now = Date.now()
    return [...lessons]
      .filter((l) => l.status === 'cancelled' || new Date(l.starts_at).getTime() < now)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .slice(0, 20)
  }, [lessons])

  const shiftMonth = (delta: number) => {
    setMonthOffset((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const goToday = () => {
    const n = new Date()
    setMonthOffset({ year: n.getFullYear(), month: n.getMonth() })
    setSelectedDateKey(toDateKey(today))
    setSelectedLessonId(null)
  }

  const closeMobileSheet = () => setMobileSheet('closed')

  const handleDayClick = (day: Date) => {
    setSelectedDateKey(toDateKey(day))
    setSelectedLessonId(null)
    setMobileSheet('closed')
  }

  const handleLessonClick = (lesson: ScheduledLesson, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedLessonId(lesson.id)
    setSelectedDateKey(toDateKey(new Date(lesson.starts_at)))
    setRescheduleValue(toDatetimeLocalValue(new Date(lesson.starts_at)))
    if (isNarrow) setMobileSheet('lesson')
  }

  const openDaySheet = () => {
    if (isNarrow) setMobileSheet('day')
  }

  const scheduleSelectedDay = () => {
    if (!onScheduleDay) return
    onScheduleDay(toDatetimeLocalValue(selectedDate), selectedDate)
    closeMobileSheet()
  }

  const renderLessonChip = (lesson: ScheduledLesson) => {
    const { primary } = getLessonLabel(lesson)
    const time = formatLessonTimeShort(lesson.starts_at)
    return (
      <button
        key={lesson.id}
        type="button"
        className={`studio-schedule-lesson ${lessonStatusClass(lesson.status)} ${
          selectedLessonId === lesson.id ? 'studio-schedule-lesson--selected' : ''
        }`}
        onClick={(e) => handleLessonClick(lesson, e)}
        title={`${time} — ${primary}`}
      >
        {time} {primary}
      </button>
    )
  }

  const detailPanel = () => {
    if (selectedLesson) {
      const label = getLessonLabel(selectedLesson)
      const isPast = new Date(selectedLesson.starts_at) < new Date()
      const canEdit = variant === 'teacher' && selectedLesson.status === 'scheduled' && !isPast

      return (
        <div>
          <p className="studio-label" style={{ marginBottom: '0.35rem' }}>
            Lesson details
          </p>
          <h3 className="studio-heading" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {label.primary}
          </h3>
          <p className="studio-subtext" style={{ marginBottom: '0.5rem' }}>
            {formatLessonDateLong(selectedLesson.starts_at)}
          </p>
          <p className="studio-subtext">
            {selectedLesson.duration_minutes} minutes
            {selectedLesson.location ? ` · ${selectedLesson.location}` : ''}
          </p>
          {selectedLesson.is_recurring ? (
            <span className="studio-badge" style={{ marginTop: '0.5rem' }}>
              Recurring{selectedLesson.recurrence_rule ? ` · ${selectedLesson.recurrence_rule}` : ''}
            </span>
          ) : null}
          <span className="studio-badge" style={{ marginLeft: '0.35rem' }}>
            {selectedLesson.status}
          </span>
          {selectedLesson.notes ? (
            <p className="studio-journal" style={{ marginTop: '0.75rem' }}>
              {selectedLesson.notes}
            </p>
          ) : null}

          {canEdit && onRescheduleLesson ? (
            <div className="studio-schedule-reschedule">
              <span className="studio-label">Reschedule</span>
              <input
                className="studio-input"
                type="datetime-local"
                value={rescheduleValue}
                onChange={(e) => setRescheduleValue(e.target.value)}
              />
              <button
                type="button"
                className="studio-btn studio-btn--secondary"
                disabled={!rescheduleValue}
                onClick={() => {
                  onRescheduleLesson(selectedLesson.id, new Date(rescheduleValue).toISOString())
                  setSelectedLessonId(null)
                }}
              >
                Save new time
              </button>
            </div>
          ) : null}

          {variant === 'teacher' ? (
            <div className="studio-schedule-detail-actions">
              <Link
                to={`/studio/lesson-planning/session/${selectedLesson.id}`}
                className="studio-btn studio-btn--primary"
                style={{ width: '100%', marginBottom: '0.5rem', textAlign: 'center', textDecoration: 'none' }}
              >
                <i className="bi bi-journal-richtext" /> Open lesson session
              </Link>
              {canEdit && onCompleteLesson ? (
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  onClick={() => {
                    onCompleteLesson(selectedLesson.id)
                    setSelectedLessonId(null)
                  }}
                >
                  Mark completed
                </button>
              ) : null}
              {selectedLesson.status === 'scheduled' && onCancelLesson ? (
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  onClick={() => {
                    onCancelLesson(selectedLesson.id)
                    setSelectedLessonId(null)
                  }}
                >
                  Cancel lesson
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div>
        <p className="studio-label" style={{ marginBottom: '0.5rem' }}>
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {variant === 'teacher' && onScheduleDay ? (
          <button
            type="button"
            className="studio-btn studio-btn--primary"
            style={{ marginBottom: '0.75rem', width: '100%' }}
            onClick={() => onScheduleDay(toDatetimeLocalValue(selectedDate), selectedDate)}
          >
            <i className="bi bi-plus-lg" /> Schedule on this day
          </button>
        ) : null}
        {selectedDayLessons.length === 0 ? (
          <p className="studio-schedule-panel__empty">
            {variant === 'teacher' ? 'No lessons on this day yet.' : 'No lessons this day.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {selectedDayLessons.map((lesson) => {
              const label = getLessonLabel(lesson)
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    className="studio-schedule-list-item"
                    style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <div>
                      <strong>{formatLessonTimeShort(lesson.starts_at)}</strong>
                      <p className="studio-subtext" style={{ margin: '0.15rem 0 0' }}>
                        {label.primary}
                      </p>
                    </div>
                    <span className="studio-badge">{lesson.status}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const dayLessonCount = selectedDayLessons.filter((l) => l.status !== 'cancelled').length

  const mobileSheetVisible =
    isNarrow && mobileSheet !== 'closed' && (mobileSheet === 'lesson' ? Boolean(selectedLesson) : true)

  const renderMobileDayBar = () => (
    <div className="studio-card studio-schedule-day-bar">
      <div className="studio-schedule-day-bar__info">
        <p className="studio-schedule-day-bar__date">{selectedDateLabel}</p>
        <p className="studio-schedule-day-bar__meta">
          {dayLessonCount === 0
            ? variant === 'teacher'
              ? 'No lessons — tap + to schedule'
              : 'No lessons this day'
            : `${dayLessonCount} lesson${dayLessonCount === 1 ? '' : 's'}`}
        </p>
      </div>
      <div className="studio-schedule-day-bar__actions">
        {dayLessonCount > 0 ? (
          <button
            type="button"
            className="studio-schedule-day-bar__icon-btn"
            aria-label={`View ${dayLessonCount} lessons on this day`}
            onClick={openDaySheet}
          >
            <i className="bi bi-list-ul" />
          </button>
        ) : null}
        {variant === 'teacher' && onScheduleDay ? (
          <button
            type="button"
            className="studio-schedule-day-bar__icon-btn studio-schedule-day-bar__icon-btn--primary"
            aria-label="Schedule a lesson on this day"
            onClick={scheduleSelectedDay}
          >
            <i className="bi bi-plus-lg" />
          </button>
        ) : null}
      </div>
    </div>
  )

  const renderMobileSheet = () => {
    if (!mobileSheetVisible) return null
    const title =
      mobileSheet === 'lesson' && selectedLesson
        ? 'Lesson details'
        : selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })

    return (
      <div
        className="studio-schedule-mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-sheet-title"
        onClick={closeMobileSheet}
      >
        <div className="studio-schedule-mobile-sheet__panel" onClick={(e) => e.stopPropagation()}>
          <div className="studio-schedule-mobile-sheet__head">
            <h3 id="schedule-sheet-title">{title}</h3>
            <button
              type="button"
              className="studio-btn studio-btn--ghost"
              aria-label="Close"
              onClick={closeMobileSheet}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
          {detailPanel()}
        </div>
      </div>
    )
  }

  if (loading) {
    return <p className="studio-subtext">Loading schedule…</p>
  }

  return (
    <>
      <div className="studio-schedule-toolbar">
        <div className="studio-schedule-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            aria-pressed={viewMode === 'calendar'}
            onClick={() => setViewMode('calendar')}
          >
            <i className="bi bi-calendar3" /> Calendar
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <i className="bi bi-list-ul" /> List
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <div className="studio-schedule-month-nav">
            <button
              type="button"
              className="studio-btn studio-btn--ghost"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <i className="bi bi-chevron-left" />
            </button>
            <h3>{getMonthLabel(monthOffset.year, monthOffset.month)}</h3>
            <button
              type="button"
              className="studio-btn studio-btn--ghost"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <i className="bi bi-chevron-right" />
            </button>
            <button type="button" className="studio-btn studio-btn--ghost" onClick={goToday}>
              Today
            </button>
          </div>
        ) : null}
      </div>

      {viewMode === 'calendar' ? (
        <div className="studio-schedule-layout studio-schedule-layout--calendar">
          {renderMobileDayBar()}
          <section className="studio-card studio-schedule-calendar">
            <div className="studio-schedule-weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="studio-schedule-grid">
              {weeks.flat().map((day) => {
                const key = toDateKey(day)
                const inMonth = day.getMonth() === monthOffset.month
                const dayLessons = (byDay.get(key) ?? []).filter(
                  (l) => l.status !== 'cancelled' || selectedDateKey === key
                )
                const visible = dayLessons.slice(0, 2)
                const more = dayLessons.length - visible.length

                return (
                  <div
                    key={key + (inMonth ? '' : '-out')}
                    role="button"
                    tabIndex={0}
                    className={[
                      'studio-schedule-day',
                      !inMonth ? 'studio-schedule-day--outside' : '',
                      isSameDay(day, today) ? 'studio-schedule-day--today' : '',
                      key === selectedDateKey ? 'studio-schedule-day--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleDayClick(day)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleDayClick(day)
                      }
                    }}
                  >
                    <span className="studio-schedule-day__num">{day.getDate()}</span>
                    <div className="studio-schedule-day__lessons">
                      {visible.map((l) => renderLessonChip(l))}
                      {more > 0 ? (
                        <button
                          type="button"
                          className="studio-schedule-more"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDayClick(day)
                            openDaySheet()
                          }}
                        >
                          +{more} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="studio-card studio-schedule-panel">{detailPanel()}</aside>
          {renderMobileSheet()}
        </div>
      ) : (
        <div className="studio-schedule-layout studio-schedule-layout--list">
          <section className="studio-card">
            <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
              Upcoming
            </h3>
            {upcomingList.length === 0 ? (
              <p className="studio-journal">{emptyHint}</p>
            ) : (
              upcomingList.map((lesson) => {
                const label = getLessonLabel(lesson)
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`studio-schedule-list-item ${
                      selectedLessonId === lesson.id ? 'studio-schedule-list-item--selected' : ''
                    }`}
                    style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <div>
                      <strong>{label.primary}</strong>
                      <p className="studio-subtext">{formatLessonDateLong(lesson.starts_at)}</p>
                      {lesson.location ? <p className="studio-subtext">{lesson.location}</p> : null}
                    </div>
                    {lesson.is_recurring ? <span className="studio-badge">Recurring</span> : null}
                  </button>
                )
              })
            )}
          </section>

          <aside className="studio-card studio-schedule-panel">{detailPanel()}</aside>
          {renderMobileSheet()}

          {pastList.length > 0 ? (
            <section className="studio-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="studio-heading studio-heading--md" style={{ marginBottom: '0.75rem' }}>
                Past & cancelled
              </h3>
              {pastList.map((lesson) => {
                const label = getLessonLabel(lesson)
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className="studio-schedule-list-item"
                    style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                    onClick={() => {
                      handleLessonClick(lesson)
                      if (isNarrow) setMobileSheet('lesson')
                    }}
                  >
                    <div>
                      <strong>{label.primary}</strong>
                      <p className="studio-subtext">{formatLessonDateLong(lesson.starts_at)}</p>
                    </div>
                    <span className="studio-badge">{lesson.status}</span>
                  </button>
                )
              })}
            </section>
          ) : null}
        </div>
      )}
    </>
  )
}
