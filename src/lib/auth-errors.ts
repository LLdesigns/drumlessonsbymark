/**
 * Maps Supabase/network auth errors to actionable messages for the UI.
 */
export function formatAuthErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)

  const lower = message.toLowerCase()
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('err_name_not_resolved') ||
    message.includes('AuthRetryableFetchError')
  ) {
    return (
      'Cannot reach Supabase (network or DNS). Open your Supabase dashboard → Project Settings → API ' +
      'and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to the current Project URL and anon key, ' +
      'then restart the dev server. If the old project was deleted, the hostname will not resolve.'
    )
  }

  return message || fallback
}
