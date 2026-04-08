import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { UserProfile } from '../types/database'

export interface ChatMessage {
  id: string
  text: string
  sender: 'me' | 'them'
  time: string
  timestamp: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
}

interface UseChatMessagesReturn {
  messages: ChatMessage[]
  otherUser: any
  isLoading: boolean
  isSyncing: boolean
  isLocked: boolean
  loadingStep: number
  progress: number
  sendMessage: (text: string) => Promise<void>
  refreshMessages: () => Promise<void>
}

export function useChatMessages(threadId: string | undefined): UseChatMessagesReturn {
  const { user, profile, setIsTrafficHeavy } = useAuth()
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLocked, setIsLocked] = useState(() => {
    if (!profile) return false
    return !(profile.has_paid || profile.is_pioneer)
  })
  
  
  // Law D: useRef to prevent infinite refetch loops
  const isFetchingRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)


  useEffect(() => {
    if (!threadId) return
    
    // Load cache immediately
    const cached = localStorage.getItem(`roommate_chat_${threadId}`)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.messages) setMessages(parsed.messages)
        if (parsed.otherUser) setOtherUser(parsed.otherUser)
        setIsLoading(false)
      } catch (e) {
        console.error("Chat cache error:", e)
      }
    }
  }, [threadId])

  useEffect(() => {
    let isMounted = true
    let channel: any = null
    let syncTimeout: any = null

    async function setupChat(retries = 2) {
      if (!user || !threadId || isFetchingRef.current) return

      isFetchingRef.current = true
      setIsSyncing(true)

      try {
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

        // 10 Second Fail-Safe Timeout
        syncTimeout = setTimeout(() => {
          if (isMounted) setIsSyncing(false)
        }, 10000)

        // Determine Delta starting point
        const cachedSlice = localStorage.getItem(`roommate_chat_${threadId}`)
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

        // Optimized Fetch: Limit to last 50 messages
        const deltaPromise = supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${myId})`)
          .gt('created_at', lastTimestamp)
          .order('created_at', { ascending: false })
          .limit(50)

        const [themRes, deltaRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', threadId).single(),
          deltaPromise
        ])

        if (!isMounted) return

        const me = profile
        const them = themRes.data

        if (!me || !them) {
          if (!me) {
            console.error("Current profile missing from context")
          } else {
            toast.error("User not found")
            navigate('/dashboard/messages')
          }
          return
        }

        // Pioneer/Payment guard
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
            sender: (m.sender_id === me.id ? 'me' : 'them') as 'me' | 'them',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: m.created_at,
            status: (m.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
          }))

          // Merge: Cache + Delta
          setMessages(prev => {
            const existingIds = new Set(fetchedMessages.map(m => m.id))
            const filteredPrev = prev.filter(m => !existingIds.has(m.id))
            const combined = [...filteredPrev, ...fetchedMessages]
            const final = combined.slice(-100)

            localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify({
              messages: final,
              otherUser: them
            }))
            return final
          })

          // Step 4: Finalizing
          setLoadingStep(3)
          setProgress(100)
          sessionStorage.setItem(`chat_synced_${threadId}`, 'true')

          // Boutique speed-up: Minimal delay
          await new Promise(r => setTimeout(r, 300))
        } else {
          // Even if no new messages, we are synced
          setLoadingStep(3)
          setProgress(100)
          sessionStorage.setItem(`chat_synced_${threadId}`, 'true')
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
              const newMessage: ChatMessage = {
                id: payload.new.id,
                text: payload.new.content,
                sender: 'them',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: payload.new.created_at,
                status: (payload.new.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
              }
              setMessages(prev => {
                const updated = [...prev, newMessage]
                localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify({
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
            // Update message status in real-time
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id ? { ...msg, status: (payload.new.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' } : msg
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
          setIsLoading(false)
          setIsSyncing(false)
          if (syncTimeout) clearTimeout(syncTimeout)
        }
      }
    }

    setupChat()

    return () => {
      isMounted = false
      isFetchingRef.current = false
      if (syncTimeout) clearTimeout(syncTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [threadId, user, profile, navigate, setIsTrafficHeavy])

  const sendMessage = async (text: string) => {
    if (!text.trim() || !threadId || !profile) return

    const tempId = Date.now().toString()

    // 1. Optimistic Update (PENDING)
    const now = new Date()
    const myNewMessage: ChatMessage = {
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
      receiver_id: threadId,
      content: text,
      status: 'SENT'
    }).select().single()

    if (error) {
      toast.error("Failed to send message")
      setMessages(prev => prev.filter(m => m.id !== tempId))
      return
    }

    // 3. Update status to SENT and replace tempId with real ID + SERVER TIMESTAMP
    if (data) {
      setMessages(prev => {
        const updated = prev.map(m => m.id === tempId ? {
          ...m,
          id: data.id,
          status: 'SENT' as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ',
          timestamp: data.created_at // Enforce server timeline!
        } : m)
        localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify({
          messages: updated,
          otherUser
        }))
        return updated
      })
    }
  }

  const refreshMessages = async () => {
    if (!threadId || !profile || isFetchingRef.current) return

    isFetchingRef.current = true
    const now = Date.now()
    if (now - lastRefreshRef.current < 1000) {
      // Debounce: prevent rapid refreshes
      await new Promise(r => setTimeout(r, 1000))
    }
    lastRefreshRef.current = now
    
    setIsSyncing(true)
    setLoadingStep(0)
    setProgress(15)

    try {
      const myId = profile.id

      // Fetch all messages for this thread
      const { data: messagesRes, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      const displayMessages: ChatMessage[] = messagesRes.map((m: any) => ({
        id: m.id,
        text: m.content,
        sender: (m.sender_id === myId ? 'me' : 'them') as 'me' | 'them',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: m.created_at,
        status: (m.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
      }))

      setMessages(displayMessages)
      localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify({
        messages: displayMessages,
        otherUser
      }))

      setLoadingStep(3)
      setProgress(100)
      sessionStorage.setItem(`chat_synced_${threadId}`, 'true')

      await new Promise(r => setTimeout(r, 300))
    } catch (error) {
      console.error('Error refreshing messages:', error)
      toast.error('Failed to refresh messages')
    } finally {
      setIsSyncing(false)
      isFetchingRef.current = false
    }
  }

  return {
    messages,
    otherUser,
    isLoading,
    isSyncing,
    isLocked,
    loadingStep,
    progress,
    sendMessage,
    refreshMessages
  }
}
