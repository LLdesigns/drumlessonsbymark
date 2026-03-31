# JWT Session Configuration for 30-Day Sessions

This document explains how to configure Supabase Auth to support 30-day session persistence.

## Overview

The application is configured to keep users logged in for 30 days. This requires configuration in both:
1. **Supabase Dashboard** (server-side JWT expiration)
2. **Client-side code** (already configured)

## Dashboard Configuration

### Step 1: Access Auth Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ciqxnpgxvuspctsaxszd`
3. Navigate to: **Authentication** → **Settings**

### Step 2: Configure JWT Expiration

In the **JWT expiry** section, set:

#### Option A: Equal Expiration (Recommended)
- **Access Token JWT expiry**: `2592000` seconds (30 days)
- **Refresh Token expiry**: `2592000` seconds (30 days)

#### Option B: Short Access, Long Refresh (More Secure)
- **Access Token JWT expiry**: `3600` seconds (1 hour)
- **Refresh Token expiry**: `2592000` seconds (30 days)

**Why Option B?**
- Access tokens expire quickly, reducing risk if stolen
- Refresh tokens last 30 days, maintaining user experience
- Client automatically refreshes access tokens when needed

### Step 3: Save Settings

Click **Save** to apply the changes. Existing sessions will use the new expiration times.

## Client-Side Configuration

The following is already configured in the codebase:

### 1. Supabase Client (`src/lib/supabase.ts`)
```typescript
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,        // Store sessions in localStorage
    autoRefreshToken: true,      // Automatically refresh expired tokens
    detectSessionInUrl: true,   // Handle OAuth callbacks
    storage: window.localStorage,
    storageKey: 'sb-session',
  }
})
```

### 2. Auth Store (`src/store/auth.ts`)
- Tracks 30-day expiration timestamps
- Automatically refreshes sessions before expiration
- Clears expired sessions

### 3. Auth State Listener (`src/App.tsx`)
- Updates expiration timestamps on sign-in/refresh
- Handles automatic token refresh events

## Testing

After configuring the dashboard settings:

1. **Sign in** to the application
2. **Check localStorage**: Open DevTools → Application → Local Storage
   - Look for: `sb-ciqxnpgxvuspctsaxszd-auth-token`
   - Also check: `session_expiration` (custom timestamp)
3. **Close and reopen** the browser
4. **Verify**: You should still be logged in without re-authentication

## Troubleshooting

### Users Still Logging Out After Short Period

**Issue**: Sessions expire quickly despite configuration.

**Solutions**:
1. Verify JWT settings in dashboard are saved correctly
2. Check browser console for auth errors
3. Ensure `autoRefreshToken: true` is set in Supabase client
4. Verify localStorage is not being cleared by browser settings

### Session Not Persisting Across Browser Restarts

**Issue**: Users need to log in again after closing browser.

**Solutions**:
1. Check browser privacy settings (some browsers clear localStorage)
2. Verify `persistSession: true` in Supabase client config
3. Check if browser extensions are clearing localStorage
4. Verify the session is actually being stored (check DevTools)

### Refresh Token Expiring Too Quickly

**Issue**: Users logged out after less than 30 days.

**Solutions**:
1. Verify refresh token expiry is set to `2592000` in dashboard
2. Check if tokens are being refreshed automatically
3. Review server logs in Supabase dashboard for auth errors

## CLI Configuration (Alternative)

If you prefer using Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref ciqxnpgxvuspctsaxszd

# Note: JWT expiry cannot be set via CLI currently
# You must use the dashboard for this configuration
```

## Security Considerations

### Access Token Expiration
- **Short expiration (1 hour)**: More secure, tokens expire quickly
- **Long expiration (30 days)**: Less secure, but better UX

### Refresh Token Expiration
- **30 days**: Good balance between security and UX
- **Longer**: More convenient but higher risk if token is compromised
- **Shorter**: More secure but users must log in more frequently

### Best Practice
Use **Option B** (short access, long refresh):
- Access tokens expire in 1 hour (minimizes risk)
- Refresh tokens last 30 days (maintains UX)
- Client automatically refreshes access tokens

## Related Files

- `src/lib/supabase.ts` - Supabase client configuration
- `src/store/auth.ts` - Session management logic
- `src/App.tsx` - Auth state listeners
- `supabase/migrations/20250103000000_configure_30day_session.sql` - Migration documentation

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JWT Configuration](https://supabase.com/docs/guides/auth/tokens)
- [Supabase Session Management](https://supabase.com/docs/reference/javascript/auth-setsession)

