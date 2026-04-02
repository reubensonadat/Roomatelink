import { Check, MessageSquare, Lock, Flag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full md:w-[980px] max-h-[90vh] bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row pointer-events-auto"
          >
            {/* Close Button (All devices) */}
            <button
               onClick={onClose}
               className="absolute top-6 right-6 z-50 w-11 h-11 rounded-2xl bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-foreground hover:text-background transition-all active:scale-90 shadow-sm"
            >
               <X className="w-5 h-5" />
            </button>

            {match?.id && (
              <>
                {/* Left Column - Large Image (Desktop Only) */}
                <div className="hidden md:block w-[380px] relative bg-muted group overflow-hidden shrink-0">
                  <img 
                    src={match.avatar} 
                    alt={match.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-8 left-8 right-8 text-left">
                    <div className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-3xl ${tier.color} shadow-xl shadow-emerald-500/20 text-white bg-background/20 backdrop-blur-md border border-white/10`}>
                      <span className="text-[20px] font-black">{match.matchPercent}%</span>
                      <span className="text-[13px] font-black uppercase tracking-wider">{tier.label} Match</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Scrollable Content */}
                <div className="flex-1 flex flex-col relative min-h-0">
                  <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar scroll-smooth">
                    
                    {/* Header Controls */}
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Institutional Hub • Batch v2.0</h3>
                    </div>

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

                    {/* Identity Header (Desktop Only) */}
                    <div className="hidden md:block mb-10 text-left">
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

                    {/* Stats HUD */}
                    <div className="grid grid-cols-2 gap-4 mb-12">
                      <div className="glass-v2 p-5 rounded-[2rem] text-center shadow-premium border border-border/40">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Verification</p>
                        <p className="text-[14px] font-black text-foreground uppercase">{match.verified ? "Verified" : "Pending"}</p>
                      </div>
                      <div className="glass-v2 p-5 rounded-[2rem] text-center shadow-premium border border-border/40">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Alignment</p>
                        <p className={`text-[14px] font-black uppercase ${tier.textColor}`}>{tier.label}</p>
                      </div>
                    </div>

                    {/* Lifestyle Pillars */}
                    {hasPaid && match.lifestyle && (
                      <div className="w-full mb-10 text-left">
                        <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-4">Lifestyle Pillars</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {match.lifestyle.map((life: any, i: number) => {
                            const LifeIcon = life.icon || Check; // Fallback to Check if icon component missing
                            return (
                              <div key={i} className="flex flex-row sm:flex-col items-center sm:items-start gap-3 p-4 bg-muted/30 border border-border/50 rounded-2xl group hover:border-primary/40 transition-colors">
                                <div className="w-8 h-8 rounded-3xl bg-card shadow-sm border border-border flex items-center justify-center shrink-0 text-primary">
                                  <LifeIcon className="w-4 h-4" />
                                </div>
                                <span className="text-[13px] font-bold text-foreground leading-tight">{life.text}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

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

                    {/* Flagged Tensions */}
                    {match.tensions && match.tensions.length > 0 && (
                      <div className="w-full mb-10 text-left">
                        <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest pl-1 mb-4">Points of Awareness</h3>
                        <div className="flex flex-col gap-2">
                          {match.tensions.map((tension: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                              <Check className="w-3.5 h-3.5 text-amber-500 mt-1 shrink-0" /> {/* Replicating the Eye icon intent */}
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
                    <div className="w-full flex flex-col gap-4 mt-8 pb-12">
                      {hasPaid ? (
                        <Link
                          to={`/dashboard/messages/${match.id}`}
                          className="w-full py-5 rounded-[2rem] bg-foreground text-background font-black text-[17px] shadow-premium active:scale-[0.98] transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                          <MessageSquare className="w-6 h-6" /> Start Messaging
                        </Link>
                      ) : (
                        <button
                          onClick={onUnlock}
                          className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-[17px] shadow-premium active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 uppercase tracking-widest"
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
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
