import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { UserProfile } from '../types/database'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isSessionLoading: boolean
  isProfileLoading: boolean
  isInitializing: boolean
  isHydrated: boolean
  isTrafficHeavy: boolean
  setIsTrafficHeavy: (value: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; success?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  refreshProfile: (force?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth event logger for production debugging
const logAuthEvent = (event: string, details?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[Auth] ${timestamp} - ${event}`, details || '')
}

// Helper to get cached profile from localStorage
const getLocalProfile = (userId: string) => {
  try {
    const cached = localStorage.getItem(`roommate_profile_${userId}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with null - let Supabase handle session restoration asynchronously
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Granular loading states
  const [isInitializing, setIsInitializing] = useState(true) // NEW: Track initial auth check
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isTrafficHeavy, setIsTrafficHeavy] = useState(false)

  // useRef for activity tracking to prevent endless re-renders
  const lastActivityRef = useRef<number>(Date.now())
  
  // Ref to prevent stale closures when mapping cached data
  const profileRef = useRef<UserProfile | null>(null)
  const lastRefreshRef = useRef<number>(0)
  
  // Ref to track last visibility refresh to prevent rapid-fire calls
  const lastVisibilityRefreshRef = useRef<number>(0)

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

  // Phase 1: Explicit session check on mount to prevent race condition
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        logAuthEvent('INITIAL_SESSION_CHECK', 'Starting session verification...')
        
        // Explicit getSession() call to verify session exists
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (error) {
          logAuthEvent('SESSION_CHECK_ERROR', error.message)
          setIsSessionLoading(false)
          setIsInitializing(false)
          setIsHydrated(true)
          return
        }

        if (currentSession) {
          logAuthEvent('SESSION_FOUND', `User ID: ${currentSession.user.id}`)
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Load cached profile immediately
          const cached = getLocalProfile(currentSession.user.id)
          if (cached) {
            updateProfile(cached)
            profileRef.current = cached
          }

          // Fetch fresh profile data
          setIsProfileLoading(true)
          const profileData = await fetchProfile(currentSession.user.id, 2)
          if (isMounted) {
            updateProfile(profileData)
            setIsProfileLoading(false)
            lastRefreshRef.current = Date.now()
          }
        } else {
          logAuthEvent('NO_SESSION', 'No active session found')
          setSession(null)
          setUser(null)
          updateProfile(null)
          setIsProfileLoading(false)
        }

        setIsSessionLoading(false)
        setIsHydrated(true)
      } catch (err) {
        logAuthEvent('INITIALIZATION_ERROR', err)
        if (isMounted) {
          setIsSessionLoading(false)
          setIsProfileLoading(false)
          setIsHydrated(true)
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener for ongoing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        logAuthEvent('AUTH_STATE_CHANGE', { event, hasSession: !!currentSession })
        
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsSessionLoading(false)
        setIsHydrated(true)
        
        // Unblock UI if getSession() is still hanging
        if (isInitializing) setIsInitializing(false)

        // Token refresh failure — must be BEFORE the user guard
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          logAuthEvent('TOKEN_REFRESH_FAILED', 'Token refresh returned null session')
          toast.error('Your session could not be refreshed. Please sign in again.')
          updateProfile(null)
          setIsProfileLoading(false)
          return
        }

        if (currentSession?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setIsProfileLoading(true)

            // Handle token refresh failures
            if (event === 'TOKEN_REFRESHED') {
              logAuthEvent('TOKEN_REFRESHED', 'Token was successfully refreshed')
            }

            const cached = getLocalProfile(currentSession.user.id)
            if (cached && !profileRef.current) {
              updateProfile(cached)
            }

            const profileData = await fetchProfile(currentSession.user.id, 2)
            if (isMounted) {
              updateProfile(profileData)
              setIsProfileLoading(false)
              lastRefreshRef.current = Date.now()
            }
          }
        } else if (event === 'SIGNED_OUT') {
          logAuthEvent('SIGNED_OUT', 'User signed out')
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
      if (isInitializing) {
        logAuthEvent('INITIALIZATION_TIMEOUT', 'Forcing initialization to complete')
        setIsInitializing(false)
        changed = true
      }
      if (isSessionLoading) {
        logAuthEvent('SESSION_LOADING_TIMEOUT', 'Forcing session loading to complete')
        setIsSessionLoading(false)
        changed = true
      }
      if (isProfileLoading) {
        logAuthEvent('PROFILE_LOADING_TIMEOUT', 'Forcing profile loading to complete')
        setIsProfileLoading(false)
        changed = true
      }
      if (changed) setIsHydrated(true)
    }, 12000) // Increased to 12 seconds for slow networks
    return () => clearTimeout(timer)
  }, [isInitializing, isSessionLoading, isProfileLoading])

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

  // Visibility and focus handlers for PWA resume
  useEffect(() => {
    if (!user) return

    const VISIBLE_REFRESH_COOLDOWN = 5000 // 5 second cooldown

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const timeSinceLastRefresh = now - lastVisibilityRefreshRef.current
        
        // Debounce: Skip if we just refreshed recently
        if (timeSinceLastRefresh < VISIBLE_REFRESH_COOLDOWN) {
          logAuthEvent('VISIBILITY_CHANGE', `Skipped (cooldown: ${timeSinceLastRefresh}ms)`)
          return
        }

        logAuthEvent('VISIBILITY_CHANGE', 'Tab became visible - refreshing session')
        // Proactive Session Resurrection: Refresh session on wake
        const { data: { session: s }, error } = await supabase.auth.getSession()
        
        // Only sign out on actual auth errors, not lock contention or network issues
        if (error) {
          // Check if this is a real auth error or just a lock/network issue
          const isAuthError = error.name === 'AuthApiError' ||
                           error.message?.toLowerCase().includes('invalid') ||
                           error.message?.toLowerCase().includes('expired')
          
          if (isAuthError) {
            logAuthEvent('SESSION_REFRESH_ERROR', error.message)
            // Session expired - handle gracefully
            toast.error('Your session has expired. Please sign in again.')
            await signOut()
            return
          } else {
            // Lock contention or network issue - don't sign out, just log
            logAuthEvent('SESSION_REFRESH_SKIPPED', `Non-auth error: ${error.message}`)
            lastVisibilityRefreshRef.current = now
            return
          }
        }
        
        lastVisibilityRefreshRef.current = now
        
        if (s) {
          setSession(s)
          setUser(s.user)
        } else {
          // Session was lost - sign out gracefully
          logAuthEvent('SESSION_LOST', 'Session was lost on visibility change')
          toast.error('Your session has expired. Please sign in again.')
          await signOut()
        }
      }
    }

    const handleFocus = () => {
      // Secondary handshake for PWA/Mobile resume
      // Also debounce focus events
      const now = Date.now()
      const timeSinceLastRefresh = now - lastVisibilityRefreshRef.current
      
      if (timeSinceLastRefresh < VISIBLE_REFRESH_COOLDOWN) {
        return
      }
      
      logAuthEvent('WINDOW_FOCUS', 'Window regained focus - refreshing profile')
      lastVisibilityRefreshRef.current = now
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
      setIsHydrated(true)

      // 3. Forcefully clear ALL relevant caches (Profile and orphaned Supabase Auth tokens)
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

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!user || !session) return

    const validateSession = async () => {
      try {
        logAuthEvent('PERIODIC_SESSION_VALIDATION', 'Checking session validity...')
        const { data: { session: s }, error } = await supabase.auth.getSession()
        
        if (error || !s) {
          logAuthEvent('SESSION_VALIDATION_FAILED', error?.message || 'Session is invalid')
          toast.error('Your session has expired. Please sign in again.')
          await signOut()
        }
      } catch (err) {
        logAuthEvent('SESSION_VALIDATION_ERROR', err)
      }
    }

    // Validate every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, session])

  const refreshProfile = async (force = false) => {
    if (!user) return
    
    // Throttle: Skip if refreshed in the last 10 minutes, unless forced
    const now = Date.now()
    if (!force && now - lastRefreshRef.current < 10 * 60 * 1000) {
      return
    }

    logAuthEvent('REFRESH_PROFILE', 'Refreshing user profile')
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
      isInitializing,
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
