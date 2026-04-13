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
  isNetworkTimeout: boolean
  isTrafficHeavy: boolean
  setIsTrafficHeavy: (value: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; success?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  refreshProfile: (force?: boolean) => Promise<void>
  // NEW: Expose updateProfile for optimistic updates (bypasses 10-minute throttle)
  updateProfile: (newProfile: UserProfile | null) => void
  // NEW: Global recovery trigger for system-wide data sync (returns Promise that resolves when sync completes)
  triggerGlobalSync: () => Promise<boolean>
  forceSync: number
  // NEW: Resolve the sync Promise - called by useDashboardData to report success/failure
  resolveGlobalSync: (success: boolean) => void
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
  const [isNetworkTimeout, setIsNetworkTimeout] = useState(false)
  const [isTrafficHeavy, setIsTrafficHeavy] = useState(false)

  // NEW: Global recovery trigger for system-wide data sync (incrementing counter to prevent "Click Twice" failure)
  const [forceSync, setForceSync] = useState(0)

  // NEW: Promise resolver ref for Force Refresh button - guarantees Promise always resolves
  const syncResolverRef = useRef<((success: boolean) => void) | null>(null)

  // useRef for activity tracking to prevent endless re-renders
  const lastActivityRef = useRef<number>(Date.now())

  // Ref to prevent stale closures when mapping cached data
  const profileRef = useRef<UserProfile | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const lastRefreshRef = useRef<number>(0)

  // Helper to keep profile state and ref in sync
  // NEW: Helper to synchronize state and ref
  const updateProfile = (newProfile: UserProfile | null) => {
    setProfile(newProfile)
    profileRef.current = newProfile
  }

  // Keep session ref in sync for visibility handler (avoids stale closures + excessive re-registrations)
  const updateSession = (newSession: Session | null) => {
    setSession(newSession)
    sessionRef.current = newSession
  }

  // NEW: Global recovery trigger function (returns Promise that resolves when sync completes)
  const triggerGlobalSync = () => {
    return new Promise<boolean>((resolve) => {
      syncResolverRef.current = resolve
      setForceSync(prev => prev + 1)
    })
  }

  // NEW: Resolve the sync Promise - called by useDashboardData to report success/failure
  const resolveGlobalSync = (success: boolean) => {
    if (syncResolverRef.current) {
      syncResolverRef.current(success)
      syncResolverRef.current = null // Set to null so finally block knows it was already handled
    }
  }

  // KEPT INTACT: Existing fetchProfile function
  // FIXED: Removed nested retry logic - supabase.ts now handles all network retries
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle()

      if (error) {
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
          updateSession(currentSession)
          setUser(currentSession.user)

          // Load cached profile immediately
          const cached = getLocalProfile(currentSession.user.id)
          if (cached) {
            updateProfile(cached)
            profileRef.current = cached
          }

          // Fetch fresh profile data
          setIsProfileLoading(true)
          const profileData = await fetchProfile(currentSession.user.id)
          if (isMounted) {
            updateProfile(profileData)
            setIsProfileLoading(false)
            lastRefreshRef.current = Date.now()
          }
        } else {
          logAuthEvent('NO_SESSION', 'No active session found')
          updateSession(null)
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
        // STRIP URL HASH: If there's an access_token in the URL, Supabase already read it.
        // Strip it now to prevent a phantom SIGNED_IN event 48 seconds later.
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }

        if (!isMounted) return

        logAuthEvent('AUTH_STATE_CHANGE', { event, hasSession: !!currentSession })

        updateSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsSessionLoading(false)
        setIsHydrated(true)

        // Unblock UI if getSession() is still hanging
        if (isInitializing) setIsInitializing(false)

        // Token refresh failure — must be BEFORE the user guard
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          logAuthEvent('TOKEN_REFRESH_FAILED', 'Token refresh returned null session — preserving cached profile')
          if (!profileRef.current) {
            toast.error('Your session could not be refreshed. Please sign in again.')
          }
          setIsNetworkTimeout(true)
          setIsProfileLoading(false)
          return
        }

        if (currentSession?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // FIXED: Add strict guard - skip fetch if we already have a profile
            // This prevents unnecessary network calls on background SIGNED_IN events
            if (event === 'SIGNED_IN' && profileRef.current) {
              return
            }

            // Only show loading spinner if we don't already have a profile
            if (!profileRef.current) {
              setIsProfileLoading(true)
            }

            // Handle token refresh failures
            if (event === 'TOKEN_REFRESHED') {
              logAuthEvent('TOKEN_REFRESHED', 'Token was successfully refreshed')
              // Reset network timeout flag on successful recovery
              setIsNetworkTimeout(false)
            }

            const cached = getLocalProfile(currentSession.user.id)
            if (cached && !profileRef.current) {
              updateProfile(cached)
            }

            const profileData = await fetchProfile(currentSession.user.id)
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
      if (changed) {
        setIsNetworkTimeout(true)
        setIsHydrated(true)
      }
    }, 20000) // Increased to 20 seconds for slow networks (supabase retry can take up to 16s)
    return () => clearTimeout(timer)
  }, [isInitializing, isSessionLoading, isProfileLoading])

  // Phase 1.2: Effect A - Activity Heartbeat (initial DB update only)
  // NEW: Split from monolithic effect, depends only on [user]
  // FIXED: Removed 2-minute interval to prevent mobile TCP connection poisoning
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

    // Update immediately on mount/session start only
    updateActivity()
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

  // Mobile PWA wake-up fix for 1-hour JWT expiration
  // Mobile OS suspends JS execution, killing background auto-refresh timer.
  // When user opens app, visibilityState === 'visible' fires.
  // We must call refreshSession() ONLY if token is expired/expiring,
  // because Supabase's internal handler already handles non-expired tokens on refocus.
  // Without this guard, both handlers race to use same single-use refresh token,
  // causing second request to fail and potentially wipe user's profile.
  useEffect(() => {
    // Helper: Check if JWT is expired or about to expire (60s buffer)
    const isTokenExpiredOrExpiring = (token: string, bufferSeconds = 60): boolean => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiresAt = payload.exp * 1000
        return Date.now() > expiresAt - bufferSeconds * 1000
      } catch {
        return true // If we can't parse it, assume expired — safe to refresh
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        const currentSession = sessionRef.current

        // GUARD: Only explicitly refresh if token is expired/expiring.
        // If token is still valid, Supabase's internal visibility handler already covers it.
        if (currentSession?.access_token && !isTokenExpiredOrExpiring(currentSession.access_token)) {
          logAuthEvent('WAKEUP_SKIP', 'Token still valid, letting Supabase internal handler manage refresh')
          return
        }

        logAuthEvent('WAKEUP_REFRESH', 'Token expired/expiring, forcing explicit refreshSession()')
        try {
          const { error } = await supabase.auth.refreshSession()
          if (error) {
            console.warn('[Auth] Wake-up refresh failed. Network may be dead.', error)
          } else {
            // Reset network timeout flag on successful recovery
            setIsNetworkTimeout(false)
          }
        } catch (err) {
          console.error('[Auth] Wake-up refresh exception:', err)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
      updateSession(null)
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
      isNetworkTimeout,
      isTrafficHeavy,
      setIsTrafficHeavy,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      refreshProfile,
      // NEW: Expose updateProfile for optimistic updates (bypasses 10-minute throttle)
      updateProfile,
      triggerGlobalSync,
      forceSync,
      resolveGlobalSync
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
