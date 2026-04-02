import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; success?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, retries = 1): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single()
      
      if (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchProfile(userId, retries - 1)
        }
        return null
      }

      if (data) {
        localStorage.setItem(`roommate_profile_${userId}`, JSON.stringify(data))
      }
      
      return data
    } catch (err) {
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      console.log('--- AuthProvider: Initializing ---')
      
      try {
        // 1. Instant check for session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          
          // 2. IMMEDIATE Cache Hydration (Sync-like feel)
          const cached = localStorage.getItem(`roommate_profile_${initialSession.user.id}`)
          if (cached) {
            try {
              const profileData = JSON.parse(cached)
              if (profileData && isMounted) {
                setProfile(profileData)
                // If we have valid cache, we can flip loading=false NOW for instant UI.
                // Background sync will update it later if needed.
                setLoading(false) 
              }
            } catch (e) {
              console.warn('Malformed cache, clearing...')
              localStorage.removeItem(`roommate_profile_${initialSession.user.id}`)
            }
          }

          // 3. Background Verification (Mandatory Sync)
          const profileData = await fetchProfile(initialSession.user.id, 2)
          if (isMounted) {
            setProfile(profileData)
            setLoading(false)
          }
        } else {
          // No session found
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`--- AuthProvider: Auth Changed [${event}] ---`)
        
        if (!isMounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          
          if (currentSession?.user) {
            // Hot cache update (Try to show SOMETHING immediately)
            const cached = localStorage.getItem(`roommate_profile_${currentSession.user.id}`)
            if (cached && !profile) {
              try { setProfile(JSON.parse(cached)) } catch(e) {}
            }

            // Sync with DB
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) setProfile(profileData)
          }
        }

        if (isMounted && event !== 'SIGNED_IN') setLoading(false)
      }
    )

    // Periodic session verification (Heartbeat)
    const heartbeat = setInterval(async () => {
      if (!isMounted) return
      const { data: { session: activeSession } } = await supabase.auth.getSession()
      if (isMounted) {
        if (activeSession) {
          setSession(activeSession)
          setUser(activeSession.user)
        } else if (session) {
          // Session was lost, force logout
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      }
    }, 10 * 60 * 1000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearInterval(heartbeat)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      return { error }
    }
    
    return { error: null, success: 'Account created successfully! You can now sign in.' }
  }

  const signOut = async () => {
    console.log('--- AuthProvider: Forces-clearing session and signing out ---')
    
    // 1. Manually clear state IMMEDIATELY for instant UI response
    setSession(null)
    setUser(null)
    setProfile(null)
    setLoading(false)
    
    // 2. Clear known localStorage keys that can cause state hangs
    localStorage.removeItem('sb-token')
    localStorage.removeItem('supabase.auth.token')
    
    try {
      // 3. Attempt the Supabase call but don't wait for it to finish if it's hanging
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 800))
      ])
    } catch (error) {
      console.warn('Silent signout error:', error)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('Google sign in error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
