import { useState, useEffect } from 'react'
import { Download, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    // Detect if already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) {
      return // Don't show if already installed
    }

    // Android / Chrome desktop generic PWA prompt handler
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt if user hasn't explicitly dismissed it recently
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, there is no beforeinstallprompt. We might just show a manual tip if not standalone.
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
      // iOS doesn't support the prompt API, just give them instructions
      alert("To install: tap the 'Share' icon at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.")
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Subtle Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border/60 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 pt-8 pb-10 flex flex-col items-center text-center gap-6"
          >
            {/* Grab Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted rounded-full" />

            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2rem]" />
              <Download className="w-10 h-10 text-primary z-10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-foreground tracking-tight">Experience RoommateLink</h3>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-[280px]">
                {isIOS 
                  ? "Install the app on your Home Screen for the full flagship experience and native matching notifications." 
                  : "Install our boutique app for faster access, offline stability, and an immersive matching experience."}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleInstall}
                className="w-full py-4.5 h-[64px] bg-primary text-primary-foreground rounded-2xl font-black text-[15px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                Get The App <Sparkles className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-4 bg-muted/50 text-muted-foreground hover:text-foreground rounded-2xl text-xs font-black transition-all uppercase tracking-widest"
              >
                No thanks, stay on web
              </button>
            </div>
            
            {isIOS && (
              <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                 <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-black">TIP</span>
                 </div>
                 <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold text-left leading-snug">
                   Tap the <span className="bg-white/50 px-1 rounded mx-0.5">Share Icon</span> at the base of Safari, scroll down, and tap <span className="bg-white/50 px-1 rounded mx-0.5">'Add to Home Screen'</span>.
                 </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
