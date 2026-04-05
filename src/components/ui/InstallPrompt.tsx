import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
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
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          className="fixed bottom-28 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary/95 backdrop-blur-md text-primary-foreground p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 border border-white/10"
        >
          <div className="w-12 h-12 bg-card/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-white truncate">Install RoommateLink</h3>
            <p className="text-xs font-semibold text-white/80 leading-tight">
              {isIOS ? 'Add to your Home Screen for a native experience.' : 'Install the app for faster access and offline mode.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="bg-card text-primary px-3 py-1.5 rounded-lg text-xs font-black shadow-sm"
            >
              Get App
            </button>
            <button
              onClick={handleDismiss}
              className="flex items-center justify-center p-1 hover:bg-white/10 rounded-lg transition-colors absolute top-2 right-2 md:relative md:top-auto md:right-auto"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
