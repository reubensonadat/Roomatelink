import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorDetails, setErrorDetails] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      console.log('--- AuthCallback: Initializing ---')
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        console.error('--- AuthCallback: Error from Provider ---', error, errorDescription)
        setErrorDetails(errorDescription || error)
        setStatus('error')
        setTimeout(() => navigate('/auth'), 3000)
        return
      }

      if (!code) {
        console.warn('--- AuthCallback: No code found in URL ---')
        // In some cases, Supabase might have already processed the code in a hash
        // Check if session exists immediately
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('--- AuthCallback: Session found via auto-detection ---')
          proceedToRedirect(session.user)
        } else {
          setErrorDetails('No authentication code or session detected.')
          setStatus('error')
          setTimeout(() => navigate('/auth'), 3000)
        }
        return
      }

      try {
        console.log('--- AuthCallback: Code detected, exchanging for session ---', code.substring(0, 5) + '...')
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('--- AuthCallback: Exchange Error ---', exchangeError)
          setErrorDetails(exchangeError.message)
          setStatus('error')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        console.log('--- AuthCallback: Exchange Success ---')
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.error('--- AuthCallback: No user found after exchange ---')
          setErrorDetails('Failed to retrieve user after authentication.')
          setStatus('error')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        await proceedToRedirect(user)
      } catch (err: any) {
        console.error('--- AuthCallback: Fatal Exception ---', err)
        setErrorDetails(err.message || 'An unexpected error occurred during the callback.')
        setStatus('error')
        setTimeout(() => navigate('/auth'), 3000)
      }
    }

    const proceedToRedirect = async (user: any) => {
      console.log('--- AuthCallback: Checking profile for user ---', user.id)
      
      // Check if user has a profile in our public.users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, course, level')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('--- AuthCallback: Profile Query Error ---', profileError)
      }

      if (!profile) {
        console.log('--- AuthCallback: No profile found, redirecting to Onboarding ---')
        navigate('/onboarding')
        return
      }

      console.log('--- AuthCallback: Profile found ---', profile)
      if (!profile.course || !profile.level) {
        console.log('--- AuthCallback: Profile incomplete, redirecting to Onboarding ---')
        navigate('/onboarding')
        return
      }

      // Check questionnaire
      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaire_responses')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (qError) {
        console.error('--- AuthCallback: Questionnaire Query Error ---', qError)
      }

      if (!questionnaire) {
        console.log('--- AuthCallback: No questionnaire, redirecting to Questionnaire ---')
        navigate('/questionnaire')
        return
      }

      const next = searchParams.get('next') || '/dashboard'
      console.log('--- AuthCallback: Success! Redirecting to ---', next)
      navigate(next)
    }

    handleCallback()
  }, [searchParams, navigate])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-4">Authentication Failed</h1>
          <p className="text-muted-foreground mb-4 leading-relaxed">{errorDetails}</p>
          <p className="text-[12px] text-muted-foreground/60 font-medium">Redirecting you back to login in 3 seconds...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Completing Sign In...</h1>
        <p className="text-muted-foreground">Please wait while we set up your session</p>
      </div>
    </div>
  )
}
