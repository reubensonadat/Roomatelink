import { motion, AnimatePresence } from 'framer-motion'
import { OrbitalLoader } from '../ui/OrbitalLoader'
import { Check } from 'lucide-react'

interface PaymentVerificationOverlayProps {
  isVisible: boolean
  verifyCountdown: number
  showPaymentFallback: boolean
  onFallback: () => void
  onCancel: () => void
}

export function PaymentVerificationOverlay({ isVisible, verifyCountdown, showPaymentFallback, onFallback, onCancel }: PaymentVerificationOverlayProps) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center px-6"
      >
        {/* Spinner */}
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          <OrbitalLoader />
        </div>

        <h2 className="text-[20px] font-black text-foreground mb-3 tracking-tight uppercase text-center">Checking payment</h2>
        <p className="text-[13px] font-bold text-muted-foreground text-center max-w-[240px] mb-8 leading-relaxed opacity-80">
          Please hold on while we confirm your access.
        </p>

        {/* Animated progress bar */}
        <div className="w-full max-w-[280px] h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${((8 - verifyCountdown) / 8) * 100}%` }}
            className="h-full bg-primary rounded-full"
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Fallback button — appears after 8 seconds */}
        <AnimatePresence>
          {showPaymentFallback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-[13px] font-medium text-muted-foreground text-center">
                Taking longer than expected?
              </p>
              <button
                onClick={onFallback}
                className="px-8 py-4 bg-primary text-primary-foreground font-black text-[13px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 border border-white/10"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                I've Paid
              </button>
              <button
                onClick={onCancel}
                className="text-[12px] font-medium text-muted-foreground underline underline-offset-2"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
