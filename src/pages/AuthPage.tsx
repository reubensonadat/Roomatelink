import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ChevronRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { OrbitalLoader } from '../components/ui/OrbitalLoader'
import { PremiumAuthLoader } from '../components/ui/PremiumAuthLoader'

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const DirectionalHoverButton = ({ children, onClick, disabled, className, isPrimary = true, type = "button" }: any) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hoverPosition, setHoverPosition] = useState({ left: '50%', top: '50%' })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setHoverPosition({ left: `${e.clientX - rect.left}px`, top: `${e.clientY - rect.top}px` })
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleAction = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) onClick(e)
  }

  return (
    <motion.button
      type={type}
      ref={buttonRef}
      onClick={handleAction}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`relative overflow-hidden w-full h-[64px] rounded-[22px] font-black transition-all text-[15px] flex justify-center items-center z-10 ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[20%]' : 'cursor-pointer'} ${className}`}
    >
      <motion.div
        initial={false}
        animate={{ 
          width: isHovering ? '800px' : '0px', 
          height: isHovering ? '800px' : '0px',
          opacity: isHovering ? 1 : 0
        }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          left: hoverPosition.left,
          top: hoverPosition.top,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          backgroundColor: isPrimary ? 'rgba(255, 255, 255, 0.35)' : 'rgba(128, 128, 128, 0.20)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div className="flex items-center gap-2 relative z-10 w-full justify-center">
         {children}
      </div>
    </motion.button>
  )
}

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || isGoogleLoading || !email || password.length < 6) return
    
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        
        if (error) {
          setErrorMessage(error.message || 'Failed to sign in')
          toast.error(error.message || 'Failed to sign in')
        } else {
          // Success HANDSHAKE:
          // Instead of navigating immediately, we wait for the AuthContext to say 'Loaded'
          // This prevents the flickering 'Setup Identity' screen on the Dashboard
          toast.loading('Synchronizing Identity...', { id: 'auth-sync' })
          
          // The ProtectedRoute will now handle the rendering logic once profile is ready.
          // We navigate to /dashboard and let the guard do its job with ZERO flicker.
          navigate('/dashboard')
          toast.success('Identity Secured!', { id: 'auth-sync' })
        }
      } else {
        const { error, success } = await signUp(email, password)
        
        if (error) {
          setErrorMessage(error.message || 'Failed to sign up')
          toast.error(error.message || 'Failed to sign up')
        } else if (success) {
          setSuccessMessage(success)
          toast.success(success)
          // Don't navigate - user needs to verify email then sign in
        }
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setErrorMessage('')
    
    try {
      await signInWithGoogle()
      // Browser will redirect to Google's login page automatically
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sign in with Google')
      setIsGoogleLoading(false)
      toast.error(error?.message || 'Failed to sign in with Google')
    }
  }

  return (
    <>
      {isRedirecting && <PremiumAuthLoader topLabel="Authentication" mainLabel="Redirecting to Google" subLabel="You will be redirected shortly..." />}
      
      <div className="min-h-screen relative flex items-center justify-center bg-background overflow-hidden selection:bg-primary/20">
      
      {/* Top-Right Anchored Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-end items-start w-full">
        <div 
          className="absolute right-0 top-0 w-[150%] h-[70vh] sm:w-[80vw] sm:h-[100vh] opacity-60 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen"
          style={{
            backgroundImage: `linear-gradient(to right, #80808044 1px, transparent 1px), linear-gradient(to bottom, #80808044 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, black 15%, transparent 75%)',
            maskImage: 'radial-gradient(ellipse at top right, black 15%, transparent 75%)'
          }}
        />
        <div className="absolute right-[-10%] top-[-10%] z-0 h-[400px] w-[400px] rounded-2xl bg-primary/20 opacity-60 blur-[130px] animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-[440px] px-6 z-10 py-12">
        
        {/* Go Back Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex justify-start mb-8 pl-2"
        >
           <Link 
              to="/" 
              className="flex items-center gap-3 px-6 py-3.5 rounded-[22px] border border-border/60 bg-card/40 hover:bg-muted/80 backdrop-blur-md text-[14px] font-black text-muted-foreground hover:text-foreground transition-all group shadow-sm hover:shadow-md"
           >
              <ChevronRight className="w-[18px] h-[18px] rotate-180 group-hover:-translate-x-1 transition-transform" />
              Go back
           </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex flex-col items-center justify-center text-center"
        >
          <span className="text-[14.5px] font-extrabold tracking-[0.15em] uppercase text-muted-foreground/80 mb-6 drop-shadow-sm">Roommate Link</span>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h1>
          
          {/* Stunning Pill Segmented Control */}
          <div className="relative flex items-center bg-muted/40 p-2 rounded-[22px] border border-border/50 w-full max-w-[300px] shadow-inner mx-auto">
            <button 
              onClick={() => { setMode('signin'); setEmail(''); setPassword(''); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl relative z-10 font-bold text-[14px] transition-colors ${mode === 'signin' ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setEmail(''); setPassword(''); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl relative z-10 font-bold text-[14px] transition-colors ${mode === 'signup' ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
            >
              Sign Up
            </button>
            {/* Sliding Background */}
            <div 
              className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-[18px] transition-all duration-300 ease-in-out shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border/50 bg-background ${mode === 'signin' ? 'left-2' : 'left-[calc(50%)]'}`} 
            />
          </div>
        </motion.div>

        <motion.div 
          layout
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-card/60 backdrop-blur-2xl border border-border/60 rounded-[22px] p-5 md:p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-5">

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-red-600 dark:text-red-400 font-medium">{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">{successMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <DirectionalHoverButton
              onClick={() => {
                setIsRedirecting(true)
                handleGoogleSignIn()
              }}
              disabled={isGoogleLoading || isLoading}
              isPrimary={false}
              className="bg-background border border-border/80 text-foreground shadow-sm hover:border-foreground/30"
            >
              {isGoogleLoading ? (
                <div className="scale-50 -mx-4 -my-4"><OrbitalLoader /></div>
              ) : (
                <>
                  <GoogleIcon /> <span className="pt-0.5">{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </DirectionalHoverButton>

            <div className="flex items-center gap-4 w-full opacity-60">
              <div className="h-[1px] bg-border flex-1" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">OR</span>
              <div className="h-[1px] bg-border flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                    placeholder="your.email@provider.com" 
                    required
                    className="w-full bg-background border border-border/80 focus:border-primary/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[22px] pl-10 pr-4 py-4 text-foreground font-black outline-none focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-[12.5px] font-medium text-foreground">Password</label>
                  {mode === 'signin' && (
                    <Link to="#" className="text-[12px] text-muted-foreground hover:text-primary font-medium transition-colors">Forgot?</Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                    placeholder="••••••••••" 
                    required
                    className="w-full bg-background border border-border/80 focus:border-primary/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[22px] pl-10 pr-4 py-4 text-foreground font-black outline-none focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px]"
                  />
                </div>
              </div>

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 mb-4"
                  >
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex gap-3 shadow-inner">
                      <div className="bg-primary/10 p-1.5 rounded-xl flex-shrink-0 h-fit mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-bold text-foreground mb-0.5">Verification Tip</span>
                        <span className="text-[12px] text-muted-foreground leading-relaxed">
                          It is <strong className="text-foreground">highly advised</strong> to sign up with your valid email address to receive <strong className="text-foreground">Verified</strong> badge automatically.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <DirectionalHoverButton 
                type="submit"
                onClick={() => {}} 
                disabled={isLoading || isGoogleLoading || !email || !password} 
                className="mt-2 bg-primary text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)] focus:ring-[3px] focus:ring-primary/20 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] border-none"
              >
                {isLoading ? (
                  <div className="scale-50 -mx-4 -my-4"><OrbitalLoader /></div>
                ) : (
                  <span className="pt-0.5">{mode === 'signin' ? "Sign in" : "Create Account"}</span>
                )}
              </DirectionalHoverButton>
            </form>
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-8 text-center text-[12px] text-muted-foreground leading-loose px-4"
        >
          By {mode === 'signin' ? 'signing in' : 'signing up'}, you agree to our <br className="sm:hidden" /> <Link to="/terms" className="text-foreground hover:underline transition-colors font-medium">Terms & Conditions</Link> and <Link to="/privacy" className="text-foreground hover:underline transition-colors font-medium">Privacy Policy</Link>.
        </motion.p>
      </div>
    </div>
  </>
)
}
