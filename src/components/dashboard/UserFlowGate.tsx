import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, UserCheck } from 'lucide-react'
import { OrbitalLoader } from '../ui/OrbitalLoader'

interface UserFlowGateProps {
  isProfileComplete: boolean
  hasQuestionnaire: boolean
  hasPaid: boolean
  isVerifyingPayment: boolean
  handlePaymentFallbackCheck: () => void
  children: React.ReactNode
  matchesCount?: number
}

export function UserFlowGate({ 
  isProfileComplete, 
  hasQuestionnaire, 
  hasPaid,
  isVerifyingPayment,
  handlePaymentFallbackCheck,
  children,
  matchesCount = 0
}: UserFlowGateProps) {
  // Profile incomplete gate
  if (!isProfileComplete) {
    return (
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
    )
  }

  // Questionnaire incomplete gate (Only block if we also have 0 matches)
  if (!hasQuestionnaire && matchesCount === 0) {
    return (
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
    )
  }

  // Payment verification button (shown when user has matches but hasn't paid)
  if (!hasPaid) {
    return (
      <>
        <div className="flex justify-center mb-8">
          <button 
            onClick={handlePaymentFallbackCheck}
            disabled={isVerifyingPayment}
            className="group px-8 py-4 bg-card border border-border/40 rounded-[22px] text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all flex items-center gap-2.5 active:scale-[0.98] disabled:opacity-50 hover:text-foreground hover:bg-muted/50 shadow-sm"
          >
            {isVerifyingPayment ? <div className="scale-50 -mx-4 -my-4"><OrbitalLoader /></div> : <UserCheck className="w-4 h-4" />}
            {isVerifyingPayment ? "Checking Vault..." : "Already Paid? Verify Status"}
          </button>
        </div>
        {children}
      </>
    )
  }

  // All gates passed - render children
  return <>{children}</>
}
