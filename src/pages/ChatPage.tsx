import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flag, ArrowLeft, Send, ShieldCheck, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ReportModal } from '../components/ui/ReportModal'

export function ChatPage() {
  const { id: receiverId } = useParams()
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    async function setupChat() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser || !receiverId) return

      const { data: me } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single()
      const { data: them } = await supabase.from('users').select('*').eq('id', receiverId).single()
      
      if (!me || !them) {
        toast.error("User not found")
        navigate('/messages')
        return
      }

      // ── Payment guard: only paid users can message ────────────────
      if (!me.has_paid) {
        setIsLocked(true)
        setOtherUser(them)
        setLoading(false)
        return
      }

      setCurrentUser(me)
      setOtherUser(them)

      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${them.id}),and(sender_id.eq.${them.id},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true })

      if (history) {
        setMessages(history.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === me.id ? 'me' : 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })))
      }

      await supabase.from('messages').update({ status: 'READ' }).eq('receiver_id', me.id).eq('sender_id', them.id)

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
  }, [receiverId, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !receiverId || !currentUser) return

    const text = input
    setInput("")

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: text,
      status: 'SENT'
    })

    if (error) toast.error("Failed to send message")
  }

  if (loading) return null

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

  return (
    <div className="flex flex-col h-[100dvh] bg-background max-w-2xl mx-auto border-x border-border/40">
      <header className="px-4 py-4 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/messages')} className="p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors active:scale-95 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.5rem] bg-card border border-border shadow-inner overflow-hidden">
              <img src={otherUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + receiverId} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-black leading-tight text-foreground truncate max-w-[150px]">{otherUser?.full_name || 'Roommate'}</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Now</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setIsReportModalOpen(true)} className="p-3 text-red-500/60 hover:text-red-500 transition-colors">
          <Flag className="w-5 h-5" />
        </button>
      </header>

      <div className="shrink-0 bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Secure End-to-End Chat</span>
        </div>
        <button className="px-4 py-1.5 bg-[#25D366] text-white rounded-full font-black text-[10px] active:scale-95 transition-all shadow-lg shadow-emerald-500/10">WhatsApp</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className={`px-5 py-3.5 rounded-[1.5rem] text-[15px] font-bold leading-relaxed shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-[4px]' : 'bg-muted/60 text-foreground rounded-tl-[4px]'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] font-black text-muted-foreground/60 mt-1.5 px-1 uppercase tracking-widest">{msg.time}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-[2rem] p-1.5 pl-6 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser?.full_name?.split(' ')[0] || 'Roommate'}...`}
            className="flex-1 bg-transparent border-none outline-none py-3 font-bold text-sm text-foreground placeholder:text-muted-foreground/40"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-primary text-primary-foreground shadow-lg active:scale-90' : 'bg-muted text-muted-foreground/30 grayscale'}`}
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
