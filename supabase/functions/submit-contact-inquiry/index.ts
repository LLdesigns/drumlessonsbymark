// Public website contact form → studio_messages for primary teacher + notification
// Deploy: supabase functions deploy submit-contact-inquiry --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactBody {
  firstName: string
  lastName: string
  email: string
  phone?: string
  message: string
  recaptchaToken?: string
}

async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY')
  if (!secret) {
    console.warn('RECAPTCHA_SECRET_KEY not set — skipping server verification')
    return Boolean(token)
  }
  if (!token) return false

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  })
  const json = await res.json()
  return json.success === true
}

async function getPrimaryTeacherId(
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<string> {
  const fromEnv = Deno.env.get('PRIMARY_TEACHER_USER_ID')?.trim()
  if (fromEnv) return fromEnv

  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'teacher')
    .order('granted_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.user_id) {
    throw new Error('No teacher account found. Add Mark as a teacher before accepting website contact.')
  }
  return data.user_id
}

async function notifyTeacher(
  supabaseAdmin: ReturnType<typeof createClient>,
  teacherId: string,
  title: string,
  body: string,
  guestName: string,
  guestEmail: string
) {
  const { data: prefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('message_notifications, push_enabled, email_enabled')
    .eq('user_id', teacherId)
    .maybeSingle()

  if (prefs?.message_notifications === false) return

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      recipient_id: teacherId,
      actor_id: null,
      notification_type: 'message_received',
      title,
      body,
      action_url: '/studio/messages',
      metadata: { source: 'website_contact', guest_name: guestName, guest_email: guestEmail },
    })
    .select('id')
    .single()

  if (error) {
    console.error('Notification insert failed:', error)
    return
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey || prefs?.email_enabled === false) return

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name')
    .eq('user_id', teacherId)
    .maybeSingle()

  if (!profile?.email) return

  const origin = Deno.env.get('PUBLIC_APP_URL') ?? 'https://www.drumlessonsbymark.com'
  const link = `${origin}/studio/messages`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? 'notifications@drumlessonsbymark.com',
      to: profile.email,
      subject: title,
      html: `
        <p>Hi ${profile.first_name ?? 'Mark'},</p>
        <p><strong>${title}</strong></p>
        <p>${body}</p>
        <p>From: ${guestName} &lt;${guestEmail}&gt;</p>
        <p><a href="${link}">Open Messages in your studio</a></p>
      `,
    }),
  }).catch((e) => console.error('Email notify failed:', e))

  if (notification?.id) {
    await supabaseAdmin
      .from('notifications')
      .update({ emailed_at: new Date().toISOString() })
      .eq('id', notification.id)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { firstName, lastName, email, phone, message, recaptchaToken } =
      (await req.json()) as ContactBody

    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPhone = phone?.trim() || null
    const trimmedMessage = message?.trim()
    const guestName = `${firstName?.trim() ?? ''} ${lastName?.trim() ?? ''}`.trim()

    if (!guestName || !trimmedEmail || !trimmedMessage) {
      throw new Error('Name, email, and message are required.')
    }

    const recaptchaOk = await verifyRecaptcha(recaptchaToken)
    if (!recaptchaOk) {
      throw new Error('CAPTCHA verification failed. Please try again.')
    }

    const teacherId = await getPrimaryTeacherId(supabaseAdmin)

    const bodyLines = [
      'New message from the website contact form',
      '',
      `From: ${guestName}`,
      `Email: ${trimmedEmail}`,
    ]
    if (trimmedPhone) bodyLines.push(`Phone: ${trimmedPhone}`)
    bodyLines.push('', trimmedMessage)
    const bodyText = bodyLines.join('\n')

    const { error: insertError } = await supabaseAdmin.from('studio_messages').insert({
      sender_id: null,
      recipient_id: teacherId,
      body: bodyText,
      message_type: 'contact_form',
      guest_name: guestName,
      guest_email: trimmedEmail,
      guest_phone: trimmedPhone,
      is_website_inquiry: true,
    })

    if (insertError) throw insertError

    const preview =
      trimmedMessage.length > 80 ? `${trimmedMessage.slice(0, 77)}…` : trimmedMessage

    await notifyTeacher(
      supabaseAdmin,
      teacherId,
      `Website contact from ${guestName}`,
      preview,
      guestName,
      trimmedEmail
    )

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit contact form'
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
