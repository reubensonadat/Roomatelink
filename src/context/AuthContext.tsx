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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helpers for synchronous hydration to prevent "Loading Session" flash
const getLocalSession = (): Session | null => {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (key) {
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      // Supabase v2 stores the session object directly, not wrapped in { session: ... }
      if (data && data.access_token) {
        return data as Session
      }
      return null
    }
  } catch (e) {
    return null
  }
  return null
}

const getLocalProfile = (userId: string) => {
  try {
    const cached = localStorage.getItem(`roommate_profile_${userId}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1. Initialize states synchronously from Local Storage to prevent any flash!
  const initialSession = getLocalSession()
  const initialUser = initialSession?.user ?? null
  const initialProfile = initialUser ? getLocalProfile(initialUser.id) : null

  const [user, setUser] = useState<User | null>(initialUser)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [profile, setProfile] = useState<any | null>(initialProfile)
  
  // If we already have a session, we are NOT loading. Instant rendering!
  const [loading, setLoading] = useState(initialSession ? false : true)

  const fetchProfile = async (userId: string, retries = 1): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle()
      
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
      // We still update the state from the actual async Supabase call to catch expired tokens
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (activeSession) {
          setSession(activeSession)
          setUser(activeSession.user)
          
          // Background Sync Profile
          const profileData = await fetchProfile(activeSession.user.id, 2)
          if (isMounted) {
            setProfile(profileData)
            setLoading(false)
          }
        } else {
          // If Supabase says we actually don't have a session, clear the optimistic cache
          if (isMounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          
          if (currentSession?.user) {
            const cached = getLocalProfile(currentSession.user.id)
            if (cached && !profile) {
              setProfile(cached)
            }
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          // Clean profiles cache
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith('roommate_profile_')) localStorage.removeItem(key)
          }
        } else if (event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) setProfile(profileData)
          }
        }

        if (isMounted && event !== 'SIGNED_IN') setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
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
    try {
      // 1. Let Supabase properly invalidate the token on server and wipe its internal caching
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Signout error:', error)
    } finally {
      // 2. Wipe memory states immediately
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // 3. Clear our custom Profile cache explicitly
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('roommate_profile_')) {
          localStorage.removeItem(key)
        }
      }
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

  const refreshProfile = async () => {
    if (!user) return
    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, signInWithGoogle, refreshProfile }}>
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
