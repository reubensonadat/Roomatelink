import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorDetails, setErrorDetails] = useState<string>('')
  const hasHandled = useRef(false)

  useEffect(() => {
    if (hasHandled.current) return
    
    // SAFETY WATCHDOG: If we're still loading after 10 seconds, force move to dashboard.
    // This prevents the user from being "stuck forever" on a blank screen.
    const watchdog = setTimeout(() => {
      if (status === 'loading') {
        console.warn('--- AuthCallback: Watchdog Triggered (10s timeout) ---')
        navigate('/dashboard')
      }
    }, 10000)

    const handleCallback = async () => {
      console.log('--- AuthCallback: Initializing Secure Auth Flow ---')
      hasHandled.current = true

      // 1. Check for explicit error from Supabase
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      if (error) {
        console.error('--- AuthCallback: Provider Error ---', error, errorDescription)
        setErrorDetails(errorDescription || error)
        setStatus('error')
        setTimeout(() => navigate('/auth'), 3000)
        return
      }

      // 2. Resolve Session (handles both ?code and hash redirects automatically)
      try {
        const code = searchParams.get('code')
        if (code) {
          console.log('--- AuthCallback: Exchanging PKCE code ---')
          await supabase.auth.exchangeCodeForSession(code)
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('--- AuthCallback: No session detected ---', sessionError)
          // Rare: maybe the session is still initializing in AuthContext
          // Re-try once after a short delay
          await new Promise(r => setTimeout(r, 800))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          
          if (!retrySession) {
            setErrorDetails('Verify session failed. Please sign in again.')
            setStatus('error')
            setTimeout(() => navigate('/auth'), 3000)
            return
          }
          await proceedWithRedirection(retrySession.user)
        } else {
          await proceedWithRedirection(session.user)
        }
      } catch (err: any) {
        console.error('--- AuthCallback: Fatal Exception ---', err)
        setErrorDetails(err.message || 'Synchronization failure.')
        setStatus('error')
        setTimeout(() => navigate('/auth'), 3000)
      } finally {
        clearTimeout(watchdog)
      }
    }

    const proceedWithRedirection = async (user: any) => {
      console.log('--- AuthCallback: Proceeding with Redirection Logic ---')
      
      try {
        // Sequentially check user status following the original "Perfect" archive-v1 flow
        // Step 1: Check Profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, course, level')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (profileError) console.error('Profile fetch error:', profileError)

        if (!profile || !profile.course || !profile.level) {
          console.log('--- AuthCallback: Profile incomplete -> Onboarding ---')
          navigate('/onboarding')
          return
        }

        // Step 2: Check Questionnaire
        const { data: questionnaire, error: qError } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (qError) console.error('Questionnaire fetch error:', qError)

        if (!questionnaire) {
          console.log('--- AuthCallback: Missing Questionnaire -> Questionnaire ---')
          navigate('/questionnaire')
          return
        }

        // Step 3: Success -> Final Destination
        const next = searchParams.get('next') || '/dashboard'
        console.log('--- AuthCallback: All clear! Navigating to ---', next)
        navigate(next)
      } catch (e) {
        console.error('--- AuthCallback: Redirection error, falling back to Dashboard ---', e)
        navigate('/dashboard')
      }
    }

    handleCallback()
    return () => clearTimeout(watchdog)
  }, [searchParams, navigate, status])

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 selection:bg-indigo-100 uppercase tracking-tight">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mb-10 shadow-sm border border-red-100"
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
          <span className="text-[32px] font-black tracking-tighter text-slate-900 leading-tight mb-4">
            Security Block
          </span>
          <p className="text-slate-500 font-bold text-[15px] leading-relaxed mb-10 text-pretty">
            {errorDetails || "We couldn't verify your credentials. Please attempt to re-authenticate."}
          </p>
          
          <button 
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-[13px] tracking-widest uppercase"
          >
            Return to Auth
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-vh-screen min-h-[100vh] bg-slate-50 p-6 selection:bg-indigo-100 uppercase tracking-tight text-left">
      <div className="relative w-28 h-28 mb-12">
        {/* Outer Ring Glow */}
        <div className="absolute inset-[-8px] rounded-[2.5rem] bg-indigo-500/10 blur-xl animate-pulse" />
        
        {/* Smooth Circular Spinner */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/50" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] animate-spin" />
        
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
          <Fingerprint className="w-12 h-12" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <h2 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">
          Identity Sync
        </h2>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[32px] font-black tracking-tighter text-slate-900 leading-none">Confirming Identity</span>
          <p className="text-[14px] font-bold text-slate-400">Establishing your secure Roommate Link session</p>
        </div>
        
        <div className="mt-10 w-48 h-1 bg-slate-200/50 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 bg-indigo-600 w-1/2 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          />
        </div>
      </motion.div>
    </div>
  )
}
