import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      set({ user: data.user, session: data.session, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, session: null, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  checkAuth: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user || null, session, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Auth check error:', error)
    }
  },
}))
