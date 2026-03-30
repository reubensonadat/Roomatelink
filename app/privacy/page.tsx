"use client";
import { ArrowLeft, Shield, Lock, Bell, Users, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-5 py-4">
        <div className="w-full max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-10 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Intro */}
          <section>
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Shield className="w-6 h-6" />
              <h2 className="text-2xl font-black tracking-tight">Our Commitment</h2>
            </div>
            <p className="text-muted-foreground font-medium leading-relaxed">
              At Roommate Link, we believe your privacy is non-negotiable. We only collect the data necessary to find you the perfect roommate and keep you updated on your matches.
            </p>
          </section>

          {/* Phone Number Section */}
          <section className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-emerald-500">
              <EyeOff className="w-6 h-6" />
              <h2 className="text-xl font-bold tracking-tight">The Phone Number Policy</h2>
            </div>
            <p className="text-foreground font-semibold mb-4 italic">
              "Your phone number is private. Period."
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[14px] text-muted-foreground font-medium">
                  <strong>Zero Visibility:</strong> Your phone number is <span className="text-foreground">never shown</span> to your matches, even after they pay to unlock your profile.
                </span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[14px] text-muted-foreground font-medium">
                  <strong>Internal Updates:</strong> We use it to send you SMS or FCM notifications about new matches, replies to your messages, and important security alerts.
                </span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[14px] text-muted-foreground font-medium">
                  <strong>Future Updates:</strong> We may use your contact info to notify you of new features like our "Refer & Earn" program or campus-wide roommate mixers.
                </span>
              </li>
            </ul>
          </section>

          {/* Data Usage */}
          <section className="grid gap-8">
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" /> Data Security
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                Your behavioral questionnaire data is stored securely in Supabase. Only our matching algorithm "reads" your full answers to calculate compatibility.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Account Control
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                You can delete your account at any time in Settings. When you delete your account, we wipe your information from our database completely.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="pt-10 border-t border-border/40 text-center">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Questions?</p>
            <p className="text-[14px] font-medium text-foreground">Contact our support team through the Help Center.</p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
