export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/signin
 * 
 * Signs in a user with email and password
 * 
 * Request body:
 * {
 *   email: string
 *   password: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { email, password } = body
    
    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // 3. Create Supabase client
    const supabase = await createClient()
    
    // 4. Sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // 5. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
