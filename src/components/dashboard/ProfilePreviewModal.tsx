import { Check, MessageSquare, Lock, Flag, Heart, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ModalShell } from '../ui/ModalShell'

interface CategoryScore {
  name: string
  score: number
  insight: string
}

interface ProfilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onReport: (match: any) => void
  match: {
    id: string
    name: string
    verified: boolean
    matchPercent: number
    gender: string
    course: string
    level: string
    avatar: string
    bio: string
    sharedTraits: string[]
    tensions: string[]
    categoryScores: CategoryScore[]
    lifestyle?: { icon: any; text: string }[]
  }
  hasPaid: boolean
  onUnlock: () => void
  getTierInfo: (pct: number) => { label: string; color: string; stroke: string; textColor: string; bgLight: string; icon: string }
}

export function ProfilePreviewModal({ 
  isOpen, 
  onClose, 
  onReport,
  match, 
  hasPaid, 
  onUnlock, 
  getTierInfo
}: ProfilePreviewModalProps) {
  const tier = getTierInfo(match?.matchPercent || 0)

  if (!match?.id) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={hasPaid ? match.name : "High Affinity Match"}
      subtitle={`Tier: ${tier.label} Compatibility`}
      maxWidth="md:w-[1020px]"
    >
      <div className="flex flex-col md:flex-row min-h-0 -mx-5 md:-mx-8 -my-4 md:-my-6">
        {/* Left Column - Image Section (Desktop Only) */}
        <div className="hidden md:block w-[400px] relative bg-muted group overflow-hidden shrink-0 border-r border-border/40">
          <img 
            src={match.avatar} 
            alt={match.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-3xl ${tier.color} shadow-xl shadow-emerald-500/20 text-white bg-background/20 backdrop-blur-md border border-white/10`}>
              <span className="text-[20px] font-black">{match.matchPercent}%</span>
              <span className="text-[13px] font-black uppercase tracking-wider">{tier.label} Match</span>
            </div>
          </div>
        </div>

        {/* Right Column - Data Content */}
        <div className="flex-1 flex flex-col relative min-h-0">
          <div className="p-6 md:p-10">
            
            {/* Hero Header (Mobile Only) */}
            <div className="flex flex-col items-center gap-4 mb-10 md:hidden border-b border-border/40 pb-10">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-3xl border-2 border-primary/20 bg-muted overflow-hidden mx-auto shadow-elevated">
                  <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-[28px] font-black text-foreground tracking-tight leading-none mb-2">
                  {hasPaid ? match.name : "Top Tier Match"}
                </h2>
                <div className="flex items-center justify-center gap-1.5">
                  {match.verified && <Check className="w-4 h-4 text-blue-500 stroke-[3]" />}
                  <span className="text-[12px] font-black text-primary uppercase tracking-[0.1em]">Level {match.level} • {match.course}</span>
                </div>
              </div>
            </div>

            {/* Desktop Identity (Desktop Only) */}
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-[32px] font-black text-foreground tracking-tight">
                  {hasPaid ? match.name : "Top Tier Match"}
                </h2>
                {match.verified && (
                  <div className="w-8 h-8 rounded-3xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                    <Check className="w-5 h-5 text-blue-500 stroke-[4px]" />
                  </div>
                )}
              </div>
              <p className="text-[13px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-none">Level {match.level} • {match.course}</p>
            </div>

            {/* Status HUD */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-muted/30 border border-border/40 p-5 rounded-3xl text-center">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <p className="text-[15px] font-extrabold text-foreground uppercase">{match.verified ? "Verified" : "Unverified"}</p>
              </div>
              <div className="bg-muted/30 border border-border/40 p-5 rounded-3xl text-center">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Affinity</p>
                <p className={`text-[15px] font-extrabold uppercase ${tier.textColor}`}>{tier.label}</p>
              </div>
            </div>

            {/* Detailed Compatibility (Archive-V1 Feature) */}
            <div className="mb-10 text-left">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[13px] font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" /> Detailed Compatibility
                </h3>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{match.categoryScores?.length || 0} Dimensions</span>
              </div>

              <div className="flex flex-col gap-4">
                {match.categoryScores?.map((cat, i) => (
                  <div key={i} className="bg-muted/30 border border-border/40 p-5 rounded-3xl flex flex-col gap-3 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-black text-foreground leading-none">{cat.name}</span>
                        <span className="text-[12px] font-semibold text-muted-foreground italic leading-tight mt-1">
                          &ldquo;{cat.insight}&rdquo;
                        </span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg bg-background border border-border flex items-center justify-center`}>
                        <span className={`text-[14px] font-black ${cat.score >= 80 ? 'text-emerald-500' : cat.score >= 60 ? 'text-amber-500' : 'text-slate-400'}`}>{cat.score}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-card border border-border/40 rounded-sm overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.score}%` }}
                        className={`h-full rounded-sm ${cat.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : cat.score >= 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-400 opacity-30'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Traits */}
            {match.sharedTraits && match.sharedTraits.length > 0 && (
              <div className="w-full mb-10 text-left">
                <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-4">What You Share</h3>
                <div className="flex flex-col gap-2">
                  {match.sharedTraits.map((t: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
                      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-primary stroke-[4]" />
                      </div>
                      <span className="text-[14px] font-medium text-foreground leading-snug">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points of Awareness */}
            {match.tensions && match.tensions.length > 0 && (
              <div className="w-full mb-10 text-left">
                <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-4">Points of Awareness</h3>
                <div className="flex flex-col gap-2">
                  {match.tensions.map((tension: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                      <Eye className="w-3.5 h-3.5 text-amber-500 mt-1 shrink-0" />
                      <span className="text-[13px] font-semibold text-foreground leading-snug">{tension}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Section */}
            {match.bio && (
              <div className="w-full mb-12 text-left">
                <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-4">About Me</h3>
                {hasPaid ? (
                  <div className="bg-muted/30 p-6 rounded-3xl border border-border/40">
                    <p className="text-[15px] leading-relaxed text-foreground/90 font-medium italic">
                      &ldquo;{match.bio}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="relative group cursor-pointer" onClick={onUnlock}>
                    <div className="bg-muted/20 p-6 rounded-3xl border border-border/20 blur-[6px] grayscale saturate-0 pointer-events-none transition-all group-hover:blur-[8px]">
                      <p className="text-[15px] leading-relaxed opacity-20">
                        This is some blurred text that represents the bio of the user. Only unlocked accounts can read this profile bio and details. Standard security measures apply. High-fidelity verification in progress.
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-[1px] rounded-3xl transition-colors group-hover:bg-card/20">
                      <div className="flex flex-col items-center gap-2">
                        <Lock className="w-6 h-6 text-muted-foreground/60" />
                        <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.1em]">Unlock to read bio</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final Actions */}
            <div className="w-full flex flex-col gap-4 mt-8 pb-4">
              {hasPaid ? (
                <Link
                  to={`/dashboard/messages/${match.id}`}
                  className="w-full h-[64px] rounded-2xl bg-foreground text-background font-black text-[17px] shadow-premium active:scale-[0.98] transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  <MessageSquare className="w-6 h-6" /> Start Messaging
                </Link>
              ) : (
                <button
                  onClick={onUnlock}
                  className="w-full h-[64px] rounded-2xl bg-primary text-white font-black text-[17px] shadow-premium active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  <Lock className="w-6 h-6" /> Unlock Connection Hub
                </button>
              )}
              
              <button
                onClick={() => onReport(match)}
                className="flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-red-500 transition-colors uppercase text-[10px] font-black tracking-widest opacity-60 hover:opacity-100"
              >
                 <Flag className="w-4 h-4" /> Report This Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
