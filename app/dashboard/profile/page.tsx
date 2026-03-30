"use client";
import { User, Upload, Sparkles, Check, GraduationCap, Users, AlignLeft, X, ArrowLeft, ChevronRight, Flame, PauseCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { updateProfile } from '@/lib/auth-actions';
import { createClient } from '@/utils/supabase/client';

const avatars = {
  M: [
    { id: 'academic-m', src: '/avatars/male/The Academic_M.png', label: 'The Academic' },
    { id: 'athlete-m', src: '/avatars/male/The Athlete_M.png', label: 'The Athlete' },
    { id: 'creative-m', src: '/avatars/male/The Creative_M.png', label: 'The Creative' },
    { id: 'eco-m', src: '/avatars/male/The Eco-Conscious (Nature-Focused)_M.png', label: 'The Eco-Conscious' },
    { id: 'gamer-m', src: '/avatars/male/The Gamer (Tech)_M.png', label: 'The Gamer' },
    { id: 'minimalist-m', src: '/avatars/male/The Minimalist_M.png', label: 'The Minimalist' },
    { id: 'nightowl-m', src: '/avatars/male/The Night Owl_M.png', label: 'The Night Owl' },
    { id: 'socialite-m', src: '/avatars/male/The Socialite_M.png', label: 'The Socialite' },
  ],
  F: [
    { id: 'academic-f', src: '/avatars/female/The Academic_F.png', label: 'The Academic' },
    { id: 'athlete-f', src: '/avatars/female/The Athlete_F.png', label: 'The Athlete' },
    { id: 'creative-f', src: '/avatars/female/The Creative_F.png', label: 'The Creative' },
    { id: 'eco-f', src: '/avatars/female/The Eco-Conscious (Nature-Focused)_F.png', label: 'The Eco-Conscious' },
    { id: 'gamer-f', src: '/avatars/female/The Gamer (Tech)_F.png', label: 'The Gamer' },
    { id: 'minimalist-f', src: '/avatars/female/The Minimalist_F.png', label: 'The Minimalist' },
    { id: 'nightowl-f', src: '/avatars/female/The Night Owl_F.png', label: 'The Night Owl' },
    { id: 'socialite-f', src: '/avatars/female/The Socialite_F.png', label: 'The Socialite' },
  ]
};

export default function ProfilePage() {
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500' | '600' | null>(null);
  const [matchPref, setMatchPref] = useState<'same' | 'any' | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [course, setCourse] = useState('');
  const [bio, setBio] = useState('');
  const [matchingStatus, setMatchingStatus] = useState<'ACTIVE' | 'HIDDEN' | 'COMPLETED'>('ACTIVE');
  const [answeredCount, setAnsweredCount] = useState(0);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const STORAGE_KEY = 'roommate_profile_data';
  const ANSWERS_KEY = 'roommate_answers';

  // Load saved state from Database
  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) setDisplayName(profile.full_name);
          if (profile.phone_number) setPhone(profile.phone_number);
          if (profile.course) setCourse(profile.course);
          if (profile.level) setLevel(profile.level.toString() as any);
          if (profile.bio) setBio(profile.bio);
          if (profile.avatar_url) setSelectedAvatar(profile.avatar_url);
          if (profile.gender) {
            setGender(profile.gender === 'MALE' ? 'M' : 'F');
          }
          if (profile.gender_pref) {
            setMatchPref(profile.gender_pref === 'SAME_GENDER' ? 'same' : 'any');
          }
          if (profile.status) setMatchingStatus(profile.status as any);
        }
      }
    };

    fetchProfile();
  }, []);

  // Load saved state from localStorage (as fallback/backup)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (!gender && data.gender) setGender(data.gender);
        if (!level && data.level) setLevel(data.level);
        if (!matchPref && data.matchPref) setMatchPref(data.matchPref);
        if (!selectedAvatar && data.selectedAvatar) setSelectedAvatar(data.selectedAvatar);
        if (!displayName && data.displayName) setDisplayName(data.displayName);
        if (!course && data.course) setCourse(data.course);
        if (!bio && data.bio) setBio(data.bio);
        if (!phone && data.phone) setPhone(data.phone);
      } catch (e) { console.error("Error parsing profile data fallback"); }
    }
  }, [gender, level, matchPref, selectedAvatar, displayName, course, bio, phone]);

  // Save state on any change
  useEffect(() => {
    const data = { gender, level, matchPref, selectedAvatar, displayName, course, bio, matchingStatus };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [gender, level, matchPref, selectedAvatar, displayName, course, bio, matchingStatus]);

  // Load answered count from questionnaire
  useEffect(() => {
    const savedAnswers = localStorage.getItem(ANSWERS_KEY);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnsweredCount(Object.keys(parsed).length);
      } catch (e) {
        console.error('Error parsing answers count');
      }
    }
  }, []);

  const handleGenderChange = (selected: 'M' | 'F') => {
    if (gender !== selected) {
      setSelectedAvatar(null);
      setGender(selected);
    }
  };

  const isComplete = gender && level && matchPref && displayName.trim().length > 0 && phone.trim().length >= 10;

  const handleSave = async () => {
    if (!isComplete || isSaving) return;
    
    setIsSaving(true);
    const result = await updateProfile({
      fullName: displayName,
      phone,
      course,
      level: level || '100',
      bio,
      avatarUrl: selectedAvatar || '',
      gender: gender || 'M',
      matchPref: matchPref || 'any',
      matchingStatus
    });

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Profile saved to database!', {
        icon: <Check className="w-5 h-5 text-white" />
      });
      router.push('/profile/review');
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full min-h-screen bg-background pb-32">
      <div className="flex flex-col px-5 pt-8 pb-32 w-full md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto">

        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="p-4 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors group active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-foreground leading-tight">
              Profile Setup
            </h1>
            <p className="text-[14px] font-medium text-muted-foreground mt-1">
              {isComplete ? 'Your profile is ready for review' : 'Complete your basic info to proceed'}
            </p>
          </div>
          <div className="ml-auto">
             <button
               onClick={() => router.push('/profile/review')}
               className="px-4 py-2 rounded-2xl border border-border bg-card hover:bg-muted text-[13px] font-bold text-foreground transition-all active:scale-95 flex items-center gap-2"
             >
               Review
             </button>
          </div>
        </header>

        {/* Visual Identity Section */}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={() => gender && setIsAvatarModalOpen(true)}
            className={`w-28 h-28 rounded-3xl bg-card border-4 border-background shadow-lg flex items-center justify-center relative overflow-hidden group active:scale-95 transition-transform ${!gender ? 'opacity-40 grayscale hover:scale-100 cursor-not-allowed' : ''}`}
          >
            {selectedAvatar ? (
              selectedAvatar.startsWith('data:') ? (
                <img src={selectedAvatar} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image src={selectedAvatar} alt="Avatar" fill className="object-cover" />
              )
            ) : (
              <User className="w-12 h-12 text-muted-foreground/30" />
            )}
            {gender && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            )}
          </button>
          <button
            onClick={() => gender && setIsAvatarModalOpen(true)}
            className={`mt-4 px-5 py-2 rounded-2xl bg-primary/10 text-[13px] font-bold text-primary transition-all active:scale-95 ${!gender ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/20'}`}
          >
            {selectedAvatar ? 'Change Avatar' : gender ? 'Choose Avatar' : 'Select gender first'}
          </button>
        </div>

        {/* Form Sections (Matching Settings Style) */}
        <div className="flex flex-col gap-10">

          {/* Core Info */}
          <section>
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Core Information</h2>
            <div className="bg-card rounded-4xl shadow-sm border border-border flex flex-col p-4 sm:p-5 gap-5">

              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Michael"
                  className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3.5 text-foreground font-medium outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 054 123 4567"
                  className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3.5 text-foreground font-medium outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
                <p className="text-[11px] font-medium text-muted-foreground/60 px-1 mt-1 leading-relaxed">
                  <span className="text-primary font-bold">Privacy Note:</span> Your phone number is <span className="text-foreground">never shared</span> with matches. We use it only for critical updates and rewards. <Link href="/privacy" className="text-primary underline hover:text-foreground transition-colors">Read full policy</Link>.
                </p>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Biological Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['M', 'F'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenderChange(g)}
                      className={`py-3.5 rounded-2xl border-2 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all
                        ${gender === g
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                        }`}
                    >
                      {gender === g && <Check className="w-4 h-4" />}
                      {g === 'M' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Preference */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Roommate Gender Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['same', 'any'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setMatchPref(p)}
                      className={`py-3.5 rounded-2xl border-2 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all
                        ${matchPref === p
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                        }`}
                    >
                      {matchPref === p && <Check className="w-4 h-4" />}
                      {p === 'same' ? 'Same Gender' : 'Any Gender'}
                    </button>
                  ))}
                </div>
              </div>


              {/* Bio */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1 flex items-center justify-between">
                  Short Bio <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Optional</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="2-3 sentences about your lifestyle vibe..."
                  rows={3}
                  className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3.5 text-foreground font-medium outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px] resize-none shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
              </div>

            </div>
          </section>

          {/* Academic Info */}
          <section>
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Academics</h2>
            <div className="bg-card rounded-4xl shadow-sm border border-border flex flex-col p-4 sm:p-5 gap-5">

              {/* Course */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Programme of Study</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Sc. Computer Science"
                  className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3.5 text-foreground font-medium outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
              </div>

              {/* Academic Level */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-foreground pl-1">Current Level</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {['100', '200', '300', '400', '500', '600'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l as any)}
                      className={`py-3 rounded-xl border-2 font-bold text-[14px] active:scale-[0.98] transition-all
                        ${level === l
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Matching Status (Success Flow) */}
          <section>
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Matching Status</h2>
            <div className="bg-card rounded-4xl shadow-sm border border-border flex flex-col p-4 sm:p-5 gap-4">
              <p className="text-[13px] text-muted-foreground font-medium px-1">
                Control your visibility in the compatibility pool. You can pause or mark as complete anytime.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setMatchingStatus('ACTIVE')}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-3xl border-2 transition-all active:scale-[0.98]
                    ${matchingStatus === 'ACTIVE'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 bg-background hover:border-foreground/10'}`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${matchingStatus === 'ACTIVE' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`font-bold text-[14px] sm:text-[15px] ${matchingStatus === 'ACTIVE' ? 'text-primary' : 'text-foreground'}`}>Actively Searching</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">Profile is visible and finding new matches</span>
                  </div>
                </button>

                <button
                  onClick={() => setMatchingStatus('HIDDEN')}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-3xl border-2 transition-all active:scale-[0.98]
                    ${matchingStatus === 'HIDDEN'
                      ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                      : 'border-border/60 bg-background hover:border-foreground/10'}`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${matchingStatus === 'HIDDEN' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <PauseCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`font-bold text-[14px] sm:text-[15px] ${matchingStatus === 'HIDDEN' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>Talking to Matches (Paused)</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">Hidden from new matches while you connect</span>
                  </div>
                </button>

                <button
                  onClick={() => setMatchingStatus('COMPLETED')}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-3xl border-2 transition-all active:scale-[0.98]
                    ${matchingStatus === 'COMPLETED'
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                      : 'border-border/60 bg-background hover:border-foreground/10'}`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${matchingStatus === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`font-bold text-[14px] sm:text-[15px] ${matchingStatus === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>Success! Match Found</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">Profile permanently hidden from the matching pool</span>
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {matchingStatus === 'COMPLETED' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-emerald-500 rounded-3xl mt-2 flex items-center gap-4 shadow-lg shadow-emerald-500/20"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[14px] font-extrabold text-white">Congratulations!</span>
                      <span className="block text-[12px] font-medium text-white/90">Good luck with your new roommate!</span>
                    </div>
                  </motion.div>
                )}
                {matchingStatus === 'HIDDEN' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-amber-500/10 rounded-3xl mt-2 flex items-start gap-3 border border-amber-500/20">
                      <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[12.5px] font-medium text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                        Algorithm matching is on pause. You will not appear in new recommendations, but can continue chatting with existing matches. Choose <b>Actively Searching</b> when you are ready to match again.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Save Button */}
          <div className="mt-4 mb-8">
            <button
              onClick={handleSave}
              disabled={!isComplete || isSaving}
              className={`w-full py-4.5 rounded-3xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isComplete && !isSaving
                ? 'bg-foreground text-background shadow-lg hover:scale-[1.02]'
                : 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
            >
              {isSaving ? 'Saving to Campus...' : 'Confirm & Review Profile'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Review Answers Link - Only show when questionnaire is complete */}
          {answeredCount === 40 && (
            <div className="mt-3 mb-8">
              <button
                onClick={() => router.push('/dashboard/review')}
                className="w-full py-3.5 rounded-3xl border border-border bg-card hover:bg-muted/50 font-bold text-[14px] text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                Review Your Answers
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Avatar Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && gender && (
          <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[680px] max-w-full bg-card border-t md:border border-border rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[92vh] flex flex-col"
            >
              {/* Drag Handle (Mobile) */}
              <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
                <div className="w-12 h-1.5 rounded-full bg-muted/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-[18px] font-bold text-foreground leading-tight">Choose Avatar</h2>
                  <p className="text-[12px] text-muted-foreground font-medium mt-0.5">Select a character for your profile</p>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 pb-10">
                {/* Hidden file input for custom upload */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = new window.Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const MAX_WIDTH = 400;
                          const MAX_HEIGHT = 400;
                          let width = img.width;
                          let height = img.height;

                          if (width > height) {
                            if (width > MAX_WIDTH) {
                              height *= MAX_WIDTH / width;
                              width = MAX_WIDTH;
                            }
                          } else {
                            if (height > MAX_HEIGHT) {
                              width *= MAX_HEIGHT / height;
                              height = MAX_HEIGHT;
                            }
                          }

                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // 1. Compress to Blob
                            canvas.toBlob(async (blob) => {
                              if (!blob) return;
                              
                              setIsUploading(true);
                              const supabase = createClient();
                              const { data: { user } } = await supabase.auth.getUser();
                              
                              if (!user) {
                                toast.error("Please sign in to upload photos");
                                setIsUploading(false);
                                return;
                              }

                              // 2. Upload to Supabase Storage
                              const fileName = `${user.id}/${Date.now()}.jpg`;
                              const { data: uploadData, error: uploadError } = await supabase
                                .storage
                                .from('avatars')
                                .upload(fileName, blob, {
                                  contentType: 'image/jpeg',
                                  upsert: true
                                });

                              if (uploadError) {
                                console.error("Upload error:", uploadError);
                                toast.error("Failed to upload photo to storage");
                                setIsUploading(false);
                                return;
                              }

                              // 3. Get Public URL
                              const { data: { publicUrl } } = supabase
                                .storage
                                .from('avatars')
                                .getPublicUrl(fileName);

                              setSelectedAvatar(publicUrl);
                              setIsUploading(false);
                              setIsAvatarModalOpen(false);
                              toast.success("Photo uploaded successfully!");
                            }, 'image/jpeg', 0.8);
                          }
                        };
                        img.src = event.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  {/* Upload Your Own — first card */}
                  <label
                    htmlFor="avatar-upload"
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 border-dashed border-border/60 bg-muted/30 transition-all cursor-pointer active:scale-[0.97] ${isUploading ? 'opacity-50 cursor-wait' : 'hover:border-primary/40 hover:bg-primary/5'}`}
                  >
                    <div className="w-24 h-24 rounded-3xl border-[3px] border-transparent bg-muted/60 flex items-center justify-center relative overflow-hidden">
                      {isUploading ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                           <span className="text-[10px] font-bold text-primary">Uploading</span>
                         </div>
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <span className="text-[13px] font-bold text-center leading-tight text-muted-foreground px-1">
                      {isUploading ? 'Processing...' : 'Upload Photo'}
                    </span>
                  </label>

                  {avatars[gender].map((avatar: any) => (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setSelectedAvatar(avatar.src);
                        setIsAvatarModalOpen(false);
                      }}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 active:scale-[0.97] transition-all
                        ${selectedAvatar === avatar.src
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border/60 bg-background hover:border-foreground/20'
                        }`}
                    >
                      <div className={`w-24 h-24 rounded-3xl border-[3px] bg-muted relative overflow-hidden transition-all shadow-sm
                        ${selectedAvatar === avatar.src ? 'border-primary' : 'border-transparent'}`}>
                        <Image src={avatar.src} alt={avatar.label} fill className="object-cover" />
                      </div>
                      <span className="text-[13px] font-bold text-center leading-tight text-foreground px-1">
                        {avatar.label}
                      </span>
                      {selectedAvatar === avatar.src && (
                        <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 text-primary-foreground stroke-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
