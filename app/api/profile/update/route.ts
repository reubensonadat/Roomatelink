import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/profile/update
 * 
 * Updates the user's profile information
 * 
 * Request body:
 * {
 *   fullName: string
 *   phone: string
 *   course: string
 *   level: string
 *   bio: string
 *   avatarUrl: string
 *   gender: 'M' | 'F'
 *   matchPref: 'same' | 'any'
 *   matchingStatus: 'ACTIVE' | 'HIDDEN' | 'COMPLETED'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get user from Supabase Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 2. Parse request body
    const body = await request.json()
    
    // 3. Validate required fields
    if (!body.fullName || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }
    
    // 4. Update profile in database
    const { error } = await supabase
      .from('users')
      .update({
        full_name: body.fullName,
        phone_number: body.phone,
        course: body.course,
        level: parseInt(body.level),
        bio: body.bio,
        avatar_url: body.avatarUrl,
        gender: body.gender === 'M' ? 'MALE' : 'FEMALE',
        gender_pref: body.matchPref === 'same' ? 'SAME_GENDER' : 'ANY_GENDER',
        status: body.matchingStatus, // ACTIVE, HIDDEN, or COMPLETED
      })
      .eq('auth_id', user.id)
    
    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: 400 }
      )
    }
    
    // 5. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
