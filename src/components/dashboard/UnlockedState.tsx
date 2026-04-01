 import { MessageSquare, ChevronRight } from 'lucide-react'

interface UnlockedStateProps {
  matchPercentage: number
  tier: string
  onMessage: () => void
}

export function UnlockedState({ matchPercentage, tier, onMessage }: UnlockedStateProps) {
  return (
    <div className="bg-card rounded-4xl shadow-premium border border-border p-6">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 px-3 py-1.5 rounded-full">
          <span className="text-white font-bold text-lg">
            {matchPercentage}%
          </span>
        </div>
        <div className="flex-1">
          <div className="bg-muted/20 px-3 py-1.5 rounded-full">
            {tier === 'exceptional' && (
              <span className="text-emerald-500 font-bold">🔥 Exceptional Match</span>
            )}
            {tier === 'strong' && (
              <span className="text-green-500 font-bold">💚 Strong Match</span>
            )}
            {tier === 'good' && (
              <span className="text-amber-500 font-bold">💛 Good Match</span>
            )}
            {tier === 'potential' && (
              <span className="text-slate-400 font-bold">⚪ Potential Match</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          You have a {tier.toLowerCase()} compatibility level with this roommate. Review their profile to learn more.
        </p>
        <button
          onClick={onMessage}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg"
        >
          Send Message
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </div>
    </div>
  )
}
