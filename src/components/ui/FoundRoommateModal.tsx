import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, PartyPopper } from 'lucide-react'

interface FoundRoommateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  dayNumber: number
}

export function FoundRoommateModal({ isOpen, onClose, onConfirm, dayNumber }: FoundRoommateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md pointer-events-auto"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[400px] bg-card border border-border/60 rounded-[3rem] p-8 shadow-2xl overflow-hidden text-center pointer-events-auto"
          >
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
            
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative z-10">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-black tracking-tight mb-2 relative z-10">Day {dayNumber} Check-in</h2>
            <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-8 relative z-10">
              It's been {dayNumber} days since you joined the tribe. Have you successfully found a roommate yet?
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={onConfirm}
                className="w-full py-4.5 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Yes, I found one! <Check className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 text-sm font-black text-muted-foreground hover:text-foreground transition-colors"
              >
                Still looking...
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
