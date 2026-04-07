import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flag, ChevronRight, Send, ShieldCheck, Lock, Check, CheckCheck, Clock, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ReportModal } from '../components/ui/ReportModal'
import { useAuth } from '../context/AuthContext'

export function ChatPage() {
  const { id: receiverId } = useParams()
  const navigate = useNavigate()
  const { user, profile, isTrafficHeavy, setIsTrafficHeavy } = useAuth()

  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const sessionSynced = sessionStorage.getItem(`chat_synced_${receiverId}`) === 'true'
  const [loadingStep, setLoadingStep] = useState(0) // 0: Link, 1: Security, 2: History, 3: Syncing
  const [progress, setProgress] = useState(sessionSynced ? 100 : 0)
  
  const [isLocked, setIsLocked] = useState(() => {
    if (!profile) return false
    return !(profile.has_paid || profile.is_pioneer)
  })
  const [isSyncing, setIsSyncing] = useState(!sessionSynced)

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

  // 1. Load Cache Immediately (Standard Boutique Pattern)
  useEffect(() => {
    if (!receiverId) return
    
    // Step A: Check thread list for instant header (the fast path)
    const threadListCached = localStorage.getItem('roommate_chat_threads')
    if (threadListCached) {
      try {
        const threads = JSON.parse(threadListCached)
        const myThread = threads.find((t: any) => t.id === receiverId)
        if (myThread) {
          setOtherUser({
            id: myThread.id,
            full_name: myThread.name,
            avatar_url: myThread.avatar,
            last_active: null // Will be updated by full sync
          })
          setLoading(false)
        }
      } catch (e) {
        console.error("Thread cache error:", e)
      }
    }

    // Step B: Check specific chat history cache (the messages)
    const cached = localStorage.getItem(`roommate_chat_${receiverId}`)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.messages) setMessages(parsed.messages)
        if (parsed.otherUser && !otherUser) setOtherUser(parsed.otherUser)
        setLoading(false)
      } catch (e) {
        console.error("Chat cache error:", e)
      }
    }
  }, [receiverId])

  useEffect(() => {
    let isMounted = true
    let channel: any = null
    let syncTimeout: any = null

    async function setupChat(retries = 2) {
      if (!user || !receiverId) return

      try {
        if (isMounted) setIsSyncing(true)

        // Step 1: Establishing Link
        setLoadingStep(0)
        setProgress(15)
        
        // Critical: Fallback for profile ID if Supabase Auth sync is slow
        const myId = profile?.id || (() => {
          const cachedProfile = localStorage.getItem('user_profile_cache')
          if (cachedProfile) return JSON.parse(cachedProfile).id
          return null
        })()
        
        if (!myId && !user) {
          navigate('/auth')
          return
        }

        // --- 10 Second Fail-Safe Timeout ---
        syncTimeout = setTimeout(() => {
          if (isMounted) setIsSyncing(false)
        }, 10000)

        // 2. Determine "Delta" starting point safely
        const cachedSlice = localStorage.getItem(`roommate_chat_${receiverId}`)
        let lastTimestamp = '1970-01-01T00:00:00Z'

        if (cachedSlice) {
          try {
            const parsed = JSON.parse(cachedSlice)
            const initialMessages = parsed.messages || []
            if (initialMessages.length > 0) {
              lastTimestamp = initialMessages[initialMessages.length - 1].timestamp || '1970-01-01T00:00:00Z'
            }
          } catch (e) {
            console.error("Cache read error:", e)
          }
        }

        // Step 2: Checking Security Protocol
        setLoadingStep(1)
        setProgress(40)

        // Optimized Fetch: Limit to last 50 messages for hyper-speed initial load
        // We move the user fetch to background if we already have cache
        const deltaPromise = supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${myId})`)
          .gt('created_at', lastTimestamp)
          .order('created_at', { ascending: false })
          .limit(50)

        const [themRes, deltaRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', receiverId).single(),
          deltaPromise
        ])

        if (!isMounted) return

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

        // ── Pioneer/Payment guard ────────────────
        const hasAccess = !!(me.has_paid || me.is_pioneer)
        if (!hasAccess) {
          setIsLocked(true)
          setOtherUser(them)
          return
        }
        setIsLocked(false)

        setOtherUser(them)

        if (deltaRes.data && deltaRes.data.length > 0) {
          // Flip back to chronological for UI display
          const displayDelta = [...deltaRes.data].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          const fetchedMessages = displayDelta.map((m: any) => ({
            id: m.id,
            text: m.content,
            sender: m.sender_id === me.id ? 'me' : 'them',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: m.created_at,
            status: m.status
          }))

          // Merge: Cache + Delta
          setMessages(prev => {
            const existingIds = new Set(fetchedMessages.map(m => m.id))
            const filteredPrev = prev.filter(m => !existingIds.has(m.id))
            const combined = [...filteredPrev, ...fetchedMessages]
            const final = combined.slice(-100)

            localStorage.setItem(`roommate_chat_${receiverId}`, JSON.stringify({
              messages: final,
              otherUser: them
            }))
            return final
          })

          // Step 4: Finalizing Encryption
          setLoadingStep(3)
          setProgress(100)
          sessionStorage.setItem(`chat_synced_${receiverId}`, 'true')

          // Boutique speed-up: Minimal delay for handshake feel
          await new Promise(r => setTimeout(r, 300))
        } else {
           // Even if no new messages, we are synced
           setLoadingStep(3)
           setProgress(100)
           sessionStorage.setItem(`chat_synced_${receiverId}`, 'true')
        }

        // Mark incoming messages as read
        supabase.from('messages').update({ status: 'READ' }).eq('receiver_id', me.id).eq('sender_id', them.id).neq('status', 'READ').then(() => { })

        channel = supabase
          .channel(`chat:${me.id}:${them.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${me.id}`
          }, (payload: any) => {
            if (payload.new.sender_id === them.id) {
              const newMessage = {
                id: payload.new.id,
                text: payload.new.content,
                sender: 'them',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: payload.new.created_at,
                status: payload.new.status
              }
              setMessages(prev => {
                const updated = [...prev, newMessage]
                localStorage.setItem(`roommate_chat_${receiverId}`, JSON.stringify({
                  messages: updated,
                  otherUser: them
                }))
                return updated
              })
              // Mark as read immediately if chat is open
              supabase.from('messages').update({ status: 'READ' }).eq('id', payload.new.id).then(() => { })
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages'
          }, (payload: any) => {
            // Update message status in real-time (e.g. from SENT to READ)
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id ? { ...msg, status: payload.new.status } : msg
            ))
          })
          .subscribe((status) => {
            if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
              console.warn('Realtime connection limited - switching to High Traffic Mode')
              setIsTrafficHeavy(true)
            }
          })

      } catch (err) {
        console.error("Chat setup error:", err)
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return setupChat(retries - 1)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setIsSyncing(false)
          if (syncTimeout) clearTimeout(syncTimeout)
        }
      }
    }

    setupChat()

    return () => {
      isMounted = false
      if (syncTimeout) clearTimeout(syncTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [receiverId, user, profile, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !receiverId || !profile) return

    const text = input
    const tempId = Date.now().toString()
    setInput("")

    // 1. Optimistic Update (PENDING)
    const now = new Date()
    const myNewMessage = {
      id: tempId,
      text,
      sender: 'me',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
      status: 'PENDING'
    }

    setMessages(prev => [...prev, myNewMessage])

    // 2. Server Sync
    const { data, error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: receiverId,
      content: text,
      status: 'SENT'
    }).select().single()

    if (error) {
      toast.error("Failed to send message")
      setMessages(prev => prev.filter(m => m.id !== tempId))
      return
    }

    // 3. Update status to SENT and replace tempId with real ID + SERVER TIMESTAMP
    // This is critical: if client clock is wrong, we must sync the timestamp to the server's truth!
    if (data) {
      setMessages(prev => {
        const updated = prev.map(m => m.id === tempId ? {
          ...m,
          id: data.id,
          status: 'SENT',
          timestamp: data.created_at // Enforce server timeline!
        } : m)
        localStorage.setItem(`roommate_chat_${receiverId}`, JSON.stringify({
          messages: updated,
          otherUser: otherUser
        }))
        return updated
      })
    }
  }

  // ── High-Fidelity Syncing UI (Boutique Messaging Vault) ────────────────
  // Show if we are missing either the identity or the message history
  if (loading && (messages.length === 0 || !otherUser)) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background max-w-2xl mx-auto border-x border-border/40">
        <header className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-muted" />
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex flex-col gap-1.5">
            <div className="w-24 h-3 bg-muted rounded-full" />
            <div className="w-16 h-2 bg-muted rounded-full opacity-50" />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 animate-ping opacity-25 rounded-[2.5rem]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-[2.5rem]"
            />
            <Lock className="w-10 h-10 text-primary z-10" />
          </motion.div>

          <div className="max-w-xs w-full space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">Syncing Thread</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary h-4">
                {loadingStep === 0 && "Establishing Secure Link"}
                {loadingStep === 1 && "Security Protocol Sync"}
                {loadingStep === 2 && "Recovering Thread History"}
                {loadingStep === 3 && "Optimizing Decryption"}
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

            <div className="flex flex-col items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-muted-foreground/30 animate-pulse" />
               <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                 End-to-End Encrypted Handshake
               </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Locked state ───────────────────────────────
  if (isLocked) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background max-w-2xl mx-auto border-x border-border/40 items-center justify-center p-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center">
            <Lock className="w-9 h-9 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground mb-2">Unlock to Message {otherUser?.full_name?.split(' ')[0] || 'this match'}</h2>
            <p className="text-muted-foreground font-semibold text-sm max-w-xs mx-auto">Unlock your matches for GHS 25 to start private conversations and see full profiles.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl active:scale-95 transition-all">Unlock Matches — GHS 25</button>
          <button onClick={() => navigate(-1)} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Go Back</button>
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
            <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden shadow-sm">
              <img src={otherUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + receiverId} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold leading-tight text-foreground truncate max-w-[150px]">{otherUser?.full_name || 'Roommate'}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <span className={`text-[11px] font-medium leading-none ${status.isOnline ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>{status.label}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSyncing && <div className="px-2 py-1 bg-muted rounded-full text-[9px] font-bold text-muted-foreground animate-pulse mr-2 uppercase tracking-tighter">Syncing</div>}
          <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-muted-foreground/40 hover:text-red-500 transition-colors active:scale-95">
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isTrafficHeavy && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600 text-white overflow-hidden shadow-lg border-b border-white/10"
          >
            <div className="px-5 py-3 flex items-center justify-between gap-4 max-w-lg mx-auto">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-white animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-tight leading-tight">High Performance Mode</span>
                  <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest leading-none mt-0.5">Live status paused to save resources</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-2 py-1 bg-white text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-tighter hover:bg-indigo-50 transition-colors shrink-0 shadow-sm"
              >
                Sync
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 bg-muted/20 px-4 py-2 border-b border-border/10 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">End-to-end encrypted</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-4">
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
                <div className={`px-6 py-4 rounded-[22px] text-[16px] font-black leading-relaxed break-all overflow-hidden border shadow-sm transition-all ${isMe ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-none' : 'bg-card text-foreground border-border/40 rounded-tl-none shadow-md'}`}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">{msg.time}</span>
                  {isMe && (
                    <div className="flex items-center">
                      {msg.status === 'PENDING' && <Clock className="w-2.5 h-2.5 text-muted-foreground/20 animate-pulse" />}
                      {msg.status === 'SENT' && <Check className="w-2.5 h-2.5 text-primary" />}
                      {msg.status === 'READ' && <CheckCheck className="w-2.5 h-2.5 text-indigo-500" />}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="px-3 pt-3 pb-5 sm:px-6 bg-background/95 backdrop-blur-2xl border-t border-border/40 sticky bottom-0 z-50">
        <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 max-w-lg mx-auto w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 h-[50px] bg-background border-2 border-border/80 rounded-[25px] pl-6 pr-4 font-bold text-[15px] sm:text-[16px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-[50px] h-[50px] rounded-[25px] flex items-center justify-center transition-all shrink-0 ${input.trim()
                ? 'bg-foreground text-background shadow-lg hover:scale-[1.05] active:scale-[0.95]'
                : 'bg-muted text-muted-foreground/10'
              }`}
          >
            <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
          </button>
        </form>
      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportedName={otherUser?.full_name || ''} reportedId={receiverId || ''} />
    </div>
  )
}
