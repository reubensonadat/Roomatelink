import { useState, useEffect } from 'react'
import { Smartphone, ChevronRight } from 'lucide-react'
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
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) {
      return 
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (isIosDevice && !isStandalone) {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
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
          className="absolute inset-0 bg-background/80 backdrop-blur-2xl pointer-events-auto"
        />

        <motion.div
           initial={{ y: "100%", opacity: 0, scale: 0.95 }}
           animate={{ y: 0, opacity: 1, scale: 1 }}
           exit={{ y: "100%", opacity: 0 }}
           transition={{ type: "spring", damping: 25, stiffness: 200 }}
           className="relative w-full max-w-lg bg-card border-t md:border border-border/80 md:rounded-[3rem] rounded-t-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Visual Grabber */}
          <div className="md:hidden absolute top-5 left-1/2 -translate-x-1/2 w-10 h-1 bg-muted/40 rounded-full" />

          <div className="px-8 pt-20 pb-16 flex flex-col items-center text-center">
            
            {/* CLEAN LOGO WITH BORDER + PHONE BADGE */}
            <div className="relative mb-10">
               <div className="w-[120px] h-[120px] border-[5px] border-foreground rounded-[2.5rem] flex items-center justify-center p-5 shadow-xl bg-background">
                  <img src="/logo.png" alt="RL" className="w-full h-full object-contain" />
               </div>
               {/* Restored Native Status Badge */}
               <div className="absolute -bottom-2 -right-2 bg-foreground text-background w-12 h-12 rounded-[1.3rem] flex items-center justify-center shadow-2xl border-[5px] border-card">
                  <Smartphone className="w-6 h-6" />
               </div>
            </div>

            <div className="space-y-3 mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Flagship Upgrade</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-[1.1] tracking-tight">
                Experience <br/>
                <span className="text-primary italic">Roommate Link</span>
              </h2>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-[320px] mx-auto px-4 mt-2">
                Install our app for faster access, native notifications, and an immersive campus experience.
              </p>
            </div>

            <div className="w-full flex flex-col gap-4 px-2">
              <button
                onClick={handleInstall}
                className="group relative w-full h-[76px] bg-foreground text-background rounded-[24px] font-black text-[14px] md:text-[15px] uppercase tracking-[0.25em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden flex items-center justify-between px-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="pl-4">Add to Home Screen</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleDismiss}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Not Now, Continue on Web
              </button>
            </div>

            {isIOS && (
              <div className="mt-10 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-[2.5rem] p-7 flex items-start gap-5 mx-2">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <span className="text-white text-[11px] font-black">iOS</span>
                </div>
                <div className="text-left py-0.5">
                  <p className="text-[14px] font-bold text-foreground flex items-center flex-wrap">
                    Tap <SafariShareIcon /> in Safari
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground leading-snug mt-1.5">
                    Then select <span className="text-foreground font-black mx-1">"Add to Home Screen"</span> to install the application.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
