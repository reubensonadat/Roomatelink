"use client";
import { Sparkles, Check, X, MessageCircle, Lock, Flame, Moon, Coffee, VolumeX, UserCheck, ShieldCheck, Eye, ChevronRight, Flag, Heart, Unlock, MessageSquare, Search, PartyPopper, Crown, Clock, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { PullToRefresh } from '@/components/pull-to-refresh';
import { ReportModal } from '@/components/ui/report-modal';
import dynamic from 'next/dynamic';
import { claimPioneerAccess } from '@/lib/auth-actions';

const PaystackPaymentButton = dynamic(() => import('@/components/paystack-payment-button'), { ssr: false });
import { FoundRoommateModal } from '@/components/ui/found-roommate-modal';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

// ─── Mock Data with Compatibility Breakdown ────────────────────
// In production this comes from the matches table + algorithm output

type CategoryScore = { name: string; score: number; insight: string };

interface MatchProfile {
  id: string;
  name: string;
  verified: boolean;
  matchPercent: number;
  gender: string;
  course: string;
  level: string;
  avatar: string;
  bio: string;
  trait: string;
  lifestyle: { icon: any; text: string }[];
  tags: string[];
  sharedTraits: string[];
  tensions: string[];
  categoryScores: CategoryScore[];
}

const MATCHES: MatchProfile[] = [];

// ─── Helpers ───────────────────────────────────────────────────

function getTierInfo(pct: number) {
  if (pct >= 90) return { label: 'Exceptional', color: 'text-emerald-500', stroke: '#10b981', textColor: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10', icon: '🔥' };
  if (pct >= 80) return { label: 'Strong', color: 'text-green-500', stroke: '#22c55e', textColor: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-500/10', icon: '💚' };
  if (pct >= 70) return { label: 'Good', color: 'text-amber-500', stroke: '#f59e0b', textColor: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10', icon: '💛' };
  return { label: 'Potential', color: 'text-slate-400', stroke: '#94a3b8', textColor: 'text-slate-500', bgLight: 'bg-slate-400/10', icon: '⚪' };
}

function getScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-400';
}

function getScoreLabel(score: number) {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}


// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function MatchesDashboard() {
  // In production: fetched from users.has_paid
  const [hasPaid, setHasPaid] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{
    isProfileComplete: boolean;
    hasQuestionnaire: boolean;
    fullName: string;
  }>({
    isProfileComplete: true, // Default to true to prevent flickering
    hasQuestionnaire: true,
    fullName: ''
  });

  // Premium Unlock States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(0);

  // Payment & Discount States
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [finalPrice, setFinalPrice] = useState(25);

  // Payment Verification States (fallback for slow connections)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(8);
  const [showPaymentFallback, setShowPaymentFallback] = useState(false);

  // Valid discount codes (in production, this would be validated on the server)
  const VALID_DISCOUNTS: Record<string, { amount: number; label: string }> = {
    'ROOMMATE10': { amount: 10, label: '10 GHS Off' },
    'WELCOME10': { amount: 10, label: '10 GHS Off' },
    'PITCH10': { amount: 10, label: '10 GHS Off' },
  };

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedMatch, setReportedMatch] = useState<MatchProfile | null>(null);

  // Found Roommate Modal State
  const [isFoundRoommateModalOpen, setIsFoundRoommateModalOpen] = useState(false);
  const [currentDayNumber, setCurrentDayNumber] = useState<number | null>(null);
  const [profileFoundRoommate, setProfileFoundRoommate] = useState(false);

  // Matches State
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Pioneer User State
  const [isPioneerUser, setIsPioneerUser] = useState(false);
  const [isPioneerModalOpen, setIsPioneerModalOpen] = useState(false);

  // Real user email for Paystack config
  const [userEmail, setUserEmail] = useState('student@stu.ucc.edu.gh');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Get User Profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, full_name, course, level, phone_number, has_paid, email')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          setCurrentUserId(profile.id);
          if (profile.has_paid) setHasPaid(true);
          if (profile.email) setUserEmail(profile.email);

          // 2. Check Questionnaire
          const { data: questionnaire } = await supabase
            .from('questionnaire_responses')
            .select('id')
            .eq('user_id', profile.id)
            .single();

          setProfileStatus({
            isProfileComplete: !!(profile.course && profile.level && profile.phone_number),
            hasQuestionnaire: !!questionnaire,
            fullName: profile.full_name || 'Student'
          });

          // 3. Fetch Real Matches
          const { data: dbMatches } = await supabase
            .from('matches')
            .select(`
              *,
              roommate:users!user_b_id (
                id, full_name, avatar_url, bio, course, level, gender, is_student_verified
              )
            `)
            .eq('user_a_id', profile.id)
            .order('match_percentage', { ascending: false });

          if (dbMatches) {
            const mappedMatches: MatchProfile[] = dbMatches.map((m: any) => ({
              id: m.roommate.id,
              name: m.roommate.full_name,
              verified: m.roommate.is_student_verified,
              matchPercent: m.match_percentage,
              gender: m.roommate.gender,
              course: m.roommate.course,
              level: m.roommate.level,
              avatar: m.roommate.avatar_url,
              bio: m.roommate.bio || "No bio yet.",
              trait: m.cross_category_flags?.[0]?.description || "Potential Roommate",
              lifestyle: [], 
              tags: [m.roommate.course, `Level ${m.roommate.level}`],
              sharedTraits: [],
              tensions: (m.cross_category_flags || []).map((f: any) => f.description),
              categoryScores: m.category_scores || [] // ✅ Pull real scores from DB
            }));
            setMatches(mappedMatches);
          }
        }
      }
      setIsLoading(false);
    };

    checkProfile();
  }, [isPioneerUser, hasPaid]);

  // Check Pioneer eligibility on mount (only if not already paid)
  useEffect(() => {
    if (hasPaid) return; // Already unlocked, skip
    
    fetch('/api/pioneer/check-status')
      .then(res => res.json())
      .then(({ isPioneer }) => {
        setIsPioneerUser(isPioneer);
      })
      .catch(err => {
        console.error('Failed to check pioneer status:', err);
      });
  }, [hasPaid]);

  // Load persisted unlock state
  useEffect(() => {
    if (localStorage.getItem('roommate_has_paid') === 'true') {
      setHasPaid(true);
      setUnlockedCount(matches.length);
    }
  }, [matches.length]);

  // Check for profile creation date and show prompts at day 7, 30, 50
  useEffect(() => {
    const PROFILE_CREATED_KEY = 'roommate_profile_created_date';
    const PROFILE_FOUND_KEY = 'roommate_found_roommate';
    const PROMPT_SHOWN_KEY = 'roommate_prompt_shown';

    // Get profile creation date
    const profileCreatedStr = localStorage.getItem(PROFILE_CREATED_KEY);
    const profileFound = localStorage.getItem(PROFILE_FOUND_KEY);

    if (profileFound === 'true') {
      setProfileFoundRoommate(true);
      return;
    }

    if (!profileCreatedStr) {
      // Set profile creation date if not exists
      localStorage.setItem(PROFILE_CREATED_KEY, Date.now().toString());
      return;
    }

    const profileCreatedDate = parseInt(profileCreatedStr);
    const daysSinceCreation = Math.floor((Date.now() - profileCreatedDate) / (1000 * 60 * 60 * 24));

    // Check if we should show a prompt
    const promptShownStr = localStorage.getItem(PROMPT_SHOWN_KEY);
    const promptShownDays = promptShownStr ? JSON.parse(promptShownStr) : [];

    const promptDays = [7, 30, 50];
    for (const day of promptDays) {
      if (daysSinceCreation >= day && !promptShownDays.includes(day)) {
        setCurrentDayNumber(day);
        setIsFoundRoommateModalOpen(true);
        break;
      }
    }
  }, []);

  // Sequential Unlock Effect
  useEffect(() => {
    if (isUnlocking && unlockedCount < matches.length) {
      const timer = setTimeout(() => {
        setUnlockedCount(prev => prev + 1);
      }, 500); // Delay between each reveal
      return () => clearTimeout(timer);
    } else if (isUnlocking && unlockedCount === matches.length) {
      setIsUnlocking(false);
      setHasPaid(true);
      localStorage.setItem('roommate_has_paid', 'true');
      toast.success('All profiles unlocked!', {
        icon: <Sparkles className="w-5 h-5 text-white" />,
        style: { background: '#10b981', color: '#fff' }
      });
    }
  }, [isUnlocking, unlockedCount, matches.length]);

  // Countdown timer — shows fallback button if payment takes too long
  useEffect(() => {
    if (!isVerifyingPayment) {
      setVerifyCountdown(8);
      setShowPaymentFallback(false);
      return;
    }
    if (verifyCountdown <= 0) {
      setShowPaymentFallback(true);
      return;
    }
    const t = setTimeout(() => setVerifyCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isVerifyingPayment, verifyCountdown]);

  // Fallback: re-poll Supabase directly to confirm payment landed in DB
  const handlePaymentFallbackCheck = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('has_paid')
      .eq('auth_id', user.id)
      .single();

    if (profile?.has_paid) {
      // DB confirmed — unlock everything
      setIsVerifyingPayment(false);
      setHasPaid(true);
      localStorage.setItem('roommate_has_paid', 'true');
      setIsUnlocking(true);
      setUnlockedCount(0);
      toast.success('Payment confirmed! Unlocking your matches...', {
        icon: <Check className="w-5 h-5 text-white" />,
        style: { background: '#10b981', color: '#fff' }
      });
    } else {
      toast.error('Payment not yet confirmed. Please wait a moment and try again.', {
        description: 'If you were charged, contact support with your payment reference.',
      });
    }
  };

  const handleStartPayment = async () => {
    // Before opening Paystack, check if this user qualifies for free Pioneer access
    if (isPioneerUser && !hasPaid) {
      setIsPioneerModalOpen(true);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleFoundRoommateConfirm = () => {
    const PROMPT_SHOWN_KEY = 'roommate_prompt_shown';
    const PROFILE_FOUND_KEY = 'roommate_found_roommate';

    // Mark this prompt as shown
    const promptShownStr = localStorage.getItem(PROMPT_SHOWN_KEY);
    const promptShownDays = promptShownStr ? JSON.parse(promptShownStr) : [];
    if (currentDayNumber && !promptShownDays.includes(currentDayNumber)) {
      localStorage.setItem(PROMPT_SHOWN_KEY, JSON.stringify([...promptShownDays, currentDayNumber]));
    }

    // Mark profile as found roommate in both locations for consistency
    localStorage.setItem(PROFILE_FOUND_KEY, 'true');
    setProfileFoundRoommate(true);

    const savedProfile = localStorage.getItem('roommate_profile_data');
    if (savedProfile) {
      const data = JSON.parse(savedProfile);
      data.isMatched = true;
      localStorage.setItem('roommate_profile_data', JSON.stringify(data));
    }

    setIsFoundRoommateModalOpen(false);

    setCurrentDayNumber(null);
    toast.success('Roommate match confirmed!', {
      icon: <Check className="w-5 h-5 text-white" />
    });
  };

  const handleApplyDiscount = () => {
    setIsApplyingDiscount(true);
    setDiscountError('');

    // Simulate API call
    setTimeout(() => {
      const discount = VALID_DISCOUNTS[discountCode.toUpperCase()];

      if (discount) {
        setFinalPrice(25 - discount.amount);
        setDiscountApplied(true);
        setDiscountError('');
        toast.success(`Discount applied: ${discount.label}`, {
          icon: <Check className="w-5 h-5 text-white" />
        });
      } else {
        setDiscountError('Invalid discount code');
        setFinalPrice(25);
        setDiscountApplied(false);
        toast.error('Invalid discount code', {
          icon: <X className="w-5 h-5 text-white" />
        });
      }

      setIsApplyingDiscount(false);
    }, 800);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountApplied(false);
    setDiscountError('');
    setFinalPrice(25);
  };

  // ── SSR Guard ──
  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative overflow-x-hidden">

      {/* ── Payment Verification Overlay ───────────────────────── */}
      <AnimatePresence>
        {isVerifyingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-6"
          >
            {/* Spinner */}
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-[4px] border-primary/20" />
              <div className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h2 className="text-[22px] font-black text-foreground mb-2 tracking-tight">Verifying Payment</h2>
            <p className="text-[14px] font-medium text-muted-foreground text-center max-w-[260px] mb-8">
              Please hold on while we confirm your payment securely.
            </p>

            {/* Animated progress bar */}
            <div className="w-full max-w-[280px] h-1.5 bg-muted rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${((8 - verifyCountdown) / 8) * 100}%` }}
                className="h-full bg-primary rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Fallback button — appears after 8 seconds */}
            <AnimatePresence>
              {showPaymentFallback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-[13px] font-medium text-muted-foreground text-center">
                    Taking longer than expected?
                  </p>
                  <button
                    onClick={handlePaymentFallbackCheck}
                    className="px-6 py-3 bg-primary text-primary-foreground font-bold text-[14px] rounded-2xl active:scale-95 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    I've Completed Payment
                  </button>
                  <button
                    onClick={() => setIsVerifyingPayment(false)}
                    className="text-[12px] font-medium text-muted-foreground underline underline-offset-2"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <PullToRefresh onRefresh={async () => { await new Promise(r => setTimeout(r, 1200)); toast.success('Matches refreshed!'); }}>
        {/* Fixed Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 sm:px-5 pt-safe-top pb-4">
          <div className="w-full max-w-2xl lg:max-w-4xl mx-auto">
            <h1 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[34px] font-black tracking-tight text-foreground leading-tight flex items-center gap-2 sm:gap-3">
              Top Matches
            </h1>
            <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-muted-foreground mt-1">
              {matches.length} highly compatible roommates found.
            </p>
          </div>
        </header>

        <div className="flex flex-col px-4 sm:px-5 pt-6 pb-40 w-full max-w-2xl lg:max-w-4xl mx-auto">
          {/* ── Match Cards Feed ────────────────────────────────── */}
          <div className="flex flex-col gap-3 md:gap-4 relative">
            {isLoading ? (
              // 1. Skeleton Loading State
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card w-full rounded-3xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center border border-border/60 animate-pulse min-h-[110px] sm:min-h-[125px]">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-muted shrink-0" />
                  <div className="flex flex-col flex-1 gap-2">
                    <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-muted rounded-sm" />
                    <div className="h-2.5 sm:h-3 w-full bg-muted rounded-sm" />
                  </div>
                </div>
              ))
            ) : !profileStatus.isProfileComplete ? (
              // 2. Profile Incomplete
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-3xl" />
                  <UserCheck className="w-8 h-8 text-amber-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Finish Your Profile</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Welcome, {profileStatus.fullName?.split(' ')[0] || 'Student'}! To find the right roommate, we need your course, level, and phone number.
                </p>
                <Link href="/dashboard/profile" className="px-8 py-4 bg-primary text-white font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Setup Profile Now <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : !profileStatus.hasQuestionnaire ? (
              // 3. Questionnaire Incomplete
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-16 pb-20 px-6 text-center"
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 animate-pulse rounded-3xl" />
                  <Sparkles className="w-8 h-8 text-indigo-500 z-10" />
                </div>
                <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3">Almost Ready!</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px] font-medium leading-relaxed max-w-[320px] mb-8">
                  Your basic profile is set. Now, take the lifestyle test so our algorithm can find your perfect roommates.
                </p>
                <Link href="/questionnaire" className="px-8 py-4 bg-foreground text-background font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  Start Questionnaire <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : matches.length === 0 ? (
              // 4. Empty State (No Matches found yet)
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-full" />
                  <Search className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-[20px] font-black text-foreground mb-2">You're Early!</h3>
                <p className="text-[14px] font-medium text-muted-foreground leading-relaxed max-w-[240px]">
                  We're still mapping the campus DNA. Check back soon for your perfect roommate matches!
                </p>
              </div>
            ) : (
              // 5. Success! Render Real Matches
              matches.map((match, i) => {
                const tier = getTierInfo(match.matchPercent);
                const isRevealed = hasPaid || (isUnlocking && i < unlockedCount);

                return (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <button
                      onClick={() => isRevealed ? setSelectedMatch(match) : handleStartPayment()}
                      className="group block w-full bg-card rounded-3xl p-3 sm:p-3.5 md:p-4 flex gap-3 sm:gap-3.5 md:gap-4 items-center border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98] min-h-[100px] sm:min-h-[110px] md:min-h-[125px] overflow-hidden relative text-left"
                    >
                      {/* Avatar Wrapper */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 shrink-0">
                        <div className={`w-full h-full rounded-3xl border-2 border-primary/20 bg-muted overflow-hidden relative shadow-inner transition-all duration-1000 ease-out ${!isRevealed ? 'blur-lg grayscale saturate-0' : 'blur-0 grayscale-0 saturate-100 scale-100'}`}>
                          <Image src={match.avatar || '/avatars/male/The Academic_M.png'} alt="Match" fill className="object-cover" />
                        </div>
                        {!isRevealed && (
                          <div className="absolute inset-0 rounded-3xl bg-background/30 flex items-center justify-center backdrop-blur-[1px]">
                            <Lock className="w-4 h-4 text-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info Content */}
                      <div className="flex flex-col flex-1 min-w-0 pr-1">
                        {isRevealed ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] font-bold text-foreground truncate">{match.name}</h3>
                              {match.verified && <Check className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-primary/80 truncate mb-1">
                              Level {match.level} • {match.course}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground border border-border/40">
                                {match.trait}
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span className={`w-fit text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${tier.bgLight} ${tier.textColor}`}>
                              {tier.label} Match
                            </span>
                            <div className="h-3 w-3/4 bg-muted/40 rounded-sm animate-pulse" />
                            <div className="h-2 w-1/2 bg-muted/30 rounded-xs animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Compatibility Gauge */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
                          <motion.circle cx="24" cy="24" r="20" stroke={tier.stroke} strokeWidth="4" fill="transparent" strokeDasharray={125.6} initial={{ strokeDashoffset: 125.6 }} animate={{ strokeDashoffset: 125.6 - (125.6 * (match.matchPercent / 100)) }} transition={{ duration: 1.5, ease: "easeOut" }} />
                        </svg>
                        <span className={`absolute text-[10px] sm:text-[11px] font-black ${tier.textColor}`}>
                          {match.matchPercent}%
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* SEED USER CELEBRATION MODAL */}
      <AnimatePresence>
        {isPioneerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPioneerModalOpen(false);
                setHasPaid(true);
                setUnlockedCount(matches.length);
                localStorage.setItem('roommate_has_paid', 'true');
                toast.success('Premium Unlocked Permanently!');
              }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[340px] bg-card rounded-3xl p-6 shadow-2xl overflow-hidden text-center border border-primary/30"
            >
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 shadow-inner">
                <Crown className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-[22px] font-black tracking-tight text-foreground mb-3 relative z-10 flex items-center justify-center gap-2">
                Pioneer Status
              </h2>
              <p className="text-[14px] text-muted-foreground font-medium leading-relaxed mb-6 relative z-10">
                You are officially one of the very first 100 students to join the roommate revolution. To say thank you, we've completely waived your verification fee.
                <br /><br />
                <span className="text-foreground font-bold">Your Premium access is free forever.</span>
              </p>

              <button
                onClick={async () => {
                  const result = await claimPioneerAccess();
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  setIsPioneerModalOpen(false);
                  setHasPaid(true);
                  setUnlockedCount(matches.length);
                  localStorage.setItem('roommate_has_paid', 'true');
                  toast.success('🎖️ Pioneer access granted! All profiles unlocked.', {
                    icon: <Check className="w-5 h-5 text-emerald-500" />
                  });
                }}
                className="w-full h-[52px] bg-primary text-primary-foreground font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-md relative z-10"
              >
                Claim Pioneer Access <PartyPopper className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Payment / Checkout Modal ─────────────────────────── */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[920px] max-w-full bg-card border-t md:border border-border rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[95vh] flex flex-col md:flex-row"
            >
              {/* Left Column (Desktop - Feature Area) */}
              <div className="hidden md:flex md:w-[420px] bg-primary/5 p-12 flex-col justify-center border-r border-border/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-3xl blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-3xl blur-3xl -translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-10 w-48 h-48">
                    <motion.img
                      initial={{ y: 0 }}
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      src="/Savings.png"
                      alt="Savings"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-[28px] font-black text-foreground leading-tight mb-4">The Smart Move.</h2>
                  <p className="text-[15px] font-medium text-muted-foreground/80 leading-relaxed mb-10 text-center">
                    A small verification fee ensures every user is a real, high-quality Campus student.
                  </p>

                  <div className="w-full space-y-4">
                    {[
                      { icon: <ShieldCheck className="w-4 h-4" />, text: "Account Protection" },
                      { icon: <Unlock className="w-4 h-4" />, text: "Campusches" },
                      { icon: <Check className="w-4 h-4" />, text: "Campus-Verified Community" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border border-border/40 p-3.5 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                          {item.icon}
                        </div>
                        <span className="text-[13px] font-bold text-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Header / Image */}
              <div className="md:hidden flex flex-col items-center pt-8 pb-4 px-6 text-center">
                <div className="w-32 h-32 mb-4">
                  <img src="/Savings.png" alt="Savings" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-[24px] font-black text-foreground leading-tight">Unlock Premium</h2>
                <p className="text-[13px] font-medium text-muted-foreground mt-2 max-w-[280px]">
                  Get full verification and start chatting with compatible roommates today.
                </p>
              </div>

              {/* Right Column (Payment Area) */}
              <div className="flex-1 flex flex-col bg-card relative">
                {/* Desktop Close Button */}
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-muted hidden md:flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex-1 p-6 md:p-12 overflow-y-auto flex flex-col justify-center">
                  <h3 className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mb-6 md:mb-8 text-center md:text-left">Verification Details</h3>

                  {/* Discount Code Input */}
                  {!discountApplied ? (
                    <div className="w-full mb-8">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            placeholder="Promo Code"
                            className="w-full px-5 py-4 bg-muted/40 border-2 border-border/40 rounded-2xl text-[15px] font-bold outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                            disabled={isApplyingDiscount}
                          />
                        </div>
                        <button
                          onClick={handleApplyDiscount}
                          disabled={!discountCode.trim() || isApplyingDiscount}
                          className="px-6 py-4 bg-primary text-white font-black rounded-2xl hover:bg-foreground transition-all disabled:opacity-40 text-[14px]"
                        >
                          {isApplyingDiscount ? '...' : 'Apply'}
                        </button>
                      </div>
                      {discountError && <p className="text-[12px] text-red-500 font-bold mt-2 pl-1">{discountError}</p>}
                    </div>
                  ) : (
                    <div className="w-full mb-8">
                      <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Check className="w-5 h-5" strokeWidth={3} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-emerald-600">₵10.00 OFF Applied</p>
                            <p className="text-[11px] font-bold text-emerald-600/60 uppercase">{discountCode}</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveDiscount} className="text-[12px] font-black text-emerald-600 border-b border-emerald-600/30 hover:text-emerald-500">Remove</button>
                      </div>
                    </div>
                  )}

                  {/* Verification Summary */}
                  <div className="space-y-4 mb-10 md:mb-12">
                    <div className="flex justify-between items-center text-[15px] font-bold text-muted-foreground px-1">
                      <span>Premium Access</span>
                      <span>GHS 25.00</span>
                    </div>
                    {discountApplied && (
                      <div className="flex justify-between items-center text-[15px] font-bold text-emerald-600 px-1">
                        <span>Promo Discount</span>
                        <span>-GHS 10.00</span>
                      </div>
                    )}
                    <div className="h-px bg-border/60 mx-1" />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[17px] font-black text-foreground">Total Fee</span>
                      <span className="text-[26px] font-black text-primary">GHS {finalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Final Button */}
                  <div className="space-y-4">
                    <PaystackPaymentButton
                      email={userEmail}
                      amount={finalPrice}
                      onSuccess={(reference: any) => {
                        // Start the verification overlay + countdown
                        setIsPaymentModalOpen(false);
                        setIsVerifyingPayment(true);

                        fetch('/api/paystack/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            reference: reference.reference, 
                            email: userEmail, 
                            amount: finalPrice 
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setIsVerifyingPayment(false);
                            if (data.success) {
                              toast.success('Identity verified! Unlocking profiles...', { id: 'verify-toast' });
                              setHasPaid(true);
                              localStorage.setItem('roommate_has_paid', 'true');
                              setIsUnlocking(true);
                              setUnlockedCount(0);
                            } else {
                              toast.error(data.error || 'Verification failed on server', { id: 'verify-toast' });
                            }
                          })
                          .catch(err => {
                            setIsVerifyingPayment(false);
                            toast.error('Network error during verification. Please use the button below.', { id: 'verify-toast' });
                            console.error('Verification error:', err);
                          });
                      }}
                      onClose={() => {
                        toast.info('Payment process cancelled.', { duration: 2000 });
                      }}
                      className="w-full py-5 bg-foreground text-background font-black rounded-2xl shadow-xl shadow-foreground/10 hover:shadow-2xl transition-all active:scale-[0.98] text-[16px] flex items-center justify-center gap-3 border border-white/10"
                    >
                      Complete Verification <ChevronRight className="w-5 h-5" />
                    </PaystackPaymentButton>
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="w-full py-4 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Floaty Unlock CTA (Only when locked) ──────────────── */}
      {!hasPaid && !isUnlocking && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-20 sm:bottom-24 left-1/2 z-50 w-full max-w-[440px] px-4 sm:px-5 pointer-events-none"
          >
            <button
              onClick={handleStartPayment}
              className="w-full bg-card/80 dark:bg-card/80 backdrop-blur-3xl text-foreground p-3 sm:p-4 rounded-3xl flex items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all border border-border/40 pointer-events-auto"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 pl-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] sm:text-[14px] font-black uppercase tracking-widest text-foreground">Secure Identity</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 leading-tight">Verify student status for full access</span>
                </div>
              </div>
              <div className="bg-primary hover:bg-foreground px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-black text-[13px] sm:text-[14px] text-primary-foreground shadow-lg transition-all active:scale-95 flex items-center gap-2">
                Verify <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ═══ Slide-Up Profile Preview Modal ═══════════════════ */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[1000px] max-w-full bg-card border-t md:border border-border rounded-t-4xl md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row"
            >
              {/* Left Column - Large Image (Desktop Only) */}
              <div className="hidden md:block w-2/5 relative bg-muted group overflow-hidden">
                <Image src={selectedMatch.avatar} alt={selectedMatch.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-3xl ${getTierInfo(selectedMatch.matchPercent).color} shadow-xl shadow-emerald-500/20 text-white`}>
                    <span className="text-[20px] font-black">{selectedMatch.matchPercent}%</span>
                    <span className="text-[13px] font-black uppercase tracking-wider">{getTierInfo(selectedMatch.matchPercent).label} Match</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Scrollable Content */}
              <div className="flex-1 flex flex-col relative bg-card min-h-0">
                {/* Mobile Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
                  <div className="w-12 h-1.5 rounded-3xl bg-muted/60" />
                </div>

                {/* Desktop Close Button */}
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-muted items-center justify-center hover:bg-foreground hover:text-background transition-colors hidden md:flex z-50"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 md:py-12 custom-scrollbar">
                  {/* Hero Header (Mobile Only) */}
                  <div className="flex flex-col items-center gap-4 mb-10 md:hidden border-b border-border/40 pb-10">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-3xl border-2 border-primary/20 bg-muted overflow-hidden mx-auto">
                        <Image src={selectedMatch.avatar} alt="Avatar" fill className="object-cover" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-[26px] font-black leading-tight text-foreground">
                        {hasPaid ? selectedMatch.name : "High Compat Match"}
                      </h2>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-[14px] font-bold text-primary">Level {selectedMatch.level} • {selectedMatch.course}</span>
                        {selectedMatch.verified && <Check className="w-4 h-4 text-blue-500 stroke-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Identity Header (Desktop Only) */}
                  <div className="hidden md:block mb-10">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-[34px] font-black text-foreground tracking-tight">
                        {hasPaid ? selectedMatch.name : "High Compat Match"}
                      </h2>
                      {selectedMatch.verified && (
                        <div className="w-8 h-8 rounded-3xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                          <Check className="w-5 h-5 text-blue-500 stroke-5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[16px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Level {selectedMatch.level} • {selectedMatch.course}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-muted/30 border border-border/40 p-5 rounded-3xl text-center">
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[16px] font-extrabold text-foreground">{selectedMatch.verified ? "Verified" : "Unverified"}</p>
                    </div>
                    <div className="bg-muted/30 border border-border/40 p-5 rounded-3xl text-center">
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gender</p>
                      <p className="text-[16px] font-extrabold text-foreground">{selectedMatch.gender}</p>
                    </div>
                  </div>

                  {/* Compatibility Section */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[14px] font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary" /> Detailed Compatibility
                      </h3>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{selectedMatch.categoryScores.length} Dimensions</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {selectedMatch.categoryScores.map((cat, i) => (
                        <div key={i} className="bg-muted/30 border border-border/40 p-5 rounded-3xl flex flex-col gap-3 shadow-sm hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[15px] font-black text-foreground leading-none">{cat.name}</span>
                              <span className="text-[12px] font-semibold text-muted-foreground italic leading-tight mt-1">
                                &ldquo;{cat.insight}&rdquo;
                              </span>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg bg-background border border-border flex items-center justify-center`}>
                              <span className={`text-[14px] font-black ${getScoreLabel(cat.score)}`}>{cat.score}%</span>
                            </div>
                          </div>
                          <div className="w-full h-3 bg-card border border-border/40 rounded-sm overflow-hidden p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.score}%` }}
                              className={`h-full rounded-sm ${getScoreColor(cat.score)} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared Traits */}
                  <div className="w-full mb-6 text-left">
                    <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">What You Share</h3>
                    <div className="flex flex-col gap-2">
                      {selectedMatch.sharedTraits.map((t, i) => (
                        <div key={i} className="flex items-start gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
                          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-primary stroke-4" />
                          </div>
                          <span className="text-[14px] font-medium text-foreground leading-snug">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flagged Tensions */}
                  {selectedMatch.tensions.length > 0 && (
                    <div className="w-full mb-6 text-left">
                      <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">Points of Awareness</h3>
                      <div className="flex flex-col gap-2">
                        {selectedMatch.tensions.map((tension, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                            <Eye className="w-3.5 h-3.5 text-amber-500 mt-1 shrink-0" />
                            <span className="text-[13px] font-semibold text-foreground leading-snug">{tension}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio Section */}
                  <div className="w-full mb-8">
                    <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">About Me</h3>
                    {hasPaid ? (
                      <div className="bg-muted/30 p-5 rounded-3xl border border-border/40">
                        <p className="text-[15px] leading-relaxed text-foreground/90 font-medium italic">
                          &ldquo;{selectedMatch.bio}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="bg-muted/20 p-5 rounded-3xl border border-border/20 blur-[6px] grayscale saturate-0 pointer-events-none">
                          <p className="text-[15px] leading-relaxed opacity-20">
                            This is some blurred text that represents the bio of the user. Only unlocked accounts can read this profile bio and details. Standard security measures apply.
                          </p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-[1px] rounded-3xl">
                          <div className="flex flex-col items-center gap-2">
                            <Lock className="w-5 h-5 text-muted-foreground/60" />
                            <span className="text-[12px] font-bold text-muted-foreground">Unlock to read bio</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lifestyle Pillars */}
                  {hasPaid && (
                    <div className="w-full mb-10">
                      <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-4">Lifestyle Pillars</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selectedMatch.lifestyle.map((life, i) => {
                          const LifeIcon = life.icon;
                          return (
                            <div key={i} className="flex flex-row sm:flex-col items-center sm:items-start gap-3 p-4 bg-muted/30 border border-border/50 rounded-2xl">
                              <div className="w-8 h-8 rounded-3xl bg-card shadow-sm border border-border flex items-center justify-center shrink-0 text-primary">
                                <LifeIcon className="w-4 h-4" />
                              </div>
                              <span className="text-[13px] font-bold text-foreground leading-tight">{life.text}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="w-full flex flex-col gap-3 pb-6 md:pb-0">
                    {hasPaid ? (
                      <Link
                        href={`/dashboard/messages/${selectedMatch.id}`}
                        className="w-full py-4.5 rounded-3xl bg-primary text-primary-foreground font-black text-[16px] shadow-lg active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-5 h-5" /> Start Messaging
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMatch(null);
                          setIsPaymentModalOpen(true);
                        }}
                        className="w-full py-4.5 rounded-3xl bg-primary text-primary-foreground font-black text-[16px] shadow-lg active:scale-[0.98] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <Lock className="w-5 h-5" /> Unlock Matches for GHS 25
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportedMatch(null);
        }}
        reportedName={reportedMatch?.name || ''}
        reportedId={reportedMatch?.id || ''}
      />

      {currentDayNumber && (
        <FoundRoommateModal
          isOpen={isFoundRoommateModalOpen}
          onClose={() => {
            const PROMPT_SHOWN_KEY = 'roommate_prompt_shown';
            const promptShownStr = localStorage.getItem(PROMPT_SHOWN_KEY);
            const promptShownDays = promptShownStr ? JSON.parse(promptShownStr) : [];
            if (currentDayNumber && !promptShownDays.includes(currentDayNumber)) {
              localStorage.setItem(PROMPT_SHOWN_KEY, JSON.stringify([...promptShownDays, currentDayNumber]));
            }
            setIsFoundRoommateModalOpen(false);
            setCurrentDayNumber(null);
          }}
          onConfirm={handleFoundRoommateConfirm}
          dayNumber={currentDayNumber}
        />
      )}
    </div>
  );
}
