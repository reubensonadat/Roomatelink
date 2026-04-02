import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'

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
      console.log('--- AuthCallback: Initializing Institutional Flow ---')
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
            setErrorDetails('No institutional session detected. Please sign in again.')
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-[24px] font-black tracking-tight text-foreground mb-4 uppercase">Sync Failure</h1>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto mb-10 leading-relaxed">
          {errorDetails}
        </p>
        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
          Institutional Protocol v2.0 • Retrying in 3s
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-8">
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div className="absolute inset-0 rounded-full border-[6px] border-primary/10" />
          <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary opacity-40 animate-pulse" />
          </div>
        </div>
        <h1 className="text-[20px] font-black text-foreground tracking-tight uppercase mb-2">Syncing Identity</h1>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">Please wait while we establish your session</p>
      </div>
    </div>
  )
}
