import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export function ProtectedRoute() {
  const { user, loading, signOut } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    let timer: number
    if (loading) {
      timer = window.setTimeout(() => {
        setShowFallback(true)
      }, 5000)
    } else {
      setShowFallback(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <div className="relative w-28 h-28 mb-12">
          {/* Outer Ring Glow */}
          <div className="absolute inset-[-8px] rounded-[2.5rem] bg-indigo-500/10 blur-xl animate-pulse" />
          
          {/* Main Spinner */}
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/50" />
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
            <span className="text-[32px] font-black tracking-tighter text-slate-900 leading-none">Verifying Account</span>
            <p className="text-[14px] font-bold text-slate-400">Ensuring your Roommate Link session is active</p>
          </div>
          
          {showFallback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col items-center"
            >
              <p className="text-[14px] font-bold text-slate-900 mb-6">Taking longer than expected?</p>
              <button
                onClick={async () => {
                  await signOut()
                  window.location.href = '/auth'
                }}
                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[13px] font-black hover:scale-105 transition-all active:scale-95 shadow-xl shadow-slate-900/10 uppercase tracking-widest"
              >
                <LogOut className="w-5 h-5" /> Sign Out & Restart
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
