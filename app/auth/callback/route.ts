import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * THE REDIRECT HANDLER
 * 
 * This is where the "Redirect" fits in the puzzle:
 * 
 * 1. Student clicks "Sign in with Google" on your auth page
 * 2. Their browser flies over to Google's login screen
 * 3. Student picks their Google account
 * 4. Google sends them BACK to Supabase (the callback URL you pasted)
 * 5. Supabase verifies everything, then sends the student HERE
 * 6. THIS route catches them, gives them a secure cookie, 
 *    and routes them to the right page based on their progress
 * 
 * Without this file, the student would get stuck after Google login!
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile in our public.users table
        // The "Profile Keeper" trigger auto-creates one with defaults like:
        //   full_name = "New Student", course = null, level = null
        // So we grab those fields to check if onboarding is COMPLETE
        const { data: profile } = await supabase
          .from('users')
          .select('id, course, level')
          .eq('auth_id', user.id)
          .single()
        
        if (!profile) {
          // No profile at all — send to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        
        // Profile exists but is still at defaults (course/level not filled in)
        // This means the user signed up but never completed onboarding
        if (!profile.course || !profile.level) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        
        // Profile is complete — check if they've done the questionnaire
        const { data: questionnaire } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', profile.id)
          .single()
        
        if (!questionnaire) {
          return NextResponse.redirect(`${origin}/questionnaire`)
        }
      }
      
      // Default: they've done everything, send them to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something went wrong, redirect back to auth with an error
  return NextResponse.redirect(`${origin}/auth?error=Could+not+authenticate`)
}

