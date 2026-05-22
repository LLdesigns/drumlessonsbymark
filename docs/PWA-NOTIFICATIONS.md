# PWA & Notifications — Mark's Drum Studio Portal

## Apply database migration

Run in Supabase SQL Editor (or `supabase db push`):

`supabase/migrations/20250524000000_notifications_pwa.sql`

Creates: `notifications`, `push_subscriptions`, `notification_preferences`

## Deploy edge function

```bash
supabase functions deploy dispatch-notification
```

Secrets (Dashboard → Edge Functions → Secrets):

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Optional — email fallback when push unavailable |
| `NOTIFICATION_FROM_EMAIL` | Sender address for Resend |
| `PUBLIC_APP_URL` | Link base in emails (e.g. `https://www.drumlessonsbymark.com`) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Optional — full web push delivery |

Client `.env`:

```
VITE_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```

Generate keys: `npx web-push generate-vapid-keys`

## Install experience

- **Android / Chrome**: After login on mobile, a banner offers install when the browser fires `beforeinstallprompt`.
- **iPhone**: Banner shows **Share → Add to Home Screen** steps (no auto-install).
- **PWA entry**: `start_url` is `/app` → redirects to student or studio home based on role.

## Notification flow

1. In-app rows in `notifications` + bell UI with unread badge
2. Realtime via Supabase `postgres_changes`
3. Push when VAPID + subscription exist
4. Email via Resend when `email_enabled` and push skipped/denied

Permission is **not** requested on first load — only after messages activity or on the notifications settings tab.

## HTTPS

PWA and push require HTTPS in production (localhost OK for dev).
