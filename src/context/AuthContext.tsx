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
      
      const watchdog = setTimeout(() => {
        if (loading && isMounted) {
          setLoading(false)
        }
      }, 12000)

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (!isMounted) return

        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        if (initialSession?.user) {
          // Instant Load from Cache
          const cached = localStorage.getItem(`roommate_profile_${initialSession.user.id}`)
          if (cached) {
            setProfile(JSON.parse(cached))
            setLoading(false)
          }

          // Background Sync
          const profileData = await fetchProfile(initialSession.user.id)
          if (isMounted) {
            setProfile(profileData)
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) setLoading(false)
      } finally {
        clearTimeout(watchdog)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, currentSession: any) => {
        console.log(`--- AuthProvider: Auth Changed [${event}] ---`)
        
        if (!isMounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          
          if (currentSession?.user) {
            // Hot cache update
            const cached = localStorage.getItem(`roommate_profile_${currentSession.user.id}`)
            if (cached) setProfile(JSON.parse(cached))

            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
        }

        if (isMounted) setLoading(false)
      }
    )

    const heartbeat = setInterval(async () => {
      if (!isMounted) return
      const { data: { session: activeSession } } = await supabase.auth.getSession()
      if (activeSession && isMounted) {
        setSession(activeSession)
        setUser(activeSession.user)
      }
    }, 15 * 60 * 1000)

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
