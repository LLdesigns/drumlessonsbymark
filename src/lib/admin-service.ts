import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { UserRole } from '../types/user'

async function readFunctionErrorBody(error: FunctionsHttpError): Promise<string | null> {
  try {
    const ctx = error.context as Response | undefined
    if (!ctx?.json) return null
    const json = (await ctx.json()) as { error?: string; message?: string }
    return json.error ?? json.message ?? null
  } catch {
    return null
  }
}

/**
 * Creates studio users via the `create-user` Edge Function (service role on server).
 * Deploy: `npx supabase functions deploy create-user`
 * Dashboard manual add often fails — use Add Student in the app or supabase/sql/CREATE_STUDIO_USER_MANUAL.sql
 */

export interface CreateUserStudioProfile {
  age?: number | null
  skill_level?: string | null
  goals?: string | null
  favorite_music?: string | null
}

export interface CreateUserParams {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdBy: string | null
  /** When an admin creates a student, link to this teacher's studio */
  teacherId?: string
  studioProfile?: CreateUserStudioProfile
}

interface CreateUserResponse {
  userId: string
  temporaryPassword: string
}

/**
 * Create a new user account with temporary password
 * 
 * This function calls the Supabase Edge Function 'create-user'
 * which securely uses the service role key on the server side.
 */
export async function createUserAccount(params: CreateUserParams): Promise<CreateUserResponse> {
  try {
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        role: params.role,
        createdBy: params.createdBy,
        teacherId: params.teacherId,
        studioProfile: params.studioProfile,
      }
    })

    if (error) {
      if (error.message?.includes('Function not found') || error.message?.includes('404')) {
        throw new Error(
          'Edge Function "create-user" is not deployed. From play-it-pro-platform run: npx supabase functions deploy create-user'
        )
      }
      if (error instanceof FunctionsHttpError) {
        const bodyMsg = await readFunctionErrorBody(error)
        throw new Error(
          bodyMsg ||
            `create-user failed (HTTP ${error.context?.status ?? 'error'}). Check Edge Function logs in Supabase Dashboard.`
        )
      }
      throw error
    }

    const payload = data as { success?: boolean; error?: string; userId?: string; temporaryPassword?: string } | null
    if (!payload?.success) {
      throw new Error(
        payload?.error ||
          'Failed to create user. If Authentication → Add user also returns 500, run supabase/sql/FIX_AUTH_USER_CREATE_TRIGGER.sql in the SQL Editor.'
      )
    }

    return {
      userId: payload.userId!,
      temporaryPassword: payload.temporaryPassword!,
    }
  } catch (error: any) {
    console.error('Error creating user:', error)
    throw error
  }
}

