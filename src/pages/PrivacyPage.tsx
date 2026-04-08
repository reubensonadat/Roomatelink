import { motion } from 'framer-motion'
import { Shield, EyeOff, Lock, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UserGroupIcon } from '../components/ui/CustomIcons'

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

export function PrivacyPage() {
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
            Agreement Framework v3.2
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
            <UserGroupIcon className="w-10 h-10" />
            <span className="text-[14px] font-black uppercase tracking-[0.3em]">Privacy First Protocol</span>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Our Data <br/>Commitment.
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
            At Roommate Link, we believe your privacy is non-negotiable. We only collect the data necessary to find you the perfect roommate and keep you safe on campus.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-0">
          <LegalSection 
            icon={Shield}
            title="Overview"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">The Core Protocol</h3>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                  This framework governs how Roommate Link handles student identity and behavioral documentation. By using our platform, you trust us with your campus lifestyle data, and we take that responsibility with institutional-grade seriousness.
                </p>
                <p className="text-muted-foreground font-medium">
                  We strictly limit data collection to parameters that directly impact your living compatibility: cleanliness, social rhythm, and academic boundaries.
                </p>
              </>
            }
          />

          <LegalSection 
            icon={EyeOff}
            title="Identity Security"
            content={
              <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                <h3 className="text-3xl font-black mb-6 tracking-tight">The Phone Number Policy</h3>
                <p className="text-xl font-bold italic mb-8 text-foreground">"Your phone number is private. Period."</p>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/40" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Zero Visibility</p>
                      <p className="text-muted-foreground font-medium">Your phone number is <span className="text-foreground font-bold">never shown</span> to your matches, even after they pay to unlock your profile. Communication remains strictly platform-based until you choose to step outside.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/40" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Internal Utility</p>
                      <p className="text-muted-foreground font-medium">We use it strictly for SMS/FCM notifications regarding new matches, message replies, and critical security alerts from our campus safety team.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/40" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Future Updates</p>
                      <p className="text-muted-foreground font-medium">We may use your contact info to notify you of major ecosystem features like our 'Refer & Earn' program or student mixers.</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          <LegalSection 
            icon={Lock}
            title="Infrastructure"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Data Security</h3>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                  Your behavioral questionnaire data is stored securely in our proprietary database framework. Our matching algorithm is the only entity that "reads" your full answers to calculate compatibly.
                </p>
                <div className="p-6 bg-muted/50 rounded-2xl border border-border/50">
                  <p className="text-[14px] font-bold text-muted-foreground uppercase tracking-widest mb-2 italic">Institutional Note:</p>
                  <p className="text-[15px] font-medium leading-relaxed italic text-foreground">
                    "We encrypt all sensitive student fields. No human moderator has arbitrary access to your private questionnaire responses without a specific safety flag."
                  </p>
                </div>
              </>
            }
          />

          <LegalSection 
            icon={Users}
            title="Ownership"
            content={
              <>
                <h3 className="text-3xl font-black mb-6 tracking-tight">Account Control</h3>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-8">
                  You maintain absolute ownership of your account. You can pause your searching status in your profile settings or delete your account entirely at any time.
                </p>
                <div className="flex items-center gap-4 p-6 bg-foreground/5 rounded-2xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-background" />
                  </div>
                  <p className="text-[15px] font-bold text-foreground/80">
                    Account deletion is permanent. We wipe all questionnaire data from our live database immediately upon request.
                  </p>
                </div>
              </>
            }
          />
        </div>

        {/* Support CTA */}
        <div className="mt-32 pt-16 border-t border-border/40 text-center">
          <p className="text-[13px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Need Clarification?</p>
          <button 
            onClick={() => navigate('/support')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-foreground/10"
          >
            Contact Transparency Team <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
