import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import StudentLayout from '../../components/layout/StudentLayout'
import { Card, Button } from '../../components/ui'
import type { StudentAssignment, Assignment } from '../../types/content'

const Assignments = () => {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<(StudentAssignment & { assignment?: Assignment })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    if (user) {
      fetchAssignments()
    }
  }, [user])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('student_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error
      
      await fetchAssignments()
    } catch (error) {
      console.error('Error marking assignment complete:', error)
    }
  }

  const filteredAssignments = assignments.filter(sa => {
    if (filter === 'all') return true
    if (filter === 'pending') return sa.status === 'pending' || sa.status === 'in_progress'
    if (filter === 'completed') return sa.status === 'completed'
    return true
  })

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: { bg: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', text: 'Pending' },
      in_progress: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'In Progress' },
      completed: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', text: 'Completed' },
      overdue: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Overdue' }
    }
    const style = colors[status as keyof typeof colors] || colors.pending
    return style
  }

  return (
    <StudentLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2 style={{ margin: 0 }}>
            Assignments ({filteredAssignments.length})
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                background: filter === 'all' ? 'var(--color-brand-primary)' : 'transparent',
                color: filter === 'all' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                background: filter === 'pending' ? 'var(--color-brand-primary)' : 'transparent',
                color: filter === 'pending' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                background: filter === 'completed' ? 'var(--color-brand-primary)' : 'transparent',
                color: filter === 'completed' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card padding="lg" variant="elevated">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-4)' }}>
                <i className="bi bi-clipboard-check" style={{ fontSize: 'var(--font-size-4xl)' }} />
              </div>
              <h3 style={{ marginTop: 0 }}>No assignments</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {filter === 'all' 
                  ? "You don't have any assignments yet." 
                  : `No ${filter} assignments.`}
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filteredAssignments.map((studentAssignment) => {
              const assignment = studentAssignment.assignment
              if (!assignment) return null

              const statusBadge = getStatusBadge(studentAssignment.status)
              const isOverdue = assignment.due_date && 
                new Date(assignment.due_date) < new Date() && 
                studentAssignment.status !== 'completed'

              return (
                <Card
                  key={studentAssignment.id}
                  padding="lg"
                  variant="elevated"
                  style={{
                    borderLeft: isOverdue ? '4px solid var(--color-error)' : '4px solid transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <h3 style={{ margin: 0, flex: 1 }}>
                      {assignment.title}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      background: statusBadge.bg,
                      color: statusBadge.color,
                      marginLeft: 'var(--space-2)'
                    }}>
                      {statusBadge.text}
                    </span>
                  </div>
                  
                  {assignment.description && (
                    <p style={{
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-4)'
                    }}>
                      {assignment.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    <span>
                      {assignment.due_date ? (
                        <>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                          {isOverdue && (
                            <span style={{ color: 'var(--color-error)', marginLeft: 'var(--space-2)' }}>
                              (Overdue)
                            </span>
                          )}
                        </>
                      ) : (
                        'No due date'
                      )}
                    </span>
                    {studentAssignment.completed_at && (
                      <span>
                        Completed: {new Date(studentAssignment.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {studentAssignment.status !== 'completed' && (
                    <Button
                      onClick={() => handleMarkComplete(studentAssignment.id)}
                      variant="primary"
                    >
                      Mark as Complete
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}

export default Assignments

