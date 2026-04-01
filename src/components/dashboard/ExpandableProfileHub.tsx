import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, RotateCw, User, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'

interface ExpandableProfileHubProps {
  userName: string
  avatarUrl?: string
  matchCount: number
  hasPaid: boolean
  onRefresh: () => void
  onNavigateToProfile: () => void
  onNavigateToSettings: () => void
}

export function ExpandableProfileHub({
  userName,
  avatarUrl,
  matchCount,
  hasPaid,
  onRefresh,
  onNavigateToProfile,
  onNavigateToSettings,
}: ExpandableProfileHubProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      toast.success('Logged out successfully')
      navigate('/auth')
    } catch {
      toast.error('Failed to log out')
    } finally {
      setIsLoggingOut(false)
      setIsLogoutOpen(false)
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex items-start gap-4">
      {/* ─── Avatar Hub Container ────────────────────────────────────── */}
      <motion.div 
        layout
        initial={false}
        className="relative flex flex-col items-start gap-2"
      >
        {/* Toggle / Avatar */}
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            relative z-20 flex items-center justify-center 
            w-12 h-12 rounded-full overflow-hidden
            bg-gradient-to-br from-primary to-primary/80 
            border-2 border-white/20 shadow-lg shadow-primary/20
            transition-transform active:scale-95
          `}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <User className="text-white w-6 h-6" strokeWidth={3} />
          )}
          
          {hasPaid && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </motion.button>

        {/* Expanded Hub Card */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className="absolute top-0 left-0 pt-14 w-48 pointer-events-none"
            >
              <div className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-3">
                <div className="flex flex-col px-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Session Status</p>
                  <p className="text-[14px] font-bold text-foreground">
                    {hasPaid ? `${matchCount} Matches` : 'Syncing...'}
                  </p>
                </div>

                <div className="h-px bg-white/5 mx-1" />

                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => { onNavigateToProfile(); setIsExpanded(false); }}
                    className="flex items-center gap-2 p-2 hover:bg-primary/5 rounded-xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User size={16} />
                    </div>
                    <span className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground">Profile</span>
                  </button>

                  <button 
                    onClick={() => { onNavigateToSettings(); setIsExpanded(false); }}
                    className="flex items-center gap-2 p-2 hover:bg-primary/5 rounded-xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={16} />
                    </div>
                    <span className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground">Settings</span>
                  </button>
                </div>

                <div className="h-px bg-white/5 mx-1" />

                <button
                  onClick={() => setIsLogoutOpen(true)}
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded-xl transition-colors group w-full text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <LogOut size={16} />
                  </div>
                  <span className="text-[13px] font-bold text-muted-foreground group-hover:text-foreground">Log Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {isLogoutOpen && (
            <div className="fixed inset-0 z-100 flex items-center justify-center px-4 pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => !isLoggingOut && setIsLogoutOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-card border border-border/60 shadow-2xl rounded-3xl p-6 relative z-10 flex flex-col items-center text-center pointer-events-auto"
              >
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">Log out of account?</h2>
                <p className="text-sm text-muted-foreground font-medium mb-8">
                  You will need to use your email to log back in next time.
                </p>
                
                <div className="w-full flex flex-col gap-2">
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full py-3.5 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, log out"}
                  </button>
                  <button 
                    onClick={() => !isLoggingOut && setIsLogoutOpen(false)}
                    disabled={isLoggingOut}
                    className="w-full py-3.5 bg-muted text-foreground font-bold rounded-2xl hover:bg-muted/80 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Refresh Button ─────────────────────────────────────────── */}
      <motion.button
        layout
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-white/10 shadow-lg text-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
        title="Refresh Matches"
      >
        <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </motion.button>
    </div>
  )
}
