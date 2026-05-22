import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface SubmitWebsiteContactInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  message: string
  recaptchaToken: string
}

/** Public homepage contact → Mark's Messages (primary teacher), not contact_messages table. */
export async function submitWebsiteContactInquiry(
  input: SubmitWebsiteContactInput
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('submit-contact-inquiry', {
    body: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || undefined,
      message: input.message.trim(),
      recaptchaToken: input.recaptchaToken,
    },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const ctx = error.context as Response | undefined
        const json = (await ctx?.json()) as { error?: string } | undefined
        if (json?.error) throw new Error(json.error)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) {
          throw parseErr
        }
      }
    }
    if (error.message?.includes('Function not found') || error.message?.includes('404')) {
      throw new Error(
        'Contact form is not available yet. Deploy: npx supabase functions deploy submit-contact-inquiry --no-verify-jwt'
      )
    }
    throw error
  }

  const payload = data as { success?: boolean; error?: string } | null
  if (!payload?.success) {
    throw new Error(payload?.error ?? 'Failed to send message')
  }
}
