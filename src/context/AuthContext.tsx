import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { UserProfile } from '../types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isSessionLoading: boolean
  isProfileLoading: boolean
  isHydrated: boolean
  isTrafficHeavy: boolean
  setIsTrafficHeavy: (value: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; success?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helpers for synchronous hydration to prevent "Loading Session" flash
// KEPT INTACT: Existing synchronous hydration logic
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
  // KEPT INTACT: Initialize states synchronously from Local Storage to prevent any flash!
  const initialSession = getLocalSession()
  const initialUser = initialSession?.user ?? null
  const initialProfile = initialUser ? getLocalProfile(initialUser.id) : null

  const [user, setUser] = useState<User | null>(initialUser)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile as UserProfile | null)

  // Phase 3: Granular loading states
  const [isSessionLoading, setIsSessionLoading] = useState(initialSession ? false : true)
  // Silent Refresh: Only block the UI if we have no profile data yet (cold start)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isTrafficHeavy, setIsTrafficHeavy] = useState(false)

  // Phase 1.1: useRef for activity tracking to prevent endless re-renders
  // CHANGED: Was useState, now useRef to prevent effect re-runs on every interaction
  const lastActivityRef = useRef<number>(Date.now())

  // Phase 1.4: Ref to prevent stale closures when mapping cached data
  const profileRef = useRef<UserProfile | null>(initialProfile as UserProfile | null)
  const lastRefreshRef = useRef<number>(0)

  // Helper to keep profile state and ref in sync
  // NEW: Helper to synchronize state and ref
  const updateProfile = (newProfile: UserProfile | null) => {
    setProfile(newProfile)
    profileRef.current = newProfile
  }

  // KEPT INTACT: Existing fetchProfile function
  const fetchProfile = async (userId: string, retries = 1): Promise<UserProfile | null> => {
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
      } else {
        // DB row is gone — evict the stale cache so isGenderLocked doesn't fire incorrectly
        localStorage.removeItem(`roommate_profile_${userId}`)
      }

      return data as UserProfile | null
    } catch (err) {
      return null
    }
  }

  // Phase 1.3: Removed redundant getSession() call, relying purely on onAuthStateChange
  // CHANGED: Removed initializeAuth() with getSession() call to prevent race condition
  useEffect(() => {
    let isMounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsSessionLoading(false)
        setIsHydrated(true)

        if (currentSession?.user) {
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setIsProfileLoading(true)

            // Phase 1.4: Fixed stale closure bug by using profileRef
            const cached = getLocalProfile(currentSession.user.id)
            if (cached && !profileRef.current) {
              updateProfile(cached as UserProfile)
            }

            const profileData = await fetchProfile(currentSession.user.id, 2)
            if (isMounted) {
              updateProfile(profileData)
              setIsProfileLoading(false)
              lastRefreshRef.current = Date.now()
            }
          }
        } else if (event === 'SIGNED_OUT') {
          updateProfile(null)
          setIsProfileLoading(false)
          setIsSessionLoading(false)
          setIsHydrated(true)
          // Clean profiles cache
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith('roommate_profile_')) localStorage.removeItem(key)
          }
        } else if (event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) {
              updateProfile(profileData)
            }
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ─── Hard Timeout Failsafe ─────────────────────────────────────────
  // If loading states stay true too long, something silently failed.
  // Force unlock to prevent "permanent loading" hangups.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let changed = false
      if (isSessionLoading) {
        console.warn('AuthContext: Session loading timeout')
        setIsSessionLoading(false)
        changed = true
      }
      if (isProfileLoading) {
        console.warn('AuthContext: Profile loading timeout')
        setIsProfileLoading(false)
        changed = true
      }
      if (changed) setIsHydrated(true)
    }, 6000) // 6 second hard cap for critical auth auth
    return () => clearTimeout(timer)
  }, [isSessionLoading, isProfileLoading])

  // Phase 1.2: Effect A - Activity Heartbeat (2-min DB update)
  // NEW: Split from monolithic effect, depends only on [user]
  useEffect(() => {
    if (!user) return

    const updateActivity = async () => {
      try {
        // Silently update last_active to track online status
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('auth_id', user.id)
      } catch (err) {
        // Heartbeat errors should not interrupt the user experience
      }
    }

    // Update immediately on mount/session start
    updateActivity()

    // Update every 2 minutes while the tab is active
    const interval = setInterval(updateActivity, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])



  // NEW: Global activity listener to update the ref silently
  // CHANGED: Was part of monolithic effect, now independent
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    activityEvents.forEach(event => window.addEventListener(event, handleActivity))

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [])

  // KEPT INTACT: Existing visibility and focus handlers (moved to separate effect)
  useEffect(() => {
    if (!user) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Proactive Session Resurrection: Refresh session on wake
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s) {
            setSession(s)
            setUser(s.user)
          }
        })
      }
    }

    const handleFocus = () => {
      // Secondary handshake for PWA/Mobile resume
      refreshProfile()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // KEPT INTACT: Existing auth methods
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
      // 1. Let Supabase properly invalidate the token on server, with a 2s timeout to prevent locks
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
      await Promise.race([supabase.auth.signOut(), timeout]);
    } catch (error) {
      console.warn('Signout logic timeout/error:', error)
    } finally {
      // 2. Wipe memory states immediately
      setSession(null)
      setUser(null)
      updateProfile(null)
      setIsSessionLoading(false)
      setIsProfileLoading(false)
      setIsHydrated(false)

      // 3. Forcefully clear ALL relevant caches (Profile and orphaned Supabase Auth tokens)
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('roommate_profile_') || key.startsWith('sb-')) {
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

  const refreshProfile = async (force = false) => {
    if (!user) return
    
    // Throttle: Skip if refreshed in the last 10 minutes, unless forced
    const now = Date.now()
    if (!force && now - lastRefreshRef.current < 10 * 60 * 1000) {
      return
    }

    const profileData = await fetchProfile(user.id)
    updateProfile(profileData)
    lastRefreshRef.current = now
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isSessionLoading,
      isProfileLoading,
      isHydrated,
      isTrafficHeavy,
      setIsTrafficHeavy,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      refreshProfile
    }}>
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
