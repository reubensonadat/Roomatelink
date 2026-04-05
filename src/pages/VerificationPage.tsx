import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, ChevronRight, Loader2, Info, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export function VerificationPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [universityName, setUniversityName] = useState('')
  const navigate = useNavigate()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Strict Domain Guard for Launch (UCC focus)
    if (!email.endsWith('stu.ucc.edu.gh')) {
      toast.error('Currently, only UCC students (@stu.ucc.edu.gh) can verify. We are expanding soon!', {
        duration: 4000,
        icon: <Info className="w-5 h-5 text-amber-500" />
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-student', {
        body: { action: 'SEND_CODE', email, userId: user?.id } 
      })
      
      if (error) throw error
      
      if (data?.error === 'SERVICE_BUSY') {
        toast.error(data.message, { duration: 6000 })
        return
      }

      setUniversityName('University of Cape Coast')
      setStep('code')
      toast.info('Verification token sent to your student mail.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-student', {
        body: { action: 'CONFIRM_CODE', email, code, userId: user?.id }
      })

      if (error) throw error

      if (data?.error === 'INVALID_CODE') {
        toast.error(data.message)
        return
      }

      toast.success(`Identity Confirmed! Welcome, UCC Student.`, {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />
      })
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg bg-card/50 backdrop-blur-xl border border-border/80 p-8 sm:p-10 rounded-[2.5rem] shadow-premium relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
          <GraduationCap size={140} />
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 relative z-10"
            >
              <header className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-black uppercase tracking-widest border border-amber-500/20">
                  <Sparkles className="w-3 h-3" /> Identity Hub
                </div>
                <h1 className="text-4xl font-black tracking-tight leading-tight text-foreground">Student <br /> Verification</h1>
                <p className="text-muted-foreground font-semibold text-lg max-w-[90%]">Confirm your campus DNA to unlock your roommate matches.</p>
              </header>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Official Student Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@stu.ucc.edu.gh"
                      required
                      className="w-full pl-12 pr-4 py-4.5 bg-muted/20 border-2 border-border/40 rounded-[22px] focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-lg placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-muted-foreground/60">
                    <Info size={12} />
                    Only UCC students are eligible for this launch window.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-foreground text-background rounded-[22px] font-black text-lg hover:translate-y-[-2px] active:translate-y-[0px] transition-all shadow-xl shadow-foreground/5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Begin Verification
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 relative z-10"
            >
              <button
                onClick={() => setStep('email')}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-black text-[11px] uppercase tracking-widest mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Change Email
              </button>

              <header className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> {universityName || 'Security Code'}
                </div>
                <h1 className="text-4xl font-black tracking-tight leading-tight text-foreground">Checkpoint</h1>
                <p className="text-muted-foreground font-semibold text-lg">We sent a 6-digit DNA token to <span className="text-foreground">{email}</span>.</p>
              </header>

              <form onSubmit={handleCodeSubmit} className="space-y-8">
                <div className="space-y-4 text-center">
                  <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/80">Enter Security Token</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    required
                    autoFocus
                    className="w-full text-center py-5 bg-muted/20 border-2 border-border/40 rounded-[22px] focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-black text-[32px] tracking-[0.5em] placeholder:text-muted-foreground/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-primary text-white rounded-[22px] font-black text-lg hover:translate-y-[-2px] active:translate-y-[0px] transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Confirm & Unlock
                      <ShieldCheck className="w-6 h-6" />
                    </>
                  )}
                </button>

                <p className="text-[12px] text-muted-foreground font-medium text-center">
                  Didn't receive it? <button type="button" onClick={handleEmailSubmit} className="text-primary font-black hover:underline ml-1">Resend DNA Token</button>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
