import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/pioneer/check-status
 * 
 * Returns whether the current user qualifies for free Pioneer access
 * A user is a Pioneer if the total number of registered users is < 100
 * AND they haven't already paid
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { isPioneer: false, userCount: 0 },
        { status: 401 }
      )
    }
    
    // 2. Count total users in the platform
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    const totalUsers = count ?? 0
    const isPioneer = totalUsers < 100
    
    // 3. Return pioneer status
    return NextResponse.json({ 
      isPioneer, 
      userCount: totalUsers 
    })
    
  } catch (error) {
    console.error('Check pioneer status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
