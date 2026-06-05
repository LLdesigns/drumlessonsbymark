import { lazy } from 'react'

export const Home = lazy(() => import('../pages/Home'))
export const Login = lazy(() => import('../pages/Login'))
export const ChangePassword = lazy(() => import('../pages/ChangePassword'))
export const ResetPassword = lazy(() => import('../pages/ResetPassword'))
export const StudioAppEntry = lazy(() => import('../pages/StudioAppEntry'))
export const HelpCaptureShowcase = lazy(() => import('../pages/HelpCaptureShowcase'))

export const MarkDashboard = lazy(() => import('../pages/studio/mark/Dashboard'))
export const MarkStudents = lazy(() => import('../pages/studio/mark/Students'))
export const MarkStudentDetail = lazy(() => import('../pages/studio/mark/StudentDetail'))
export const MarkSchedule = lazy(() => import('../pages/studio/mark/Schedule'))
export const MarkMessages = lazy(() => import('../pages/studio/mark/Messages'))
export const MarkLessonPlanning = lazy(() => import('../pages/studio/mark/LessonPlanning'))
export const LessonBuilder = lazy(() => import('../pages/studio/mark/LessonBuilder'))
export const LegacyLessonBuilderRedirect = lazy(() =>
  import('../pages/studio/mark/LessonBuilder').then((m) => ({ default: m.LegacyLessonBuilderRedirect }))
)
export const AssignedLessonEdit = lazy(() => import('../pages/studio/mark/AssignedLessonEdit'))
export const LessonSession = lazy(() => import('../pages/studio/mark/LessonSession'))

export const StudentHome = lazy(() => import('../pages/studio/student/Home'))
export const StudentLessons = lazy(() => import('../pages/studio/student/StudentLessons'))
export const StudentLessonDetail = lazy(() => import('../pages/studio/student/StudentLessonDetail'))
export const StudentMessages = lazy(() => import('../pages/studio/student/Messages'))
export const StudentSchedule = lazy(() => import('../pages/studio/student/Schedule'))
export const StudentProgress = lazy(() => import('../pages/studio/student/Progress'))
