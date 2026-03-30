export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/reset-password
 * 
 * Sends a password reset email to the user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'No email found for this account' },
        { status: 400 }
      )
    }
    
    // 2. Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send reset email' },
        { status: 400 }
      )
    }
    
    // 3. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
