import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { MOCK_MATCHES } from '../lib/mockData'
import { MatchProfile } from '../types/database'

interface UseDashboardDataReturn {
  matches: MatchProfile[]
  isLoading: boolean
  hasQuestionnaire: boolean | null
  isPioneerUser: boolean
  initializeDashboard: () => Promise<void>
  forceRecalculate: () => Promise<void>
  incrementDevClickCount: () => void
  isDevMode: boolean
  isRecalculating: boolean
  setMatches: (matches: MatchProfile[]) => void
  setIsLoading: (loading: boolean) => void
  fetchError: boolean
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useDashboardData(): UseDashboardDataReturn {
  const { user, profile, isSessionLoading, refreshProfile, forceSync, resolveGlobalSync, clearNetworkTimeout } = useAuth()
  
  const isMountedRef = useRef(true)
  
  // Core State
  const [matches, setMatches] = useState<MatchProfile[]>(() => {
    try {
      const cached = localStorage.getItem('matchesCache')
      if (!cached) return []
      const { data, timestamp } = JSON.parse(cached)
      // 1-hour Time-To-Live (TTL) to prevent showing severely stale data
      const isExpired = !timestamp || (Date.now() - timestamp > 3600000)
      if (isExpired) return []
      return Array.isArray(data) && data.length > 0 ? data : []
    } catch {
      return []
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const isInitializingRef = useRef(false)
  
  // hasQuestionnaire is derived from questionnaire_responses table - source of truth
  // Initialize as null (loading state) to avoid stale cache poisoning
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(null)

  const [isPioneerUser, setIsPioneerUser] = useState(() => !!profile?.is_pioneer)
  const [mounted, setMounted] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [devClickCount, setDevClickCount] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const lastFetchRef = useRef<number>(0)
  const previousHasPaidRef = useRef<boolean>(false)
  const successOnceRef = useRef<boolean>(false)
  const fetchGenerationRef = useRef<number>(0)

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

  const initializeDashboardRef = useRef<any>(null)

  // Watch profile?.has_paid changes and trigger match refetch when payment is completed
  useEffect(() => {
    const currentHasPaid = !!profile?.has_paid
    const previousHasPaid = previousHasPaidRef.current

    // Only trigger if transitioning from false to true
    if (currentHasPaid && !previousHasPaid) {
      initializeDashboardRef.current()
    }

    // Update ref for next comparison
    previousHasPaidRef.current = currentHasPaid
  }, [profile?.has_paid])

  // Increment dev click count
  const incrementDevClickCount = () => setDevClickCount(prev => prev + 1)

  // ─── Core Functions ──────────────────────────────────────────────

  const initializeDashboard = async () => {
    const currentGeneration = fetchGenerationRef.current
    // If we are locked by an active fetch, resolve false immediately
    if (isInitializingRef.current) {
      resolveGlobalSync(false)
      return
    }
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
    setFetchError(false) // Reset error state on new fetch attempt

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

        // Check if user has completed questionnaire - source of truth
        // Add retry logic for lock contention errors
        const queryQuestionnaire = async (retries = 2): Promise<boolean | null> => {
          for (let i = 0; i < retries; i++) {
            const { data: qResp, error: qError } = await supabase
              .from('questionnaire_responses')
              .select('id')
              .eq('user_id', activeProfile.id)
              .maybeSingle()

            if (!qError) {
              return !!qResp
            }

            // Check if this is a lock contention error
            const isLockError = qError.name === 'AbortError' ||
                             qError.message?.toLowerCase().includes('lock broken') ||
                             qError.message?.toLowerCase().includes('lock')

            if (isLockError && i < retries - 1) {
              // Instant retry - no artificial delays
            } else {
              // Non-retryable error or max retries reached
              console.error('[Questionnaire Check] Query failed:', qError)
              return null
            }
          }
          return null
        }

        const hasQ = await queryQuestionnaire()
        
        // Only update state if query succeeds; keep cached value on error
        if (hasQ !== null) {
          setHasQuestionnaire(hasQ)
          localStorage.setItem('hasQuestionnaireCache', JSON.stringify({ data: hasQ, timestamp: Date.now() }))
          console.log('[Questionnaire Check] User has questionnaire:', hasQ)
        } else {
          // On query failure, try to use cached value from persistent storage
          const cached = localStorage.getItem('hasQuestionnaireCache')
          if (cached !== null) {
            try {
              const { data, timestamp } = JSON.parse(cached)
              const isExpired = !timestamp || (Date.now() - timestamp > 86400000) // 24 hour TTL for questionnaire status
              if (!isExpired) {
                setHasQuestionnaire(data)
                console.log('[Questionnaire Check] Using persistent cached value:', data)
              }
            } catch (e) { /* ignore parse errors */ }
          }
        }

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

        if (matchesARes.error || matchesBRes.error) {
          console.error('[Matching Engine] Network/Query failure prevented cache wipe:', matchesARes.error, matchesBRes.error)
          setFetchError(true)
          return
        }

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
              categoryScores: Array.isArray(m.category_scores) && m.category_scores.length > 0
                ? m.category_scores.map((cat: any) => {
                    // Find the question with lowest similarity for the insight
                    const worstQuestion = cat.questionScores?.reduce(
                      (worst: any, q: any) => (!worst || q.similarity < worst.similarity) ? q : worst,
                      null
                    )
                    
                    // Question ID to readable name mapping
                    const questionNames: Record<string, string> = {
                      'q1': 'Door noise waking you up',
                      'q2': 'Personal info shared with others',
                      'q3': 'Argument aftermath behavior',
                      'q4': 'Reacting to being upset',
                      'q5': '1AM location',
                      'q6': 'Studying with background noise',
                      'q7': 'Exam season noise tolerance',
                      'q8': 'Natural sleep time',
                      'q9': 'Dishes in the sink',
                      'q10': "Other person's mess tolerance",
                      'q11': 'Laundry pile smell feedback',
                      'q12': 'Settled-in timeline',
                      'q13': 'Friday evening location',
                      'q14': 'Last-minute guests',
                      'q15': 'Guest frequency',
                      'q16': 'Late-night noise tolerance',
                      'q17': 'One-month relationship expectation',
                      'q18': 'Coming back after a bad day',
                      'q19': 'Everyday greeting style',
                      'q20': 'Roommate relationship goal',
                      'q21': 'First-time freedom reaction',
                      'q22': 'Wednesday night invitation',
                      'q23': 'Self-discipline self-assessment',
                      'q24': "Friend's description of you",
                      'q25': '2AM door noise follow-up',
                      'q26': 'Academic struggle intervention',
                      'q27': 'Persistent invitation boundaries',
                      'q28': 'Disagreeing choices',
                      'q29': 'Partner visit frequency',
                      'q30': '11PM phone call tolerance',
                      'q31': 'Partner presence tolerance',
                      'q32': 'Midnight argument aftermath',
                      'q33': 'Food sharing expectations',
                      'q34': 'Cooking philosophy',
                      'q35': 'Food/eating without asking',
                      'q36': 'Asking for food regularly',
                      'q37': 'Borrowing charger without asking',
                      'q38': 'Borrowing iron while absent',
                      'q39': 'Unreturned borrowed item',
                      'q40': 'Honest self-assessment'
                    }

                    const insightText = worstQuestion
                      ? `Biggest difference: ${questionNames[worstQuestion.questionId] || 'lifestyle habits'}`
                      : null

                    return {
                      name: cat.categoryName || 'Unknown',
                      score: Math.round((cat.meanSimilarity || 0) * 100),
                      insight: insightText
                    }
                  })
                : []
            }))
          
          // GUARD: Only update state if this is still the active generation
          if (currentGeneration !== fetchGenerationRef.current) return
          
          setMatches(mappedMatches)
          if (!isMountedRef.current) return
          localStorage.setItem('matchesCache', JSON.stringify({ data: mappedMatches, timestamp: Date.now() }))
          resolveGlobalSync(true)
          clearNetworkTimeout()
          successOnceRef.current = true
        } else {
          setMatches([])
          localStorage.removeItem('matchesCache')
        }

        // Step 4: Verify Pioneer Status if not already checked
        // Only check once per session to avoid wasting Edge Function calls
        // Run check to determine if user IS a pioneer (not just for non-pioneers)
        if (!sessionStorage.getItem('pioneerChecked')) {
          try {
            const { data: pcData, error: pcError } = await supabase.functions.invoke('pioneer-check')
            
            if (!pcError && pcData) {
              // Only mark as checked AFTER successful response
              sessionStorage.setItem('pioneerChecked', 'true')
              
              const isPioneer = (pcData as any).isPioneer || false
              setIsPioneerUser(isPioneer)
              if (isPioneer) {
                await refreshProfile() // Sync DB update to AuthContext
              }
            } else if (pcError) {
              console.error('[Pioneer Check] Error:', pcError)
              // Don't mark as checked on error - allows retry on next session
            }
          } catch (pcErr) {
            console.warn('[Pioneer Check] Exception:', pcErr)
            // Don't mark as checked on exception - allows retry
          }
        }
      } else {
        setMatches([])
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err)
      // DO NOT wipe matches on error - preserve cached data
      setFetchError(true)
    } finally {
      // SILENT EVAPORATION: If a newer recovery was triggered while this was running,
      // do absolutely nothing. Let the newer generation handle the UI state.
      if (currentGeneration !== fetchGenerationRef.current) return

      resolveGlobalSync(false)
      setIsLoading(false)
      if (!isMountedRef.current) return
      isInitializingRef.current = false
    }
  }

  initializeDashboardRef.current = initializeDashboard

  // ─── Hard Timeout Failsafe ─────────────────────────────────────────
  const forceRecalculate = async () => {
    if (!profile) return
    setIsRecalculating(true)
    try {
      // DIAGNOSTIC: Blind trigger disabled - Edge function needs UPSERT logic first
      console.warn('[Force Recalculate] Blocked: Edge function is a blind trigger and needs UPSERT logic first.')
      
      // const { data: { session } } = await supabase.auth.getSession()
      // if (!session) throw new Error("No active session")

      // const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session.access_token}`
      //   },
      //   body: JSON.stringify({ userId: profile.id })
      // })

      // if (!res.ok) throw new Error("Edge function failed")

      // toast.success("Algorithm triggered!")
      // Reload dashboard
      // setIsLoading(true)
      // await initializeDashboard()
    } catch (err: any) {
      toast.error(`Refresh failed: ${err.message}`)
    } finally {
      setIsRecalculating(false)
    }
  }
