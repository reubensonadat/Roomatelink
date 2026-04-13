import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { PremiumAuthLoader } from './ui/PremiumAuthLoader'

export function ProtectedRoute() {
  const { user, profile, isInitializing, isSessionLoading, isProfileLoading, isHydrated, isNetworkTimeout, signOut } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    let timer: number
    if (isInitializing || isSessionLoading || isProfileLoading) {
      timer = window.setTimeout(() => {
        setShowFallback(true)
      }, 8000)
    } else {
      setShowFallback(false)
    }
    return () => clearTimeout(timer)
  }, [isInitializing, isSessionLoading, isProfileLoading])

  // Phase 3: Zero-Flicker Handshake - Wait for initial auth check to complete
  if (isInitializing || !isHydrated || isSessionLoading) {
    return (
      <>
        <PremiumAuthLoader
          topLabel="Security"
          mainLabel="Checking Account"
          subLabel="Ensuring your session is active"
        />
        
        {showFallback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-[51]"
          >
            <p className="text-[14px] font-bold text-foreground mb-4">Taking longer than expected?</p>
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
      </>
    )
  }

  // Network is down but user has cached data — show app with offline banner
  // Only show full-page error if we have NO user AND NO cached profile
  if (!user && isNetworkTimeout && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <div className="w-20 h-20 bg-red-500/10 rounded-[24px] flex items-center justify-center mb-10 shadow-sm border border-red-500/20">
          <span className="text-[12px] font-black tracking-widest text-red-500 text-center">Offline</span>
        </div>
        <div className="flex flex-col items-center text-center max-w-sm">
          <h2 className="text-[12px] font-black text-red-500 uppercase tracking-[0.4em] mb-4">Connection Interrupted</h2>
          <span className="text-[32px] font-black tracking-tighter text-foreground leading-tight mb-4">Network Unreachable</span>
          <p className="text-[15px] font-bold text-muted-foreground leading-relaxed mb-10 text-pretty">Cannot load account data. Please check your connection and refresh.</p>
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
  if (isProfileLoading && !profile) {
    return (
      <PremiumAuthLoader
        topLabel="Security"
        mainLabel="One moment..."
        subLabel="Getting things ready for you"
      />
    )
  }

  // Fully authenticated and loaded
  return (
    <>
      {isNetworkTimeout && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-black text-center py-2 px-4 text-[12px] font-black uppercase tracking-widest">
          You're offline — showing cached data
        </div>
      )}
      <Outlet />
    </>
  )
}
