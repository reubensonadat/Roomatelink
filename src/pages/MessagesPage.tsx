import { Search, MessageCircle, UserCheck, ChevronRight, Lock, Cpu, RefreshCw, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TopHeader } from '../components/layout/TopHeader'
import { useAuth } from '../context/AuthContext'
import { useChatThreads } from '../hooks/useChatThreads'
import { useUserFlowStatus } from '../hooks/useUserFlowStatus'
import { PAYMENT_AMOUNT } from '../lib/constants'
import DrawingHouseLoader from '../components/ui/DrawingHouseLoader'

export function MessagesPage() {
  const { isTrafficHeavy } = useAuth()
  
  // Use chat threads hook
  const { chats, isLoading, wsConnectionState, reconnectAvailable, reconnectWebSocket } = useChatThreads()
  
  // Use user flow status hook for profile gating
  const { hasPaid, isProfileComplete } = useUserFlowStatus()

  const profileStatus = {
    isProfileComplete,
    hasPaid
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30 overflow-x-hidden max-w-[100vw]">
      <TopHeader 
        title="Messages" 
        subtitle={chats.length > 0 ? `You have ${chats.length} active conversations.` : 'Your private conversations will appear here.'}
      />

      <AnimatePresence>
        {wsConnectionState === 'disconnected' && reconnectAvailable ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/95 backdrop-blur-sm text-white overflow-hidden shadow-lg border-b border-amber-400/30"
          >
            <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 bg-white/20 rounded-xl">
                  <WifiOff className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight leading-tight">Live updates paused</span>
                  <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wide sm:tracking-widest mt-0.5 truncate">Tap reconnect to refresh conversations</p>
                </div>
              </div>
              <button onClick={reconnectWebSocket} className="px-3 py-1.5 bg-white text-amber-600 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-tighter hover:bg-amber-50 transition-colors flex items-center gap-1.5 shrink-0">
                <RefreshCw className="w-3 h-3" />
                Reconnect
              </button>
            </div>
          </motion.div>
        ) : isTrafficHeavy && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600 text-white overflow-hidden shadow-lg border-b border-white/10"
          >
            <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Cpu className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight leading-tight">High Performance Mode</span>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-wide sm:tracking-widest mt-0.5 truncate">Live updates paused to save resources</p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-white text-indigo-600 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-tighter hover:bg-indigo-50 transition-colors shrink-0">Reconnect</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLoading && chats.length === 0 ? (
          <motion.div
            key="vault-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
              <DrawingHouseLoader />

              <div className="max-w-xs mt-8">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Loading messages</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                    Just a second...
                  </p>
              </div>

              <div className="relative w-full max-w-[240px] h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                />
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </div>

              <p className="text-[13px] font-bold text-muted-foreground/60">
                  Getting your conversations ready...
                </p>
          </motion.div>
        ) : !profileStatus.isProfileComplete ? (
        <motion.div
          key="profile-check"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-20 px-6 text-center gap-6"
        >
              <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-[2rem]" />
                <UserCheck className="w-9 h-9 text-amber-500 z-10" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Identity Check</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">Complete your profile setup to start connecting with roommates.</p>
              </div>
              <Link to="/profile" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
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
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center relative">
                <Lock className="w-9 h-9 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Unlock Messages</h2>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  Unlock your matches for GHS {PAYMENT_AMOUNT} to start private conversations with your top roommate matches.
                </p>
              </div>
              <Link to="/dashboard" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
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
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2rem]" />
                <MessageCircle className="w-9 h-9 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Quiet in Here</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">You haven't messaged anyone yet. Go check out your top matches!</p>
              </div>
              <Link to="/dashboard" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto justify-center flex">Browse Matches</Link>
          </motion.div>
        ) : (
          <div className="px-4 sm:px-5 space-y-3 max-w-md mx-auto pt-6 pb-32 w-full">
              {/* Search Bar Refined: Only shows with active threads */}
              <div className="pt-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group w-full max-w-md mx-auto">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/60 transition-colors group-focus-within:text-primary z-10" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full h-[56px] sm:h-[60px] pl-14 sm:pl-16 pr-6 sm:pr-8 bg-background border-2 border-border/80 rounded-[18px] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all font-black text-[14px] sm:text-[17px] text-foreground placeholder:text-muted-foreground/50 shadow-md relative z-0"
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
                    className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 md:p-5 bg-card rounded-[22px] border border-border/80 shadow-premium hover:shadow-elevated hover:border-primary/20 transition-all active:scale-[0.98] group relative"
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
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <span className="text-[15px] sm:text-[17px] font-black text-foreground truncate tracking-tight min-w-0">{chat.name}</span>
                            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest shrink-0 whitespace-nowrap ${chat.unread > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                              {chat.time}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2 sm:gap-3">
                            <p className={`text-[13px] sm:text-[14px] leading-relaxed line-clamp-2 flex-1 break-words ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
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
