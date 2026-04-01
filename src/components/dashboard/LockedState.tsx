import { Lock } from 'lucide-react'

export function LockedState({ matchPercentage, tier, onUnlock }: { matchPercentage: number; tier: string; onUnlock: () => void }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-violet-600 flex items-center justify-center mb-4">
        <Lock className="w-10 h-10 text-amber-500" />
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-bold text-foreground">Match Locked</h3>
        <p className="text-muted-foreground mt-2">
          {tier === 'exceptional' && (
            <>
              <span className="text-emerald-500 font-bold">🔥</span>
            </>
          )}
          {tier === 'strong' && (
            <>
              <span className="text-green-500 font-bold">💚</span>
            </>
          )}
          {tier === 'good' && (
            <>
              <span className="text-amber-500 font-bold">💛</span>
            </>
          )}
          {tier === 'potential' && (
            <>
              <span className="text-slate-400 font-bold">⚪</span>
            </>
          )}
        </p>
      </div>
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{matchPercentage}%</span> compatible
        </p>
        <p className="text-xs text-muted-foreground">
          Unlock to view full profile and start messaging.
        </p>
      </div>
      <button
        onClick={onUnlock}
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg"
      >
        Unlock Now
      </button>
    </div>
  )
}
