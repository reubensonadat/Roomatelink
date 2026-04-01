import { useState, useEffect } from 'react'
import { Sparkles, Check, X, Lock, Flame, UserCheck, ShieldCheck, ChevronRight, Heart, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { PullToRefresh } from '../components/PullToRefresh'
import { useAuth } from '../context/AuthContext'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { MatchFeed } from '../components/dashboard/MatchFeed'
import { ProfilePreviewModal } from '../components/dashboard/ProfilePreviewModal'
import { PaymentModal } from '../components/dashboard/PaymentModal'
import { PioneerModal } from '../components/dashboard/PioneerModal'
import { PaymentVerificationOverlay } from '../components/dashboard/PaymentVerificationOverlay'
import { FloatingUnlockCTA } from '../components/dashboard/FloatingUnlockCTA'
import { ReportModal } from '../components/ui/ReportModal'
import { FoundRoommateModal } from '../components/ui/FoundRoommateModal'

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

function getScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-amber-500'
  return 'bg-red-400'
}

function getScoreLabel(score: number) {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  
  // ─── State ─────────────────────────────────────────────────────────────
  
  const [hasPaid, setHasPaid] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasQuestionnaire, setHasQuestionnaire] = useState(true)
  
  // Premium Unlock States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(0)

  // Payment & Discount States
  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [finalPrice, setFinalPrice] = useState(25)

  // Payment Verification States
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [verifyCountdown, setVerifyCountdown] = useState(8)
  const [showPaymentFallback, setShowPaymentFallback] = useState(false)

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportedMatch, setReportedMatch] = useState<MatchProfile | null>(null)

  // Found Roommate Modal State
  const [isFoundRoommateModalOpen, setIsFoundRoommateModalOpen] = useState(false)
  const [currentDayNumber, setCurrentDayNumber] = useState<number | null>(null)
  const [profileFoundRoommate, setProfileFoundRoommate] = useState(false)

  // Matches State
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [isPioneerUser, setIsPioneerUser] = useState(false)
  const [isPioneerModalOpen, setIsPioneerModalOpen] = useState(false)

  // ─── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      if (!profile) {
        // Wait a bit more if auth says it's loading or if we just got the user
        if (authLoading) return
        
        // Final check: if user exists but profile still hasn't arrived after authLoading is false, 
        // it might be a slow fetch. We give it one more manual check.
        const { data: retryProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()
          
        if (!retryProfile) {
          console.warn('DashboardPage: Profile really is null after retry.')
          setIsLoading(false)
          return
        }
        // If we found it on retry, continue
        setHasPaid(retryProfile.has_paid)
      } else {
        setHasPaid(profile.has_paid)
      }
      
      try {
        const { data: questionnaire } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle()

        setHasQuestionnaire(!!questionnaire)
        
        const { data: dbMatches } = await supabase
          .from('matches')
          .select(`
            *,
            roommate:users!user_b_id (
              id, full_name, avatar_url, bio, course, level, gender, is_student_verified
            )
          `)
          .eq('user_a_id', profile.id)
          .order('match_percentage', { ascending: false })

        if (dbMatches && dbMatches.length > 0) {
          const mappedMatches: MatchProfile[] = dbMatches.map((m: any) => ({
            id: m.roommate.id,
            name: m.roommate.full_name,
            verified: m.roommate.is_student_verified,
            matchPercent: m.match_percentage,
            gender: m.roommate.gender,
            course: m.roommate.course,
            level: m.roommate.level,
            avatar: m.roommate.avatar_url,
            bio: m.roommate.bio || "No bio yet.",
            trait: m.cross_category_flags?.[0]?.description || "Potential Roommate",
            lifestyle: (m.cross_category_flags || []).map((f: any) => ({ text: f.description, icon: Heart })),
            tags: [m.roommate.course, `Level ${m.roommate.level}`],
            sharedTraits: (m.cross_category_flags || []).filter((f: any) => !f.is_conflict).map((f: any) => f.description),
            tensions: (m.cross_category_flags || []).filter((f: any) => f.is_conflict).map((f: any) => f.description),
            categoryScores: (m.category_scores || []).map((s: any) => ({
              name: s.category || 'Compatibility',
              score: s.score || 0,
              insight: s.insight || 'High alignment.'
            }))
          }))
          setMatches(mappedMatches)
        } else {
          // UI VERIFICATION MOCKS
          setMatches([{
            id: 'mock-1',
            name: 'Dr. Institutional (Mock)',
            verified: true,
            matchPercent: 98,
            gender: 'Male',
            course: 'Computer Science',
            level: '300',
            avatar: '/avatars/male/The Academic_M.png',
            bio: 'I am a mock profile injected to verify that the UI is solid and rounded correctly.',
            trait: 'Verification Hero',
            lifestyle: [{ icon: Heart, text: 'Solid Backgrounds' }, { icon: ShieldCheck, text: '24px Corners' }],
            tags: ['UCC', 'Institutional'],
            sharedTraits: ['Bank Grade UI', 'No Overlap'],
            tensions: [],
            categoryScores: [
              { name: 'Cleanliness', score: 95, insight: 'Pristine living.' },
              { name: 'Social Pace', score: 82, insight: 'Respects quiet.' },
              { name: 'Study Habits', score: 91, insight: 'Library schedule.' }
            ]
          }])
        }

        // Check Pioneer eligibility via Supabase Edge Function
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('id')
              .eq('auth_id', session.user.id)
              .single()
            
            if (profile) {
              const { data, error } = await supabase.functions.invoke('pioneer-check', {
                body: { userId: profile.id }
              })
              if (!error && data) {
                setIsPioneerUser((data as any).isPioneer || false)
              }
            }
          }
        } catch (e) {
          console.error('Pioneer check failed:', e)
          setIsPioneerUser(false)
        }
      } catch (err) {
        console.error('Error initializing dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      initializeDashboard()
    }
  }, [user, profile, authLoading])

  // Found Roommate Prompt Logic
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
  }, [])

  // Valid discount codes
  const VALID_DISCOUNTS: Record<string, { amount: number; label: string }> = {
    'ROOMMATE10': { amount: 10, label: '10 GHS Off' },
    'WELCOME10': { amount: 10, label: '10 GHS Off' },
    'PITCH10': { amount: 10, label: '10 GHS Off' },
  }

  // Sequential Unlock Effect
  useEffect(() => {
    if (isUnlocking && unlockedCount < matches.length) {
      const timer = setTimeout(() => {
        setUnlockedCount(prev => prev + 1)
      }, 500)
      return () => clearTimeout(timer)
    } else if (isUnlocking && unlockedCount === matches.length) {
      setIsUnlocking(false)
      setHasPaid(true)
      toast.success('All profiles unlocked!', {
        icon: <Sparkles className="w-5 h-5 text-white" />,
        style: { background: '#10b981', color: '#fff' }
      })
    }
  }, [isUnlocking, unlockedCount, matches.length])

  // Countdown timer
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
    const t = setTimeout(() => setVerifyCountdown(c => c - 1), 1000)
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
      toast.success('Payment confirmed! Unlocking your matches...', {
        icon: <Check className="w-5 h-5 text-white" />,
        style: { background: '#10b981', color: '#fff' }
      })
    } else {
      toast.error('Payment not yet confirmed. Please wait a moment and try again.', {
        description: 'If you were charged, contact support with your payment reference.',
      })
    }
  }

  useEffect(() => {
    const isAnyModalOpen = isPaymentModalOpen || !!selectedMatch || isPioneerModalOpen || isVerifyingPayment || isReportModalOpen || isFoundRoommateModalOpen
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
  }, [isPaymentModalOpen, selectedMatch, isPioneerModalOpen, isVerifyingPayment, isReportModalOpen, isFoundRoommateModalOpen])

  const handleStartPayment = async () => {
    if (isPioneerUser && !hasPaid) {
      setIsPioneerModalOpen(true)
      return
    }
    setIsPaymentModalOpen(true)
  }

  const handleFoundRoommateConfirm = async () => {
    if (!profile) return
    
    const { error } = await supabase
      .from('users')
      .update({ is_matched: true })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    setIsFoundRoommateModalOpen(false)
    setCurrentDayNumber(null)

    toast.success('Roommate match confirmed!', {
      icon: <Check className="w-5 h-5 text-white" />
    })
  }

  const handleApplyDiscount = () => {
    setIsApplyingDiscount(true)
    setDiscountError('')

    setTimeout(() => {
      const discount = VALID_DISCOUNTS[discountCode.toUpperCase()]

      if (discount) {
        setFinalPrice(25 - discount.amount)
        setDiscountApplied(true)
        setDiscountError('')
        toast.success(`Discount applied: ${discount.label}`, {
          icon: <Check className="w-5 h-5 text-white" />
        })
      } else {
        setDiscountError('Invalid discount code')
        setFinalPrice(25)
        setDiscountApplied(false)
        toast.error('Invalid discount code', {
          icon: <X className="w-5 h-5 text-white" />
        })
      }

      setIsApplyingDiscount(false)
    }, 800)
  }

  const handleRemoveDiscount = () => {
    setDiscountCode('')
    setDiscountApplied(false)
    setDiscountError('')
    setFinalPrice(25)
  }

  const handlePaymentSuccess = (reference: any) => {
    setIsPaymentModalOpen(false)
    setIsVerifyingPayment(true)

    console.log('Payment reference:', reference.reference)
    
    supabase.from('users')
      .update({ 
        has_paid: true,
        payment_reference: reference.reference,
        payment_date: new Date().toISOString()
      })
      .eq('id', profile?.id)
      .then(({ error }: { error: any }) => {
        setIsVerifyingPayment(false)
        if (!error) {
          toast.success('Identity verified! Unlocking profiles...', { id: 'verify-toast' })
          setHasPaid(true)
          setIsUnlocking(true)
          setUnlockedCount(0)
        } else {
          toast.error('Payment confirmed but failed to update status. Contact support.', { id: 'verify-toast' })
        }
      })
  }

  const handlePaymentClose = () => {
    toast.info('Payment process cancelled.', { duration: 2000 })
  }

  const handlePioneerClaim = () => {
    setIsPioneerModalOpen(false)
    setHasPaid(true)
    setUnlockedCount(matches.length)
    localStorage.setItem('roommate_has_paid', 'true')
    toast.success('🎖️ Pioneer access granted! All profiles unlocked.', {
      icon: <Check className="w-5 h-5 text-emerald-500" />
    })
  }

  const handleSelectMatch = (match: MatchProfile) => {
    if (hasPaid) {
      setSelectedMatch(match)
    } else {
      handleStartPayment()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  // Refined Loading State
  if (!mounted || authLoading || (user && !profile && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-[4px] border-primary/20" />
          <div className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-[18px] font-black text-foreground tracking-tight uppercase">Synchronizing Identity</h2>
          <p className="text-[12px] font-bold text-muted-foreground mt-1">SECURE SESSION VERIFIED</p>
        </div>
      </div>
    )
  }

  const isProfileComplete = profile && profile.course && profile.level && profile.phone_number

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative overflow-x-hidden pt-8">
      {/* Payment Verification Overlay */}
      <PaymentVerificationOverlay
        isVisible={isVerifyingPayment}
        verifyCountdown={verifyCountdown}
        showPaymentFallback={showPaymentFallback}
        onFallback={handlePaymentFallbackCheck}
        onCancel={() => setIsVerifyingPayment(false)}
      />

      <PullToRefresh onRefresh={async () => { await new Promise(r => setTimeout(r, 1200)); toast.success('Matches refreshed!'); }}>
        <div className="flex-1 overflow-y-auto pt-32">
          <DashboardHeader 
            userName={profile?.full_name || 'Student'} 
            avatarUrl={profile?.avatar_url}
            matchCount={matches.length}
            hasPaid={hasPaid}
            onRefresh={async () => { await new Promise(r => setTimeout(r, 1200)); toast.success('Matches refreshed!'); }}
            onNavigateToProfile={() => navigate('/dashboard/profile')}
            onNavigateToSettings={() => navigate('/dashboard/settings')}
          />

          <div className="flex flex-col px-4 sm:px-5 pt-6 pb-40 w-full max-w-2xl lg:max-w-4xl mx-auto">
            {/* PIONEER UNLOCK (Free for early users) */}
            {isPioneerUser && !hasPaid && (
              <div className="mx-5 mb-10 p-8 rounded-[2.5rem] bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                  <Flame className="w-20 h-20 text-amber-500" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
                    Pioneer Status Active <Flame className="w-6 h-6 text-amber-500" />
                  </h3>
                  <p className="text-[15px] font-medium text-muted-foreground mb-8 max-w-[80%]">
                    As one of first 100 users, your premium access has been waived. Secure your identity for free.
                  </p>
                  <button 
                    onClick={handlePioneerClaim}
                    className="w-full sm:w-auto px-10 py-5 bg-amber-500 text-white rounded-2xl font-black text-[18px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Claim Pioneer Access <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* MATCH FEED */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-14 h-14 rounded-4xl border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="mt-6 text-[13px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Scanning Grid...</p>
              </div>
            ) : !profile ? (
              /* Profile Not Found Fallback */
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center bg-muted/20 rounded-[2.5rem] border border-border/40">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-3">Profile Access Issue</h2>
                <p className="text-[15px] font-medium text-muted-foreground mb-10 max-w-[300px]">
                  We established your account but your profile details need to be synchronized. Please visit Profile Hub to continue.
                </p>
                <button
                  onClick={() => navigate('/dashboard/profile')}
                  className="px-8 py-4 bg-primary text-white font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  Setup Profile Hub <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : !isProfileComplete ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-3xl" />
                  <UserCheck className="w-8 h-8 text-amber-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Finish Your Profile</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Welcome, {profile?.full_name?.split(' ')[0] || 'Student'}! To find right roommate, we need your course, level, and phone number.
                </p>
                <Link to="/dashboard/profile" className="px-8 py-4 bg-primary text-white font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Setup Profile Now <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : !hasQuestionnaire ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 animate-pulse rounded-3xl" />
                  <Sparkles className="w-8 h-8 text-indigo-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Almost Ready!</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Your basic profile is set. Now, take lifestyle test so our algorithm can find your perfect roommates.
                </p>
                <Link to="/questionnaire" className="px-8 py-4 bg-foreground text-background font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Start Questionnaire <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-full" />
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-[20px] font-black text-foreground mb-2">You're Early!</h3>
                <p className="text-[14px] font-medium text-muted-foreground leading-relaxed max-w-[240px]">
                  We're still mapping campus DNA. Check back soon for your perfect roommate matches!
                </p>
              </div>
            ) : (
              <MatchFeed
                matches={matches}
                hasPaid={hasPaid}
                onSelectMatch={handleSelectMatch}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* FLOATING UNLOCK CTA */}
      <FloatingUnlockCTA 
        isVisible={!hasPaid && !isUnlocking && !isPaymentModalOpen && !selectedMatch}
        onClick={handleStartPayment}
      />

      {/* PROFILE PREVIEW MODAL */}
      <ProfilePreviewModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch || {} as MatchProfile}
        hasPaid={hasPaid}
        onUnlock={handleStartPayment}
        getTierInfo={getTierInfo}
        getScoreColor={getScoreColor}
        getScoreLabel={getScoreLabel}
      />

      {/* PAYMENT MODAL */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        email={user?.email || profile?.email || ''}
        amount={finalPrice}
        discountCode={discountCode}
        discountApplied={discountApplied}
        discountError={discountError}
        finalPrice={finalPrice}
        isApplyingDiscount={isApplyingDiscount}
        onDiscountCodeChange={setDiscountCode}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentClose={handlePaymentClose}
      />

      {/* PIONEER MODAL */}
      <PioneerModal
        isOpen={isPioneerModalOpen}
        onClose={() => {
          setIsPioneerModalOpen(false)
          setHasPaid(true)
          setUnlockedCount(matches.length)
          localStorage.setItem('roommate_has_paid', 'true')
          toast.success('Premium Unlocked Permanently!')
        }}
        onClaim={handlePioneerClaim}
      />

      {/* REPORT MODAL */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false)
          setReportedMatch(null)
        }}
        reportedName={reportedMatch?.name || ''}
        reportedId={reportedMatch?.id || ''}
      />

      {/* FOUND ROOMMATE MODAL */}
      {currentDayNumber && (
        <FoundRoommateModal
          isOpen={isFoundRoommateModalOpen}
          onClose={() => {
            setIsFoundRoommateModalOpen(false)
            setCurrentDayNumber(null)
          }}
          onConfirm={handleFoundRoommateConfirm}
          dayNumber={currentDayNumber}
        />
      )}
    </div>
  )
}
