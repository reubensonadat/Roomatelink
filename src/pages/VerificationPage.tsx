import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, ChevronRight, Loader2, Info } from 'lucide-react'
import { verifyUniversityEmail } from '../lib/verification'
import { toast } from 'sonner'

export function VerificationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await verifyUniversityEmail(email)
      toast.success(`Verified! Welcome to ${result.university}.`)
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border border-border p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <GraduationCap size={120} />
        </div>

        <div className="space-y-6 relative z-10">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[12px] font-black uppercase tracking-widest">
              Identity Secure
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">Student <br/> Verification</h1>
            <p className="text-muted-foreground font-medium text-lg italic pr-12">Confirm your university status to unlock the matching engine.</p>
          </header>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[14px] font-black uppercase tracking-widest text-foreground/70">University Email</label>
                <div className="flex items-center gap-1.5 text-muted-foreground group cursor-help relative">
                  <Info size={14} />
                  <span className="text-[12px] font-bold">Why?</span>
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-foreground text-background rounded-xl text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    We only allow verified students to ensure a safe, community-focused platform.
                  </div>
                </div>
              </div>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border/50 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-lg placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-5 bg-foreground text-background rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Verify Identity
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-border/50">
            <p className="text-[12px] text-muted-foreground font-medium text-center">
              Don't have a student email yet? <button className="text-primary font-black hover:underline">Contact Admissions</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
