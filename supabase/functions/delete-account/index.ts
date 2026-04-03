import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore - Deno types for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1. Initialize a generic client with the user's Auth Header to confirm identity
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const authClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await authClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized or invalid token')
    }

    // 2. Initialize Admin Client to bypass RLS and physically wipe the auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Look up the PROFILE ID (public.users.id) from the AUTH ID (auth.users.id)
    // This is critical: messages, matches, questionnaire_responses all reference
    // the profile UUID (public.users.id), NOT the auth UUID.
    const { data: profileRow } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileRow) {
      const profileId = profileRow.id

      // Manual cascading deletes using the PROFILE ID (not auth ID)
      await Promise.all([
        adminClient.from('messages').delete().eq('sender_id', profileId),
        adminClient.from('messages').delete().eq('receiver_id', profileId),
        adminClient.from('matches').delete().eq('user_a_id', profileId),
        adminClient.from('matches').delete().eq('user_b_id', profileId),
        adminClient.from('questionnaire_responses').delete().eq('user_id', profileId),
        adminClient.from('reports').delete().eq('reporter_id', profileId),
        adminClient.from('reports').delete().eq('reported_id', profileId),
      ])

      // Delete the public.users record itself
      await adminClient.from('users').delete().eq('id', profileId)
    }

    // 4. Delete the root authentication user
    const { error: deletionError } = await adminClient.auth.admin.deleteUser(user.id)
    
    if (deletionError) {
      throw deletionError
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account entirely removed." }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