// Main effect to initialize dashboard
useEffect(() => {
  isMountedRef.current = true
  if (!mounted || !user || isSessionLoading) return

  // NEW: Override throttle if forceSync > 0 (user clicked Sync button OR auto-recovery)
  const shouldOverrideThrottle = forceSync > 0

  // Throttle: skip background re-fetch ONLY if we fetched within 30s AND have cached matches.
  // IMPORTANT: Never skip if matches is empty — we always want to re-verify from the DB.
  // IMPORTANT: Override throttle if forceSync > 0 (user clicked Sync button OR auto-recovery)
  const now = Date.now()
  if (!shouldOverrideThrottle && matches.length > 0 && lastFetchRef.current > 0 && now - lastFetchRef.current < 30000) return

  // ZOMBIE ASSASSIN: Increment generation to invalidate any currently hanging requests,
  // then unlock the initialization gate so the new request can start.
  if (shouldOverrideThrottle) {
    fetchGenerationRef.current++
    isInitializingRef.current = false
  }

  lastFetchRef.current = now
  initializeDashboard()

  // NEW: Reset forceSync after fetching (handled by AuthContext's setForceSync(prev => prev + 1))
  // We don't call it here to avoid circular dependencies

  return () => {
    isMountedRef.current = false
    isInitializingRef.current = false
  }
}, [user, profile, isSessionLoading, mounted, isDevMode, forceSync])
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
    fetchError,
  }
}
