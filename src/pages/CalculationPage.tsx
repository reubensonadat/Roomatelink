import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, ArrowRight, ShieldCheck, Cpu, Fingerprint, Lock, Brain, Signal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { text: "Encrypting lifestyle data", icon: <Lock className="w-4 h-4" />, detail: "AES-256 Secure" },
  { text: "Analyzing behavioral patterns", icon: <Brain className="w-4 h-4" />, detail: "Neural Mapping" },
  { text: "Cross-referencing compatibility", icon: <Cpu className="w-4 h-4" />, detail: "Multi-Layer" },
  { text: "Synthesizing social DNA", icon: <Fingerprint className="w-4 h-4" />, detail: "Identity Core" },
  { text: "Scoring roommate matches", icon: <Sparkles className="w-4 h-4" />, detail: "AI Scoring" },
  { text: "Finalizing campus results", icon: <Check className="w-4 h-4" />, detail: "Complete" },
]

export default function CalculationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [studentsScanned, setStudentsScanned] = useState(0)
  const [complete, setComplete] = useState(false)
  const [scanY, setScanY] = useState(0)
  const navigate = useNavigate()

  // Scanning counter animation
  useEffect(() => {
    if (complete) return
    const interval = setInterval(() => {
      setStudentsScanned(prev => {
        if (prev >= 240) return prev
        return prev + Math.floor(Math.random() * 6) + 1
      })
    }, 60)
    return () => clearInterval(interval)
  }, [complete])

  // Step progression
  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => setCurrentStep(prev => prev + 1), 1600)
      return () => clearTimeout(timer)
    } else {
      setComplete(true)
      const redirect = setTimeout(() => navigate('/dashboard'), 3000)
      return () => clearTimeout(redirect)
    }
  }, [currentStep, navigate])

  // Scanning line animation
  useEffect(() => {
    if (complete) return
    const interval = setInterval(() => {
      setScanY(prev => (prev >= 100 ? 0 : prev + 1.5))
    }, 25)
    return () => clearInterval(interval)
  }, [complete])

  const progress = Math.min((currentStep / STEPS.length) * 100, 100)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* ═══ Ambient Background Effects ═══ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[25%] -right-[15%] w-[70%] h-[70%] bg-primary/8 rounded-full blur-[150px]"
        />
        {/* Secondary orb */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [360, 180, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[25%] -left-[15%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]"
        />
        {/* Grid overlay for "tech" feel */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="w-full max-w-[480px] z-10 flex flex-col items-center">

        {/* ═══ Biometric Scanner Hub ═══ */}
        <div className="relative mb-14 flex flex-col items-center">

          {/* Outer pulsing ring */}
          {!complete && (
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.15, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-[44px] border-2 border-primary/30"
            />
          )}

          {/* Main scanner container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-[36px] bg-card border border-border/60 shadow-2xl flex items-center justify-center relative overflow-hidden"
          >
            {/* Spinning gradient backdrop */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-primary/8 opacity-80"
            />

            {/* Corner brackets (scanner frame) */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />

            {/* Scanning beam */}
            {!complete && (
              <motion.div
                className="absolute left-0 right-0 h-[3px] z-20"
                style={{ top: `${scanY}%` }}
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="w-full h-6 bg-gradient-to-b from-primary/15 to-transparent -mt-1" />
              </motion.div>
            )}

            {/* Success overlay */}
            <AnimatePresence>
              {complete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center z-30 rounded-[36px]"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-14 h-14 text-white" strokeWidth={3.5} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status badges below scanner */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-2.5 mt-5"
          >
            {/* Shield badge */}
            <div className="px-4 py-1.5 rounded-2xl bg-card border border-border shadow-lg flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">
                {complete ? "Synthesis Complete" : "Secure Verification"}
              </span>
            </div>

            {/* Live counter */}
            {!complete && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Signal className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-black text-primary/70 uppercase tracking-[0.2em] tabular-nums">
                  {studentsScanned} Profiles Scanned
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ═══ Main Heading ═══ */}
        <div className="text-center mb-10 w-full px-2">
          <motion.h1
            key={complete ? 'done' : 'working'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[28px] sm:text-[36px] font-black tracking-tight text-foreground leading-[1.1] mb-3"
          >
            {complete ? "Matches Found" : "Synthesizing Matches"}
          </motion.h1>
          <motion.p
            key={complete ? 'done-p' : 'working-p'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-[15px] sm:text-[16px] font-medium text-muted-foreground leading-relaxed max-w-sm mx-auto"
          >
            {complete
              ? "Your lifestyle DNA has been matched against verified campus students."
              : "Running compatibility algorithms across the student network..."
            }
          </motion.p>
        </div>

        {/* ═══ Progress Bar ═══ */}
        <div className="w-full mb-10">
          <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner relative">
            <motion.div
              className="h-full rounded-full relative"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: complete
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))'
              }}
            >
              {!complete && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              )}
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              {complete ? "Complete" : `Step ${Math.min(currentStep + 1, STEPS.length)} of ${STEPS.length}`}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground/60 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* ═══ Step Cards ═══ */}
        <div className="w-full flex flex-col gap-2.5">
          <AnimatePresence mode="popLayout">
            {STEPS.map((step, i) => {
              const isDone = i < currentStep || complete
              const isActive = i === currentStep && !complete

              // Only show completed steps and the current active one
              if (i > currentStep) return null

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300
                    ${isActive
                      ? 'bg-card border-primary/30 shadow-lg shadow-primary/5'
                      : 'bg-muted/20 border-border/30 opacity-50'
                    }
                  `}
                >
                  {/* Step icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isDone
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : step.icon}
                  </div>

                  {/* Step text */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-[14px] font-bold leading-tight truncate
                      ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                      {step.text}
                    </span>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-bold text-primary uppercase tracking-wider mt-0.5"
                      >
                        Processing...
                      </motion.span>
                    )}
                  </div>

                  {/* Step detail badge */}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : isDone
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-muted text-muted-foreground/50'
                    }
                  `}>
                    {isDone ? 'Done' : step.detail}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* ═══ Completion CTA ═══ */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mt-10 w-full"
            >
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4.5 rounded-2xl bg-foreground text-background font-black text-[16px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
              >
                <Sparkles className="w-5 h-5" />
                Explore Your Matches
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
