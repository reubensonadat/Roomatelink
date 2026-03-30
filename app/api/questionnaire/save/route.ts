import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/questionnaire/save
 * 
 * Saves questionnaire answers for the current user
 * 
 * Request body:
 * {
 *   answers: Record<string, string>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { answers } = body
    
    // 2. Validate input
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }
    
    // 3. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to save answers.' },
        { status: 401 }
      )
    }
    
    // 4. Get the public user's internal ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Failed to get student profile:', profileError)
      return NextResponse.json(
        { error: 'Student profile not found. Please complete profile setup first.' },
        { status: 400 }
      )
    }
    
    // 5. Save the answers to questionnaire_responses
    const { error: saveError } = await supabase
      .from('questionnaire_responses')
      .upsert({
        user_id: profile.id,
        answers: answers,
        completed_at: new Date().toISOString()
      })
    
    if (saveError) {
      console.error('Save answers error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save answers. Try again.' },
        { status: 500 }
      )
    }
    
    // 6. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Save questionnaire error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
