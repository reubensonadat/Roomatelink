import { useState, useEffect } from 'react'
import { Smartphone, ChevronRight, Monitor, X, ShieldCheck, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SafariShareIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="inline-block mx-1.5 -mt-1 text-blue-600"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return 

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (isIosDevice && !isStandalone) {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) setShowPrompt(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    } else if (isIOS) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-background/40 backdrop-blur-[12px] md:backdrop-blur-2xl pointer-events-auto"
        />

        <motion.div
           initial={{ y: 20, opacity: 0, scale: 0.95 }}
           animate={{ y: 0, opacity: 1, scale: 1 }}
           exit={{ y: 20, opacity: 0 }}
           transition={{ type: "spring", damping: 30, stiffness: 300 }}
           className="relative w-full max-w-[480px] md:max-w-4xl bg-card border-t md:border border-border/60 md:rounded-[3rem] rounded-t-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Close Button - Desktop Only */}
          <button 
            onClick={handleDismiss}
            className="hidden md:flex absolute top-6 right-6 w-10 h-10 items-center justify-center rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-foreground z-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row">
            
            {/* LEFT SIDE: THE BRAND PRESENTATION (Desktop Hero) */}
            <div className="hidden md:flex w-1/2 bg-muted/30 p-12 flex-col justify-between relative border-r border-border/40">
               <div className="space-y-4">
                  <div className="w-20 h-20 border-[4px] border-foreground rounded-[2.2rem] flex items-center justify-center p-4 bg-background shadow-lg">
                    <img src="/logo.png" alt="RL" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">Roommate Link</h2>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">Desktop Suite</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/60">
                    <ShieldCheck className="w-4 h-4" /> Secure Native Instance
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/60">
                    <Zap className="w-4 h-4" /> 2x Faster Initialization
                  </div>
               </div>

               {/* Decorative Background Element */}
               <Monitor className="absolute -bottom-10 -right-10 w-48 h-48 opacity-[0.03] rotate-12 pointer-events-none" />
            </div>

            {/* RIGHT SIDE: CONTENT & ACTIONS (Clean & Balanced) */}
            <div className="flex-1 px-8 md:px-14 pt-16 pb-14 flex flex-col items-center md:items-start text-center md:text-left justify-center relative">
              
              {/* MOBILE ONLY: LOGO HEADER */}
              <div className="md:hidden relative mb-10 w-32 h-32 flex items-center justify-center border-[5px] border-foreground rounded-[2.8rem] bg-background">
                <img src="/logo.png" alt="RL" className="w-16 h-16 object-contain" />
                <div className="absolute -bottom-2 -right-2 bg-foreground text-background w-10 h-10 rounded-[1.2rem] flex items-center justify-center border-4 border-card">
                   <Smartphone className="w-5 h-5" />
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/80 mb-3">Install Recommended</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-[1.05] tracking-tighter mb-4">
                Experience <br className="hidden md:block" />
                <span className="text-primary italic">Better Matching</span>
              </h1>
              
              <p className="text-sm md:text-base font-semibold text-muted-foreground leading-relaxed max-w-[380px] mb-10">
                Install our application for faster access, persistent profiles, and an immersive university matching experience.
              </p>

              <div className="w-full space-y-4">
                <button
                  onClick={handleInstall}
                  className="group relative w-full h-[72px] bg-foreground text-background rounded-[24px] font-black text-[15px] md:text-[16px] uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden flex items-center justify-between px-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="opacity-90">Install Application</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform opacity-60" />
                </button>

                <button
                  onClick={handleDismiss}
                  className="md:hidden w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue on Web
                </button>
              </div>

              {/* iOS TIP: Mobile Only */}
              {isIOS && (
                <div className="md:hidden mt-10 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] p-7 flex items-start gap-5">
                  <div className="w-11 h-11 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-black hover:scale-110 transition-all">iOS</span>
                  </div>
                  <p className="text-[12px] font-bold text-foreground text-left leading-snug">
                    Tap <SafariShareIcon /> in Safari and select <span className="text-foreground font-black">"Add to Home Screen"</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
