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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Catch error fetching profile:', err)
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('--- AuthProvider: Initializing ---')
      
      // WATCHDOG TIMER: Force loading to false after 10 seconds to prevent "Infinite Refresh Hang"
      const watchdog = setTimeout(() => {
        if (loading) {
          console.warn('--- AuthProvider: Watchdog forced loading to false (Timeout) ---')
          setLoading(false)
        }
      }, 10000)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        clearTimeout(watchdog)
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log(`--- AuthProvider: Auth Changed [${event}] ---`)
        try {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error('Auth state change error:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    // 15-minute Heartbeat to ensure session remains active and token refreshes
    const heartbeat = setInterval(async () => {
      console.log('--- AuthProvider: Session Heartbeat Check ---')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        setUser(session.user)
      }
    }, 15 * 60 * 1000)

    return () => {
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
