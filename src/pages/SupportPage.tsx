import { UserGroupIcon, CustomMatch, CustomVerification } from '../components/ui/CustomIcons'
import { ChevronLeft, MessageCircle, Clock, ShieldAlert, BadgeCheck, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const SupportCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-card rounded-[2.5rem] border border-border/50 p-8 flex flex-col gap-6 hover:shadow-xl transition-all group"
  >
    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7 text-foreground" />
    </div>
    <div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed text-[15px]">{description}</p>
    </div>
  </motion.div>
)

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className="py-6 border-b border-border/50">
    <h4 className="text-lg font-bold mb-3 flex items-start gap-3">
      <HelpCircle className="w-5 h-5 text-foreground mt-1 shrink-0" />
      {question}
    </h4>
    <p className="text-muted-foreground font-medium leading-relaxed pl-8">{answer}</p>
  </div>
)

export function SupportPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-background text-left selection:bg-foreground/10">
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
            Support Protocol v1.0
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 pb-32">
        {/* Hero Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6 text-foreground"
          >
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8" />
            </div>
            <span className="text-[14px] font-black uppercase tracking-[0.2em]">Institutional Support</span>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-8 leading-[1.1]">
            How can we <br />help you today?
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
            Our priority support team is dedicated to ensuring every student finds a safe, compatible, and stress-free living environment.
          </p>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <SupportCard
            icon={CustomMatch}
            title="Matching & Vibe Checks"
            description="Having trouble finding a match? We can manually review your behavioral assessment to ensure your 'vibe check' is optimized for campus compatibility."
          />
          <SupportCard
            icon={CustomVerification}
            title="Identity & Billing"
            description="Questions about your verification fee or student status? Our billing team handles all Paystack and academic email troubleshooting."
          />
          <SupportCard
            icon={ShieldAlert}
            title="Safety & Reporting"
            description="Report suspicious behavior, harassment, or profile falsification. We maintain a zero-tolerance policy for community guideline violations."
          />
          <SupportCard
            icon={BadgeCheck}
            title="Technical Issues"
            description="Encountered a bug or a display error? Your feedback helps us build a more robust ecosystem for university students worldwide."
          />
        </div>

        {/* Commitment Section */}
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12 border border-border/50 mb-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-black mb-6 tracking-tight">Our Support Commitment</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <Clock className="w-6 h-6 text-foreground shrink-0" />
                  <div>
                    <p className="font-bold">Fast Response Times</p>
                    <p className="text-muted-foreground text-[14px]">We aim to reply to all queries within 2 hours during standard academic hours.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <MessageCircle className="w-6 h-6 text-foreground shrink-0" />
                  <div>
                    <p className="font-bold">Human-to-Human Support</p>
                    <p className="text-muted-foreground text-[14px]">No complex bots. You'll talk to a real person who understands campus life.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2 bg-background p-8 rounded-[2rem] border border-border shadow-sm">
              <p className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-4">Direct Access</p>
              <div className="space-y-6">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-muted-foreground">Support Email</span>
                  <a href="mailto:synaptech25@gmail.com" className="text-xl font-black hover:text-primary transition-colors">synaptech25@gmail.com</a>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-muted-foreground">Call or WhatsApp</span>
                  <a href="tel:0548135853" className="text-xl font-black hover:text-primary transition-colors">0548135853</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-32">
          <h2 className="text-3xl font-black mb-10 tracking-tight">Common Inquiries</h2>
          <div className="divide-y divide-border/50">
            <FAQItem
              question="Why is there a one-time verification fee?"
              answer="To definitively restrict bots, scammers, and actors who aren't serious about finding a roommate. This fee sustains our high-security infrastructure and academic verification engine."
            />
            <FAQItem
              question="Can my matches see my phone number?"
              answer="No. Your phone number is strictly for internal updates, security alerts, and reward notifications. It is never displayed to other users on the platform."
            />
            <FAQItem
              question="What if I don't find a roommate?"
              answer="Our algorithm continuously reruns matches as new students join. We recommend checking your 'Vibe Check' settings if you aren't seeing compatible options."
            />
            <FAQItem
              question="How do I report a user?"
              answer="Navigate to the user's profile and use the Report icon. Our team manually reviews every report within 24 hours to ensure community safety."
            />
          </div>
        </section>

        {/* CTA Footer */}
        <div className="text-center">
          <p className="text-muted-foreground font-bold mb-4">Ready to find your perfect campus partner?</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-foreground text-background rounded-full font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
          >
            Explore Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
