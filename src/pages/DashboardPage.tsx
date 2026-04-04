import { useState, useEffect } from 'react'
import { Sparkles, Lock as LockIcon, Flame, UserCheck, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { PullToRefresh } from '../components/PullToRefresh'
import { useAuth } from '../context/AuthContext'
import { MatchFeed } from '../components/dashboard/MatchFeed'
import { ProfilePreviewModal } from '../components/dashboard/ProfilePreviewModal'
import { PaymentModal } from '../components/dashboard/PaymentModal'
import { PioneerModal } from '../components/dashboard/PioneerModal'
import { PaymentVerificationOverlay } from '../components/dashboard/PaymentVerificationOverlay'
import { ReportModal } from '../components/ui/ReportModal'
import { FoundRoommateModal } from '../components/ui/FoundRoommateModal'
import { TopHeader } from '../components/layout/TopHeader'
import { MOCK_MATCHES } from '../lib/mockData'

// ─── Types ────────────────────────────────────────────────────────────

type CategoryScore = { name: string; score: number; insight: string }

interface MatchProfile {
  id: string
  name: string
  verified: boolean
  matchPercent: number
  gender: string
  course: string
  level: string
  avatar: string
  bio: string
  trait: string
  lifestyle: { icon: any; text: string }[]
  tags: string[]
  sharedTraits: string[]
  tensions: string[]
  categoryScores: CategoryScore[]
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getTierInfo(pct: number) {
  if (pct >= 90) return { label: 'Exceptional', color: 'text-emerald-500', stroke: '#10b981', textColor: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10', icon: '🔥' }
  if (pct >= 80) return { label: 'Strong', color: 'text-green-500', stroke: '#22c55e', textColor: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-500/10', icon: '💚' }
  if (pct >= 70) return { label: 'Good', color: 'text-amber-500', stroke: '#f59e0b', textColor: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10', icon: '💛' }
  return { label: 'Potential', color: 'text-slate-400', stroke: '#94a3b8', textColor: 'text-slate-500', bgLight: 'bg-slate-400/10', icon: '⚪' }
}


export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()

  // ─── Core State ──────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true)
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [hasPaid, setHasPaid] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null)
  const [isPioneerUser, setIsPioneerUser] = useState(false)
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [devClickCount, setDevClickCount] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // ─── Modal States ────────────────────────────────────────────────────
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPioneerModalOpen, setIsPioneerModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isFoundRoommateModalOpen, setIsFoundRoommateModalOpen] = useState(false)

  // ─── Payment & Discount States ───────────────────────────────────────
  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [finalPrice, setFinalPrice] = useState(25)

  // ─── Payment Verification States ─────────────────────────────────────
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [verifyCountdown, setVerifyCountdown] = useState(8)
  const [showPaymentFallback, setShowPaymentFallback] = useState(false)

  // ─── Unlock Animation States ─────────────────────────────────────────
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(0)

  // ─── Found Roommate Logic States ─────────────────────────────────────
  const [currentDayNumber, setCurrentDayNumber] = useState<number | null>(null)
  const [profileFoundRoommate, setProfileFoundRoommate] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const initializeDashboard = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    if (!profile && authLoading) return

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
        setHasPaid(activeProfile.has_paid)

        // Check if user has completed questionnaire
        const { data: qResp } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', activeProfile.id)
          .maybeSingle()

        setHasQuestionnaire(!!qResp)

        // Step 3: Fetch Matches
        const { data: dbMatches, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            roommate:users!user_b_id (
              id, full_name, avatar_url, bio, course, level, gender, is_student_verified
            )
          `)
          .eq('user_a_id', activeProfile.id)
          .order('match_percentage', { ascending: false })

        if (matchesError) throw matchesError

        if (dbMatches && dbMatches.length > 0) {
          const mappedMatches: MatchProfile[] = dbMatches
            .filter((m: any) => m.roommate)
            .map((m: any) => ({
              id: m.roommate.id,
              name: m.roommate.full_name || 'Anonymous Student',
              verified: m.roommate.is_student_verified,
              matchPercent: m.match_percentage,
              gender: m.roommate.gender,
              course: m.roommate.course || 'Unspecified Course',
              level: m.roommate.level && !String(m.roommate.level).toLowerCase().includes('level') ? `Level ${m.roommate.level}` : (m.roommate.level || 'Unknown Level'),
              avatar: m.roommate.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.roommate.full_name || 'S')}&background=random`,
              bio: m.roommate.bio || 'No bio provided yet.',
              trait: m.top_shared_trait || 'Highly Compatible',
              lifestyle: [{ icon: Sparkles, text: 'Cleanliness: 90%' }],
              tags: [m.roommate.course, 'Verified'].filter(Boolean),
              sharedTraits: m.common_traits || [],
              tensions: m.tensions || ['None Detected'],
              categoryScores: m.match_details?.categoryScores || []
            }))
          setMatches(mappedMatches)
        } else {
          setMatches([])
        }

        // Check Pioneer Status (Try/Catch for Edge Function stability)
        try {
          const { data: pcData, error: pcError } = await supabase.functions.invoke('pioneer-check', {
            body: { userId: activeProfile.id }
          })
          if (!pcError && pcData) {
            setIsPioneerUser((pcData as any).isPioneer || false)
          }
        } catch (pcErr) {
          console.warn('Pioneer Engine unreachable. Falling back to standard flow.')
        }
      } else {
        setMatches([])
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err)
      setMatches([])
    } finally {
      setIsLoading(false)
    }
  }

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

  useEffect(() => {
    if (mounted) initializeDashboard()
  }, [user, profile, authLoading, mounted, isDevMode])

  useEffect(() => {
    if (devClickCount >= 3) {
      const nextMode = !isDevMode
      setIsDevMode(nextMode)
      setDevClickCount(0)
      toast.info(`Dev Mode ${nextMode ? 'Enabled' : 'Disabled'}`)
    }
  }, [devClickCount])

  useEffect(() => {
    if (profileFoundRoommate) return

    const PROFILE_CREATED_KEY = 'roommate_profile_created_date'
    const PROFILE_FOUND_KEY = 'roommate_found_roommate'
    const PROMPT_SHOWN_KEY = 'roommate_prompt_shown'

    const profileCreatedStr = localStorage.getItem(PROFILE_CREATED_KEY)
    const foundStatus = localStorage.getItem(PROFILE_FOUND_KEY)

    if (foundStatus === 'true') {
      setProfileFoundRoommate(true)
      return
    }

    if (!profileCreatedStr) {
      localStorage.setItem(PROFILE_CREATED_KEY, Date.now().toString())
      return
    }

    const profileCreatedDate = parseInt(profileCreatedStr)
    const daysSinceCreation = Math.floor((Date.now() - profileCreatedDate) / (1000 * 60 * 60 * 24))
    const promptShownStr = localStorage.getItem(PROMPT_SHOWN_KEY)
    const lastShownDay = promptShownStr ? parseInt(promptShownStr) : -1

    const promptIntervals = [7, 30, 50]
    const targetDay = promptIntervals.find(day => daysSinceCreation >= day && lastShownDay < day)

    if (targetDay) {
      setCurrentDayNumber(targetDay)
      setIsFoundRoommateModalOpen(true)
      localStorage.setItem(PROMPT_SHOWN_KEY, targetDay.toString())
    }
  }, [profileFoundRoommate])

  useEffect(() => {
    if (isUnlocking && unlockedCount < matches.length) {
      const timer = setTimeout(() => {
        setUnlockedCount(prev => prev + 1)
      }, 500)
      return () => clearTimeout(timer)
    } else if (isUnlocking && unlockedCount === matches.length && matches.length > 0) {
      setIsUnlocking(false)
      setHasPaid(true)
      toast.success('All profiles unlocked!')
    }
  }, [isUnlocking, unlockedCount, matches.length])

  useEffect(() => {
    if (!isVerifyingPayment) {
      setVerifyCountdown(8)
      setShowPaymentFallback(false)
      return
    }
    if (verifyCountdown <= 0) {
      setShowPaymentFallback(true)
      return
    }
    const t = setTimeout(() => setVerifyCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [isVerifyingPayment, verifyCountdown])

  const handlePaymentFallbackCheck = async () => {
    if (!user || !profile) return
    const { data: latestProfile } = await supabase
      .from('users')
      .select('has_paid')
      .eq('id', profile.id)
      .maybeSingle()

    if (latestProfile?.has_paid) {
      setIsVerifyingPayment(false)
      setHasPaid(true)
      setIsUnlocking(true)
      setUnlockedCount(0)
    } else {
      toast.error('Payment not yet confirmed. Please wait.')
    }
  }

  const handleStartPayment = () => {
    if (isPioneerUser && !hasPaid) {
      setIsPioneerModalOpen(true)
    } else {
      setIsPaymentModalOpen(true)
    }
  }

  const handleFoundRoommateConfirm = async () => {
    if (!profile) return
    const { error } = await supabase.from('users').update({ is_matched: true }).eq('id', profile.id)
    if (!error) {
      setIsFoundRoommateModalOpen(false)
      setCurrentDayNumber(null)
      toast.success('Status updated!')
    }
  }

  const handleApplyDiscount = () => {
    setIsApplyingDiscount(true)
    setTimeout(() => {
      const VALID_DISCOUNTS: Record<string, number> = { 'ROOMMATE10': 10, 'WELCOME10': 10 }
      const amount = VALID_DISCOUNTS[discountCode.toUpperCase()]
      if (amount) {
        setFinalPrice(25 - amount)
        setDiscountApplied(true)
        setDiscountError('')
      } else {
        setDiscountError('Invalid code')
      }
      setIsApplyingDiscount(false)
    }, 800)
  }

  const handlePaymentSuccess = (reference: any) => {
    setIsPaymentModalOpen(false)
    setIsVerifyingPayment(true)
    supabase.from('users').update({ has_paid: true, payment_reference: reference.reference }).eq('id', profile?.id)
      .then(() => {
        setIsVerifyingPayment(false)
        setHasPaid(true)
        setIsUnlocking(true)
        setUnlockedCount(0)
      })
  }

  const handlePioneerClaim = async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ has_paid: true })
        .eq('id', profile.id)

      if (error) throw error

      setIsPioneerModalOpen(false)
      setHasPaid(true)
      setUnlockedCount(matches.length)
      toast.success('Pioneer Access Granted!')
    } catch (err) {
      console.error('Pioneer claim failed:', err)
      toast.error('Failed to claim access. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMatch = (match: MatchProfile) => {
    if (hasPaid) setSelectedMatch(match)
    else handleStartPayment()
  }

  // Refined Hydration Defense
  const isHydrating = authLoading || (user && !profile && isLoading)

  if (!mounted || isHydrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 dark:selection:bg-indigo-500/30 uppercase tracking-tight">
        <div className="relative w-28 h-28 mb-12">
          {/* Outer Ring Glow */}
          <div className="absolute inset-[-8px] rounded-[2.5rem] bg-indigo-500/10 blur-xl animate-pulse" />

          {/* Main Spinner */}
          <div className="absolute inset-0 rounded-[2.5rem] border-[3px] border-border/50" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-[2.5rem] border-[3px] border-transparent border-t-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center shadow-sm border border-border">
              <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">
            Welcome Back {isDevMode && <span className="text-muted-foreground tracking-normal">(DEV)</span>}
          </h2>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[32px] font-black tracking-tighter text-foreground leading-none">Starting Roommate Link</span>
            <p className="text-[14px] font-bold text-muted-foreground">Synchronizing your matching preferences</p>
          </div>

          {/* Premium Progress Bar */}
          <div className="mt-8 w-48 h-1.5 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] w-[60%]"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  const isProfileComplete = profile && profile.course && profile.level

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative overflow-x-hidden">
      <PaymentVerificationOverlay
        isVisible={isVerifyingPayment}
        verifyCountdown={verifyCountdown}
        showPaymentFallback={showPaymentFallback}
        onFallback={handlePaymentFallbackCheck}
        onCancel={() => setIsVerifyingPayment(false)}
      />

      <PullToRefresh onRefresh={async () => { await new Promise(r => setTimeout(r, 1200)); toast.success('Matches refreshed!'); }}>
        <TopHeader
          title="Top Matches"
          subtitle={`${matches.length} highly compatible roommates found.`}
        />

        <div className="flex flex-col px-4 sm:px-5 pt-6 pb-40 w-full max-w-2xl lg:max-w-4xl mx-auto">
          {isPioneerUser && !hasPaid && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-2 mb-8 p-6 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner">
                <Flame className="w-7 h-7 text-indigo-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-black uppercase tracking-widest text-indigo-500 mb-1">Pioneer Status</h3>
                <p className="text-[13px] font-bold text-muted-foreground leading-tight">You're one of our first 100 students. Claim your free permanent access.</p>
              </div>
              <button
                onClick={handlePioneerClaim}
                className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[13px] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
              >
                Claim
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4 w-full"
              >
                <MatchFeed matches={[]} hasPaid={false} onSelectMatch={() => { }} isLoading={true} />
              </motion.div>
            ) : !isProfileComplete ? (
              <motion.div
                key="profile-incomplete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-3xl" />
                  <UserCheck className="w-8 h-8 text-amber-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Finish Your Profile</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}! To find the right roommate, we need your course, level, and phone number.
                </p>
                <Link to="/dashboard/profile" className="px-8 py-4 bg-primary text-white font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Setup Profile Now <Sparkles className="w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            ) : !hasQuestionnaire ? (
              <motion.div
                key="questionnaire-incomplete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 animate-pulse rounded-3xl" />
                  <Sparkles className="w-8 h-8 text-indigo-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Almost Ready!</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Your basic profile is set. Now, take the lifestyle test so our algorithm can find your perfect roommates.
                </p>
                <Link to="/questionnaire" className="px-8 py-4 bg-foreground text-background font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Start Questionnaire <Sparkles className="w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            ) : matches.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center pt-12 pb-20 px-6 text-center"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-full" />
                  <LockIcon className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-[20px] font-black text-foreground mb-2">You're Early!</h3>
                <p className="text-muted-foreground text-[14px] font-medium leading-relaxed max-w-[280px] mb-6">
                  We're still mapping the campus DNA. Check back soon for your perfect roommate matches!
                </p>
                <button
                  onClick={forceRecalculate}
                  disabled={isRecalculating}
                  className="mt-2 px-6 py-3 bg-muted text-foreground border border-border/50 rounded-xl font-bold flex items-center gap-2 hover:bg-muted/80 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isRecalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isRecalculating ? "Running Algorithm..." : "Force Run Algorithm"}
                </button>
              </motion.div>
            ) : (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MatchFeed matches={matches} hasPaid={hasPaid} onSelectMatch={handleSelectMatch} isLoading={isLoading} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PullToRefresh>

      <ProfilePreviewModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch || {} as MatchProfile}
        hasPaid={hasPaid}
        onUnlock={handleStartPayment}
        getTierInfo={getTierInfo}
        onReport={() => setIsReportModalOpen(true)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        email={user?.email || ''}
        amount={finalPrice}
        onApplyDiscount={handleApplyDiscount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentClose={() => setIsPaymentModalOpen(false)}
        discountCode={discountCode}
        onDiscountCodeChange={setDiscountCode}
        discountApplied={discountApplied}
        discountError={discountError}
        finalPrice={finalPrice}
        isApplyingDiscount={isApplyingDiscount}
        onRemoveDiscount={() => setDiscountApplied(false)}
      />

      <PioneerModal isOpen={isPioneerModalOpen} onClose={() => setIsPioneerModalOpen(false)} onClaim={handlePioneerClaim} />
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportedName={selectedMatch?.name || ''} reportedId={selectedMatch?.id || ''} />
      {currentDayNumber && <FoundRoommateModal isOpen={isFoundRoommateModalOpen} onClose={() => setIsFoundRoommateModalOpen(false)} onConfirm={handleFoundRoommateConfirm} dayNumber={currentDayNumber} />}
    </div>
  )
}
