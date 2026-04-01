import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, AlertCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-12 h-12 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
          {showFallback && (
            <div className="absolute -top-1 -right-1">
              <AlertCircle className="w-5 h-5 text-amber-500 fill-background" />
            </div>
          )}
        </div>
        
        <span className="text-[13px] font-black text-foreground uppercase tracking-[0.2em] mb-2">Verifying Identity</span>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] leading-relaxed">
          Securing your session with institutional protocols...
        </p>

        {showFallback && (
          <div className="mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[14px] font-bold text-foreground mb-6">Taking longer than expected?</p>
            <button
              onClick={async () => {
                console.log('User triggered manual logout from ProtectedRoute')
                await signOut()
                // Forced reload is the most reliable way to clear all React state and hit the /auth redirect
                window.location.href = '/auth'
              }}
              className="flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-3xl text-[14px] font-black hover:scale-105 transition-all active:scale-95 shadow-xl shadow-foreground/10"
            >
              <LogOut className="w-5 h-5" /> Log out & Start over
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
