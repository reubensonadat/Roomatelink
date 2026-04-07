import { useState, useEffect } from 'react'
import { Search, MessageCircle, UserCheck, ChevronRight, Sparkles, Lock, Cpu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { TopHeader } from '../components/layout/TopHeader'
import { useAuth } from '../context/AuthContext'

export function MessagesPage() {
  const { user, profile, isTrafficHeavy, setIsTrafficHeavy } = useAuth()
  const isPaid = !!(profile?.has_paid || profile?.is_pioneer)
  // Robust initial derivation: if user has cached chats AND is paid, they've completed the full flow
  const hasCachedChats = (() => { try { const c = localStorage.getItem('roommate_chat_threads'); return c ? JSON.parse(c).length > 0 : false } catch { return false } })()
  const [profileStatus, setProfileStatus] = useState({
    isProfileComplete: !!(profile?.course && profile?.level),
    hasQuestionnaire: sessionStorage.getItem('hasQuestionnaireCache') === 'true' || (isPaid && hasCachedChats),
    hasPaid: isPaid
  })
  // Instant Resume: Check if we already synced this session
  const sessionSynced = sessionStorage.getItem('chat_vault_synced') === 'true'
  
  const [chats, setChats] = useState<any[]>(() => {
    const cached = localStorage.getItem('roommate_chat_threads')
    return cached ? JSON.parse(cached) : []
  })
  
  // Only show the deep sync UI if we haven't synced this session AND have no valid cache
  const [isLoading, setIsLoading] = useState(!sessionSynced)
  const [loadingStep, setLoadingStep] = useState(0) // 0: Handshake, 1: Verification, 2: Recovering, 3: Finalizing
  const [progress, setProgress] = useState(sessionSynced ? 100 : 0)
  const navigate = useNavigate()

  // Re-sync profile status when AuthContext profile updates (e.g., on tab resume)
  useEffect(() => {
    if (profile) {
      const paid = !!(profile.has_paid || profile.is_pioneer)
      setProfileStatus(prev => ({
        ...prev,
        isProfileComplete: !!(profile.course && profile.level),
        hasPaid: paid
      }))
    }
  }, [profile])

  useEffect(() => {
    // 1. Instant Cache Load (Boutique performance)
    const cachedThreads = localStorage.getItem('roommate_chat_threads')
    if (cachedThreads) {
      try {
        setChats(JSON.parse(cachedThreads))
        setIsLoading(false) // Hide spinner early if we have data
      } catch (err) {
        console.error("Cache corrupted:", err)
      }
    }

    async function fetchChats(retries = 2) {
      if (!user) {
        navigate('/auth')
        return
      }

      // Step 1: Handshake
      setLoadingStep(0)
      setProgress(15)

      try {
        const currentProfile = profile || await (async () => {
          const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
          return data
        })()

        if (!currentProfile) {
          setIsLoading(false)
          return
        }

        // Step 2: Verification
        setLoadingStep(1)
        setProgress(40)

        // 3. Parallelize Questionnaire Check and Messages Fetch
        const isPaid = !!(currentProfile.has_paid || currentProfile.is_pioneer)
        const [questionnaireRes, messagesRes] = await Promise.all([
          supabase.from('questionnaire_responses').select('id').eq('user_id', currentProfile.id).maybeSingle(),
          isPaid 
            ? supabase.from('messages').select('*').or(`sender_id.eq.${currentProfile.id},receiver_id.eq.${currentProfile.id}`).order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as any[], error: null })
        ])

        setProfileStatus(prev => ({
          isProfileComplete: !!(currentProfile.course && currentProfile.level),
          // If questionnaire query errored, preserve previous state instead of reverting to false
          hasQuestionnaire: questionnaireRes.error ? prev.hasQuestionnaire : !!questionnaireRes.data,
          hasPaid: isPaid
        }))

        if (!isPaid) {
          setIsLoading(false)
          sessionStorage.setItem('chat_vault_synced', 'true')
          setProgress(100)
          return
        }

        // Step 3: Recovering
        setLoadingStep(2)
        setProgress(65)

        const msgs = messagesRes.data

        if (msgs && msgs.length > 0) {
          // Collect unique user IDs to fetch their profiles and last_active status
          const idsToFetch = new Set<string>();
          msgs.forEach(m => {
             if (m.sender_id !== currentProfile.id) idsToFetch.add(m.sender_id);
             if (m.receiver_id !== currentProfile.id) idsToFetch.add(m.receiver_id);
          });

          const { data: chatUsers } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, last_active')
            .in('id', Array.from(idsToFetch));

          const usersMap = new Map((chatUsers || []).map(u => [u.id, u]));

          const threads: Record<string, any> = {}
          msgs.forEach((m: any) => {
            const otherId = m.sender_id === currentProfile.id ? m.receiver_id : m.sender_id
            const other = usersMap.get(otherId) as any

            if (other && !threads[other.id]) {
              const lastActiveDate = new Date(other.last_active)
              const isOnline = (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000 // 5 minutes threshold

              threads[other.id] = {
                id: other.id,
                name: other.full_name,
                avatar: other.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + other.id,
                lastMessage: m.content,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: m.receiver_id === currentProfile.id && m.status !== 'READ' ? 1 : 0,
                isOnline
              }
            } else if (other && m.receiver_id === currentProfile.id && m.status !== 'READ') {
              threads[other.id].unread++
            }
          })
          const threadList = Object.values(threads)
          setChats(threadList)
          // Save to cache for next time
          localStorage.setItem('roommate_chat_threads', JSON.stringify(threadList))
          
          // Step 4: Finalizing
          setLoadingStep(3)
          setProgress(100)
          sessionStorage.setItem('chat_vault_synced', 'true')
          
          // Small delay for boutique feel
          await new Promise(r => setTimeout(r, 600))
        }
      } catch (error) {
        console.error('Error fetching chats:', error)
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return fetchChats(retries - 1)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()

    // 4. Realtime "Auto-Sync" for the Messages List
    // This allows the "Last Message" snippet and "Unread" badge to update instantly
    // while the user is parked on the Messages tab.
    const channel = supabase
      .channel('messages-list-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile?.id}`
      }, async (payload: any) => {
        // When a new message arrives, we recalculate the specific thread
        const newMsg = payload.new
        const senderId = newMsg.sender_id

        setChats(prev => {
          const existingIndex = prev.findIndex(c => c.id === senderId)
          let updatedChats = [...prev]

          if (existingIndex !== -1) {
            // Update existing thread
            const thread = { ...updatedChats[existingIndex] }
            thread.lastMessage = newMsg.content
            thread.time = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            thread.unread = (thread.unread || 0) + 1
            
            // Move to top
            updatedChats.splice(existingIndex, 1)
            updatedChats.unshift(thread)
          } else {
             // It's a new conversation from someone not in our current thread list
             // We'll let the next manual/auto-refresh handle fetching their profile info
             // OR we can trigger a full sync if we want to be high-fidelity.
             // For now, let's just trigger fetchChats() to grab the new user's profile and avatar.
             fetchChats()
             return prev
          }
          
          localStorage.setItem('roommate_chat_threads', JSON.stringify(updatedChats))
          return updatedChats
        })
      })
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime connection limited - switching to High Traffic Mode')
          setIsTrafficHeavy(true)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, navigate])


  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader 
        title="Messages" 
        subtitle={chats.length > 0 ? `You have ${chats.length} active conversations.` : 'Your private conversations will appear here.'}
      />

      <AnimatePresence>
        {isTrafficHeavy && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600 text-white overflow-hidden shadow-lg border-b border-white/10"
          >
            <div className="px-5 py-3 flex items-center justify-between gap-4 max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Cpu className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight leading-tight">High Performance Mode</span>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5">Live updates paused to save resources</p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-tighter hover:bg-indigo-50 transition-colors shrink-0">Reconnect</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto w-full md:max-w-2xl lg:max-w-4xl mx-auto pb-40">

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="vault-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-[2.5rem]" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-[2.5rem]"
                />
                <Lock className="w-10 h-10 text-primary z-10" />
              </div>

              <div className="max-w-xs w-full space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Syncing Vault</h3>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                    {loadingStep === 0 && "Establishing Secure Link"}
                    {loadingStep === 1 && "Verifying Credentials"}
                    {loadingStep === 2 && "Recovering Records"}
                    {loadingStep === 3 && "Optimizing Inbox"}
                  </p>
                </div>

                {/* Boutique Progress Bar */}
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  />
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                </div>

                <p className="text-[13px] font-bold text-muted-foreground">
                  Synchronizing with Institutional Servers...
                </p>
              </div>
            </motion.div>
          ) : !profileStatus.isProfileComplete ? (
            <motion.div 
              key="profile-check"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center py-20 px-6 text-center gap-6"
            >
              <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-amber-500/20 animate-pulse rounded-[2.5rem]" />
                <UserCheck className="w-10 h-10 text-amber-500 z-10" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Identity Check</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">Complete your profile setup to start connecting with roommates.</p>
              </div>
              <Link to="/profile" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Setup Identity <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : !profileStatus.hasQuestionnaire ? (
            <motion.div 
              key="question-check"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center py-20 px-6 text-center gap-6"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2.5rem]" />
                <Sparkles className="w-10 h-10 text-primary z-10" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Find Your Tribe</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">Take the DNA test to unlock matches and start private conversations.</p>
              </div>
              <Link to="/questionnaire" className="px-8 py-4 bg-foreground text-background font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Start Test <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : !profileStatus.hasPaid ? (
            <motion.div 
              key="pay-check"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center py-20 px-6 text-center gap-6"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Unlock Messages</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">Unlock your matches for GHS 25 to start private conversations with your top roommate matches.</p>
              </div>
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Unlock Matches <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : chats.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center py-20 px-6 text-center gap-6"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2.5rem]" />
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Quiet in Here</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">You haven't messaged anyone yet. Go check out your top matches!</p>
              </div>
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Browse Matches</Link>
            </motion.div>
          ) : (
            <div className="px-5 space-y-4 max-w-lg mx-auto pt-6">
              {/* Search Bar Refined: Only shows with active threads */}
              <div className="pt-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group w-full max-w-lg mx-auto">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/60 transition-colors group-focus-within:text-primary z-10" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full h-[60px] pl-16 pr-8 bg-background border-2 border-border/80 rounded-[18px] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all font-black text-[15px] sm:text-[17px] text-foreground placeholder:text-muted-foreground/50 shadow-md relative z-0"
                  />
                </div>
              </div>

              {chats.map((chat, i) => (
                <motion.div 
                  key={chat.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link 
                    to={`/dashboard/messages/${chat.id}`} 
                    className="flex items-start gap-5 p-6 bg-card rounded-[24px] border border-border/80 shadow-premium hover:shadow-elevated hover:border-primary/20 transition-all active:scale-[0.98] group relative"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-muted border border-border shadow-inner overflow-hidden">
                        <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-[22px] border-4 border-card animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[17px] font-black text-foreground truncate tracking-tight">{chat.name}</span>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${chat.unread > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>{chat.time}</span>
                      </div>
                      <div className="flex justify-between items-start gap-3">
                        <p className={`text-[14px] leading-relaxed line-clamp-2 flex-1 break-all ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                          {chat.lastMessage}
                        </p>
                        {chat.unread > 0 && (
                          <div className="mt-1 min-w-[22px] h-[22px] bg-primary rounded-[22px] flex items-center justify-center text-[10px] font-black text-primary-foreground px-1.5 shadow-lg shadow-primary/20">
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
