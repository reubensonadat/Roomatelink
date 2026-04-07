import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function ProtectedRoute() {
  const { user, profile, isSessionLoading, isProfileLoading, isHydrated, signOut } = useAuth()
  const [showFallback, setShowFallback] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  useEffect(() => {
    let timer: number
    if (isSessionLoading || isProfileLoading) {
      timer = window.setTimeout(() => {
        setShowFallback(true)
      }, 8000)
    } else {
      setShowFallback(false)
    }
    return () => clearTimeout(timer)
  }, [isSessionLoading, isProfileLoading])

  // Hard cap: If still loading after 12s, force unlock the route
  // This is a last-resort guard so users are never permanently stuck
  useEffect(() => {
    if (!isSessionLoading && !isProfileLoading) return
    const hard = window.setTimeout(() => {
      console.warn('ProtectedRoute: Loading hard cap reached — forcing render')
      setLoadingTimedOut(true)
    }, 12000)
    return () => clearTimeout(hard)
  }, [])

  // Phase 3: Zero-Flicker Handshake - Wait for Supabase to check LocalStorage
  if (!loadingTimedOut && (!isHydrated || isSessionLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <div className="relative w-28 h-28 mb-12">
          {/* Outer Ring Glow */}
          <div className="absolute inset-[-8px] rounded-[2.5rem] bg-indigo-500/10 blur-xl animate-pulse" />
          
          {/* Main Spinner */}
          <div className="absolute inset-0 rounded-full border-[3px] border-border/50" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] animate-spin" />
          
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
             <ShieldCheck className={`w-10 h-10 ${showFallback ? 'text-amber-500 animate-bounce' : 'text-indigo-600/80'}`} />
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">
            Security Check
          </h2>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[32px] font-black tracking-tighter text-foreground leading-none">Verifying Account</span>
            <p className="text-[14px] font-bold text-muted-foreground">Ensuring your Roommate Link session is active</p>
          </div>
          
          {showFallback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col items-center"
            >
              <p className="text-[14px] font-bold text-foreground mb-6">Taking longer than expected?</p>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/auth'
                }}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-[13px] font-black hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 uppercase tracking-widest"
              >
                <LogOut className="w-5 h-5" /> Sign Out & Restart
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Definitive lack of auth: Kick to login
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Phase 3: Authenticated, but fetching custom database profile
  // We MUST wait for the profile to load to prevent 'Monolithic State Flicker'
  // (where the UI shows 'Setup Profile' for 0.5s before the DB returns data)
  // Hard cap: if loadingTimedOut or profile already exists, skip this gate and render anyway
  if (isProfileLoading && !profile && !loadingTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <div className="relative w-28 h-28 mb-12">
          {/* Outer Ring Glow */}
          <div className="absolute inset-[-8px] rounded-full bg-primary/5 blur-2xl animate-pulse" />
          
          {/* Main Spinner */}
          <div className="absolute inset-0 rounded-full border-[3px] border-border/40" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center shadow-lg border border-border/80 backdrop-blur-xl">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-[12px] font-black text-primary uppercase tracking-[0.4em] mb-4">
            Identity Sync
          </h2>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[32px] font-black tracking-tighter text-foreground leading-none">Establishing Session</span>
            <p className="text-[14px] font-bold text-muted-foreground">Synchronizing your institutional credentials</p>
          </div>
          
          <div className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 h-full bg-primary w-[60%]"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Fully authenticated and loaded
  return <Outlet />
}
