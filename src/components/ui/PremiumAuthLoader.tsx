import { motion } from 'framer-motion'
import { GooeyLoader } from './GooeyLoader'

interface PremiumAuthLoaderProps {
  topLabel: string
  mainLabel: string
  subLabel?: string
}

export function PremiumAuthLoader({ topLabel, mainLabel, subLabel }: PremiumAuthLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 z-50">
      {/* Glow effect behind loader */}
      <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative mb-16">
        <GooeyLoader />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">
          {topLabel}
        </p>
        <h2 className="text-[28px] font-black tracking-tighter text-foreground leading-none mb-3">
          {mainLabel}
        </h2>
        {subLabel && (
          <p className="text-[14px] font-bold text-muted-foreground max-w-xs">
            {subLabel}
          </p>
        )}
      </motion.div>
    </div>
  )
}
