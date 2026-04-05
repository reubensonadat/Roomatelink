import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flag, ArrowLeft, Send, ShieldCheck, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ReportModal } from '../components/ui/ReportModal'
import { useAuth } from '../context/AuthContext'

export function ChatPage() {
  const { id: receiverId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(false)

  // Header status helper
  const getStatus = (lastActive: string | null) => {
    if (!lastActive) return { label: 'Offline', isOnline: false }
    const lastActiveDate = new Date(lastActive)
    const diff = new Date().getTime() - lastActiveDate.getTime()
    
    if (diff < 5 * 60 * 1000) return { label: 'Online', isOnline: true }
    
    const timeStr = lastActiveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dayStr = lastActiveDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    const isToday = new Date().toDateString() === lastActiveDate.toDateString()
    
    return { 
      label: `Last seen ${isToday ? 'today' : dayStr} at ${timeStr}`, 
      isOnline: false 
    }
  }

  useEffect(() => {
    async function setupChat() {
      if (!user || !receiverId) return

      // Parallel fetch: Other User Profile and Message History
      const [themRes, historyRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', receiverId).single(),
        supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${profile?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${profile?.id})`)
          .order('created_at', { ascending: true })
      ])

      const me = profile
      const them = themRes.data
      
      if (!me || !them) {
        if (!me) {
           console.error("Current profile missing from context");
        } else {
           toast.error("User not found")
           navigate('/dashboard/messages')
        }
        return
      }

      // ── Payment guard: only paid users can message ────────────────
      if (!me.has_paid) {
        setIsLocked(true)
        setOtherUser(them)
        setLoading(false)
        return
      }

      setOtherUser(them)

      if (historyRes.data) {
        setMessages(historyRes.data.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === me.id ? 'me' : 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })))
      }

      // Mark as read in background
      supabase.from('messages').update({ status: 'READ' }).eq('receiver_id', me.id).eq('sender_id', them.id).then(() => {})

      const channel = supabase
        .channel(`chat:${me.id}:${them.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${me.id}`
        }, (payload: any) => {
          if (payload.new.sender_id === them.id) {
            setMessages(prev => [...prev, {
              id: payload.new.id,
              text: payload.new.content,
              sender: 'them',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
          }
        })
        .subscribe()

      setLoading(false)
      return () => { supabase.removeChannel(channel) }
    }

    setupChat()
  }, [receiverId, user, profile, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !receiverId || !profile) return

    const text = input
    setInput("")

    // Optimistic update
    const tempId = Date.now()
    setMessages(prev => [...prev, {
      id: tempId,
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: receiverId,
      content: text,
      status: 'SENT'
    })

    if (error) {
      toast.error("Failed to send message")
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  if (loading && !otherUser) return null

  // ── Locked state: user hasn't paid ───────────────────────────────
  if (isLocked) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background max-w-2xl mx-auto border-x border-border/40 items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center">
            <Lock className="w-9 h-9 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground mb-2">
              Unlock to Message {otherUser?.full_name?.split(' ')[0] || 'this match'}
            </h2>
            <p className="text-muted-foreground font-semibold text-sm max-w-xs mx-auto">
              Unlock your matches for GHS 25 to start private conversations and see full profiles.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            Unlock Matches — GHS 25
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    )
  }

  const status = getStatus(otherUser?.last_active)

  return (
    <div className="flex flex-col h-[100dvh] bg-background max-w-2xl mx-auto border-x border-border/40">
      <header className="px-4 py-3 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/messages')} className="p-2 rounded-xl hover:bg-muted transition-colors active:scale-95 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden shadow-sm">
              <img src={otherUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + receiverId} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold leading-tight text-foreground truncate max-w-[150px]">{otherUser?.full_name || 'Roommate'}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {status.isOnline && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                <span className={`text-[11px] font-medium leading-none ${status.isOnline ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-muted-foreground/40 hover:text-red-500 transition-colors active:scale-95">
          <Flag className="w-5 h-5" />
        </button>
      </header>

      <div className="shrink-0 bg-muted/20 px-4 py-2 border-b border-border/10 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">End-to-end encrypted</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className={`px-4 py-2.5 rounded-2xl text-[14.5px] font-medium leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 text-foreground rounded-tl-sm'}`}>
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground/40 mt-1 px-1 uppercase tracking-tighter">{msg.time}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-background border-t border-border/40">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 bg-muted/30 border border-border/20 rounded-full px-5 py-1.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none outline-none py-2 font-medium text-sm text-foreground placeholder:text-muted-foreground/30"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-primary text-primary-foreground shadow-lg active:scale-90' : 'bg-muted text-muted-foreground/20'}`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedName={otherUser?.full_name || ''}
        reportedId={receiverId || ''}
      />
    </div>
  )
}
