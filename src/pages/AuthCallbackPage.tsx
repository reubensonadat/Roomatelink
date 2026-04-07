import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useUserFlowStatus } from '../hooks/useUserFlowStatus'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { isProfileLoading, isHydrated, user } = useAuth()
  const { getLandingRoute } = useUserFlowStatus()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorDetails, setErrorDetails] = useState<string>('')
  const hasHandled = useRef(false)

  // 1. Initial Handshake (Exchange PKCE code if present)
  useEffect(() => {
    if (hasHandled.current) return
    
    const handleAuthExchange = async () => {
      hasHandled.current = true
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        setErrorDetails(errorDescription || error)
        setStatus('error')
        return
      }

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)
        } catch (err: any) {
          console.error('Code exchange failed:', err)
          setErrorDetails('Authentication sync failed.')
          setStatus('error')
        }
      }
    }

    handleAuthExchange()
  }, [searchParams])

  // 2. Navigation Handshake (Wait for Profile + Hydration)
  useEffect(() => {
    // Only move if we are hydrated, session is determined, and profile is loaded
    if (isHydrated && !isProfileLoading) {
      if (user) {
        const target = getLandingRoute()
        console.log('--- Auth Handshake Complete. Navigating to:', target)
        navigate(target, { replace: true })
      } else {
        // If profile finished loading but there is no user, login failed
        if (hasHandled.current) {
          navigate('/auth', { replace: true })
        }
      }
    }
  }, [isHydrated, isProfileLoading, user, navigate, getLandingRoute])

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-red-500/10 rounded-[24px] flex items-center justify-center mb-10 shadow-sm border border-red-500/20"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <h2 className="text-[12px] font-black text-red-500 uppercase tracking-[0.4em] mb-4">
            Connection Interrupted
          </h2>
          <span className="text-[32px] font-black tracking-tighter text-foreground leading-tight mb-4">
            Security Block
          </span>
          <p className="text-muted-foreground font-bold text-[15px] leading-relaxed mb-10 text-pretty">
            {errorDetails || "We couldn't verify your credentials. Please attempt to re-authenticate."}
          </p>
          
          <button 
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-foreground text-background font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-[13px] tracking-widest uppercase"
          >
            Return to Auth
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-vh-screen min-h-[100vh] bg-background p-6 selection:bg-indigo-100 uppercase tracking-tight text-left">
      <div className="relative w-28 h-28 mb-12">
        {/* Outer Ring Glow */}
        <div className="absolute inset-[-8px] rounded-[2.5rem] bg-indigo-500/10 blur-xl animate-pulse" />
        
        {/* Smooth Circular Spinner */}
        <div className="absolute inset-0 rounded-full border-[3px] border-muted/50" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary shadow-[0_0_15px_rgba(79,70,229,0.3)] animate-spin" />
        
        <div className="absolute inset-0 flex items-center justify-center text-primary">
          <Fingerprint className="w-12 h-12" />
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
          <span className="text-[32px] font-black tracking-tighter text-foreground leading-none">Confirming Identity</span>
          <p className="text-[14px] font-bold text-muted-foreground">Establishing your secure Roommate Link session</p>
        </div>
        
        <div className="mt-10 w-48 h-1 bg-muted/50 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 bg-primary w-1/2 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          />
        </div>
      </motion.div>
    </div>
  )
}
