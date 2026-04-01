import { ChevronRight } from 'lucide-react'

interface CompatibilityBreakdownProps {
  categoryScores: any[]
  matchPercentage: number
  patternFlags: string[]
}

export function CompatibilityBreakdown({ categoryScores, matchPercentage, patternFlags }: CompatibilityBreakdownProps) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Compatibility Breakdown</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall: </span>
          <span className="text-3xl font-black text-primary font-bold">{matchPercentage}%</span>
        </div>
      </div>

      {/* Category Scores */}
      <div className="space-y-4">
        {categoryScores.map((cat: any, index: number) => (
          <div key={index} className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Score: </span>
                <span className={`text-3xl font-black ${
                  cat.score >= 85 ? 'text-emerald-500' : 
                  cat.score >= 70 ? 'text-green-500' : 
                  cat.score >= 50 ? 'text-amber-500' : 'text-red-400'
                }`}>
                  {cat.score}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-background border-border/60 rounded-full h-2">
              <div
                className={`h-full rounded-full ${
                  cat.score >= 85 ? 'bg-emerald-500' : 
                  cat.score >= 70 ? 'bg-green-500' : 
                  cat.score >= 50 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${cat.score}%` }}
              ></div>
            </div>

            {/* Insight */}
            {cat.insight && (
              <p className="text-sm text-muted-foreground mt-2">
                {cat.insight}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pattern Flags */}
      {patternFlags.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/60 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-3">Pattern Flags</h3>
          <div className="space-y-3">
            {patternFlags.map((flag: string, index: number) => (
              <div key={index} className="flex items-start gap-4 bg-amber-500/5 px-5 py-4 rounded-2xl border border-amber-500/15 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-black text-amber-600 uppercase tracking-widest">Observation #{index + 1}</span>
                  <span className="text-[14px] font-medium text-foreground leading-snug">{flag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
