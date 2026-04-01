import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Upload, ChevronRight, PauseCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

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
}

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [gender, setGender] = useState<'M' | 'F' | null>(null)
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500' | '600' | null>(null)
  const [matchPref, setMatchPref] = useState<'same' | 'any' | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [course, setCourse] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [matchingStatus, setMatchingStatus] = useState<'ACTIVE' | 'HIDDEN' | 'COMPLETED'>('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const STORAGE_KEY = 'roommate_profile_data'
  const ANSWERS_KEY = 'roommate_answers'

  // Standard React mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load saved state from Database
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        if (profile.full_name) setDisplayName(profile.full_name)
        if (profile.phone_number) setPhone(profile.phone_number)
        if (profile.course) setCourse(profile.course)
        if (profile.level) setLevel(profile.level.toString() as any)
        if (profile.bio) setBio(profile.bio)
        if (profile.avatar_url) setSelectedAvatar(profile.avatar_url)
        if (profile.gender) {
          setGender(profile.gender === 'MALE' ? 'M' : 'F')
        }
        if (profile.gender_pref) {
          setMatchPref(profile.gender_pref === 'SAME_GENDER' ? 'same' : 'any')
        }
        if (profile.status) setMatchingStatus(profile.status as any)
      }
    }

    fetchProfile()
  }, [user])

  // Save state on any change
  useEffect(() => {
    const data = { gender, level, matchPref, selectedAvatar, displayName, course, bio, matchingStatus }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [gender, level, matchPref, selectedAvatar, displayName, course, bio, matchingStatus])

  // Load answered count from questionnaire
  useEffect(() => {
    const savedAnswers = localStorage.getItem(ANSWERS_KEY)
    if (savedAnswers) {
      try {
        // Just verify it's valid JSON
        JSON.parse(savedAnswers)
      } catch (e) {
        console.error('Error parsing answers:', e)
      }
    }
  }, [])

  const handleGenderChange = (selected: 'M' | 'F') => {
    if (gender !== selected) {
      setSelectedAvatar(null)
      setGender(selected)
    }
  }

  const isComplete = gender && level && matchPref && displayName.trim().length > 0 && phone.trim().length >= 10

  const handleSave = async () => {
    if (!isComplete || isSaving || !user) return

    setIsSaving(true)
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      const profileData: any = {
        full_name: displayName,
        phone_number: phone,
        course: course || '100',
        bio,
        avatar_url: selectedAvatar || '',
        gender: gender === 'M' ? 'MALE' : 'FEMALE',
        gender_pref: matchPref === 'same' ? 'SAME_GENDER' : 'ANY_GENDER',
        status: matchingStatus
      }

      if (existingProfile) {
        const { error } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', existingProfile.id)

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Profile saved!')
          navigate('/dashboard')
        }
      } else {
        const { error } = await supabase
          .from('users')
          .insert({
            auth_id: user.id,
            ...profileData
          })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Profile saved!')
          navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error('Failed to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col w-full min-h-screen bg-background pb-32">
      <div className="flex flex-col px-5 pt-8 pb-32 w-full md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto">

        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-4 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors group active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col text-left">
            <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-foreground leading-tight">
              Profile Setup
            </h1>
            <p className="text-[14px] font-medium text-muted-foreground mt-1">
              {isComplete ? 'Your profile is ready for review' : 'Complete your basic info to proceed'}
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-2xl border border-border bg-card hover:bg-muted text-[13px] font-bold text-foreground transition-all active:scale-95 flex items-center gap-2"
            >
              Review
            </button>
          </div>
        </header>

        {/* Visual Identity Section */}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={() => gender && setSelectedAvatar(gender === 'F' ? avatars.F[0].src : avatars.M[0].src)}
            className={`w-28 h-28 rounded-3xl bg-card border-4 border-background shadow-lg flex items-center justify-center relative overflow-hidden group transition-all ${!gender ? 'opacity-40 grayscale hover:scale-100 cursor-not-allowed' : ''}`}
          >
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
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
            onClick={() => gender && setSelectedAvatar(gender === 'F' ? avatars.F[0].src : avatars.M[0].src)}
            className={`mt-4 px-8 py-4 rounded-2xl bg-primary/10 text-[14px] font-black text-primary transition-all active:scale-95 shadow-sm ${!gender ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/20'}`}
          >
            {selectedAvatar ? 'Change Avatar' : gender ? 'Choose Avatar' : 'Select gender first'}
          </button>
        </div>

        {/* Form Sections */}
        <div className="flex flex-col gap-10">
          <section className="text-left">
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Core Information</h2>
            <div className="bg-card rounded-4xl shadow-sm border border-border flex flex-col p-4 sm:p-5 gap-5">
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
                  <span className="text-primary font-bold">Privacy Note:</span> Your phone number is <span className="text-foreground">never shared</span> with matches. We use it only for critical updates and rewards. <span className="text-primary underline cursor-pointer" onClick={() => navigate('/privacy')}>Read full policy</span>.
                </p>
              </div>

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
                      {g === 'M' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

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
                      {p === 'same' ? 'Same Gender' : 'Any Gender'}
                    </button>
                  ))}
                </div>
              </div>

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

          <section className="text-left">
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Matching Status</h2>
            <div className="bg-card rounded-4xl shadow-sm border border-border flex flex-col p-4 sm:p-5 gap-4">
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setMatchingStatus('ACTIVE')}
                  className={`
                    relative w-full p-8 rounded-[2rem] border-2 text-left transition-all duration-300 group
                    ${matchingStatus === 'ACTIVE' 
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-4 ring-primary/5' 
                      : 'border-border/40 bg-card hover:border-primary/40 hover:bg-muted/30'}
                  `}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${matchingStatus === 'ACTIVE' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`font-bold text-[14px] sm:text-[15px] ${matchingStatus === 'ACTIVE' ? 'text-primary' : 'text-foreground'}`}>Actively Searching</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">Profile is visible in searches</span>
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
                    <span className={`font-bold text-[14px] sm:text-[15px] ${matchingStatus === 'HIDDEN' ? 'text-amber-600' : 'text-foreground'}`}>Talking to Matches (Paused)</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">Hidden while you talk to friends</span>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <div className="mt-4 mb-8">
            <button
              onClick={handleSave}
              disabled={!isComplete || isSaving}
              className={`premium-btn w-full flex items-center justify-center gap-3 transition-all ${isComplete && !isSaving
                ? 'bg-foreground text-background shadow-2xl hover:scale-[1.02]'
                : 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
            >
              {isSaving ? 'Directing to Campus...' : 'Confirm & Review Profile'} <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay — Solve 'messy' continuous submits */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center px-6 text-center"
          >
            <div className="relative mb-10">
              <div className="w-24 h-24 rounded-4xl bg-primary/10 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="absolute -inset-6 rounded-full border-2 border-primary/20 animate-ping opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-foreground">Securing Identity</h3>
            <p className="mt-3 text-[13px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Profile to Database...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
