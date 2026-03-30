import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will securely refresh the session if expired.
  // We MUST use getUser() instead of getSession() to guarantee the token isn't forged locally.
  const { data: { user } } = await supabase.auth.getUser()

  // ROUTE PROTECTION BOUNCER LOGIC
  const path = request.nextUrl.pathname;

  // 1. If user is NOT logged in and trying to access a secure route like /dashboard or /profile
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/profile'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // 2. If user IS logged in but tries to go to the login/auth page again
  //    EXCEPTION: /auth/callback MUST always be accessible — it's where Google sends
  //    students back after login. Blocking it breaks the entire OAuth flow.
  if (user && path.startsWith('/auth') && !path.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
