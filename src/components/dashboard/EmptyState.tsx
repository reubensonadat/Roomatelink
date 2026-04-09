import { motion } from 'framer-motion'
import { Sparkles, Lock as LockIcon, Timer } from 'lucide-react'
import { useState, useEffect } from 'react'
import { OrbitalLoader } from '../ui/OrbitalLoader'

interface EmptyStateProps {
  isPioneerUser: boolean
  isRecalculating: boolean
  forceRecalculate: () => void
}

const COOLDOWN_MS = 5 * 60 * 1000 // 5 Minutes

export function EmptyState({ isPioneerUser, isRecalculating, forceRecalculate }: EmptyStateProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const checkCooldown = () => {
      const lastRun = localStorage.getItem('last_recalculate')
      if (lastRun) {
        const elapsed = Date.now() - parseInt(lastRun)
        if (elapsed < COOLDOWN_MS) {
          setTimeLeft(Math.ceil((COOLDOWN_MS - elapsed) / 1000))
        } else {
          setTimeLeft(0)
        }
      }
    }

    checkCooldown()
    const interval = setInterval(checkCooldown, 1000)
    return () => clearInterval(interval)
  }, [isRecalculating])

  const handleRecalculate = () => {
    if (timeLeft > 0) return
    localStorage.setItem('last_recalculate', Date.now().toString())
    forceRecalculate()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center pt-10 pb-16 px-6 text-center"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 relative">
        <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-full" />
        <LockIcon className="w-8 h-8 text-primary animate-pulse" />
      </div>
      {isPioneerUser ? (
        <>
          <h3 className="text-[20px] font-black text-foreground mb-2">Pioneer Hub</h3>
          <p className="text-muted-foreground text-[14px] font-medium leading-relaxed max-w-[240px] mb-3">
            We're currently matching you with initial wave of students. New compatible roommates appear as they join!
          </p>
          <p className="text-muted-foreground text-[13px] font-semibold leading-relaxed max-w-[240px] mb-5">
            Check back daily or invite friends to speed up the process.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-[20px] font-black text-foreground mb-2">You're Early!</h3>
          <p className="text-muted-foreground text-[14px] font-medium leading-relaxed max-w-[240px] mb-5">
            We're still mapping campus DNA. Check back soon for your perfect roommate matches!
          </p>
        </>
      )}
      <button
        onClick={handleRecalculate}
        disabled={isRecalculating || timeLeft > 0}
        className="mt-2 px-8 py-4 bg-muted text-foreground border border-border/50 rounded-[22px] font-bold flex items-center gap-2 hover:bg-muted/80 transition-all active:scale-95 disabled:opacity-50 tracking-tight"
      >
        {isRecalculating ? (
          <div className="scale-50 -mx-4 -my-4"><OrbitalLoader /></div>
        ) : timeLeft > 0 ? (
          <Timer className="w-4 h-4 text-amber-500" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        
        {isRecalculating 
          ? "Running Algorithm..." 
          : timeLeft > 0 
            ? `Cooldown: ${formatTime(timeLeft)}` 
            : "Force Run Algorithm"}
      </button>
    </motion.div>
  )
}
