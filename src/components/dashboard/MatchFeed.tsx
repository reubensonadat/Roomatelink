import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MatchCard } from './MatchCard'
import DrawingHouseLoader from '../ui/DrawingHouseLoader'

interface MatchFeedProps {
  matches: any[]
  hasPaid: boolean
  onSelectMatch: (match: any) => void
  isLoading: boolean
}

export function MatchFeed({ matches, hasPaid, onSelectMatch, isLoading }: MatchFeedProps) {
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setUnlockedCount(0)
      return
    }

    if (hasPaid) {
      // Staggered reveal animation (Archive-V1 Standard)
      const interval = setInterval(() => {
        setUnlockedCount(prev => {
          if (prev >= matches.length) {
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, 300)
      return () => clearInterval(interval)
    } else {
      setUnlockedCount(0)
    }
  }, [hasPaid, matches.length, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <DrawingHouseLoader />
        <p className="mt-4 text-sm font-bold text-muted-foreground">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4 relative w-full">
      <AnimatePresence mode="popLayout">
        {matches.map((match, i) => {
          const isRevealed = hasPaid || (i < unlockedCount)
          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: i * 0.1, 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              layout
            >
              <MatchCard
                match={match}
                isRevealed={isRevealed}
                onSelect={() => onSelectMatch(match)}
                index={i}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
