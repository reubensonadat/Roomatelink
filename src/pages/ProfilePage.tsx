import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Upload, Check, ChevronRight, Sparkles, Flame, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { ModalShell } from '../components/ui/ModalShell'

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

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [gender, setGender] = useState<'M' | 'F' | null>(null)
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500' | '600' | null>(null)
  const [matchPref, setMatchPref] = useState<'same' | 'any' | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [course, setCourse] = useState('')
  const [bio, setBio] = useState('')
  const [matchingStatus, setMatchingStatus] = useState<'ACTIVE' | 'HIDDEN' | 'COMPLETED'>('ACTIVE')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const STORAGE_KEY = 'roommate_profile_data'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const { data: dbProfile } = await withTimeout(
          supabase.from('users').select('*').eq('auth_id', user.id).maybeSingle(),
          30000,
          "Profile handshake timeout."
        )

        if (dbProfile) {
          if (dbProfile.full_name) setDisplayName(dbProfile.full_name)
          if (dbProfile.phone_number) setPhone(dbProfile.phone_number)
          if (dbProfile.course) setCourse(dbProfile.course)
          if (dbProfile.level) setLevel(dbProfile.level.toString() as any)
          if (dbProfile.bio) setBio(dbProfile.bio)
          if (dbProfile.avatar_url) setSelectedAvatar(dbProfile.avatar_url)
          if (dbProfile.gender) {
            setGender(dbProfile.gender === 'MALE' ? 'M' : 'F')
          }
          if (dbProfile.gender_pref) {
            setMatchPref(dbProfile.gender_pref === 'SAME_GENDER' ? 'same' : 'any')
          }
          if (dbProfile.status) setMatchingStatus(dbProfile.status as any)
        }
      } catch (err) {
        console.error("Fetch failed:", err)
      }
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    if (!mounted) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (!displayName && data.displayName) setDisplayName(data.displayName)
        if (!phone && data.phone) setPhone(data.phone)
        if (!course && data.course) setCourse(data.course)
        if (!bio && data.bio) setBio(data.bio)
      } catch { /* parse fail */ }
    }
  }, [mounted, displayName, phone, course, bio])

  useEffect(() => {
    if (!mounted) return
    const data = { displayName, phone, course, bio, matchingStatus, gender, level, matchPref, selectedAvatar }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [mounted, displayName, phone, course, bio, matchingStatus, gender, level, matchPref, selectedAvatar])

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
    setSaveError(null)
    
    try {
      const { data: existingProfile } = await withTimeout(
        supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle(),
        30000,
        "Network timed out."
      )

      const profileData: any = {
        full_name: displayName,
        phone_number: phone,
        course: course,
        level: level,
        bio: bio,
        avatar_url: selectedAvatar || '',
        gender: gender === 'M' ? 'MALE' : 'FEMALE',
        gender_pref: matchPref === 'same' ? 'SAME_GENDER' : 'ANY_GENDER',
        status: matchingStatus
      }

      if (existingProfile) {
        const { error } = await withTimeout(
          supabase.from('users').update(profileData).eq('id', existingProfile.id),
          30000,
          "Update timed out."
        )
        if (error) throw error
      } else {
        const { error } = await withTimeout(
          supabase.from('users').insert({ auth_id: user.id, ...profileData }),
          30000,
          "Establishment timed out."
        )
        if (error) throw error
      }

      toast.success('Identity Synced!')
      localStorage.removeItem(STORAGE_KEY)
      navigate('/dashboard')
    } catch (error: any) {
      setSaveError(error.message || 'Sync failed. Retry required.')
      toast.error('Sync Interrupted')
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

  if (!mounted) return null

  return (
    <div className="flex flex-col w-full min-h-screen bg-background pb-32 relative">
      <div className="flex flex-col px-6 pt-10 pb-32 w-full md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto">
        <header className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="p-4 rounded-[1.5rem] bg-muted/50 hover:bg-muted text-muted-foreground transition-all group active:scale-95 shadow-sm border border-border/40"
          >
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[28px] md:text-[34px] font-black tracking-tight text-foreground leading-tight uppercase">
              Profile Hub
            </h1>
            <p className="text-[14px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">
              Institutional Credentials
            </p>
          </div>
        </header>

        <div className="flex flex-col items-center mb-12">
          <button
            onClick={() => gender && setIsAvatarModalOpen(true)}
            className={`w-[160px] h-[160px] rounded-[1.5rem] bg-card border-[6px] border-background shadow-premium flex items-center justify-center relative overflow-hidden group transition-all ${!gender ? 'opacity-40 grayscale hover:scale-100 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
          >
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-muted-foreground/20" />
            )}
            {gender && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-7 h-7 text-white" />
              </div>
            )}
          </button>
          <button
            onClick={() => gender && setIsAvatarModalOpen(true)}
            className={`mt-6 px-10 py-5 rounded-[1.5rem] bg-foreground text-[14px] font-black text-background transition-all active:scale-95 shadow-premium uppercase tracking-[0.2em] ${!gender ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary hover:text-white'}`}
          >
            {selectedAvatar ? 'Refresh Identity' : gender ? 'Choose Avatar' : 'Select gender first'}
          </button>
        </div>

        <div className="flex flex-col gap-12">
          <section>
            <h2 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-3 mb-5">Institutional Identity</h2>
            <div className="bg-card rounded-[1.5rem] shadow-premium border border-border/40 p-8 flex flex-col gap-8">
              
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. David"
                  className="w-full bg-background border border-border/60 rounded-[1.5rem] px-8 py-5.5 text-foreground font-bold outline-none focus:border-primary/50 focus:ring-[6px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 text-[16px] shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 054 123 4567"
                  className="w-full bg-background border border-border/60 rounded-[1.5rem] px-8 py-5.5 text-foreground font-bold outline-none focus:border-primary/50 focus:ring-[6px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 text-[16px] shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
                />
                <div className="bg-primary/5 border-l-4 border-primary p-4 mt-1 rounded-[1.5rem]">
                   <p className="text-[12px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                     <span className="text-primary">Policy Note:</span> Your number is encrypted and used only for critical roommate matches.
                   </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 flex items-center justify-between uppercase tracking-widest text-left">
                  Short bio <span className="text-[11px] font-bold text-muted-foreground/30">Optional</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="2-3 sentences about your lifestyle..."
                  rows={3}
                  className="w-full bg-background border border-border/60 rounded-[1.5rem] px-8 py-5.5 text-foreground font-bold outline-none focus:border-primary/50 focus:ring-[6px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 text-[16px] resize-none shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Biological gender</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['M', 'F'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenderChange(g)}
                      className={`py-6 rounded-[1.5rem] border-2 font-black text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest
                        ${gender === g
                          ? 'border-primary bg-primary/5 text-primary shadow-premium'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20'
                        }`}
                    >
                      {gender === g && <Check className="w-5 h-5" />}
                      {g === 'M' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Roommate preference</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['same', 'any'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setMatchPref(p)}
                      className={`py-6 rounded-[1.5rem] border-2 font-black text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest
                        ${matchPref === p
                          ? 'border-primary bg-primary/5 text-primary shadow-premium'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20'
                        }`}
                    >
                      {matchPref === p && <Check className="w-5 h-5" />}
                      {p === 'same' ? 'Same sex' : 'Any sex'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-3 mb-5">Institutional Creds</h2>
            <div className="bg-card rounded-[1.5rem] shadow-premium border border-border/40 p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Academic programme</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.A. Economics"
                  className="w-full bg-background border border-border/60 rounded-[1.5rem] px-8 py-5.5 text-foreground font-bold outline-none focus:border-primary/50 focus:ring-[6px] focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 text-[16px] shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-black text-foreground pl-1 uppercase tracking-widest text-left">Current level</label>
                <div className="grid grid-cols-3 gap-4">
                  {['100', '200', '300', '400', '500', '600'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l as any)}
                      className={`py-5 rounded-[1.5rem] border-2 font-black text-[15px] active:scale-[0.98] transition-all
                        ${level === l
                          ? 'border-primary bg-primary/5 text-primary shadow-md'
                          : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20'
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-3 mb-5">Network Status</h2>
            <div className="bg-card rounded-[1.5rem] shadow-premium border border-border/40 p-6 flex flex-col gap-4">
              {(['ACTIVE', 'HIDDEN', 'COMPLETED'] as const).map((status) => {
                const isActive = matchingStatus === status
                return (
                  <button
                    key={status}
                    onClick={() => setMatchingStatus(status)}
                    className={`flex items-center gap-6 p-6 rounded-[1.5rem] border-2 transition-all active:scale-[0.98] ${isActive ? 'border-primary bg-primary/5' : 'border-border/60 bg-background'}`}
                  >
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground/30'}`}>
                      {status === 'ACTIVE' && <User className="w-7 h-7" />}
                      {status === 'HIDDEN' && <Check className="w-7 h-7" />}
                      {status === 'COMPLETED' && <Sparkles className="w-7 h-7" />}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-[16px] font-black uppercase tracking-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {status === 'ACTIVE' ? 'Actively Searching' : status === 'HIDDEN' ? 'Talking (Hidden)' : 'Match Found!'}
                      </span>
                      <span className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {status === 'ACTIVE' ? 'Visible to campus pool' : status === 'HIDDEN' ? 'Hidden from searches' : 'Deactivate matching'}
                      </span>
                    </div>
                  </button>
                )
              })}

              {matchingStatus === 'COMPLETED' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-emerald-500 rounded-[1.5rem] mt-2 flex items-center gap-5 shadow-lg shadow-emerald-500/20"
                >
                  <div className="w-12 h-12 rounded-[1.5rem] bg-white/20 flex items-center justify-center text-white">
                    <Flame className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <span className="block text-[15px] font-black text-white uppercase tracking-tight">Institutional Mission Accomplished!</span>
                    <span className="block text-[12px] font-bold text-white/80 uppercase tracking-widest">Your academy habitat is secured.</span>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          <div className="mt-6 mb-24">
            <button
              onClick={handleSave}
              disabled={!isComplete || isSaving}
              className={`w-full py-7 rounded-[1.5rem] font-black text-[20px] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] shadow-premium
                ${isComplete && !isSaving
                  ? 'bg-foreground text-background hover:bg-primary hover:text-white active:scale-[0.98]'
                  : 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
            >
              {isSaving ? 'Syncing...' : 'Secure & Synchronize Identity'} <ChevronRight className="w-7 h-7" />
            </button>
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
            className="flex flex-col items-center justify-center gap-5 p-6 rounded-[1.5rem] border-2 border-dashed border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-95 aspect-square"
          >
            <div className="w-14 h-14 rounded-[1.5rem] bg-foreground text-background flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-widest text-center">Snapshot Hub</span>
          </button>

          {gender && (gender === 'M' ? avatars.M : avatars.F).map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => { setSelectedAvatar(avatar.src); setIsAvatarModalOpen(false); }}
              className={`flex flex-col items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all hover:scale-[1.03] active:scale-95 group
                ${selectedAvatar === avatar.src
                  ? 'border-primary bg-primary/5'
                  : 'border-border/40 hover:border-foreground/20 bg-card shadow-sm'
                }`}
            >
              <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden mb-1 ring-1 ring-border/20">
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

      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center px-10 text-center"
          >
            <div className="relative mb-12">
              <motion.div
                animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-[1.5rem] bg-primary/10 flex items-center justify-center relative z-10"
              >
                <RefreshCw className="w-12 h-12 text-primary" />
              </motion.div>
              <div className="absolute -inset-10 rounded-[1.5rem] border-2 border-primary/20 animate-ping opacity-20" />
            </div>

            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Securing Identity</h3>
            
            {!saveError ? (
              <p className="max-w-md text-[14px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse tracking-[0.3em]">
                Synchronizing hub to network...
              </p>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                <p className="max-w-md text-[14px] font-black text-red-500 uppercase tracking-widest mb-8">
                  {saveError}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    className="px-8 py-4 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-primary/30"
                  >
                    Retry Sync
                  </button>
                  <button
                    onClick={() => { setIsSaving(false); setSaveError(null); }}
                    className="px-8 py-4 bg-muted text-muted-foreground rounded-[1.5rem] font-black uppercase tracking-widest"
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
