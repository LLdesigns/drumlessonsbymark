import { supabase } from './supabase'
import type { UserProfile } from '../types/user'

export interface ProfileUpdateInput {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  handle?: string | null
  bio?: string | null
}

/** Update the signed-in user's row in public.profiles (RLS: own profile only). */
export async function updateOwnProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile> {
  const payload = {
    first_name: input.first_name?.trim() || null,
    last_name: input.last_name?.trim() || null,
    display_name: input.display_name?.trim() || null,
    handle: input.handle?.trim() || null,
    bio: input.bio?.trim() || null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as UserProfile
}
