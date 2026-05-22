import { useEffect, useState } from 'react'
import StudentStudioLayout from '../../../components/layout/StudentStudioLayout'
import StudioPageHeader from '../../../components/studio/StudioPageHeader'
import StudioScheduleView from '../../../components/studio/StudioScheduleView'
import { useAuthStore } from '../../../store/auth'
import { fetchScheduledLessons } from '../../../lib/studio-service'
import type { ScheduledLesson } from '../../../types/studio'

export default function StudentSchedule() {
  const { user } = useAuthStore()
  const [lessons, setLessons] = useState<ScheduledLesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    fetchScheduledLessons(user.id, 'student').then((data) => {
      setLessons(data)
      setLoading(false)
    })
  }, [user?.id])

  return (
    <StudentStudioLayout>
      <StudioPageHeader
        title="Schedule"
        subtitle="Your lessons with Mark — browse by month or list."
      />

      <StudioScheduleView
        lessons={lessons}
        loading={loading}
        variant="student"
        getLessonLabel={(lesson) => ({
          lesson,
          primary: 'Lesson with Mark',
        })}
        emptyHint="No lessons on the calendar yet — Mark will add your next time here."
      />
    </StudentStudioLayout>
  )
}
