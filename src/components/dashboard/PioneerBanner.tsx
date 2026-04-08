import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface PioneerBannerProps {
  handlePioneerClaim: () => void
}

export function PioneerBanner({ handlePioneerClaim }: PioneerBannerProps) {
  return (
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
        className="px-6 py-4 bg-indigo-500 text-white rounded-[22px] font-black text-[13px] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
      >
        Claim
      </button>
    </motion.div>
  )
}
