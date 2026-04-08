import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { MOCK_MATCHES } from '../lib/mockData'
import { MatchProfile } from '../types/database'

interface UseDashboardDataReturn {
  matches: MatchProfile[]
  isLoading: boolean
  hasQuestionnaire: boolean
  isPioneerUser: boolean
  initializeDashboard: () => Promise<void>
  forceRecalculate: () => Promise<void>
  incrementDevClickCount: () => void
  isDevMode: boolean
  isRecalculating: boolean
  setMatches: (matches: MatchProfile[]) => void
  setIsLoading: (loading: boolean) => void
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useDashboardData(): UseDashboardDataReturn {
  const { user, profile, isSessionLoading, refreshProfile } = useAuth()
  
  // Core State
  const [matches, setMatches] = useState<MatchProfile[]>(() => {
    const cached = sessionStorage.getItem('matchesCache')
    if (!cached) return []
    try {
      const parsed = JSON.parse(cached)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : []
    } catch {
      return []
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const isInitializingRef = useRef(false)
  
  // State Healing: If we have matches in cache, we MUST have a questionnaire
  const [hasQuestionnaire, setHasQuestionnaire] = useState(() => {
    const cachedQ = sessionStorage.getItem('hasQuestionnaireCache') === 'true'
    const hasMatchesInCache = matches.length > 0
    return cachedQ || hasMatchesInCache
  })

  const [isPioneerUser, setIsPioneerUser] = useState(() => !!profile?.is_pioneer)
  const [mounted, setMounted] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [devClickCount, setDevClickCount] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const lastFetchRef = useRef<number>(0)
  const previousHasPaidRef = useRef<boolean>(false)
  const successOnceRef = useRef<boolean>(false)

  // Mounted effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Dev mode toggle (3 clicks to enable)
  useEffect(() => {
    if (devClickCount >= 3) {
      const nextMode = !isDevMode
      setIsDevMode(nextMode)
      setDevClickCount(0)
      toast.info(`Dev Mode ${nextMode ? 'Enabled' : 'Disabled'}`)
    }
  }, [devClickCount])

  // Watch profile?.has_paid changes and trigger match refetch when payment is completed
  useEffect(() => {
    const currentHasPaid = !!profile?.has_paid
    const previousHasPaid = previousHasPaidRef.current

    // Only trigger if transitioning from false to true
    if (currentHasPaid && !previousHasPaid) {
      initializeDashboard()
    }

    // Update ref for next comparison
    previousHasPaidRef.current = currentHasPaid
  }, [profile?.has_paid])

  // Increment dev click count
  const incrementDevClickCount = () => setDevClickCount(prev => prev + 1)

  // ─── Core Functions ──────────────────────────────────────────────

  const initializeDashboard = async () => {
    if (isInitializingRef.current) return
    isInitializingRef.current = true

    if (!user) {
      setIsLoading(false)
      isInitializingRef.current = false
      return
    }

    // Guard: If session is still resolving, don't pull the trigger yet.
    // The main effect will re-run when isSessionLoading changes to false.
    if (!profile && isSessionLoading) {
      isInitializingRef.current = false
      return
    }

    // Always mark loading at the start to prevent stale cache from rendering wrong state
    setIsLoading(true)

    try {
      // Step 1: Dev Mode Override
      if (isDevMode) {
        setMatches(MOCK_MATCHES as any[])
        setIsLoading(false)
        return
      }

      // Step 2: Handle Profile Initial Sync
      let activeProfile = profile
      if (!activeProfile) {
        const { data: retryProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()
        activeProfile = retryProfile
      }

      if (activeProfile) {
        const pioneerStatus = !!activeProfile.is_pioneer
        setIsPioneerUser(pioneerStatus)

        // Check if user has completed questionnaire
        const { data: qResp } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', activeProfile.id)
          .maybeSingle()

        setHasQuestionnaire(!!qResp)
        sessionStorage.setItem('hasQuestionnaireCache', String(!!qResp))

        // Step 3: Fetch Matches — query BOTH sides for bulletproof loading
        // A user can be user_a_id OR user_b_id depending on insertion order
        const myId = activeProfile.id
        console.log('[Matching Engine] Initializing sync for Profile ID:', myId)

        // Query A-side: where I am user_a_id, roommate is user_b_id
        // Using explicit constraint name (!matches_user_b_id_fkey) to resolve schema ambiguity
        const matchesAPromise = supabase
          .from('matches')
          .select(`
            *,
            roommate:users!matches_user_b_id_fkey (
              id, full_name, avatar_url, bio, course, level, gender, is_student_verified
            )
          `)
          .eq('user_a_id', myId)
          .order('match_percentage', { ascending: false })

        // Query B-side: where I am user_b_id, roommate is user_a_id
        // Using explicit constraint name (!matches_user_a_id_fkey) to resolve schema ambiguity
        const matchesBPromise = supabase
          .from('matches')
          .select(`
            *,
            roommate:users!matches_user_a_id_fkey (
              id, full_name, avatar_url, bio, course, level, gender, is_student_verified
            )
          `)
          .eq('user_b_id', myId)
          .order('match_percentage', { ascending: false })

        const [matchesARes, matchesBRes] = await Promise.all([matchesAPromise, matchesBPromise])

        // Diagnostic Check: RLS or Query Failures
        if (matchesARes.error) console.error('[Matching Engine] Side A Sync Failure:', matchesARes.error)
        if (matchesBRes.error) console.error('[Matching Engine] Side B Sync Failure:', matchesBRes.error)

        // Merge both sides, deduplicate by roommate ID (prefer higher percentage)
        const allRaw = [...(matchesARes.data || []), ...(matchesBRes.data || [])]
        
        console.log(`[Matching Engine] Query complete. Found ${matchesARes.data?.length || 0} (A) and ${matchesBRes.data?.length || 0} (B) raw records.`)

        const seenRoommates = new Map<string, any>()
        for (const m of allRaw) {
          if (!m.roommate) {
            console.warn('[Matching Engine] Found match record but roommate data is null (Possible RLS restriction on users table):', m.id)
            continue
          }
          const rid = (m.roommate as any).id
          if (!seenRoommates.has(rid) || (m.match_percentage || 0) > (seenRoommates.get(rid).match_percentage || 0)) {
            seenRoommates.set(rid, m)
          }
        }
        const dedupedMatches = Array.from(seenRoommates.values())
          .sort((a: any, b: any) => (b.match_percentage || 0) - (a.match_percentage || 0))

        if (dedupedMatches.length > 0) {
          const mappedMatches: MatchProfile[] = dedupedMatches
            .map((m: any) => ({
              id: m.roommate.id,
              name: m.roommate.full_name || 'Anonymous Student',
              verified: m.roommate.is_student_verified,
              matchPercent: m.match_percentage || 0,
              gender: m.roommate.gender,
              course: m.roommate.course || 'Unspecified Course',
              level: String(m.roommate.level || 'Unknown').replace(/level/i, '').trim(),
              avatar: m.roommate.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.roommate.full_name || 'S')}&background=random`,
              bio: m.roommate.bio || 'No bio provided yet.',
              trait: (m as any).top_shared_trait || 'Highly Compatible',
              lifestyle: [{ icon: null, text: 'Cleanliness: 90%' }], // Placeholder icon fix
              tags: [m.roommate.course, 'Verified'].filter(Boolean),
              sharedTraits: (m as any).common_traits || [],
              tensions: (m as any).tensions || ['None Detected'],
              categoryScores: m.category_scores || []
            }))
          setMatches(mappedMatches)
          sessionStorage.setItem('matchesCache', JSON.stringify(mappedMatches))
          
          // State Healing: If matches exist, questionnaire status MUST be true
          setHasQuestionnaire(true)
          sessionStorage.setItem('hasQuestionnaireCache', 'true')
          successOnceRef.current = true
        } else {
          setMatches([])
          sessionStorage.removeItem('matchesCache')
        }

        // Step 4: Verify Pioneer Status if not already marked
        // Only check once per session to avoid wasting Edge Function calls
        if (!pioneerStatus && !sessionStorage.getItem('pioneerChecked')) {
          try {
            const { data: pcData, error: pcError } = await supabase.functions.invoke('pioneer-check')
            sessionStorage.setItem('pioneerChecked', 'true')
            if (!pcError && pcData) {
              const isPioneer = (pcData as any).isPioneer || false
              setIsPioneerUser(isPioneer)
              if (isPioneer) {
                await refreshProfile() // Sync DB update to AuthContext
              }
            }
          } catch (pcErr) {
            console.warn('Pioneer Engine sync deferred.')
          }
        }
      } else {
        setMatches([])
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err)
      setMatches([])
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }

  // ─── Hard Timeout Failsafe ─────────────────────────────────────────
  // If isLoading is still true after 8 seconds, force unlock.
  // This prevents permanent "Starting Roommate Link" hangups.
  useEffect(() => {
    if (!isLoading) return
    const timer = window.setTimeout(() => {
      console.warn('useDashboardData: Initialization timeout — forcing isLoading=false')
      setIsLoading(false)
    }, 8000)
    return () => clearTimeout(timer)
  }, [isLoading])

  const forceRecalculate = async () => {
    if (!profile) return
    setIsRecalculating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: profile.id })
      })

      if (!res.ok) throw new Error("Edge function failed")

      toast.success("Algorithm triggered!")
      // Reload dashboard
      setIsLoading(true)
      await initializeDashboard()
    } catch (err: any) {
      toast.error(`Refresh failed: ${err.message}`)
    } finally {
      setIsRecalculating(false)
    }
  }

  // Main effect to initialize dashboard
  useEffect(() => {
    if (!mounted || !user || isSessionLoading) return
    // Throttle: skip background re-fetch ONLY if we fetched within 30s AND have cached matches.
    // IMPORTANT: Never skip if matches is empty — we always want to re-verify from the DB.
    const now = Date.now()
    if (matches.length > 0 && lastFetchRef.current > 0 && now - lastFetchRef.current < 30000) return
    lastFetchRef.current = now
    initializeDashboard()
  }, [user, profile, isSessionLoading, mounted, isDevMode])

  return {
    matches,
    isLoading,
    hasQuestionnaire,
    isPioneerUser,
    initializeDashboard,
    forceRecalculate,
    incrementDevClickCount,
    isDevMode,
    isRecalculating,
    setMatches,
    setIsLoading,
  }
}
