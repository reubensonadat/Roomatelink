import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/signout
 * 
 * Signs the user out and redirects to auth page
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Create Supabase client
    const supabase = await createClient()
    
    // 2. Sign out the user
    await supabase.auth.signOut()
    
    // 3. Return success response (client will handle redirect)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}
