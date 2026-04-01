import { useState } from 'react'
import { RotateCw, UserX } from 'lucide-react'
import { MatchCard } from './MatchCard'

interface MatchFeedProps {
  matches: any[]
  hasPaid: boolean
  onSelectMatch: (match: any) => void
  isLoading: boolean
}

export function MatchFeed({ matches, hasPaid, onSelectMatch, isLoading }: MatchFeedProps) {
  const [visibleCount, setVisibleCount] = useState(10)

  const loadMore = () => {
    setVisibleCount(prev => prev + 10)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-14 h-14 rounded-4xl border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="mt-6 text-[13px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Scanning Grid...</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-24 h-24 rounded-5xl bg-muted/40 flex items-center justify-center mb-6 shadow-inner">
          <UserX className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-[22px] font-black text-foreground tracking-tight uppercase">No Matches Stabilized</h3>
        <p className="mt-3 text-[15px] font-medium text-muted-foreground max-w-sm leading-relaxed">
          The behavioral algorithm is still processing data. Complete your profile details to improve synchronization.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-10 px-8 py-4 rounded-4xl bg-card border border-border/60 text-foreground font-black text-[14px] shadow-premium hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" /> Refresh Hub
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 pb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[15px] font-black text-foreground uppercase tracking-wider">Top Matches</h2>
        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 px-3 py-1 rounded-full">
          {matches.length} Compatible
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {matches.slice(0, visibleCount).map((match: any) => (
          <MatchCard 
            key={match.id}
            match={match}
            isLocked={!hasPaid}
            onSelect={() => onSelectMatch(match)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {matches.length > visibleCount && (
        <button
          onClick={loadMore}
          className="w-full py-5 text-center bg-card border border-border/60 rounded-4xl text-[14px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted transition-all active:scale-[0.98] shadow-sm mt-4"
        >
          Load More Matches
        </button>
      )}
    </div>
  )
}
