import { BackButton } from '@/components/ui/back-button';

export default function Terms() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans py-24 px-6 selection:bg-primary/20">
      <div className="max-w-4xl mx-auto">
        <BackButton />
        <div className="bg-card p-8 sm:p-16 rounded-[2.5rem] shadow-sm border border-border/50">
          
          <div className="flex flex-col items-center mb-12 w-full mt-4">
            <div className="flex items-center w-full gap-4 sm:gap-6 mb-4">
              <div className="h-px flex-1 bg-border/80"></div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-[0.25em] sm:tracking-[0.35em] uppercase text-foreground text-center">
                Terms of Service
              </h1>
              <div className="h-px flex-1 bg-border/80"></div>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground tracking-[0.2em] uppercase">User Agreement</span>
          </div>
          
          <div className="max-w-none text-muted-foreground font-medium leading-relaxed space-y-12">
            <p className="border-b border-border/50 pb-8 text-lg">
              Last updated: {new Date().toLocaleDateString()}
              <br/><br/>
              Welcome to Roommate Link. These Terms of Service ("Terms") constitute a legally binding agreement between you and Roommate Link regarding your use of our platform, matchmaking algorithms, and communication tools. By registering an account, you strictly agree to these terms.
            </p>
            
            <section>
               <h2 className="text-2xl font-bold mb-4 text-foreground">1. Eligibility & Academic Verification</h2>
               <div className="space-y-4">
                 <p>1.1. <strong>Academic Requirement</strong>: Roommate Link is an exclusive platform designed strictly for verified university students. To access the platform, you must possess an active, verifiable university email address (e.g., .edu or regional equivalents).</p>
                 <p>1.2. <strong>Age Restriction</strong>: You must be at least 16 years of age or the legal age of majority in your jurisdiction to use this platform.</p>
                 <p>1.3. <strong>Identity Authenticity</strong>: You agree to provide accurate, current, and complete information during your psychological and behavioral assessment. Falsifying lifestyle data undermines the algorithmic integrity and is grounds for immediate termination.</p>
               </div>
            </section>
            
            <section>
               <h2 className="text-2xl font-bold mb-4 text-foreground">2. The Verification & Access Fee</h2>
               <div className="space-y-4">
                 <p>2.1. <strong>One-Time Payment</strong>: To definitively restrict bot activity, scammers, and unserious actors, Roommate Link requires a one-time verification fee (e.g., ₵ 15) to unlock the matchmaking database for the duration of the current academic year.</p>
                 <p>2.2. <strong>Non-Refundable Policy</strong>: Because this fee is strictly used to verify your identity and sustain platform security infrastructure, it is strictly <strong>non-refundable</strong> under any circumstances, including account termination due to ToS violations or failure to secure a real-world roommate.</p>
                 <p>2.3. <strong>No Hidden Subscriptions</strong>: We legally guarantee that Roommate Link operates independently of predatory recurring subscription models. Your payment provides unfiltered access without arbitrary paywalled match limits.</p>
               </div>
            </section>

            <section>
               <h2 className="text-2xl font-bold mb-4 text-foreground">3. User Conduct & Zero-Tolerance Policy</h2>
               <div className="space-y-4">
                 <p>3.1. <strong>Platform Safety</strong>: You agree to use Roommate Link exclusively for finding campus housing compatibility. Any use of the platform for dating, soliciting, commercial advertising, or academic cheating is strictly prohibited.</p>
                 <p>3.2. <strong>Zero-Tolerance for Harassment</strong>: Roommate Link maintains a zero-tolerance policy for harassment, hate speech, bullying, discrimination, or abusive messaging. Any user reported with sufficient evidence of such behavior will face an irreversible, permanent IP and academic email ban.</p>
                 <p>3.3. <strong>Content Restrictions</strong>: Any custom avatars or uploaded profile photos must be safe for viewing. Explicit, violent, or offensive media will trigger automated account deletion.</p>
               </div>
            </section>

            <section>
               <h2 className="text-2xl font-bold mb-4 text-foreground">4. Limitation of Liability & Real-World Risk</h2>
               <div className="space-y-4">
                 <p>4.1. <strong>Algorithmic Disclaimer</strong>: Our 40+ point algorithm calculates predicted compatibility based purely on user-submitted data. Roommate Link does not legally guarantee a flawless living arrangement.</p>
                 <p>4.2. <strong>Real-World Interactions</strong>: We are a digital matchmaking interface, not a housing authority or landlord. Roommate Link, its creators, and affiliates are <strong>not legally liable</strong> for any real-world disputes, financial disagreements, property damage, or physical altercations that occur between matched users offline.</p>
                 <p>4.3. <strong>Duty of Care</strong>: Users explicitly assume all risks associated with meeting strangers in the real world. We strongly advise meeting potential matches in public campus locations prior to signing any leasing agreements.</p>
               </div>
            </section>

            <section>
               <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">5. Termination</h2>
               <p>We maintain an absolute zero-tolerance policy for harassment. We reserve the right to suspend or instantly terminate accounts that violate our community guidelines, spread hate speech, or bypass our verification protocols.</p>
            </section>

            <section>
               <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">6. Indemnification</h2>
               <p>You agree to defend, indemnify, and hold harmless Roommate Link, its founders, and affiliates from any and all claims, liabilities, damages, losses, and expenses (including reasonable legal and accounting fees) arising out of or in any way connected with your access to or use of the platform, or your violation of these Terms.</p>
            </section>

            <section>
               <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">7. Governing Law & Dispute Resolution</h2>
               <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Roommate Link is registered, without regard to its conflict of law provisions. Any dispute arising from these Terms will be resolved exclusively through binding arbitration, strictly prohibiting participation in any class-action lawsuits against the platform.</p>
            </section>

            <section>
               <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">8. Changes to Terms</h2>
               <p>We reserve the right to modify these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
            </section>
          </div>

        </div>
      </div>
    </main>
  )
}
