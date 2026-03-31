import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../../hooks/useMediaQuery'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui'

interface ChartDataPoint {
  date: string
  users: number
  teachers: number
  students: number
  courses: number
  enrollments: number
  completions: number
}

const Dashboard = () => {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalSongs: 0,
    activeEnrollments: 0,
    completedLessons: 0,
    publishedCourses: 0,
    loading: true
  })
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchChartData()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      // Fetch counts in parallel
      const [
        usersResult, 
        teachersResult, 
        studentsResult, 
        coursesResult,
        songsResult,
        enrollmentsResult,
        completionsResult,
        publishedCoursesResult
      ] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('songs').select('id', { count: 'exact', head: true }),
        supabase.from('student_course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('lesson_completions').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published')
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalSongs: songsResult.count || 0,
        activeEnrollments: enrollmentsResult.count || 0,
        completedLessons: completionsResult.count || 0,
        publishedCourses: publishedCoursesResult.count || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchChartData = async () => {
    try {
      setChartLoading(true)
      
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case 'all':
          startDate = new Date(0) // Beginning of time
          break
      }

      // Fetch all data with timestamps
      // For teachers and students, we need to join with profiles to get created_at
      const [usersData, teachersRoles, studentsRoles, coursesData, enrollmentsData, completionsData] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('user_roles').select('user_id').eq('role', 'teacher'),
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
        supabase.from('courses').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('student_course_enrollments').select('enrolled_at').gte('enrolled_at', startDate.toISOString()),
        supabase.from('lesson_completions').select('completed_at').gte('completed_at', startDate.toISOString())
      ])

      // Get teacher and student user IDs
      const teacherIds = teachersRoles.data?.map(r => r.user_id) || []
      const studentIds = studentsRoles.data?.map(r => r.user_id) || []

      // Fetch teacher and student profiles with created_at
      const [teachersData, studentsData] = await Promise.all([
        teacherIds.length > 0 
          ? supabase.from('profiles').select('created_at').in('user_id', teacherIds).gte('created_at', startDate.toISOString())
          : { data: [], error: null },
        studentIds.length > 0
          ? supabase.from('profiles').select('created_at').in('user_id', studentIds).gte('created_at', startDate.toISOString())
          : { data: [], error: null }
      ])

      // Group data by date
      const dateMap = new Map<string, ChartDataPoint>()

      // Helper function to add to date map
      const addToDate = (dateStr: string, key: Exclude<keyof ChartDataPoint, 'date'>) => {
        const date = new Date(dateStr).toISOString().split('T')[0]
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date: formatDateForChart(date),
            users: 0,
            teachers: 0,
            students: 0,
            courses: 0,
            enrollments: 0,
            completions: 0
          })
        }
        const entry = dateMap.get(date)!
        entry[key] = (entry[key] as number) + 1
      }

      // Process users
      usersData.data?.forEach(item => {
        addToDate(item.created_at, 'users')
      })

      // Process teachers
      teachersData.data?.forEach(item => {
        addToDate(item.created_at, 'teachers')
      })

      // Process students
      studentsData.data?.forEach(item => {
        addToDate(item.created_at, 'students')
      })

      // Process courses
      coursesData.data?.forEach(item => {
        addToDate(item.created_at, 'courses')
      })

      // Process enrollments
      enrollmentsData.data?.forEach(item => {
        addToDate(item.enrolled_at, 'enrollments')
      })

      // Process completions
      completionsData.data?.forEach(item => {
        addToDate(item.completed_at, 'completions')
      })

      // Convert to array and calculate cumulative values
      const sortedDates = Array.from(dateMap.entries()).sort((a, b) => 
        new Date(a[0]).getTime() - new Date(b[0]).getTime()
      )

      // Calculate cumulative values
      let cumulativeUsers = 0
      let cumulativeTeachers = 0
      let cumulativeStudents = 0
      let cumulativeCourses = 0

      const chartDataWithCumulative = sortedDates.map(([_, data]) => {
        cumulativeUsers += data.users
        cumulativeTeachers += data.teachers
        cumulativeStudents += data.students
        cumulativeCourses += data.courses

        return {
          ...data,
          users: cumulativeUsers,
          teachers: cumulativeTeachers,
          students: cumulativeStudents,
          courses: cumulativeCourses,
          // Keep enrollments and completions as daily counts, not cumulative
          enrollments: data.enrollments,
          completions: data.completions
        }
      })

      setChartData(chartDataWithCumulative)
      setChartLoading(false)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setChartLoading(false)
    }
  }

  const formatDateForChart = (dateStr: string): string => {
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: 'bi-people',
      color: 'var(--color-brand-primary)',
      path: '/admin/users'
    },
    {
      label: 'Teachers',
      value: stats.totalTeachers,
      icon: 'bi-person-badge',
      color: 'var(--color-success)',
      path: '/admin/teachers'
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      icon: 'bi-mortarboard',
      color: 'var(--color-info)',
      path: '/admin/students'
    },
    {
      label: 'Courses',
      value: stats.totalCourses,
      icon: 'bi-book',
      color: 'var(--color-warning)',
      path: '/admin/courses'
    },
    {
      label: 'Songs',
      value: stats.totalSongs,
      icon: 'bi-music-note-beamed',
      color: 'var(--color-brand-primary)',
      path: '/admin/songs'
    },
    {
      label: 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: 'bi-check-circle',
      color: 'var(--color-success)',
      path: '/admin/students'
    },
    {
      label: 'Completed Lessons',
      value: stats.completedLessons,
      icon: 'bi-trophy',
      color: 'var(--color-warning)',
      path: '/admin/students'
    },
    {
      label: 'Published Courses',
      value: stats.publishedCourses,
      icon: 'bi-check2-square',
      color: 'var(--color-info)',
      path: '/admin/courses'
    }
  ]

  return (
    <AdminLayout>
      {stats.loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          Loading statistics...
        </div>
      ) : (
        <>
          <div className="responsive-grid" style={{
            marginBottom: 'var(--space-8)'
          }}>
            {statCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  transition: 'var(--transition-base)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  e.currentTarget.style.borderColor = card.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-size-4xl)',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${card.color}20`,
                  borderRadius: 'var(--radius-base)',
                  color: card.color,
                  flexShrink: 0
                }}>
                  <i className={`${card.icon} bi`} style={{ fontSize: 'var(--font-size-4xl)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {card.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--space-8)'
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Quick Actions
            </h2>
            <div className="responsive-grid-sm">
              <Link
                to="/admin/teachers"
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-brand-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-base)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: 'var(--font-weight-semibold)',
                  transition: 'var(--transition-base)',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                Add Teacher
              </Link>
              <Link
                to="/admin/users"
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-base)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: 'var(--font-weight-semibold)',
                  border: '1px solid var(--color-border)',
                  transition: 'var(--transition-base)',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                Manage Users
              </Link>
            </div>
          </div>

          {/* Growth Charts Section */}
          <Card padding="lg" style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-6)',
              flexWrap: 'wrap',
              gap: 'var(--space-4)'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)'
              }}>
                Growth Trends
              </h2>
              <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap'
              }}>
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: timeRange === range 
                        ? 'var(--color-brand-primary)' 
                        : 'var(--color-bg-tertiary)',
                      color: timeRange === range 
                        ? 'var(--color-text-on-primary)' 
                        : 'var(--color-text-primary)',
                      border: `1px solid ${timeRange === range ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                      transition: 'var(--transition-base)'
                    }}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                Loading chart data...
              </div>
            ) : chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                No data available for the selected time range
              </div>
            ) : (
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    />
                    <YAxis 
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 'var(--radius-base)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'var(--color-text-primary)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="var(--color-brand-primary)" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)"
                      name="Total Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="teachers" 
                      stroke="var(--color-success)" 
                      fillOpacity={1} 
                      fill="url(#colorTeachers)"
                      name="Teachers"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="students" 
                      stroke="var(--color-info)" 
                      fillOpacity={1} 
                      fill="url(#colorStudents)"
                      name="Students"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Activity Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-8)'
          }}>
            {/* Courses & Enrollments */}
            <Card padding="lg">
              <h3 style={{
                marginTop: 0,
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)'
              }}>
                Courses Created
              </h3>
              {chartLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  Loading...
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No data available
                </div>
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                      <YAxis 
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: 'var(--radius-base)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="courses" 
                        stroke="var(--color-warning)" 
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-warning)', r: 4 }}
                        name="Total Courses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Enrollments & Completions */}
            <Card padding="lg">
              <h3 style={{
                marginTop: 0,
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)'
              }}>
                Activity Trends
              </h3>
              {chartLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  Loading...
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No data available
                </div>
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                      <YAxis 
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: 'var(--radius-base)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ color: 'var(--color-text-primary)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="enrollments" 
                        stroke="var(--color-success)" 
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-success)', r: 4 }}
                        name="New Enrollments"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="var(--color-warning)" 
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-warning)', r: 4 }}
                        name="Lesson Completions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default Dashboard

