import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { useIsMobile } from '../../hooks/useMediaQuery'
import AdminLayout from '../../components/layout/AdminLayout'
import type { UserProfile, UserRole } from '../../types/user'

interface PendingUpdate {
  userId: string
  type: 'role' | 'status'
  value: UserRole | boolean
  originalValue: UserRole | boolean | null
}

const Users = () => {
  const { userProfile } = useAuthStore()
  const isMobile = useIsMobile()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student' | 'author'>('all')
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map())
  const [saving, setSaving] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch profiles and roles separately (more reliable with RLS)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        throw profilesError
      }

      // Fetch roles for all users - admins should be able to see all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        // If roles fetch fails (possibly RLS issue), still show users without roles
        setUsers((profilesData || []).map(profile => ({
          ...profile,
          role: null
        } as UserProfile)))
        return
      }

      // Combine profiles with roles - use strict comparison
      const usersWithRoles = (profilesData || []).map(profile => {
        // Find matching role entry - handle both UUID and string comparisons
        const roleEntry = rolesData?.find(r => {
          // Convert both to strings for comparison to handle UUID type differences
          return String(r.user_id) === String(profile.user_id)
        })
        
        return {
          ...profile,
          role: roleEntry?.role || null
        } as UserProfile
      })

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
      // Try fallback method
      fetchUsersFallback()
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersFallback = async () => {
    try {
      // Fallback: Fetch profiles and roles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        // If roles fetch fails, still show users without roles
        setUsers((profilesData || []).map(profile => ({
          ...profile,
          role: null
        } as UserProfile)))
        return
      }

      // Combine profiles with roles - ensure user_id comparison works
      const usersWithRoles = (profilesData || []).map(profile => {
        const roleEntry = rolesData?.find(r => {
          // Ensure both are strings for comparison
          const profileUserId = String(profile.user_id)
          const roleUserId = String(r.user_id)
          return profileUserId === roleUserId
        })
        return {
          ...profile,
          role: roleEntry?.role || null
        } as UserProfile
      })

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error in fallback fetch:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (user.first_name?.toLowerCase().includes(searchLower) || false) ||
      (user.last_name?.toLowerCase().includes(searchLower) || false) ||
      (user.display_name?.toLowerCase().includes(searchLower) || false) ||
      (user.email?.toLowerCase().includes(searchLower) || false)
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  // Debounced batch update function
  const applyPendingUpdates = useCallback(async () => {
    if (pendingUpdates.size === 0 || !userProfile) return

    setSaving(true)
    const updatesArray = Array.from(pendingUpdates.values())
    
    try {
      // Separate updates by type
      const roleUpdates: Array<{ userId: string; role: UserRole }> = []
      const statusUpdates: Array<{ userId: string; active: boolean }> = []

      for (const update of updatesArray) {
        if (update.type === 'role') {
          roleUpdates.push({ userId: update.userId, role: update.value as UserRole })
        } else {
          statusUpdates.push({ userId: update.userId, active: update.value as boolean })
        }
      }

      // Batch update roles
      if (roleUpdates.length > 0) {
        const rolePromises = roleUpdates.map(async ({ userId, role }) => {
          // Check if role exists
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('user_id', userId)
            .single()

          if (existingRole) {
            // Update existing role
            const { error } = await supabase
              .from('user_roles')
              .update({ role, granted_by: userProfile.user_id })
              .eq('user_id', userId)
            
            if (error) throw error
          } else {
            // Insert new role
            const { error } = await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                role,
                granted_by: userProfile.user_id
              })
            
            if (error) throw error
          }

          // Handle role-specific table updates
          if (role === 'teacher') {
            // Ensure teacher record exists
            const { data: teacherExists } = await supabase
              .from('teachers')
              .select('user_id')
              .eq('user_id', userId)
              .single()

            if (!teacherExists) {
              await supabase
                .from('teachers')
                .insert({ user_id: userId, status: 'active' })
            }
          }
        })

        await Promise.all(rolePromises)
      }

      // Batch update status
      if (statusUpdates.length > 0) {
        const statusPromises = statusUpdates.map(async ({ userId, active }) => {
          const { error } = await supabase
            .from('profiles')
            .update({ active })
            .eq('user_id', userId)
          
          if (error) throw error
        })

        await Promise.all(statusPromises)
      }

      // Refresh users list - call without await to avoid dependency issue
      await fetchUsers()
      
      // Clear pending updates
      setPendingUpdates(new Map())
    } catch (error: any) {
      console.error('Error applying updates:', error)
      alert(`Error updating users: ${error.message}`)
      // Revert optimistic updates
      await fetchUsers()
      setPendingUpdates(new Map())
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUpdates.size, userProfile?.user_id])

  // Debounce updates
  useEffect(() => {
    if (pendingUpdates.size === 0) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      applyPendingUpdates()
    }, 1000) // 1 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [pendingUpdates, applyPendingUpdates])

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.user_id === userId)
    if (!user) return

    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, role: newRole } : u
    ))

    // Track pending update
    setPendingUpdates(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(userId)
      
      if (existing && existing.type === 'role') {
        // Update existing role update
        newMap.set(userId, {
          ...existing,
          value: newRole
        })
      } else {
        // New role update
        newMap.set(userId, {
          userId,
          type: 'role',
          value: newRole,
          originalValue: user.role || null
        })
      }
      
      return newMap
    })
  }

  const handleStatusChange = (userId: string, newStatus: boolean) => {
    const user = users.find(u => u.user_id === userId)
    if (!user) return

    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, active: newStatus } : u
    ))

    // Track pending update
    setPendingUpdates(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(userId)
      
      if (existing && existing.type === 'status') {
        // Update existing status update
        newMap.set(userId, {
          ...existing,
          value: newStatus
        })
      } else {
        // New status update
        newMap.set(userId, {
          userId,
          type: 'status',
          value: newStatus,
          originalValue: user.active ?? true
        })
      }
      
      return newMap
    })
  }

  const getRoleBadgeColor = (role: string | null | undefined) => {
    switch (role) {
      case 'admin':
        return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', text: 'Admin' }
      case 'teacher':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', text: 'Teacher' }
      case 'student':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Student' }
      case 'author':
        return { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', text: 'Author' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', text: role || 'No role' }
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        {saving && (
          <div style={{
            padding: 'var(--space-3)',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: 'var(--radius-base)',
            marginBottom: 'var(--space-4)',
            color: '#3b82f6',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span>Saving changes...</span>
          </div>
        )}
        {pendingUpdates.size > 0 && !saving && (
          <div style={{
            padding: 'var(--space-3)',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid #fbbf24',
            borderRadius: 'var(--radius-base)',
            marginBottom: 'var(--space-4)',
            color: '#fbbf24',
            fontSize: 'var(--font-size-sm)'
          }}>
            {pendingUpdates.size} change{pendingUpdates.size !== 1 ? 's' : ''} pending...
          </div>
        )}
        <div className="responsive-flex" style={{
          marginBottom: 'var(--space-4)'
        }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1 1 300px',
              minWidth: isMobile ? '100%' : '300px',
              padding: 'var(--padding-input-md-y) var(--padding-input-md-x)',
              border: 'var(--border-width-base) solid var(--color-border-default)',
              borderRadius: 'var(--radius-base)',
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-input-md)',
              outline: 'none',
              transition: 'border var(--transition-base)',
              fontFamily: 'var(--font-family-body)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-border-focus)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-default)'
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            style={{
              flex: isMobile ? '1 1 100%' : '0 1 auto',
              minWidth: isMobile ? '100%' : 'auto',
              padding: 'var(--padding-input-md-y) var(--padding-input-md-x)',
              border: 'var(--border-width-base) solid var(--color-border-default)',
              borderRadius: 'var(--radius-base)',
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-input-md)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border var(--transition-base)',
              fontFamily: 'var(--font-family-body)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-border-focus)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-default)'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="author">Author</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading users...
          </div>
        ) : (
          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <table className="responsive-table" style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'var(--color-bg-tertiary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Status
                  </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      Created
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: 'var(--space-8)',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)'
                    }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleBadge = getRoleBadgeColor(user.role)
                    return (
                  <tr
                    key={user.user_id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'var(--transition-base)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td data-label="Name" style={{ padding: 'var(--space-4)' }}>
                      {user.first_name || user.display_name || 'N/A'} {user.last_name || ''}
                    </td>
                    <td data-label="Email" style={{ padding: 'var(--space-4)' }}>
                      {user.email || 'N/A'}
                    </td>
                    <td data-label="Role" style={{ padding: 'var(--space-4)' }}>
                      {user.role ? (
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-base)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          background: roleBadge.bg,
                          color: roleBadge.color
                        }}>
                          {roleBadge.text}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>No role</span>
                      )}
                    </td>
                    <td data-label="Status" style={{ padding: 'var(--space-4)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        background: (user.active !== false) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: (user.active !== false) ? '#22c55e' : '#ef4444'
                      }}>
                        {(user.active !== false) ? 'Active' : 'Inactive'}
                      </span>
                      {user.must_change_password && (
                        <span style={{
                          marginLeft: 'var(--space-2)',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-warning)'
                        }}>
                          <i className="bi bi-lock-fill" />
                        </span>
                      )}
                    </td>
                    <td data-label="Created" style={{
                      padding: 'var(--space-4)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td data-label="Actions" style={{ padding: 'var(--space-4)' }}>
                      <div style={{
                        display: 'flex',
                        gap: 'var(--space-2)',
                        flexDirection: 'column'
                      }}>
                        <select
                          value={user.role || ''}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value as UserRole)}
                          disabled={saving}
                          className="contact-input contact-input-sm contact-input-secondary"
                          style={{
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1
                          }}
                        >
                          <option value="">No role</option>
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                          <option value="author">Author</option>
                        </select>
                        <select
                          value={user.active !== false ? 'active' : 'inactive'}
                          onChange={(e) => handleStatusChange(user.user_id, e.target.value === 'active')}
                          disabled={saving}
                          className="contact-input contact-input-sm contact-input-secondary"
                          style={{
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Users

