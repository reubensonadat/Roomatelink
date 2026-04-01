import { motion } from 'framer-motion'
import { Scale, ShieldCheck, Banknote, Ban, AlertTriangle, ChevronLeft, ArrowRight, Gavel } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LegalSection = ({ icon: Icon, title, content }: { icon: any, title: string, content: React.ReactNode }) => (
  <motion.section 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="py-12 border-b border-border/40 last:border-0"
  >
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3">
        <div className="sticky top-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-foreground/5">
              <Icon className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
          </div>
        </div>
      </div>
      <div className="md:w-2/3">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {content}
        </div>
      </div>
    </div>
  </motion.section>
)

export function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-background text-left selection:bg-foreground/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 group text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-2 rounded-xl bg-muted group-hover:bg-foreground/10 group-hover:text-foreground transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
            Back
          </button>
          <div className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">
            Agreement Framework v1.0
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 pb-32">
        {/* Hero */}
        <div className="mb-24 border-b border-border/40 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 text-foreground"
          >
            <Scale className="w-10 h-10" />
            <span className="text-[14px] font-black uppercase tracking-[0.3em]">Institutional Governance</span>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Terms of <br/>Service.
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
            Welcome to Roommate Link. These Terms constitute a legally binding agreement regarding your use of our platform, matchmaking algorithms, and communication tools.
          </p>
          <p className="mt-8 text-[14px] font-bold text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-0">
          <LegalSection 
            icon={ShieldCheck}
            title="01 Eligibility"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Academic Verification</h3>
                <div className="space-y-6 text-muted-foreground font-medium text-[16px] leading-relaxed">
                  <p>
                    <strong className="text-foreground">1.1 Academic Requirement:</strong> Roommate Link is an exclusive platform designed strictly for verified university students. To access the platform, you must possess an active, verifiable university email address (e.g., .edu or regional equivalents).
                  </p>
                  <p>
                    <strong className="text-foreground">1.2 Age Restriction:</strong> You must be at least 16 years of age or the legal age of majority in your jurisdiction to use this platform.
                  </p>
                  <p>
                    <strong className="text-foreground">1.3 Identity Authenticity:</strong> You agree to provide accurate, current, and complete information during your psychological and behavioral assessment. Falsifying lifestyle data undermines the algorithmic integrity and is grounds for immediate termination.
                  </p>
                </div>
              </>
            }
          />

          <LegalSection 
            icon={Banknote}
            title="02 Access"
            content={
              <div className="bg-muted/30 border border-border/50 rounded-[2.5rem] p-8 md:p-12">
                <h3 className="text-3xl font-black mb-6 tracking-tight">Verification Fees</h3>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>
                    <strong className="text-foreground">2.1 One-Time Payment:</strong> To definitively restrict bot activity, scammers, and unserious actors, Roommate Link requires a one-time verification fee to unlock the matchmaking database for the duration of the current academic year.
                  </p>
                  <p className="p-6 bg-background rounded-2xl border border-border shadow-sm">
                    <strong className="text-foreground block mb-2">2.2 Non-Refundable Policy:</strong> Because this fee is strictly used to verify your identity and sustain platform security infrastructure, it is strictly <span className="text-foreground font-black">non-refundable</span> under any circumstances.
                  </p>
                  <p>
                    <strong className="text-foreground">2.3 No Hidden Subscriptions:</strong> We legally guarantee that Roommate Link operates independently of predatory recurring subscription models.
                  </p>
                </div>
              </div>
            }
          />

          <LegalSection 
            icon={Ban}
            title="03 Conduct"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Zero-Tolerance Policy</h3>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>
                    <strong className="text-foreground">3.1 Platform Safety:</strong> You agree to use Roommate Link exclusively for finding campus housing compatibility. Any use for dating, soliciting, or commercial advertising is strictly prohibited.
                  </p>
                  <div className="flex gap-4 p-6 bg-foreground/5 rounded-2xl border border-border/50">
                    <AlertTriangle className="w-6 h-6 text-foreground shrink-0" />
                    <p className="text-[15px] font-bold text-foreground/80">
                      3.2 Harassment: We maintain a zero-tolerance policy for hate speech, bullying, or abusive messaging. Violations face an irreversible, permanent IP and academic email ban.
                    </p>
                  </div>
                </div>
              </>
            }
          />

          <LegalSection 
            icon={AlertTriangle}
            title="04 Liability"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Real-World Risk</h3>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>
                    <strong className="text-foreground">4.1 Algorithmic Disclaimer:</strong> Our 40+ point algorithm calculates predicted compatibility based on user-submitted data. Roommate Link does not legally guarantee a flawless living arrangement.
                  </p>
                  <p>
                    <strong className="text-foreground">4.2 Interactions:</strong> We are a digital matchmaking interface, not a housing authority. Roommate Link, its creators, and affiliates are <strong className="text-foreground">not legally liable</strong> for any real-world disputes, financial disagreements, or physical altercations.
                  </p>
                  <p className="italic underline">Users explicitly assume all risks associated with meeting strangers in the real world.</p>
                </div>
              </>
            }
          />

          <LegalSection 
            icon={Gavel}
            title="05 Legal"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Governing Framework</h3>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>
                    <strong className="text-foreground">Indemnification:</strong> You agree to defend and hold harmless Roommate Link from any claims arising out of your access to or use of the platform.
                  </p>
                  <p>
                    <strong className="text-foreground">Dispute Resolution:</strong> Any dispute arising from these Terms will be resolved exclusively through binding arbitration, prohibiting participation in class-action lawsuits.
                  </p>
                </div>
              </>
            }
          />
        </div>

        {/* support hub link */}
        <div className="mt-32 pt-16 border-t border-border/40 text-center">
          <p className="text-[13px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Legal Inquiry?</p>
          <button 
            onClick={() => navigate('/support')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-foreground/10"
          >
            Review Support Hub <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
