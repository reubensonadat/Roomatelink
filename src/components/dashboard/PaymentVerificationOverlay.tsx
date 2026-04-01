import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Check } from 'lucide-react'

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
        className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-6"
      >
        {/* Spinner */}
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-[4px] border-primary/20" />
          <div className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-[22px] font-black text-foreground mb-2 tracking-tight">Verifying Payment</h2>
        <p className="text-[14px] font-medium text-muted-foreground text-center max-w-[260px] mb-8">
          Please hold on while we confirm your payment securely.
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
                className="px-6 py-3 bg-primary text-primary-foreground font-bold text-[14px] rounded-2xl active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                I've Completed Payment
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
