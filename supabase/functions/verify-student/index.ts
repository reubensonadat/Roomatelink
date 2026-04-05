// Supabase Edge Function: verify-student (Beast Mode)
// Purpose: Secure 2-step verification using Resend OTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // ─── BEAST MODE SECURITY: MANUAL JWT VERIFICATION ──────────────
    // We bypass the strict NTP gateway (Kong) and verify the token manually
    // inside the function because student device clocks are often unsynced.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authentication')

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    })

    // Securely pull the user identity directly from Supabase Auth engine
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized Access')

    const { action, email, code } = await req.json()
    const userId = user.id // Now 100% cryptographically secure

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // --- CASE 1: SEND CODE ---
    if (action === 'SEND_CODE') {
      if (!email.endsWith('stu.ucc.edu.gh')) {
        throw new Error('Only UCC domains are supported.')
      }

      // 1. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()

      // 2. Store in vault (verification_codes)
      const { error: dbError } = await adminClient
        .from('verification_codes')
        .insert({ 
            user_id: userId, 
            email, 
            code: otp,
            expires_at: new Date(Date.now() + 10 * 60000).toISOString() 
        })

      if (dbError) throw dbError

      // 3. Send via Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Roommate Link <onboarding@resend.dev>', 
          to: [email],
          subject: `${otp} is your Roommate Link ID Token`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
              <h2 style="color: #4f46e5;">UCC Student Verification</h2>
              <p>Welcome to Roommate Link. Use the token below to confirm your student identity:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                This token expires in 10 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          `,
        }),
      })

      const resData = await res.json()
      
      if (!res.ok) {
        console.error('Resend Error:', resData)
        if (res.status === 422 || res.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'SERVICE_BUSY', 
            message: 'Verification service is sync-limited/busy today. Try again tomorrow morning.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          })
        }
        throw new Error('Verification mailer failed.')
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // --- CASE 2: CONFIRM CODE ---
    if (action === 'CONFIRM_CODE') {
      const { data: record, error: fetchError } = await adminClient
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !record) {
        return new Response(JSON.stringify({ error: 'INVALID_CODE', message: 'Invalid or expired token.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
        })
      }

      const { error: updateError } = await adminClient
        .from('users')
        .update({ 
           is_student_verified: true,
           student_email: email 
        })
        .eq('auth_id', userId)

      if (updateError) throw updateError

      await adminClient.from('verification_codes').delete().eq('id', record.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

