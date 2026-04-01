import { ChevronRight, Lock, ShieldCheck, Heart, MessageSquare } from 'lucide-react'

interface MatchCardProps {
  match: any
  isLocked: boolean
  isPioneerUser: boolean
  onSelect: () => void
}

export function MatchCard({ match, isLocked, isPioneerUser, onSelect }: MatchCardProps) {
  return (
    <div 
      onClick={onSelect}
      className="bg-card/40 backdrop-blur-xl rounded-4xl shadow-premium border border-border/40 hover:border-primary/50 transition-all cursor-pointer group flex flex-col h-full overflow-hidden"
    >
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-6">
          {/* Avatar Hub */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-4xl bg-muted/40 overflow-hidden ring-4 ring-primary/5 border border-border/60">
              {match.avatar ? (
                <img
                  src={match.avatar}
                  alt={match.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-violet-600/10">
                  <span className="text-primary font-black text-xl">
                    {match.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {match.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-card flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="bg-primary px-3 py-1.5 rounded-3xl shadow-lg shadow-primary/20">
              <span className="text-white font-black text-[18px]">
                {match.matchPercent}%
              </span>
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5">Compatibility</p>
          </div>
        </div>

        {/* Identity & Course */}
        <div className="mb-6 flex-1">
          <h3 className="text-[18px] font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
            {isLocked ? "Compatible Matching" : match.name}
          </h3>
          <p className="text-[12px] font-bold text-muted-foreground mt-1 uppercase tracking-wider line-clamp-1">
            {match.course} • LEVEL {match.level}
          </p>
        </div>

        {/* Tags Tier */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {match.tags?.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="bg-muted/40 px-3 py-1 rounded-2xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/40"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Interaction Bar */}
        <div className="mt-auto pt-4 border-t border-border/40">
          {isLocked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black text-amber-600/80 uppercase tracking-widest">Locked Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
          ) : (
            <div className="flex items-center justify-between text-primary">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase tracking-widest">Open Connection</span>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
