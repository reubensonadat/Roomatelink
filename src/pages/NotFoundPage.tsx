import { Link } from 'react-router-dom'
import { ChevronRight, Radar } from 'lucide-react'
import { motion } from 'framer-motion'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      
      {/* Cinematic Background Effect */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_80%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-32 h-32 bg-card/50 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mb-10 relative border border-border/50 shadow-2xl"
        >
          <Radar className="w-12 h-12 text-primary" />
          <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-2xl border border-border shadow-lg">
             <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-8xl sm:text-[10rem] font-black tracking-tighter mb-4 text-foreground leading-none"
        >
          404
        </motion.h1>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-black mb-8 text-foreground tracking-tight"
        >
          Signal Lost in Orbit
        </motion.h2>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-lg sm:text-xl max-w-md mb-12 leading-relaxed font-bold tracking-tight"
        >
          The matchmaking algorithm couldn't locate this sector. It either never existed or has been scrubbed from the database.
        </motion.p>
        
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 px-10 py-5 rounded-3xl bg-foreground text-background font-black text-[16px] transition-transform hover:scale-[1.05] active:scale-95 shadow-2xl hover:shadow-primary/20 group"
          >
            Return to Base <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Decorative Binary/Code dust */}
      <div className="absolute bottom-10 left-10 text-[10px] font-mono text-muted-foreground/30 hidden md:block">
        ERR_SECTOR_NOT_FOUND :: MATCH_ID_NULL
      </div>
      <div className="absolute bottom-10 right-10 text-[10px] font-mono text-muted-foreground/30 hidden md:block">
        v2.0.4_STABLE :: CLOUDFLARE_EDGE
      </div>
    </div>
  )
}
