// Supabase Edge Function: Create User
// This function uses the service role key to create users securely
// Deploy: supabase functions deploy create-user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the service role key from environment
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get authenticated user (admin/teacher who is creating the user)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Verify the requesting user has permission (admin or teacher)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || !roleData) {
      throw new Error('User role not found')
    }

    const requestingRole = roleData.role
    const { email, firstName, lastName, role, createdBy } = await req.json()

    // Permission checks: Only admins can create teachers and authors, teachers can create students
    if (requestingRole === 'teacher' && role !== 'student') {
      throw new Error('Teachers can only create students')
    }
    if (requestingRole !== 'admin' && (role === 'teacher' || role === 'author')) {
      throw new Error(`Only admins can create ${role}s`)
    }
    // Validate role is in enum
    const validRoles = ['admin', 'teacher', 'student', 'author']
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`)
    }

    // Generate secure password
    const generatePassword = (length: number = 12): string => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz'
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const numbers = '0123456789'
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const charset = lowercase + uppercase + numbers + special
      
      let password = ''
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
      password += numbers[Math.floor(Math.random() * numbers.length)]
      password += special[Math.floor(Math.random() * special.length)]
      
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
      }
      
      return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    const temporaryPassword = generatePassword(12)

    // Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        must_change_password: true,
        created_by: createdBy || user.id,
        active: true
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {})
      throw profileError
    }

    // Create role entry
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role,
        granted_by: createdBy || user.id
      })

    if (roleInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {})
      throw roleInsertError
    }

    // Create role-specific records
    if (role === 'teacher') {
      const { error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          user_id: authData.user.id,
          status: 'active'
        })

      if (teacherError) {
        // Don't cleanup here - user is already created
        console.error('Failed to create teacher record:', teacherError)
      }
    }
    // Note: 'author' role doesn't need a separate table - they're just users with author role
    // Authors can be treated similar to teachers for course creation permissions if needed

    // If student is created by a teacher, create teacher_students relationship
    if (role === 'student' && requestingRole === 'teacher') {
      const { error: relationError } = await supabaseAdmin
        .from('teacher_students')
        .insert({
          teacher_id: user.id,
          student_id: authData.user.id
        })

      if (relationError) {
        console.error('Failed to create teacher-student relation:', relationError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
        temporaryPassword
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create user'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

