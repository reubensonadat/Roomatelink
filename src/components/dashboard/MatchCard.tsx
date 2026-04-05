import { Check, Flag, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MatchCardProps {
  match: any
  isRevealed: boolean
  onSelect: () => void
  index: number
}

function getTierInfo(pct: number) {
  if (pct >= 90) return { label: 'Exceptional', color: 'text-emerald-500', stroke: '#10b981', textColor: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10' };
  if (pct >= 80) return { label: 'Strong', color: 'text-green-500', stroke: '#22c55e', textColor: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-500/10' };
  if (pct >= 70) return { label: 'Good', color: 'text-amber-500', stroke: '#f59e0b', textColor: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10' };
  return { label: 'Potential', color: 'text-slate-400', stroke: '#94a3b8', textColor: 'text-slate-500', bgLight: 'bg-slate-400/10' };
}

export function MatchCard({ match, isRevealed, onSelect, index }: MatchCardProps) {
  const tier = getTierInfo(match.matchPercent);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={onSelect}
        className="group w-full bg-card rounded-[22px] p-3 sm:p-3.5 md:p-4 flex gap-4 sm:gap-4 md:gap-5 items-center border-2 border-border/60 shadow-premium transition-all hover:border-primary/40 hover:shadow-elevated active:scale-[0.98] min-h-[105px] sm:min-h-[115px] md:min-h-[130px] overflow-hidden relative text-left"
      >
        {/* Avatar Wrapper */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 shrink-0">
          <div className={`w-full h-full rounded-[22px] border-2 border-primary/20 bg-muted overflow-hidden relative shadow-inner transition-all duration-1000 ease-out ${!isRevealed ? 'blur-lg grayscale saturate-0' : 'blur-0 grayscale-0 saturate-100'}`}>
            {match.avatar ? (
              <img src={match.avatar} alt={match.name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-primary font-black text-xl">{match.name?.charAt(0) || 'S'}</span>
               </div>
            )}
          </div>
          {!isRevealed && (
            <div className="absolute inset-0 rounded-[22px] bg-background/30 flex items-center justify-center backdrop-blur-[1px]">
              <Lock className="w-4 h-4 text-foreground/50" />
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="flex flex-col flex-1 min-w-0 pr-1">
          {isRevealed ? (
            <AnimatePresence mode="wait">
              <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] font-bold text-foreground truncate">{match.name}</h3>
                  {match.verified && <Check className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 stroke-[3]" />}
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-primary/80 truncate mb-1 w-full">
                  Level {match.level} • {match.course}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                   <span className="px-3 py-1 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground border border-border/40">
                    {match.trait || "Potential Roommate"}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col gap-2">
               <span className={`w-fit text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${tier.bgLight} ${tier.textColor}`}>
                {tier.label} Match
              </span>
              <div className="h-3 w-3/4 bg-muted/40 rounded-sm animate-pulse" />
              <div className="h-2 w-1/2 bg-muted/30 rounded-xs animate-pulse" />
            </div>
          )}
        </div>

        {/* Compatibility Gauge */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
            <motion.circle 
              cx="24" cy="24" r="20" 
              stroke={tier.stroke} strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={125.6} 
              initial={{ strokeDashoffset: 125.6 }} 
              animate={{ strokeDashoffset: 125.6 - (125.6 * (match.matchPercent / 100)) }} 
              transition={{ duration: 1.5, ease: "easeOut" }} 
            />
          </svg>
          <span className={`absolute text-[10px] sm:text-[11px] font-black ${tier.textColor}`}>
            {match.matchPercent}%
          </span>
        </div>

        {/* Quick Actions (Report Flag) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="absolute top-2 right-2 p-2 text-muted-foreground/20 hover:text-red-500/40 transition-colors z-20"
        >
          <Flag className="w-3 h-3" />
        </button>
      </button>
    </motion.div>
  )
}
