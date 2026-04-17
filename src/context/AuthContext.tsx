import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { UserProfile } from '../types/database'
import { toast } from 'sonner'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

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
  clearNetworkTimeout: () => void
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

/**
 * Synchronous Bootloader: Reads cached auth state from localStorage BEFORE React mounts.
 * This enables 0ms hydration — the dashboard appears on frame one with cached data.
 *
 * Returns nulls if:
 * - No cached session exists
 * - Session JSON is corrupted
 * - Token is expired (prevents FOUC — flash of unauthenticated content)
 */
function getInitialAuthState(): {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isHydrated: boolean
} {
  try {
    // 1. Extract project ref from Supabase URL to build the storage key
    // URL format: https://<ref>.supabase.co
    const url = import.meta.env.VITE_SUPABASE_URL || ''
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (!match) {
      return { session: null, user: null, profile: null, isHydrated: false }
    }
    const projectRef = match[1]

    // 2. Build the exact key Supabase uses: sb-<ref>-auth-token
    const storageKey = `sb-${projectRef}-auth-token`
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return { session: null, user: null, profile: null, isHydrated: false }
    }

    // 3. Parse the stored session
    const parsed = JSON.parse(raw)
    const currentSession = parsed?.session
    if (!currentSession) {
      return { session: null, user: null, profile: null, isHydrated: false }
    }

    // 4. CHECK TOKEN EXPIRATION (critical — prevents FOUC)
    // expires_at is in seconds, Date.now() is in milliseconds
    const expiresAt = currentSession.expires_at * 1000
    const now = Date.now()
    const bufferMs = 60 * 1000 // 60-second buffer
    
    if (now > expiresAt - bufferMs) {
      // Token is expired or about to expire — do NOT optimistically hydrate
      // Let the async initializeAuth() handle the refresh
      return { session: null, user: null, profile: null, isHydrated: false }
    }

    // 5. Token is valid — read cached profile too
    const cachedProfile = currentSession.user
      ? getLocalProfile(currentSession.user.id)
      : null

    return {
      session: currentSession,
      user: currentSession.user,
      profile: cachedProfile,
      isHydrated: true
    }
  } catch {
    // Corrupted localStorage — fail safely, do not crash
    return { session: null, user: null, profile: null, isHydrated: false }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous bootloader — pre-fill state from localStorage cache
  const initialState = getInitialAuthState()
  const [user, setUser] = useState<User | null>(initialState.user)
  const [session, setSession] = useState<Session | null>(initialState.session)
  const [profile, setProfile] = useState<UserProfile | null>(initialState.profile)

  // Granular loading states
  // If we have valid cached state, start unblocked. Otherwise, start blocked.
  const [isInitializing, setIsInitializing] = useState(!initialState.isHydrated)
  const [isSessionLoading, setIsSessionLoading] = useState(!initialState.isHydrated)
  const [isProfileLoading, setIsProfileLoading] = useState(!initialState.isHydrated)
  const [isHydrated, setIsHydrated] = useState(initialState.isHydrated)
  const [isNetworkTimeout, setIsNetworkTimeout] = useState(false)
  const [isTrafficHeavy, setIsTrafficHeavy] = useState(false)

  // NEW: Global recovery trigger for system-wide data sync (incrementing counter to prevent "Click Twice" failure)
  const [forceSync, setForceSync] = useState(0)

  // Track network connectivity status
  const { status } = useNetworkStatus()

  // Ref to track previous network state for transition detection
  const prevNetworkStatusRef = useRef<string>(status)

  // NEW: Promise resolver ref for Force Refresh button - guarantees Promise always resolves
  const syncResolverRef = useRef<((success: boolean) => void) | null>(null)

  // useRef for activity tracking to prevent endless re-renders
  const lastActivityRef = useRef<number>(Date.now())

  // Ref to prevent stale closures when mapping cached data
  const profileRef = useRef<UserProfile | null>(initialState.profile)
  const sessionRef = useRef<Session | null>(initialState.session)
  const userRef = useRef<User | null>(initialState.user)
  const lastRefreshRef = useRef<number>(0)

  // Ref to track live value of isNetworkTimeout for event listener access
  const isNetworkTimeoutRef = useRef<boolean>(false)

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

  // Keep user ref in sync for SIGNED_OUT toast (avoids stale closure)
  const updateUser = (newUser: User | null) => {
    setUser(newUser)
    userRef.current = newUser
  }

  // NEW: Global recovery trigger function (returns Promise that resolves when sync completes)
  const triggerGlobalSync = () => {
    return new Promise<boolean>((resolve) => {
      syncResolverRef.current = resolve
      setForceSync(prev => prev + 1)
    })
  }

  // NEW: Resolve the sync Promise - called by useDashboardData to report success/failure
  const clearNetworkTimeout = () => {
    setIsNetworkTimeout(false)
    isNetworkTimeoutRef.current = false
  }

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
        // DB row is gone — evict stale cache so isGenderLocked doesn't fire incorrectly
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
          updateUser(currentSession.user)

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
            if (profileData) {
              updateProfile(profileData)
            } else if (profileRef.current) {
              // fetchProfile failed (network/timeout) but we have cached data — preserve it
              logAuthEvent('PROFILE_FETCH_FAILED', 'Preserving cached profile after fetch failure')
              setIsNetworkTimeout(true)
              isNetworkTimeoutRef.current = true
            } else {
              // No cache AND no fresh data — genuine absence
              updateProfile(null)
            }
            setIsProfileLoading(false)
            lastRefreshRef.current = Date.now()
          }
        } else {
          logAuthEvent('NO_SESSION', 'No active session found')
          updateSession(null)
          updateUser(null)
          updateProfile(null)
          setIsSessionLoading(false)
          setIsProfileLoading(false)
          setIsHydrated(true)
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
        updateUser(currentSession?.user ?? null)
        setIsSessionLoading(false)
        setIsHydrated(true)

        // Unblock UI if getSession() is still hanging
        if (isInitializing) setIsInitializing(false)

        // Token refresh failure — must be BEFORE user guard
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          logAuthEvent('TOKEN_REFRESH_FAILED', 'Token refresh returned null session — preserving cached profile')
          if (!profileRef.current) {
            toast.error('Your session could not be refreshed. Please sign in again.')
          }
          setIsNetworkTimeout(true)
          isNetworkTimeoutRef.current = true
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
              isNetworkTimeoutRef.current = false
            }

            const cached = getLocalProfile(currentSession.user.id)
            if (cached && !profileRef.current) {
              updateProfile(cached)
            }

            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) {
              if (profileData) {
                updateProfile(profileData)
              } else if (profileRef.current) {
                // fetchProfile failed but we have cached data — preserve it
                logAuthEvent('PROFILE_FETCH_FAILED', 'Preserving cached profile after fetch failure in auth state change')
                setIsNetworkTimeout(true)
                isNetworkTimeoutRef.current = true
              } else {
                updateProfile(null)
              }
              setIsProfileLoading(false)
              lastRefreshRef.current = Date.now()
            }
          }
        } else if (event === 'SIGNED_OUT') {
          logAuthEvent('SIGNED_OUT', 'User signed out')
          // Use userRef (not user state) to avoid stale closure — callback captures initial values
          if (userRef.current) {
            toast.error('Your session has expired. Please sign in again.')
          }
          updateProfile(null)
          setIsProfileLoading(false)
          setIsSessionLoading(false)
          setIsHydrated(true)

          // Clean profiles cache
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith('roommate_profile_')) {
              localStorage.removeItem(key)
            }
          }
        } else if (event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id)
            if (isMounted) {
              if (profileData) {
                updateProfile(profileData)
              } else if (profileRef.current) {
                // fetchProfile failed but we have cached data — preserve it
                logAuthEvent('PROFILE_FETCH_FAILED', 'Preserving cached profile after USER_UPDATED fetch failure')
              }
              // Don't wipe profile on network error during USER_UPDATED
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
        isNetworkTimeoutRef.current = true
        setIsHydrated(true)
      }
    }, 20000) // Increased to 20 seconds for slow networks (supabase retry can take up to 16s)
    return () => clearTimeout(timer)
  }, [isInitializing, isSessionLoading, isProfileLoading])

  // ─── Network Recovery 1: Standard Transition + Liar Radio Fallback ─────────
  // 1. Standard Transition: offline -> online (Phone radio fully cycled through offline)
  // 2. Liar Radio Fallback: If we are marked offline but phone sensor says 'online'
  //    (because mobile radios stay 'online' even when TCP drops), verify via ping.
  useEffect(() => {
    const isTransition = prevNetworkStatusRef.current === 'offline' && status === 'online'
    const isLiarRadio = !isTransition && status === 'online' && isNetworkTimeoutRef.current

    if (isTransition || isLiarRadio) {
      setIsNetworkTimeout(false)
      isNetworkTimeoutRef.current = false
      setForceSync(prev => prev + 1)
      logAuthEvent('NETWORK_RESTORED', `Triggered by: ${isTransition ? 'offline->online transition' : 'Liar Radio fallback'}`)

      // ─── Offline Queue: Retry Pending Match Calculation ─────────
      // If questionnaire was saved but match-calculate failed, retry now
      const needsMatchCalculation = localStorage.getItem('needsMatchCalculation')
      if (needsMatchCalculation === 'true' && user && session) {
        logAuthEvent('MATCH_CALCULATION_RETRY', 'Retrying match calculation after network recovery')
        
        // Retry match-calculate with exponential backoff
        const retryMatchCalculate = async (retries = 2): Promise<boolean> => {
          for (let i = 0; i < retries; i++) {
            try {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: user.id })
              })

              if (response.ok) {
                logAuthEvent('MATCH_CALCULATION_SUCCESS', 'Match calculation completed on retry')
                localStorage.removeItem('needsMatchCalculation')
                // Force dashboard refresh to show new matches
                setForceSync(prev => prev + 1)
                return true
              }
            } catch (err) {
              logAuthEvent('MATCH_CALCULATION_RETRY_FAILED', `Attempt ${i + 1} failed`)
            }

            // Exponential backoff: 2s, 4s
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)))
            }
          }
          return false
        }

        retryMatchCalculate().catch(err => {
          logAuthEvent('MATCH_CALCULATION_RETRY_ERROR', err)
        })
      }
    }
    prevNetworkStatusRef.current = status
  }, [status, isNetworkTimeout, user, session])

  // ─── Network Recovery 2: Cold Boot Repeating Ping ──────────────────────
  // Instead of a one-shot setTimeout, use setInterval to keep pinging every 5 seconds.
  // Stops automatically if ping succeeds or if another recovery mechanism clears the timeout.
  useEffect(() => {
    if (!isNetworkTimeout) return

    const intervalId = setInterval(async () => {
      // Safety check: If trapdoor was closed by another mechanism, stop pinging
      if (!isNetworkTimeoutRef.current) {
        clearInterval(intervalId)
        return
      }

      try {
        const { error } = await supabase.auth.getSession()
        if (!error) {
          logAuthEvent('COLD_BOOT_PING_SUCCESS', 'Connection established via repeating ping')
          setIsNetworkTimeout(false)
          isNetworkTimeoutRef.current = false
          setForceSync(prev => prev + 1)
          clearInterval(intervalId) // SUCCESS: Stop loop
        }
      } catch (err) {
        logAuthEvent('COLD_BOOT_PING_FAILED', 'Ping failed, will try again in 5s')
      }
    }, 5000) // Try every 5 seconds

    return () => clearInterval(intervalId)
  }, [isNetworkTimeout])

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
        // Heartbeat errors should not interrupt user experience
      }
    }

    // Update immediately on mount/session start only
    updateActivity()
  }, [user])

  // NEW: Global activity listener to update ref silently
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
        // Focus Heartbeat: If network timeout is active, ping Supabase to test TCP connectivity
        // This bypasses liar navigator.onLine state on mobile networks
        if (isNetworkTimeoutRef.current) {
          logAuthEvent('WAKEUP_PING', 'Network timeout active, testing connection...')
          try {
            const { error } = await supabase.auth.getSession()
            if (!error) {
              logAuthEvent('WAKEUP_PING_SUCCESS', 'Connection restored via ping')
              setIsNetworkTimeout(false)
              isNetworkTimeoutRef.current = false
              setForceSync(prev => prev + 1)
              return
            }
          } catch (err) {
            logAuthEvent('WAKEUP_PING_FAILED', 'Ping failed, network still dead')
          }
        }

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
            setIsNetworkTimeout(true)
            isNetworkTimeoutRef.current = true
          } else {
            // Reset network timeout flag on successful recovery
            setIsNetworkTimeout(false)
            isNetworkTimeoutRef.current = false
          }
        } catch (err) {
          console.error('[Auth] Wake-up refresh exception:', err)
          setIsNetworkTimeout(true)
          isNetworkTimeoutRef.current = true
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
      // 1. Let Supabase properly invalidate token on server, with a 2s timeout to prevent locks
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
      await Promise.race([supabase.auth.signOut(), timeout]);
    } catch (error) {
      console.warn('Signout logic timeout/error:', error)
    } finally {
      // 2. Wipe memory states immediately
      updateSession(null)
      updateUser(null)
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
    if (profileData) {
      updateProfile(profileData)
    } else if (profileRef.current) {
      // fetchProfile failed but we have cached data — preserve it
      logAuthEvent('PROFILE_FETCH_FAILED', 'Preserving cached profile after manual refresh failure')
      setIsNetworkTimeout(true)
      isNetworkTimeoutRef.current = true
    }
    // Don't wipe profile on network error
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
      clearNetworkTimeout,
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
