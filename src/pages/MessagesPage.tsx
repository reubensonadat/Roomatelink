import { useState, useEffect } from 'react'
import { Search, MessageCircle, UserCheck, ChevronRight, Sparkles, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    async function fetchChats() {
      if (!user) {
        navigate('/auth')
        return
      }

      // 1. Efficiently determine profile status using context profile first
      const currentProfile = profile || await (async () => {
        const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
        return data
      })()

      if (!currentProfile) return

      // 2. Parallelize Questionnaire Check and Messages Fetch
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
        setChats(Object.values(threads))
      }
      setIsLoading(false)
    }

    fetchChats()
  }, [user, profile, navigate])


  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader title="Messages" />

      <div className="flex-1 overflow-y-auto w-full md:max-w-2xl lg:max-w-3xl mx-auto pb-32">
        <div className="px-4 pt-6 mb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-muted/30 border border-border/40 rounded-2xl pl-12 pr-5 py-3 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-0 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-border/20 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !profileStatus.isProfileComplete ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20 px-6 text-center gap-6">
            <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center animate-pulse">
              <UserCheck className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Identity Check</h2>
            <p className="text-muted-foreground font-bold max-w-xs">Complete your profile setup to start connecting with roommates.</p>
            <Link to="/profile" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2">
              Setup Identity <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : !profileStatus.hasQuestionnaire ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20 px-6 text-center gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Find Your Tribe</h2>
            <p className="text-muted-foreground font-bold max-w-xs">Take the DNA test to unlock matches and start private conversations.</p>
            <Link to="/questionnaire" className="px-8 py-4 bg-foreground text-background font-black rounded-2xl shadow-xl flex items-center gap-2">
              Start Test <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : !profileStatus.hasPaid ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20 px-6 text-center gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Unlock Messages</h2>
            <p className="text-muted-foreground font-bold max-w-xs">Unlock your matches for GHS 25 to start private conversations with your top roommate matches.</p>
            <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2">
              Unlock Matches <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : chats.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 px-6 text-center gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Quiet in Here</h2>
            <p className="text-muted-foreground font-bold max-w-xs">You haven't messaged anyone yet. Go check out your top matches!</p>
            <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl">Browse Matches</Link>
          </motion.div>
        ) : (
          <div className="px-0">
            {chats.map((chat, i) => (
              <motion.div key={chat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/dashboard/messages/${chat.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-muted/30 transition-all group active:bg-muted/50 relative">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-card border border-border overflow-hidden shadow-sm">
                      <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-border/10 pb-4 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[16px] font-bold text-foreground truncate">{chat.name}</span>
                      <span className={`text-[11px] font-bold ${chat.unread > 0 ? 'text-primary' : 'text-muted-foreground/60'}`}>{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[14px] truncate flex-1 ${chat.unread > 0 ? 'text-foreground font-black' : 'text-muted-foreground font-bold'}`}>
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <div className="ml-3 min-w-[20px] h-[20px] bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-primary-foreground px-1.5">
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
      </div>
    </div>
  )
}
