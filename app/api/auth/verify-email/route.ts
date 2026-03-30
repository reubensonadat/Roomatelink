export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/verify-email
 * 
 * Verifies a university email address
 * Now supports manual entry for users who signed up with Gmail
 * Checks the provided email domain against the university_domains table
 * 
 * Request body:
 * {
 *   email?: string  // Optional - if not provided, uses user's login email
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { email: manualEmail } = body
    
    // 2. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 3. Use manual email if provided, otherwise fallback to their login email
    const targetEmail = manualEmail || user.email
    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No email found to verify' },
        { status: 400 }
      )
    }
    
    // 4. Validate email format
    const domain = targetEmail.split('@')[1]
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // 5. Check against our whitelist table
    const { data: university, error: domainError } = await supabase
      .from('university_domains')
      .select('id, university_name')
      .eq('email_domain', domain)
      .single()
    
    if (domainError || !university) {
      return NextResponse.json(
        { error: `The domain @${domain} is not currently a recognized University domain on our platform.` },
        { status: 400 }
      )
    }
    
    // 6. Domain matches! Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_student_verified: true,
        student_email: targetEmail, // Store the verified student email
        university_id: university.id 
      })
      .eq('auth_id', user.id)
    
    if (updateError) {
      console.error('Update verification status error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      )
    }
    
    // 7. Return success response
    return NextResponse.json({ 
      success: true, 
      university: university.university_name 
    })
    
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
