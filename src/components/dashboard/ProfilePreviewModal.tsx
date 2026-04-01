import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Heart, Eye, MessageSquare, Lock, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CategoryScore {
  name: string
  score: number
  insight: string
}

interface ProfilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
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
  }
  hasPaid: boolean
  onUnlock: () => void
  getTierInfo: (pct: number) => { label: string; color: string; stroke: string; textColor: string; bgLight: string; icon: string }
  getScoreColor: (score: number) => string
  getScoreLabel: (score: number) => string
}

export function ProfilePreviewModal({ isOpen, onClose, match, hasPaid, onUnlock, getTierInfo, getScoreColor, getScoreLabel }: ProfilePreviewModalProps) {
  if (!isOpen) return null

  const tier = getTierInfo(match.matchPercent)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full md:w-[1000px] max-w-full bg-card border-t md:border border-border rounded-t-5xl md:rounded-4xl shadow-2xl overflow-hidden pointer-events-auto max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row"
        >
          {/* Left Column - Large Image (Desktop Only) */}
          <div className="hidden md:block w-2/5 relative bg-muted group overflow-hidden">
            <img src={match.avatar} alt={match.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-8 left-8 right-8 text-left">
              <div className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-3xl ${tier.color} shadow-xl shadow-emerald-500/20 text-white bg-background/20 backdrop-blur-md border border-white/10`}>
                <span className="text-[20px] font-black">{match.matchPercent}%</span>
                <span className="text-[13px] font-black uppercase tracking-wider">{tier.label} Match</span>
              </div>
            </div>
          </div>

          {/* Right Column - Scrollable Content */}
          <div className="flex-1 flex flex-col relative bg-card min-h-0">
            {/* Mobile Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-12 h-1.5 rounded-3xl bg-muted/60" />
            </div>

            {/* Close Hub (Top Row) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-50">
              {/* Back Button (Always Visible) */}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-card/60 backdrop-blur-xl border border-border/40 flex items-center gap-2 hover:bg-foreground hover:text-background transition-all active:scale-95 pointer-events-auto text-foreground group"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-[13px] font-black uppercase tracking-wider hidden sm:inline">Back</span>
              </button>

              {/* Close Button (Always Visible) */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-xl border border-border/40 flex items-center justify-center hover:bg-destructive hover:text-white transition-all active:scale-95 pointer-events-auto text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 md:py-12 custom-scrollbar">
              {/* Hero Header (Mobile Only) */}
              <div className="flex flex-col items-center gap-4 mb-10 md:hidden border-b border-border/40 pb-10">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl border-2 border-primary/20 bg-muted overflow-hidden mx-auto">
                    <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-[26px] font-black text-foreground leading-tight">
                    {hasPaid ? match.name : "High Compat Match"}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[14px] font-bold text-primary">Level {match.level} • {match.course}</span>
                    {match.verified && <Check className="w-4 h-4 text-blue-500 stroke-5" />}
                  </div>
                </div>
              </div>

              {/* Identity Header (Desktop Only) */}
              <div className="hidden md:block mb-10 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-[34px] font-black text-foreground tracking-tight">
                    {hasPaid ? match.name : "High Compat Match"}
                  </h2>
                  {match.verified && (
                    <div className="w-8 h-8 rounded-3xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                      <Check className="w-5 h-5 text-blue-500 stroke-[4px]" />
                    </div>
                  )}
                </div>
                <p className="text-[16px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Level {match.level} • {match.course}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-muted/30 border border-border/40 p-5 rounded-4xl text-center shadow-sm">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[16px] font-extrabold text-foreground">{match.verified ? "Verified" : "Unverified"}</p>
                </div>
                <div className="bg-muted/30 border border-border/40 p-5 rounded-4xl text-center shadow-sm">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-[16px] font-extrabold text-foreground">{match.gender}</p>
                </div>
              </div>

              {/* Compatibility Section */}
              <div className="mb-10 text-left">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[14px] font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" /> Detailed Compatibility
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{match.categoryScores.length} Dimensions</span>
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {match.categoryScores.map((cat, i) => (
                    <div key={i} className="bg-muted/30 border border-border/40 p-5 rounded-4xl flex flex-col gap-3 shadow-sm hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-black text-foreground leading-none">{cat.name}</span>
                          <span className="text-[12px] font-semibold text-muted-foreground italic leading-tight mt-1">
                            &ldquo;{cat.insight}&rdquo;
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg bg-background border border-border flex items-center justify-center ${getScoreLabel(cat.score)}`}>
                          <span className={`text-[14px] font-black ${getScoreLabel(cat.score)}`}>{cat.score}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-card border border-border/40 rounded-full overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.score}%` }}
                          className={`h-full rounded-full ${getScoreColor(cat.score)} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Traits Section */}
              <div className="w-full mb-10 text-left">
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">What You Share</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {match.sharedTraits.length > 0 ? (
                    match.sharedTraits.map((t, i) => (
                      <div key={i} className="flex items-start gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-primary stroke-[4px]" />
                        </div>
                        <span className="text-[14px] font-medium text-foreground leading-snug">{t}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-muted-foreground pl-1 italic">Comparison processing...</p>
                  )}
                </div>
              </div>

              {/* Flagged Tensions Section */}
              {match.tensions && match.tensions.length > 0 && (
                <div className="w-full mb-10 text-left">
                  <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4 text-amber-500">Points of Awareness</h3>
                  <div className="flex flex-col gap-2">
                    {match.tensions.map((tension, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-4 py-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                         <Eye className="w-3.5 h-3.5 text-amber-500 mt-1 shrink-0" />
                         <span className="text-[14px] font-medium text-foreground leading-snug">{tension}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio Section */}
              <div className="w-full mb-8 text-left">
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">About Me</h3>
                {hasPaid ? (
                  <div className="bg-muted/30 p-5 rounded-4xl border border-border/40 shadow-sm">
                    <p className="text-[15px] leading-relaxed text-foreground/90 font-medium italic">
                      &ldquo;{match.bio}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-muted/20 p-5 rounded-3xl border border-border/20 blur-[6px] grayscale saturate-0 pointer-events-none">
                      <p className="text-[15px] leading-relaxed opacity-20">
                        This is some blurred text that represents the bio of the user. Only unlocked accounts can read this profile bio and details. Standard security measures apply.
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-[1px] rounded-3xl">
                      <Lock className="w-5 h-5 text-muted-foreground/60" />
                      <span className="text-[12px] font-bold text-muted-foreground ml-2">Unlock to read bio</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-3 pb-6 md:pb-0">
                {hasPaid ? (
                  <Link
                    to={`/dashboard/messages/${match.id}`}
                    className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-[18px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    <MessageSquare className="w-6 h-6" /> Start Messaging
                  </Link>
                ) : (
                  <button
                    onClick={onUnlock}
                    className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-[18px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    <Lock className="w-6 h-6" /> Unlock Matches for GHS 25
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
