import { useState, useEffect } from 'react'
import { Search, MessageCircle, UserCheck, ChevronRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export function MessagesPage() {
  const [profileStatus, setProfileStatus] = useState({
    isProfileComplete: true,
    hasQuestionnaire: true
  })
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchChats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        const { data: questionnaire } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        setProfileStatus({
          isProfileComplete: !!(profile.course && profile.level && profile.phone_number),
          hasQuestionnaire: !!questionnaire
        })

        const { data: msgs } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!sender_id (id, full_name, avatar_url),
            receiver:users!receiver_id (id, full_name, avatar_url)
          `)
          .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .order('created_at', { ascending: false })

        if (msgs) {
          const threads: Record<string, any> = {}
          msgs.forEach((m: any) => {
            const other = m.sender_id === profile.id ? m.receiver : m.sender
            if (other && !threads[other.id]) {
              threads[other.id] = {
                id: other.id,
                name: other.full_name,
                avatar: other.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + other.id,
                lastMessage: m.content,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: m.receiver_id === profile.id && m.status !== 'READ' ? 1 : 0
              }
            } else if (other && m.receiver_id === profile.id && m.status !== 'READ') {
              threads[other.id].unread++
            }
          })
          setChats(Object.values(threads))
        }
      }
      setIsLoading(false)
    }

    fetchChats()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col pb-32">
      <header className="px-5 pt-8 pb-6 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-40">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h1 className="text-3xl font-black tracking-tight leading-none">Messages</h1>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-muted/40 border border-border/40 rounded-2xl pl-12 pr-5 py-4 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-16 h-16 rounded-[1.5rem] bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !profileStatus.isProfileComplete ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20 text-center gap-6">
            <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center animate-pulse">
              <UserCheck className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black">Identity Check</h2>
            <p className="text-muted-foreground font-bold max-w-xs">Complete your profile setup to start connecting with roommates.</p>
            <Link to="/profile" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl flex items-center gap-2">
              Setup Identity <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : !profileStatus.hasQuestionnaire ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20 text-center gap-6">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black">Find Your Tribe</h2>
            <p className="text-muted-foreground font-bold max-w-xs">Take the DNA test to unlock matches and start private conversations.</p>
            <Link to="/questionnaire" className="px-8 py-4 bg-foreground text-background font-black rounded-2xl shadow-xl flex items-center gap-2">
              Start Test <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : chats.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-center gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black">Quiet in Here</h2>
            <p className="text-muted-foreground font-bold max-w-xs">You haven't messaged anyone yet. Go check out your top matches!</p>
            <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl">Browse Matches</Link>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat, i) => (
              <motion.div key={chat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/messages/${chat.id}`} className="flex items-center gap-5 p-4 rounded-[2rem] hover:bg-muted/40 transition-all group active:scale-[0.98]">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-card border border-border/60 overflow-hidden shadow-inner">
                      <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    {chat.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center text-[10px] font-black text-primary-foreground shadow-lg">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-black truncate">{chat.name}</span>
                      <span className="text-xs font-bold text-muted-foreground">{chat.time}</span>
                    </div>
                    <p className={`text-sm truncate ${chat.unread > 0 ? 'text-foreground font-black' : 'text-muted-foreground font-bold'}`}>
                      {chat.lastMessage}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
