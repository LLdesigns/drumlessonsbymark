import { supabase } from './supabase'
import type { UserRole } from '../types/user'

/**
 * Admin Service
 * 
 * NOTE: Creating users with Supabase requires the service role key.
 * For production, this should be done via:
 * 1. Supabase Edge Functions (recommended)
 * 2. A backend API endpoint
 * 
 * For now, this is a placeholder that shows the required structure.
 * You'll need to either:
 * - Set up a Supabase Edge Function that uses the service role key
 * - Create a backend API endpoint that handles user creation securely
 */

interface CreateUserParams {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdBy: string | null
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
        createdBy: params.createdBy
      }
    })

    if (error) {
      // If Edge Function doesn't exist, provide helpful error
      if (error.message?.includes('Function not found') || error.message?.includes('404')) {
        throw new Error(
          'Edge Function "create-user" not found. Please deploy it first. ' +
          'See supabase/functions/create-user/index.ts and edge-function-setup.sql'
        )
      }
      throw error
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create user')
    }

    return {
      userId: data.userId,
      temporaryPassword: data.temporaryPassword
    }
  } catch (error: any) {
    console.error('Error creating user:', error)
    throw error
  }
}

