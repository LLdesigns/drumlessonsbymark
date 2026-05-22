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
  if (lower.includes('function not found') || lower.includes('404')) {
    if (lower.includes('submit-contact')) {
      return (
        'Contact form is not deployed. Run: npx supabase functions deploy submit-contact-inquiry --no-verify-jwt'
      )
    }
    return (
      'The create-user Edge Function is not deployed. From the project folder run: npx supabase functions deploy create-user'
    )
  }
  if (lower.includes('user role not found')) {
    return (
      'Your account has no role in user_roles. In Supabase SQL Editor, run supabase/sql/ONBOARD_MARK_AND_LUKE.sql or after-migrations-first-user.sql with your email.'
    )
  }
  if (lower.includes('only admins can create teacher')) {
    return (
      'Only admins can add teachers. Run ONBOARD_MARK_AND_LUKE.sql to grant admin to lukelibbydesigns@gmail.com, sign out/in, then use Add teacher on the Students page.'
    )
  }
  if (lower.includes('teachers can only create students')) {
    return (
      'Teachers can only add students. To add Mark as a teacher, sign in as an admin and use Add teacher (not Add student).'
    )
  }
  if (lower.includes('handle_new_user') || lower.includes('auth user create')) {
    return (
      'Database trigger blocked new users. In Supabase SQL Editor, run supabase/sql/FIX_AUTH_USER_CREATE_TRIGGER.sql then try Add student again.'
    )
  }
  if (lower.includes('http 500') || lower.includes('internal server error')) {
    return (
      'Server error creating user. Do not use Dashboard → Authentication → Add user (often 500). Use Studio → Students → Add student in the app, or run FIX_AUTH_USER_CREATE_TRIGGER.sql in SQL Editor.'
    )
  }
  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('42501')) {
    return (
      'Database policy blocked this action. New students must be created via Add student in the app (deployed create-user function) or by an admin in the SQL Editor — not by inserting rows in the Table Editor.'
    )
  }
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
