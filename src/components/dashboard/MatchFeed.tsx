import { useState, useEffect } from 'react'
import { MatchCard } from './MatchCard'

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
      }, 500)
      return () => clearInterval(interval)
    } else {
      setUnlockedCount(0)
    }
  }, [hasPaid, matches.length, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card w-full rounded-3xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center border border-border/60 animate-pulse min-h-[110px] sm:min-h-[125px]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-muted shrink-0" />
            <div className="flex flex-col flex-1 gap-2">
              <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-muted rounded-sm" />
              <div className="h-2.5 sm:h-3 w-full bg-muted rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4 relative">
      {matches.map((match, i) => {
        const isRevealed = hasPaid || (i < unlockedCount)
        return (
          <MatchCard
            key={match.id}
            match={match}
            isRevealed={isRevealed}
            onSelect={() => onSelectMatch(match)}
            index={i}
          />
        )
      })}
    </div>
  )
}
