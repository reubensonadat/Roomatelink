import { useState, useEffect } from 'react'
import { Sparkles, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { PullToRefresh } from '../components/PullToRefresh'
import { useAuth } from '../context/AuthContext'
import { MatchFeed } from '../components/dashboard/MatchFeed'
import { ProfilePreviewModal } from '../components/dashboard/ProfilePreviewModal'
import { PaymentModal } from '../components/dashboard/PaymentModal'
import { PioneerModal } from '../components/dashboard/PioneerModal'
import { PaymentVerificationOverlay } from '../components/dashboard/PaymentVerificationOverlay'
import { ReportModal } from '../components/dashboard/ReportModal'
import { FoundRoommateModal } from '../components/dashboard/FoundRoommateModal'
import { TopHeader } from '../components/layout/TopHeader'
import { PioneerBanner } from '../components/dashboard/PioneerBanner'
import { EmptyState } from '../components/dashboard/EmptyState'
import { UserFlowGate } from '../components/dashboard/UserFlowGate'
import { useDashboardData } from '../hooks/useDashboardData'
import { usePaymentFlow } from '../hooks/usePaymentFlow'
import { useUserFlowStatus } from '../hooks/useUserFlowStatus'
import { useFoundRoommatePrompt } from '../hooks/useFoundRoommatePrompt'
import { getTierInfo } from '../lib/utils'
import { MatchProfile } from '../types/database'


export function DashboardPage() {
  const { user, refreshProfile } = useAuth()

  // Use custom hooks for extracted logic
  const {
    matches,
    isLoading,
    hasQuestionnaire,
    isPioneerUser,
    initializeDashboard,
    forceRecalculate,
    isDevMode,
    isRecalculating,
  } = useDashboardData()

  const {
    hasPaid,
    isProfileComplete,
  } = useUserFlowStatus()

  const {
    discountCode,
    setDiscountCode,
    isApplyingDiscount,
    discountApplied,
    setDiscountApplied,
    discountError,
    finalPrice,
    isVerifyingPayment,
    verifyCountdown,
    showPaymentFallback,
    isUnlocking,
    unlockedCount,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isPioneerModalOpen,
    setIsPioneerModalOpen,
    handleApplyDiscount,
    handlePaymentSuccess,
    handlePaymentFallbackCheck,
    handlePioneerClaim,
    handleStartPayment,
    handleCancelVerification,
  } = usePaymentFlow()

  // Modal states (kept in DashboardPage orchestrator)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null)
  const [displayLimit, setDisplayLimit] = useState(10)
  const [mounted, setMounted] = useState(false)

  // Found Roommate Prompt Hook
  const {
    isModalOpen: isFoundRoommateModalOpen,
    dayNumber: currentDayNumber,
    handleConfirm: handleFoundRoommateConfirm,
    handleClose: handleFoundRoommateClose,
  } = useFoundRoommatePrompt()

  // Mounted effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // ─── Unlock Animation Effect ───────────────────────────────────
  useEffect(() => {
    if (isUnlocking && unlockedCount === matches.length && matches.length > 0) {
      toast.success('All profiles unlocked!')
    }
  }, [isUnlocking, unlockedCount, matches.length])

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSelectMatch = (match: MatchProfile) => {
    if (hasPaid || isPioneerUser) setSelectedMatch(match)
    else handleStartPayment()
  }

  const handleReportModalOpen = () => setIsReportModalOpen(true)

  // ─── Pull-to-Refresh Handler ───────────────────────────────
  const handleRefresh = async () => {
    await refreshProfile()
    await initializeDashboard()
    toast.success('Matches refreshed!')
  }

  // Splash guard: Show loading screen only during initial cold-boot fetch.
  // Since isLoading always starts true, we show the splash when:
  //   - We are actively loading (isLoading=true)
  //   - AND there are no pre-cached matches to render behind the scenes
  // The moment isLoading becomes false (fetch done), the splash goes away
  // and the correct state (matches, empty state, or gate) is shown.
  const showSplash = isLoading && matches.length === 0

  if (!mounted || showSplash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 dark:selection:bg-indigo-500/30 uppercase tracking-tight">
        <div className="relative w-28 h-28 mb-12">
          {/* Outer Ring Glow */}
          <div className="absolute inset-[-8px] rounded-full bg-indigo-500/5 blur-2xl animate-pulse" />

          {/* Main Spinner (Silky Glass Sphere) */}
          <div className="absolute inset-0 rounded-full border-[3px] border-border/40" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center shadow-lg border border-border/80 backdrop-blur-xl">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
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

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative overflow-x-hidden">
      <PaymentVerificationOverlay
        isVisible={isVerifyingPayment}
        verifyCountdown={verifyCountdown}
        showPaymentFallback={showPaymentFallback}
        onFallback={handlePaymentFallbackCheck}
        onCancel={handleCancelVerification}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <TopHeader
          title="Top Matches"
          subtitle={`${matches.length} highly compatible roommates found.`}
        />

        <div className="flex flex-col px-4 sm:px-5 pt-6 pb-40 w-full max-w-2xl lg:max-w-4xl mx-auto">
          {isPioneerUser && !hasPaid && (
            <PioneerBanner handlePioneerClaim={handlePioneerClaim} />
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
            ) : matches.length > 0 ? (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!hasPaid && (
                  <div className="flex justify-center mb-8">
                    <button
                      onClick={handlePaymentFallbackCheck}
                      disabled={isVerifyingPayment}
                      className="group px-8 py-4 bg-card border border-border/40 rounded-[22px] text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all flex items-center gap-2.5 active:scale-[0.98] disabled:opacity-50 hover:text-foreground hover:bg-muted/50 shadow-sm"
                    >
                      {isVerifyingPayment ? <span className="animate-spin">⟳</span> : <UserCheck className="w-4 h-4" />}
                      {isVerifyingPayment ? "Checking Vault..." : "Already Paid? Verify Status"}
                    </button>
                  </div>
                )}
                <UserFlowGate 
                  isProfileComplete={isProfileComplete}
                  hasQuestionnaire={hasQuestionnaire}
                  hasPaid={hasPaid}
                  isVerifyingPayment={isVerifyingPayment}
                  handlePaymentFallbackCheck={handlePaymentFallbackCheck}
                  matchesCount={matches.length}
                >
                  <MatchFeed matches={matches.slice(0, Math.min(displayLimit, 20))} hasPaid={hasPaid} onSelectMatch={handleSelectMatch} isLoading={isLoading} />
                </UserFlowGate>

                {matches.length > displayLimit && displayLimit < 20 && (
                  <div className="flex justify-center mt-10 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button
                      onClick={() => setDisplayLimit(prev => Math.min(prev + 10, 20))}
                      className="group px-8 py-5 bg-muted/40 hover:bg-muted border border-border/40 rounded-[22px] flex items-center gap-4 transition-all active:scale-95 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-[18px] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] font-bold text-muted-foreground">Revealing top 20 potential roommates</span>
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : !isProfileComplete ? (
              <motion.div
                key="profile-incomplete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg mx-auto"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border/80 p-8 shadow-premium flex flex-col items-center text-center gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-3xl" />
                    <UserCheck className="w-9 h-9 text-amber-500 z-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[24px] font-black tracking-tight text-foreground leading-tight">Identity Synchronization</h2>
                    <p className="text-muted-foreground text-[14px] font-semibold leading-relaxed max-w-[280px]">
                      Welcome, student! Secure your institutional credentials to enter the matching pool.
                    </p>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    className="w-full py-6 bg-amber-500 text-white font-black text-[15px] rounded-[22px] shadow-xl shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    Setup Identity <Sparkles className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ) : !hasQuestionnaire ? (
              <motion.div
                key="questionnaire-incomplete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg mx-auto"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-[3xl] border border-border/80 p-8 shadow-premium flex flex-col items-center text-center gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-3xl" />
                    <Sparkles className="w-9 h-9 text-primary z-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[24px] font-black tracking-tight text-foreground leading-tight">DNA Mapping Required</h2>
                    <p className="text-muted-foreground text-[14px] font-semibold leading-relaxed max-w-[280px]">
                      Your identity is secure. Now, map your lifestyle DNA to find your perfect roommates.
                    </p>
                  </div>
                  <Link
                    to="/questionnaire"
                    className="w-full py-6 bg-foreground text-background font-black text-[15px] rounded-[22px] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    Start DNA Test <Sparkles className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <EmptyState
                isPioneerUser={isPioneerUser}
                isRecalculating={isRecalculating}
                forceRecalculate={forceRecalculate}
              />
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
        onReport={handleReportModalOpen}
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
      {currentDayNumber !== null && <FoundRoommateModal isOpen={isFoundRoommateModalOpen} onClose={handleFoundRoommateClose} onConfirm={handleFoundRoommateConfirm} dayNumber={currentDayNumber} />}
    </div>
  )
}
