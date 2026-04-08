import { Search, MessageCircle, UserCheck, ChevronRight, Lock, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TopHeader } from '../components/layout/TopHeader'
import { useAuth } from '../context/AuthContext'
import { useChatThreads } from '../hooks/useChatThreads'
import { useUserFlowStatus } from '../hooks/useUserFlowStatus'
import { PAYMENT_AMOUNT } from '../lib/constants'

export function MessagesPage() {
  const { isTrafficHeavy } = useAuth()
  
  // Use chat threads hook
  const { chats, isLoading } = useChatThreads()
  
  // Use user flow status hook for profile gating
  const { hasPaid, isProfileComplete } = useUserFlowStatus()

  const profileStatus = {
    isProfileComplete,
    hasPaid
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader 
        title="Messages" 
        subtitle={chats.length > 0 ? `You have ${chats.length} active conversations.` : 'Your private conversations will appear here.'}
      />

      <AnimatePresence>
        {isTrafficHeavy && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600 text-white overflow-hidden shadow-lg border-b border-white/10"
          >
            <div className="px-5 py-3 flex items-center justify-between gap-4 max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Cpu className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight leading-tight">High Performance Mode</span>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5">Live updates paused to save resources</p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-tighter hover:bg-indigo-50 transition-colors shrink-0">Reconnect</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="vault-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-[2.5rem]" />
                <Lock className="w-10 h-10 text-primary" />
              </div>

              <div className="max-w-xs">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Syncing Vault</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                    Establishing Secure Link
                  </p>
              </div>

              {/* Boutique Progress Bar */}
              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                />
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </div>

              <p className="text-[13px] font-bold text-muted-foreground">
                  Synchronizing with Institutional Servers...
                </p>
          </motion.div>
        ) : !profileStatus.isProfileComplete ? (
        <motion.div
          key="profile-check"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-20 px-6 text-center gap-6"
        >
              <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-[2.5rem]" />
                <UserCheck className="w-10 h-10 text-amber-500 z-10" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Identity Check</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">Complete your profile setup to start connecting with roommates.</p>
              </div>
              <Link to="/profile" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Setup Identity <ChevronRight className="w-4 h-4" />
              </Link>
          </motion.div>
        ) : !profileStatus.hasPaid ? (
        <motion.div
          key="pay-check"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-20 px-6 text-center gap-6"
        >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center relative">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Unlock Messages</h2>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  Unlock your matches for GHS {PAYMENT_AMOUNT} to start private conversations with your top roommate matches.
                </p>
              </div>
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Unlock Matches <ChevronRight className="w-4 h-4" />
              </Link>
          </motion.div>
        ) : chats.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-20 px-6 text-center gap-6"
        >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2.5rem]" />
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Quiet in Here</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">You haven't messaged anyone yet. Go check out your top matches!</p>
              </div>
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">Browse Matches</Link>
          </motion.div>
        ) : (
          <div className="px-5 space-y-4 max-w-lg mx-auto pt-6">
              {/* Search Bar Refined: Only shows with active threads */}
              <div className="pt-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group w-full max-w-lg mx-auto">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/60 transition-colors group-focus-within:text-primary z-10" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full h-[60px] pl-16 pr-8 bg-background border-2 border-border/80 rounded-[18px] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all font-black text-[15px] sm:text-[17px] text-foreground placeholder:text-muted-foreground/50 shadow-md relative z-0"
                  />
                </div>
              </div>

              {chats.map((chat, i) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="group"
                >
                  <Link 
                    to={`/dashboard/messages/${chat.id}`} 
                    className="flex items-start gap-5 p-6 bg-card rounded-[24px] border border-border/80 shadow-premium hover:shadow-elevated hover:border-primary/20 transition-all active:scale-[0.98] group relative"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-muted border border shadow-inner overflow-hidden relative">
                        <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                        {chat.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-[22px] border-4 border-card flex items-center justify-center animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[17px] font-black text-foreground truncate tracking-tight">{chat.name}</span>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${chat.unread > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                              {chat.time}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-3">
                            <p className={`text-[14px] leading-relaxed line-clamp-2 flex-1 break-all ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                              {chat.lastMessage}
                            </p>
                            {chat.unread > 0 && (
                              <div className="mt-1 min-w-[22px] h-[22px] bg-primary rounded-[22px] flex items-center justify-center text-[10px] font-black text-primary-foreground px-1.5 shadow-lg shadow-primary/20">
                                {chat.unread}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          )}
        </AnimatePresence>
    </div>
  )
}
