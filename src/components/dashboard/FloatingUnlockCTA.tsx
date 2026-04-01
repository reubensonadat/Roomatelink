import { motion, AnimatePresence } from 'framer-motion'
import { Unlock, ChevronRight } from 'lucide-react'

interface FloatingUnlockCTAProps {
  isVisible: boolean
  onClick: () => void
}

export function FloatingUnlockCTA({ isVisible, onClick }: FloatingUnlockCTAProps) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: 20, x: '-50%' }}
        className="fixed bottom-32 left-1/2 z-50 w-full max-w-[440px] px-4 sm:px-5 pointer-events-none"
      >
        <button
          onClick={onClick}
          className="w-full bg-card dark:bg-card backdrop-blur-3xl text-foreground p-3 sm:p-4 rounded-[24px] flex items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all border border-border pointer-events-auto"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 pl-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 transition-transform group-hover:scale-110">
              <Unlock className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-primary" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[13px] sm:text-[14px] font-black uppercase tracking-widest text-foreground">Secure Identity</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 leading-tight">Verify student status for full access</span>
            </div>
          </div>
          <div className="bg-primary hover:bg-foreground px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-black text-[13px] sm:text-[14px] text-primary-foreground shadow-lg transition-all active:scale-95 flex items-center gap-2 pointer-events-auto">
            Verify <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
