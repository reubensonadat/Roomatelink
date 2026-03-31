import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/pioneer/claim
 * 
 * Grants free Premium to a Pioneer user (first 100)
 * Sets has_paid=true and is_pioneer=true without going through Paystack
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 2. Re-verify eligibility before granting (defense against abuse)
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if ((count ?? 0) >= 100) {
      return NextResponse.json(
        { error: 'Pioneer slots are full. Please proceed with payment.' },
        { status: 400 }
      )
    }
    
    // 3. Grant Pioneer access
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        has_paid: true,
        is_pioneer: true
      })
      .eq('auth_id', user.id)
    
    if (updateError) {
      console.error('Claim pioneer access error:', updateError)
      return NextResponse.json(
        { error: 'Failed to grant Pioneer access. Please try again.' },
        { status: 500 }
      )
    }
    
    // 4. Return success response
    return NextResponse.json({ 
      success: 'Pioneer access granted! Enjoy free Premium.' 
    })
    
  } catch (error) {
    console.error('Claim pioneer access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
