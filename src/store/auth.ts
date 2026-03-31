import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '../types/user'

interface AuthState {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  userRole: UserRole | null
  mustChangePassword: boolean
  /** True when public.profiles / user_roles are missing (migrations not applied to this Supabase project). */
  databaseSchemaMissing: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  fetchUserProfile: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

function isMissingSchemaError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  if (err.code === 'PGRST205') return true
  const m = err.message || ''
  return /could not find the table|schema cache|relation .* does not exist/i.test(m)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  userRole: null,
  mustChangePassword: false,
  databaseSchemaMissing: false,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      // Sign in with password - session will be automatically stored in localStorage
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        set({ loading: false })
        throw error
      }
      
      if (!data.session || !data.user) {
        set({ loading: false })
        throw new Error('No session received from server')
      }
      
      // Set session expiration to 30 days
      const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days from now
      localStorage.setItem('session_expiration', expirationTime.toString())
      
      // Set user and session immediately
      set({ user: data.user, session: data.session })
      
      // Fetch user profile after successful login
      // This must complete before redirecting
      await get().fetchUserProfile()
      
      set({ loading: false })
    } catch (error) {
      set({ loading: false })
      // Clear any partial state on error (keep databaseSchemaMissing — set only by fetchUserProfile)
      set({ user: null, session: null, userProfile: null, userRole: null })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear session expiration from localStorage
      localStorage.removeItem('session_expiration')
      
      set({ 
        user: null, 
        session: null, 
        userProfile: null,
        userRole: null,
        mustChangePassword: false,
        loading: false 
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  checkAuth: async () => {
    set({ loading: true })
    try {
      // First, check the actual Supabase session (most reliable)
      // This will automatically restore from localStorage if persistSession is true
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
      }
      
      // If there's no session, clear everything
      if (!session) {
        localStorage.removeItem('session_expiration')
        set({ 
          user: null,
          session: null,
          userProfile: null,
          userRole: null,
          mustChangePassword: false,
          databaseSchemaMissing: false,
          loading: false
        })
        return
      }

      // Session exists - set it immediately
      set({ user: session.user, session })

      // Check if it needs refreshing
      if (session.expires_at) {
        const expiresAt = session.expires_at * 1000 // Convert to milliseconds
        const now = Date.now()
        const oneDayInMs = 24 * 60 * 60 * 1000
        
        // If session expires within 24 hours OR has already expired, try to refresh it
        if (expiresAt - now < oneDayInMs || expiresAt <= now) {
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            
            if (!refreshError && refreshData.session) {
              // Update expiration timestamp on successful refresh
              const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
              localStorage.setItem('session_expiration', expirationTime.toString())
              set({ user: refreshData.session.user, session: refreshData.session })
              await get().fetchUserProfile()
              set({ loading: false })
              return
            } else if (refreshError) {
              // Refresh failed - but session might still be valid for a short time
              console.warn('Session refresh failed:', refreshError)
              // Continue with existing session
            }
          } catch (refreshErr) {
            console.warn('Session refresh error:', refreshErr)
            // Continue with existing session
          }
        }
      }
      
      // Update custom expiration timestamp if not set or if it's older than current session
      const storedExpiration = localStorage.getItem('session_expiration')
      if (!storedExpiration || parseInt(storedExpiration, 10) < Date.now() + (30 * 24 * 60 * 60 * 1000)) {
        const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
        localStorage.setItem('session_expiration', expirationTime.toString())
      }
      
      // Fetch user profile if session exists
      await get().fetchUserProfile()
      
      set({ loading: false })
    } catch (error) {
      console.error('Auth check error:', error)
      // Don't clear session on error - might be a network issue
      // Just set loading to false and let Supabase handle it
      set({ loading: false })
    }
  },

  fetchUserProfile: async () => {
    try {
      const { user } = get()
      if (!user) {
        set({ 
          userProfile: null,
          userRole: null,
          mustChangePassword: false
        })
        return
      }

      // Fetch profile and role separately (they're in different tables)
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      const pErr = profileResult.error
      const rErr = roleResult.error
      if (isMissingSchemaError(pErr) || isMissingSchemaError(rErr)) {
        console.warn(
          '[Supabase] Tables public.profiles / user_roles are not in this database (migrations not applied). ' +
            'Fix: Supabase Dashboard → SQL Editor → paste and run the file supabase/sql/apply-all-migrations-once.sql ' +
            '(or run: supabase db push). Then run supabase/sql/after-migrations-first-user.sql (edit email). Reload the app.'
        )
        set({
          userProfile: null,
          userRole: null,
          mustChangePassword: false,
          databaseSchemaMissing: true
        })
        return
      }

      if (pErr) {
        console.warn('User profile fetch error:', pErr)
        set({
          userProfile: null,
          userRole: null,
          mustChangePassword: false,
          databaseSchemaMissing: false
        })
        return
      }

      if (!profileResult.data) {
        console.warn(
          'No profile row for this user. If tables exist, insert a row in public.profiles for this auth user_id, ' +
            'or sign up again after migrations so the handle_new_user trigger can run.'
        )
        set({
          userProfile: null,
          userRole: null,
          mustChangePassword: false,
          databaseSchemaMissing: false
        })
        return
      }

      const profile = profileResult.data
      const role = roleResult.data?.role as UserRole | undefined

      set({ 
        userProfile: { ...profile, role },
        userRole: role || null,
        mustChangePassword: profile.must_change_password || false,
        databaseSchemaMissing: false
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      set({ 
        userProfile: null,
        userRole: null,
        mustChangePassword: false,
        databaseSchemaMissing: false
      })
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      // Update must_change_password flag in profiles
      const { user } = get()
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('user_id', user.id)
          .select()

        if (profileError) {
          console.error('Error updating profile must_change_password:', profileError)
          // Don't throw here - password was updated successfully
          // Try to refresh profile to get current state
        }

        // Refresh user profile to ensure state is up to date
        await get().fetchUserProfile()
        
        // Ensure mustChangePassword is set to false in state
        set({ mustChangePassword: false })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  },
}))
