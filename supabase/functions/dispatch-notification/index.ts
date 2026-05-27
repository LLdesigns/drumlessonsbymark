import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isWebPushConfigured, sendPushToUser } from '../_shared/web-push.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotificationType =
  | 'message_received'
  | 'lesson_reminder'
  | 'assignment_added'
  | 'assignment_completed'
  | 'schedule_changed'
  | 'practice_upload'
  | 'lesson_note_added'
  | 'lesson_assigned'
  | 'session_note_added'
  | 'practice_task_completed'
  | 'practice_note_added'

interface DispatchBody {
  recipientId: string
  actorId?: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

function prefAllows(type: NotificationType, prefs: Record<string, boolean> | null): boolean {
  if (!prefs) return true
  const map: Record<NotificationType, keyof typeof prefs | null> = {
    message_received: 'message_notifications',
    lesson_reminder: 'lesson_reminders',
    assignment_added: 'assignment_notifications',
    assignment_completed: 'assignment_notifications',
    schedule_changed: 'schedule_notifications',
    practice_upload: 'practice_notifications',
    lesson_note_added: 'assignment_notifications',
    lesson_assigned: 'assignment_notifications',
    session_note_added: 'message_notifications',
    practice_task_completed: 'practice_notifications',
    practice_note_added: 'practice_notifications',
  }
  const key = map[type]
  return key ? prefs[key] !== false : true
}

async function sendEmailFallback(
  supabaseAdmin: ReturnType<typeof createClient>,
  recipientId: string,
  title: string,
  body: string,
  actionUrl?: string
) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? 'notifications@drumlessonsbymark.com'

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name')
    .eq('user_id', recipientId)
    .maybeSingle()

  if (!profile?.email) return false

  const origin = Deno.env.get('PUBLIC_APP_URL') ?? 'https://www.drumlessonsbymark.com'
  const link = actionUrl ? `${origin}${actionUrl}` : origin
  const html = `
    <p>Hi ${profile.first_name ?? 'there'},</p>
    <p><strong>${title}</strong></p>
    <p>${body}</p>
    <p><a href="${link}">Open Mark's Studio Portal</a></p>
    <p style="color:#888;font-size:12px;">Mark's Drum Studio — personal lesson updates</p>
  `

  if (!resendKey) {
    console.log('[email fallback]', profile.email, title, body)
    return false
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: profile.email,
      subject: title,
      html,
    }),
  })

  return resp.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as DispatchBody
    if (!payload.recipientId || !payload.type || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', payload.recipientId)
      .maybeSingle()

    if (!prefAllows(payload.type, prefs)) {
      return new Response(JSON.stringify({ skipped: true, reason: 'preferences' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: notification, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: payload.recipientId,
        actor_id: payload.actorId ?? user.id,
        notification_type: payload.type,
        title: payload.title,
        body: payload.body,
        action_url: payload.actionUrl ?? null,
        metadata: payload.metadata ?? {},
      })
      .select()
      .single()

    if (insertError) throw insertError

    let pushed = false
    let emailed = false

    if (prefs?.push_enabled !== false && isWebPushConfigured()) {
      pushed = await sendPushToUser(supabaseAdmin, payload.recipientId, {
        title: payload.title,
        body: payload.body,
        url: payload.actionUrl ?? '/app',
      })
      if (pushed) {
        await supabaseAdmin
          .from('notifications')
          .update({ pushed_at: new Date().toISOString() })
          .eq('id', notification.id)
      }
    }

    if (prefs?.email_enabled !== false) {
      emailed = await sendEmailFallback(
        supabaseAdmin,
        payload.recipientId,
        payload.title,
        payload.body,
        payload.actionUrl
      )
      if (emailed) {
        await supabaseAdmin
          .from('notifications')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', notification.id)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        notificationId: notification.id,
        pushed,
        emailed,
        pushConfigured: isWebPushConfigured(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
