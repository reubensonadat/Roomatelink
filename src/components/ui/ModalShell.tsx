import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string // e.g. 'md:w-[600px]'
  showCloseButton?: boolean
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md:w-[540px]',
  showCloseButton = true
}: ModalShellProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  // ─── Detect Mobile & Load Persistence ──────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Load saved position for this specific modal title (Desktop only)
    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem(`modal_pos_${title}`)
      if (saved) {
        try {
          setInitialPos(JSON.parse(saved))
        } catch (e) {
          console.warn("Failed to load modal position", e)
        }
      }
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [title])

  // ─── Handle Body Scroll Lock ────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  const handleDragEnd = (_: any, info: any) => {
    if (isMobile) {
      // Mobile swipe-to-dismiss logic
      if (info.offset.y > 150) onClose()
    } else {
      // Desktop persistence logic
      const newPos = {
        x: initialPos.x + info.offset.x,
        y: initialPos.y + info.offset.y
      }
      setInitialPos(newPos)
      localStorage.setItem(`modal_pos_${title}`, JSON.stringify(newPos))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            drag={isMobile ? "y" : true}
            dragConstraints={isMobile ? { top: 0 } : false}
            dragElastic={isMobile ? 0.15 : 0.05}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={isMobile ? { y: "100%", opacity: 0 } : { x: initialPos.x, y: initialPos.y, opacity: 0, scale: 0.95 }}
            animate={{ 
              x: isMobile ? 0 : initialPos.x,
              y: isMobile ? 0 : initialPos.y, 
              opacity: 1, 
              scale: 1 
            }}
            exit={isMobile ? { y: "100%", opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className={`
              relative w-full ${maxWidth} bg-card 
              border-t md:border border-border shadow-2xl overflow-hidden 
              pointer-events-auto max-h-[92vh] md:max-h-[85vh] flex flex-col
              rounded-t-[2.5rem] md:rounded-[2.5rem]
              ${isMobile ? 'pb-safe' : ''}
            `}
          >
            {/* Mobile Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden bg-card/50 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-muted/60" />
            </div>

            {/* Header - Optimized for iPhone SE (smaller padding/text) */}
            <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-6 border-b border-border/40 shrink-0 select-none cursor-move md:cursor-default">
              <div className="flex flex-col">
                <h2 className="text-[16px] md:text-[22px] font-black text-foreground leading-tight tracking-tight uppercase">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[10px] md:text-[12px] text-muted-foreground font-bold mt-0.5 tracking-tight uppercase opacity-70">
                    {subtitle}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95 shadow-sm"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative px-5 md:px-8 py-4 md:py-6">
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="px-5 py-4 md:px-8 md:py-6 border-t border-border/40 bg-muted/5 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

