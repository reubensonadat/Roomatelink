import Link from 'next/link'
import { FileQuestion, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-8 relative border border-border/50 shadow-sm">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
        <div className="absolute -bottom-2 -right-2 bg-background p-[6px] rounded-full border border-border">
          <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>
      
      <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-4 text-foreground">404</h1>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground tracking-tight">Signal Lost</h2>
      
      <p className="text-muted-foreground text-[16px] sm:text-lg max-w-md mb-12 leading-relaxed">
        The matchmaking algorithm couldn't locate this sector. It either never existed or has been scrubbed from the database.
      </p>
      
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-bold text-[15px] transition-transform hover:scale-[1.02] shadow-lg hover:shadow-xl group"
      >
        Return to Dashboard <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}
