export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

/**
 * POST /api/auth/signup
 * 
 * Signs up a new user with email and password
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
    
    // 3. Get origin for email redirect
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const origin = `${protocol}://${host}`
    
    // 4. Create Supabase client
    const supabase = await createClient()
    
    // 5. Sign up with email and password
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After clicking the email verification link, send them here
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to sign up' },
        { status: 400 }
      )
    }
    
    // 6. Return success response
    return NextResponse.json({ 
      success: 'Check your email for a verification link!' 
    })
    
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
