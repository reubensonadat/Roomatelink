import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'

interface PioneerModalProps {
  isOpen: boolean
  onClose: () => void
  onClaim: () => void
}

export function PioneerModal({ isOpen, onClose, onClaim }: PioneerModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[340px] bg-card rounded-3xl p-6 shadow-2xl overflow-hidden text-center border border-primary/30"
        >
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 shadow-inner">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3 relative z-10 flex items-center justify-center gap-2">
            Pioneer Status
          </h2>
          <p className="text-[14px] text-muted-foreground font-medium leading-relaxed mb-6 relative z-10">
            You are officially one of the very first 100 students to join the roommate revolution. To say thank you, we've completely waived your verification fee.
            <br /><br />
            <span className="text-foreground font-bold">Your Premium access is free forever.</span>
          </p>

          <button
            onClick={onClaim}
            className="w-full h-[52px] bg-primary text-primary-foreground font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-md relative z-10"
          >
            Claim Pioneer Access <Sparkles className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
