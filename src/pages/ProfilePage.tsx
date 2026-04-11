import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Upload, Check, ChevronRight, Sparkles, ShieldCheck, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { ModalShell } from '../components/ui/ModalShell'
import { TopHeader } from '../components/layout/TopHeader'
import { FormInput } from '../components/ui/FormInput'
import { PillToggle } from '../components/ui/PillToggle'
import DrawingHouseLoader from '../components/ui/DrawingHouseLoader'

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

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ])
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000,
  onRetry?: (attempt: number) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    onRetry?.(retries);
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2, onRetry); // Exponential backoff
  }
}

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const STORAGE_KEY = 'roommate_profile_data'

  // Hydrate synchronously to avoid effect race conditions overwriting data
  const getInitial = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }
  const initialState = getInitial()

  const [gender, setGender] = useState<'M' | 'F' | null>(initialState.gender || null)
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500' | '600' | null>(initialState.level || null)
  const [matchPref, setMatchPref] = useState<'same' | 'any' | null>(initialState.matchPref || null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialState.selectedAvatar || null)
  const [displayName, setDisplayName] = useState(initialState.displayName || '')
  const [course, setCourse] = useState(initialState.course || '')
  const [bio, setBio] = useState(initialState.bio || '')
  const [matchingStatus, setMatchingStatus] = useState<string>(initialState.matchingStatus || 'ACTIVE')
  const [phone, setPhone] = useState(initialState.phone || '')
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncStep, setSyncStep] = useState(0) // 0: Handshake, 1: Verification, 2: Finalizing
  const [syncProgress, setSyncProgress] = useState(0)
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [hasVerified, setHasVerified] = useState(false)
  const [mounted, setMounted] = useState(false)



  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
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
      if (profile.status) setMatchingStatus(profile.status)

      // Async check for questionnaire completion
      supabase
        .from('questionnaire_responses')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle()
        .then(({ data, error }) => setHasQuestionnaire(!error && !!data))
    }
  }, [profile])

  useEffect(() => {
    const data = { displayName, phone, course, bio, matchingStatus, gender, level, matchPref, selectedAvatar }
    // Only save to localStorage if there's actually data to prevent wiping it randomly
    if (displayName || gender || phone || course) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [mounted, displayName, phone, course, bio, matchingStatus, gender, level, matchPref, selectedAvatar])

  const handleGenderChange = (selected: 'M' | 'F') => {
    if (gender !== selected) {
      setSelectedAvatar(null)
      setGender(selected)
    }
  }

  const isComplete = gender && level && matchPref && displayName.trim().length > 0 && phone.trim().length >= 10
  const isGenderLocked = !!profile?.gender
  const isPrefLocked = !!profile?.gender_pref

  const handleSave = async (isConfirmed = false) => {
    if (!isComplete || isSaving || !user) return

    // Show confirmation modal for the FIRST sync of critical identity data
    if (!isGenderLocked && !isConfirmed) {
      setHasVerified(false)
      setIsConfirmModalOpen(true)
      return
    }

    setIsConfirmModalOpen(false)

    setIsSaving(true)
    setSaveError(null)

    try {
      const profileId = profile?.id || null

      const profileData: any = {
        full_name: displayName,
        phone_number: phone,
        course: course,
        level: parseInt(level as string) || null,
        bio: bio,
        avatar_url: selectedAvatar || '',
        // Only write gender/pref when user has explicitly chosen them (DB is now nullable)
        ...(gender !== null && { gender: gender === 'M' ? 'MALE' : 'FEMALE' }),
        ...(matchPref !== null && { gender_pref: matchPref === 'same' ? 'SAME_GENDER' : 'ANY_GENDER' }),
        status: matchingStatus
      }

      // Track if matching-relevant fields changed (for existing profiles)
      const matchFieldsChanged = profileId && profile && (
        profileData.gender !== profile.gender ||
        profileData.gender_pref !== profile.gender_pref ||
        profileData.status !== profile.status
      )

      const performSync = async () => {
        // Step 1: Handshake
        setSyncStep(0)
        setSyncProgress(25)

        if (profileId) {
          const { error } = await withTimeout(
            supabase.from('users').update(profileData).eq('id', profileId),
            15000,
            "Update timed out. Reconnecting..."
          )
          if (error) throw error
        } else {
          const { error } = await withTimeout(
            supabase.from('users').insert({
              auth_id: user.id,
              email: user.email || `university_mail_${Date.now()}@stu.ucc.edu.gh`,
              ...profileData
            }),
            10000,
            "Insertion timed out. Reconnecting..."
          )
          if (error) throw error
        }

        // Step 2: Verification
        setSyncStep(1)
        setSyncProgress(60)
        await refreshProfile(true)

        // Step 3: Finalizing
        setSyncStep(2)
        setSyncProgress(100)

        // Boutique delay for visual confirmation
        await new Promise(r => setTimeout(r, 800))
      }

      await withRetry(
        performSync,
        3,
        2000,
        (attempt) => toast.info(`Sync Interrupted. Reconnecting... (Attempt ${4 - attempt}/3)`)
      )

      // If matching-relevant fields changed, trigger match recalculation in background
      if (matchFieldsChanged && profileId && hasQuestionnaire) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ userId: profileId })
            }).catch(() => { }) // Fire-and-forget, don't block navigation
            toast.info('Recalculating your matches with updated preferences...')
          }
        } catch {
          // Silent fail — matches will update on next manual recalc
        }
      }

      navigate('/dashboard')
    } catch (error: any) {
      console.error("RAW SYNCHRONIZATION ERROR:", error);
      setSaveError(error.message || JSON.stringify(error) || 'Sync failed. Retry required.')
      toast.error(`Sync Failed: ${error.message || 'Network issue'}`, { duration: 8000 })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 1000 * 1024) {
      toast.error('File too large (1MB Max).')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const fileName = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await withTimeout(
        supabase.storage.from('avatars').upload(fileName, file, { contentType: file.type, upsert: true }),
        45000,
        "Upload timed out."
      )

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setSelectedAvatar(publicUrl)
      setIsAvatarModalOpen(false)
      toast.success('Visual ID Updated!')
    } catch (error: any) {
      toast.error(error.message || 'Upload failed.')
    } finally {
      setIsSaving(false)
    }
  }

  // Zero-Flash Mounting: Removed the !mounted return to prevent layout shift during transit

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader title="Profile Hub" showBackButton />

      <div className="flex-1 overflow-y-auto w-full md:max-w-2xl lg:max-w-3xl mx-auto px-4 pt-6 pb-32">

        {/* Identity Section */}
        <div className="flex flex-col items-center pt-2 pb-8">
          <div className="relative mb-3 group">
            <div className={`w-20 h-20 bg-indigo-50 rounded-boutique flex items-center justify-center border-4 border-white shadow-sm overflow-hidden relative transition-all ${!gender ? 'opacity-40 grayscale animate-pulse' : 'hover:ring-4 hover:ring-indigo-100'
              }`}>
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-indigo-400" />
              )}
              {gender && (
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            {gender && <div className="absolute bottom-1 right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-[6px] shadow-sm" />}
          </div>
          <h2 className="text-xl font-bold text-foreground">{displayName || 'User Identity'}</h2>

          <button
            onClick={() => gender && setIsAvatarModalOpen(true)}
            disabled={!gender}
            className={`mt-3 px-8 py-3 bg-foreground text-background rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${!gender ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'
              }`}
          >
            Refresh Identity
          </button>
        </div>

        <div className="space-y-6">

          {/* Institutional Creds */}
          <section>
            <h3 className="px-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Institutional Creds</h3>
            <div className="bg-card rounded-boutique shadow-sm border border-border p-6 space-y-6">
              <FormInput
                id="course"
                label="Academic Programme"
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Information Technology"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2.5 block">Current Level</label>
                <PillToggle
                  options={[
                    { value: '100', label: '100' },
                    { value: '200', label: '200' },
                    { value: '300', label: '300' },
                    { value: '400', label: '400' },
                    { value: '500', label: '500' },
                    { value: '600', label: '600' },
                  ]}
                  value={level || ''}
                  onChange={(val) => setLevel(val as any)}
                />
              </div>
            </div>
          </section>

          {/* Personal Details */}
          <section>
            <h3 className="px-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Personal Details</h3>
            <div className="bg-card rounded-boutique shadow-sm border border-border overflow-hidden">

              <div className="px-5 py-4 border-b border-border">
                <FormInput
                  id="displayName"
                  label="Full Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="px-5 py-4 border-b border-border">
                <FormInput
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 054 165 1298"
                />
                <div className="mt-3 bg-muted/30 border border-border/40 rounded-xl p-4 flex items-start">
                  <Check size={16} className="text-primary mt-0.5 mr-3 shrink-0" />
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed font-bold">
                    <span className="text-foreground font-black">POLICY NOTE:</span> YOUR NUMBER IS ENCRYPTED AND USED ONLY FOR CRITICAL ROOMMATE MATCHES.
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-border">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-muted-foreground">Short Bio</label>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-extrabold">Optional</span>
                </div>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground/40 resize-y min-h-[80px] max-h-[200px]"
                />
              </div>

              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-muted-foreground">Biological Gender</span>
                  {isGenderLocked ? (
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <ShieldCheck size={10} strokeWidth={3} /> Identity Sealed
                    </span>
                  ) : !gender ? (
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1 animate-pulse">
                      ● Required to match
                    </span>
                  ) : null}
                </div>

                {isGenderLocked ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/25 rounded-xl shrink-0 shadow-sm">
                    <ShieldCheck size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                    <span className="text-xs font-black text-primary">{gender === 'M' ? 'Male' : 'Female'}</span>
                    <span className="ml-1 text-[9px] font-extrabold uppercase tracking-widest text-primary/60 border border-primary/20 bg-primary/10 px-1.5 py-0.5 rounded-md">Sealed</span>
                  </div>
                ) : (
                  <div className="flex bg-muted p-1.5 rounded-xl border border-border/50 shadow-inner shrink-0">
                    {(['M', 'F'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleGenderChange(opt)}
                        className={`px-5 py-2 flex-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${gender === opt
                          ? 'bg-card text-primary shadow-md border border-border/80'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {gender === opt && <Check size={13} className="stroke-[3]" />} {opt === 'M' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-muted-foreground">Roommate Preference</span>
                  {isPrefLocked ? (
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <ShieldCheck size={10} strokeWidth={3} /> Priority Sealed
                    </span>
                  ) : !matchPref ? (
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1 animate-pulse">
                      ● Required to match
                    </span>
                  ) : null}
                </div>

                {isPrefLocked ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/25 rounded-xl shrink-0 shadow-sm">
                    <ShieldCheck size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                    <span className="text-xs font-black text-primary">{matchPref === 'same' ? 'Same Sex' : 'Any Sex'}</span>
                    <span className="ml-1 text-[9px] font-extrabold uppercase tracking-widest text-primary/60 border border-primary/20 bg-primary/10 px-1.5 py-0.5 rounded-md">Sealed</span>
                  </div>
                ) : (
                  <div className="flex bg-muted p-1.5 rounded-xl border border-border/50 shadow-inner shrink-0">
                    {(['same', 'any'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setMatchPref(opt)}
                        className={`px-5 py-2 flex-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${matchPref === opt
                          ? 'bg-card text-primary shadow-md border border-border/80'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {matchPref === opt && <Check size={13} className="stroke-[3]" />} {opt === 'same' ? 'Same Sex' : 'Any Sex'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Network Status */}
          <section>
            <h3 className="px-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Network Status</h3>
            <div className="bg-card rounded-boutique shadow-sm border border-border p-3 space-y-3">

              {(['ACTIVE', 'HIDDEN', 'COMPLETED'] as const).map((status) => {
                const isActive = matchingStatus === status
                const colorMap = {
                  ACTIVE: { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary', sub: 'text-primary/70', iconBg: 'bg-primary' },
                  HIDDEN: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', sub: 'text-blue-500', iconBg: 'bg-blue-500' },
                  COMPLETED: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', sub: 'text-emerald-500', iconBg: 'bg-emerald-500' }
                }
                const current = colorMap[status]

                return (
                  <button
                    key={status}
                    onClick={() => setMatchingStatus(status)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all border ${isActive ? `${current.bg} ${current.border}` : 'bg-transparent border-transparent hover:bg-muted/50'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 ${isActive ? `${current.iconBg} text-white shadow-sm` : 'bg-muted text-muted-foreground'
                      }`}>
                      {status === 'ACTIVE' && <User size={20} />}
                      {status === 'HIDDEN' && <Check size={20} />}
                      {status === 'COMPLETED' && <Sparkles size={20} />}
                    </div>
                    <div className="text-left flex-1">
                      <h4 className={`text-sm font-bold ${isActive ? current.text : 'text-foreground'}`}>
                        {status === 'ACTIVE' ? 'Actively Searching' : status === 'HIDDEN' ? 'Talking (Hidden)' : 'Match Found!'}
                      </h4>
                      <p className={`text-[10px] font-extrabold uppercase tracking-widest mt-0.5 ${isActive ? current.sub : 'text-muted-foreground/60'}`}>
                        {status === 'ACTIVE' ? 'Visible to campus pool' : status === 'HIDDEN' ? 'Hidden from searches' : 'Deactivate matching'}
                      </p>
                    </div>
                    {isActive && (
                      <div className={`w-5 h-5 ${current.iconBg} rounded-[6px] flex items-center justify-center shadow-sm`}>
                        <Check size={12} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Big Action Button */}
          <div className="mt-8 mb-24">
            <button
              onClick={() => handleSave()}
              disabled={!isComplete || isSaving}
              className={`w-full py-6 rounded-boutique flex items-center justify-center gap-3 shadow-md transition-all duration-500 active:scale-[0.96] relative overflow-hidden group ${!isComplete || isSaving
                ? 'bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/40'
                : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:shadow-xl'
                }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                  {isSaving ? 'Syncing...' : 'Secure Node'}
                </span>
                <span className="text-[16px] font-black leading-tight">
                  Synchronize Identity
                </span>
              </div>
              {!isSaving && <Sparkles size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
            </button>

            {/* Questionnaire Action Button */}
            {hasQuestionnaire !== null && (
              <button
                onClick={() => navigate(hasQuestionnaire ? '/questionnaire/review' : '/questionnaire')}
                className="w-full mt-4 h-[64px] rounded-boutique flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group active:scale-[0.98]"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[14px] font-black text-slate-800 transition-colors group-hover:text-indigo-600">
                    {hasQuestionnaire ? 'Review My Match Responses' : 'Start Campus DNA Questionnaire'}
                  </span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ModalShell
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Institutional Character"
        subtitle="Secure your visual identity on the network"
        maxWidth="md:w-[820px]"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 pb-10 pt-4">
          <button
            onClick={() => document.getElementById('avatar-upload')?.click()}
            className="flex flex-col items-center justify-center gap-5 p-6 rounded-[22px] border-2 border-dashed border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-95 aspect-square"
          >
            <div className="w-14 h-14 rounded-[22px] bg-foreground text-background flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-widest text-center">Snapshot Hub</span>
          </button>

          {gender && (gender === 'M' ? avatars.M : avatars.F).map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => { setSelectedAvatar(avatar.src); setIsAvatarModalOpen(false); }}
              className={`flex flex-col items-center gap-4 p-4 rounded-[22px] border-2 transition-all hover:scale-[1.03] active:scale-95 group
                ${selectedAvatar === avatar.src
                  ? 'border-primary bg-primary/5'
                  : 'border-border/40 hover:border-foreground/20 bg-card shadow-sm'
                }`}
            >
              <div className="w-full aspect-square rounded-[22px] overflow-hidden mb-1 ring-1 ring-border/20">
                <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-[0.1em] text-center opacity-60 ${selectedAvatar === avatar.src ? 'text-primary opacity-100' : ''}`}>
                {avatar.label.split('The ')[1] || avatar.label}
              </span>
            </button>
          ))}
        </div>
        <input type="file" accept="image/*" className="hidden" id="avatar-upload" onChange={handleAvatarUpload} />
      </ModalShell>

      <ModalShell
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Permanent Identity Lock"
        subtitle="Read carefully — this cannot be undone"
        maxWidth="max-w-[92%] md:max-w-md"
      >
        <div className="flex flex-col items-center p-5 text-center gap-4">

          {/* Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h4 className="text-xl font-black text-foreground tracking-tight">This Is Your One Chance</h4>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-sm">
              Your <span className="text-foreground font-black">Gender</span> and <span className="text-foreground font-black">Roommate Preference</span> will be <span className="text-primary font-black">permanently sealed</span> after this sync. They cannot be changed — not by you, not by support.
            </p>
          </div>

          {/* Preview of what they selected */}
          <div className="w-full bg-muted/50 border border-border rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">You are sealing</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Biological Gender</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
                <ShieldCheck size={11} className="text-primary" strokeWidth={3} />
                <span className="text-xs font-black text-primary">{gender === 'M' ? 'Male' : 'Female'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Roommate Preference</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
                <ShieldCheck size={11} className="text-primary" strokeWidth={3} />
                <span className="text-xs font-black text-primary">{matchPref === 'same' ? 'Same Sex' : 'Any Sex'}</span>
              </div>
            </div>
          </div>

          {/* Verification checkbox */}
          <label className="w-full flex items-start gap-3 cursor-pointer text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors group">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={hasVerified}
                onChange={(e) => setHasVerified(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
            </div>
            <span className="text-[12px] font-bold text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
              I have verified the above selections. I understand they are <span className="text-foreground font-black">permanent</span> and cannot be changed after this sync.
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => handleSave(true)}
              disabled={!hasVerified}
              className={`w-full py-4 font-black text-sm rounded-[22px] shadow-xl transition-all uppercase tracking-widest ${
                hasVerified
                  ? 'bg-foreground text-background hover:opacity-90 active:scale-95'
                  : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              Seal & Synchronize Identity
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="w-full py-4 bg-transparent text-muted-foreground font-bold text-sm rounded-[22px] hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
            >
              Wait, let me review
            </button>
          </div>
        </div>
      </ModalShell>

      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md flex flex-col items-center justify-center px-6"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center">
                <DrawingHouseLoader />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-indigo-600/20 animate-ping opacity-20" />
            </div>

            <h3 className="mt-8 text-[18px] font-black text-slate-900 tracking-tight">Securing Identity</h3>

            <div className="relative w-48 h-1.5 bg-muted rounded-full overflow-hidden border border-border/40 mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                className="absolute inset-y-0 left-0 bg-primary"
              />
            </div>

            {!saveError ? (
              <p className="mt-2 text-[13px] font-medium text-slate-500 animate-pulse">Syncing with campus records...</p>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-center">
                <p className="max-w-xs text-center text-[13px] font-bold text-red-500 mb-6 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                  {saveError}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSave()}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
                  >
                    Retry Sync
                  </button>
                  <button
                    onClick={() => { setIsSaving(false); setSaveError(null); }}
                    className="px-6 py-2.5 bg-card text-foreground hover:bg-muted hover:text-foreground rounded-xl text-sm font-bold active:scale-95 transition-all"
                  >
                    Abort
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
