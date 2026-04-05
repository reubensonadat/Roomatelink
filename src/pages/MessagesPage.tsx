import { useState, useEffect } from 'react'
import { Search, MessageCircle, UserCheck, ChevronRight, Sparkles, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { TopHeader } from '../components/layout/TopHeader'
import { useAuth } from '../context/AuthContext'

export function MessagesPage() {
  const { user, profile } = useAuth()
  const [profileStatus, setProfileStatus] = useState({
    isProfileComplete: true,
    hasQuestionnaire: true,
    hasPaid: true
  })
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

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

    async function fetchChats() {
      if (!user) {
        navigate('/auth')
        return
      }

      try {
        // 2. Efficiently determine profile status using context profile first
        const currentProfile = profile || await (async () => {
          const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
          return data
        })()

        if (!currentProfile) {
          setIsLoading(false)
          return
        }

        // 3. Parallelize Questionnaire Check and Messages Fetch
        const [questionnaireRes, messagesRes] = await Promise.all([
          supabase.from('questionnaire_responses').select('id').eq('user_id', currentProfile.id).maybeSingle(),
          currentProfile.has_paid 
            ? supabase.from('messages').select('*').or(`sender_id.eq.${currentProfile.id},receiver_id.eq.${currentProfile.id}`).order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as any[], error: null })
        ])

        setProfileStatus({
          isProfileComplete: !!(currentProfile.course && currentProfile.level && currentProfile.phone_number),
          hasQuestionnaire: !!questionnaireRes.data,
          hasPaid: !!currentProfile.has_paid
        })

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
        }
      } catch (error) {
        console.error('Error fetching chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [user, profile, navigate])


  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader 
        title="Messages" 
        subtitle={chats.length > 0 ? `You have ${chats.length} active conversations.` : 'Your private conversations will appear here.'}
      />

      <div className="flex-1 overflow-y-auto w-full md:max-w-2xl lg:max-w-4xl mx-auto pb-40">
        <div className="px-5 pt-8 mb-8">
          <div className="relative group max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl pl-12 pr-5 py-4 font-bold text-sm shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-muted-foreground/30 text-foreground"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 px-5 max-w-lg mx-auto"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-5 bg-card rounded-[2rem] border border-border/40 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
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
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Quiet in Here</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">You haven't messaged anyone yet. Go check out your top matches!</p>
              </div>
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl">Browse Matches</Link>
            </motion.div>
          ) : (
            <div className="px-5 space-y-4 max-w-lg mx-auto">
              {chats.map((chat, i) => (
                <motion.div 
                  key={chat.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link 
                    to={`/dashboard/messages/${chat.id}`} 
                    className="flex items-start gap-4 p-5 bg-card rounded-[2rem] border border-border/80 shadow-premium hover:shadow-elevated hover:border-primary/20 transition-all active:scale-[0.98] group relative"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted border border-border shadow-inner overflow-hidden">
                        <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-card animate-pulse" />
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
                          <div className="mt-1 min-w-[22px] h-[22px] bg-primary rounded-lg flex items-center justify-center text-[10px] font-black text-primary-foreground px-1.5 shadow-lg shadow-primary/20">
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
