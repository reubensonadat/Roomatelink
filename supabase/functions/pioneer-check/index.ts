import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
declare const Deno: any;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1. Verify user's identity securely inside Deno (bypassing Kong strict clock skew)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const authClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized or invalid token')
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Fetch the user's profile row to get their created_at timestamp
    const { data: profileRow } = await adminClient
      .from('users')
      .select('created_at')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!profileRow || !profileRow.created_at) {
      // If we can't find their profile or timestamp, they can't be a pioneer
      return new Response(
        JSON.stringify({ isPioneer: false, reason: "No profile timeline found." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 3. Count how many users signed up BEFORE or at the EXACT SAME TIME as this user
    const { count, error: countError } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', profileRow.created_at)

    if (countError) {
      throw countError
    }

    // PIONEER LIMIT IS SET TO 100 STUDENTS
    const isPioneer = count !== null && count <= 100

    return new Response(
      JSON.stringify({ 
        isPioneer,
        rank: count 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
