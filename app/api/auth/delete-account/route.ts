export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/delete-account
 * 
 * Deletes the user's account and all associated data
 * Uses service role key to bypass RLS and delete auth user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete your account.' },
        { status: 401 }
      )
    }
    
    // 2. Create admin client (bypasses Row Level Security)
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    // 3. Delete user's row from public.users first
    // (This also cascades to delete questionnaire_responses, matches, messages, reports)
    const { error: profileError } = await adminClient
      .from('users')
      .delete()
      .eq('auth_id', user.id)
    
    if (profileError) {
      console.error('Failed to delete profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete your profile data. Please try again.' },
        { status: 400 }
      )
    }
    
    // 4. Delete from auth.users (the login credentials)
    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)
    
    if (authError) {
      console.error('Failed to delete auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to delete your authentication. Please contact support.' },
        { status: 400 }
      )
    }
    
    // 5. Sign out the (now-deleted) user
    await supabase.auth.signOut()
    
    // 6. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
