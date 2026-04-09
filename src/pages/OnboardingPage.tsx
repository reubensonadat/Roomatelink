import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, ChevronRight, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDES = [
  {
    title: "Find Your\nPerfect Match",
    description: "Our algorithm learns your habits and finds the most compatible roommates for your lifestyle.",
    image: "/onboarding/slide1.jpg"
  },
  {
    title: "Real\nCompatibility",
    description: "From sleep schedules to cleaning habits, we match you based on how you truly live and study.",
    image: "/onboarding/slide2.jpg"
  },
  {
    title: "Secure\n& Verified",
    description: "Connect with verified university students through our secure, encrypted matching system.",
    image: "/onboarding/slide3.jpg"
  }
]

export function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) setTheme(savedTheme)
  }, [])

  const totalSteps = 4 // 3 info slides + 1 theme chooser
  const isDark = mounted && theme === 'dark'

  const handleThemeChange = (newTheme: 'light' | 'dark', event?: React.MouseEvent<HTMLButtonElement>) => {
    // Core theme toggle logic
    const applyTheme = () => {
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }

    // Check if View Transitions API is supported
    if (typeof document.startViewTransition === 'function' && event) {
      try {
        // Calculate click position for circular wipe origin
        const clickX = event.clientX
        const clickY = event.clientY
        
        // Calculate maximum radius to cover entire screen with buffer
        const maxRadius = Math.hypot(
          Math.max(clickX, window.innerWidth - clickX),
          Math.max(clickY, window.innerHeight - clickY)
        ) * 1.5; // Add 50% buffer to ensure full coverage

        // Start the view transition
        document.startViewTransition(() => {
          applyTheme()
        }).ready.then(() => {
          // Animate circular clip-path expanding from click point
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${clickX}px ${clickY}px)`,
                `circle(${maxRadius}px at ${clickX}px ${clickY}px)`
              ]
            },
            {
              duration: 1000,
              easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth, gradual expansion
              pseudoElement: '::view-transition-new(root)'
            }
          )
        })
      } catch {
        // Fallback: Apply theme instantly if view transition fails
        applyTheme()
      }
    } else {
      // Fallback: Apply theme instantly for unsupported browsers
      applyTheme()
    }
  }

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide(currentSlide + 1)
    } else {
      navigate('/profile')
    }
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    } else {
      navigate('/')
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">

      {/* ─── DESKTOP LEFT / MOBILE TOP (Square Image Area) ─── */}
      <div className="w-full md:w-1/2 p-4 md:p-6 lg:p-12 flex items-center justify-center bg-muted/20">
        <AnimatePresence mode="wait">
          {currentSlide < 3 ? (
            <motion.div
              key={`img-${currentSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full aspect-square max-w-[550px] rounded-3xl md:rounded-[40px] overflow-hidden bg-card relative shadow-2xl"
            >
              <img
                src={`${SLIDES[currentSlide].image}?v=${Date.now()}`}
                alt={SLIDES[currentSlide].title}
                className="w-full h-full object-cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="img-theme"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full aspect-square max-w-[480px] rounded-3xl md:rounded-[40px] bg-card border border-border/60 flex items-center justify-center shadow-2xl overflow-hidden p-6 sm:p-10"
            >
              {/* Square Preview Module */}
              <div className="w-full border border-border/40 p-6 rounded-3xl bg-background/50 backdrop-blur-sm flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="text-[15px] font-black text-foreground uppercase tracking-tight">Preview Mode</span>
                </div>

                {/* Fake Match Card */}
                <div className="bg-card rounded-2xl border border-border p-4 flex gap-4 items-center shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-28 bg-foreground/15 rounded-sm" />
                    </div>
                    <div className="h-2 w-full bg-muted rounded-sm" />
                    <div className="h-2 w-2/3 bg-muted rounded-sm" />
                  </div>
                </div>

                {/* Progress Indicators (Geometric Squares) */}
                <div className="flex gap-2.5 pt-4 border-t border-border/40">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-2 rounded-sm bg-primary/20 w-8" />
                  ))}
                  <div className="h-2 rounded-sm bg-primary w-12" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── RIGHT SECTION (Square UI Text Area) ─── */}
      <div className="w-full md:w-1/2 p-6 md:p-10 lg:px-16 lg:py-14 flex flex-col min-h-[50vh] md:min-h-screen">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-auto">
          <button onClick={handleBack} className="p-4 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors group">
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/40 rounded-xl border border-border/20">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Step {currentSlide + 1} / {totalSteps}</span>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentSlide < 3 ? (
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* Progress Bars (Square Geometric) */}
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 rounded-sm transition-all duration-500 ${i === currentSlide ? 'w-12 bg-primary' : 'w-5 bg-primary/20'}`}
                    />
                  ))}
                </div>

                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-none mb-5 whitespace-pre-line">
                    {SLIDES[currentSlide].title}
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-muted-foreground leading-relaxed max-w-md">
                    {SLIDES[currentSlide].description}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="text-theme"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-8"
              >
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 rounded-sm transition-all duration-500 ${i === currentSlide ? 'w-12 bg-primary' : 'w-5 bg-primary/20'}`}
                    />
                  ))}
                </div>

                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-none mb-4">
                    Find Your<br />Match
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-muted-foreground leading-relaxed max-w-md">
                    Pick your preferred mode. Our squares look great in both.
                  </p>
                </div>

                {/* Square Theme Controls */}
                <div className="flex flex-col gap-3 max-w-sm">
                  <div className="relative flex bg-muted/60 p-2 rounded-3xl border border-border/40 shadow-inner overflow-hidden">
                    <button
                      onClick={(e) => handleThemeChange("light", e)}
                      className={`flex items-center justify-center gap-3 flex-1 py-4 px-6 rounded-2xl transition-all duration-300 relative z-10 font-black text-[15px] ${!isDark ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Sun className={`w-5 h-5 ${!isDark ? 'text-primary' : ''}`} /> light
                    </button>
                    <button
                      onClick={(e) => handleThemeChange("dark", e)}
                      className={`flex items-center justify-center gap-3 flex-1 py-4 px-6 rounded-2xl transition-all duration-300 relative z-10 font-black text-[15px] ${isDark ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Moon className={`w-5 h-5 ${isDark ? 'text-primary' : ''}`} /> dark
                    </button>
                    <motion.div
                      layoutId="theme-pill"
                      className="absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-2xl bg-card shadow-lg border border-border/40 z-0"
                      initial={false}
                      animate={{ 
                        left: !isDark ? '8px' : 'calc(50% + 1px)'
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30, 
                        mass: 1 
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
 
        {/* Square Footer Button */}
        <div className="pt-8 md:pt-10">
          <button
            onClick={handleNext}
            className="premium-btn py-5 w-full md:w-auto md:min-w-[240px] bg-foreground text-background flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98]"
          >
            {currentSlide === 3 ? "Go to Dashboard" : "Next Step"}
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  )
}
