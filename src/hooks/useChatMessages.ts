import { useState, useEffect, useRef, useCallback } from 'react'
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

// ============================================================================
// ISSUE 2 FIX: Dead Chat WebSocket - Cold Start Handoff & Walkie-Talkie Reconnect
// ============================================================================
// When Cloudflare kills idle WebSocket connections, the app can recover without
// refreshing the page. The physics:
//
// 1. COLD START HANDOFF: When user opens chat, fetch messages via HTTP first
//    (always works), then open WebSocket in background for live updates.
//
// 2. WALKIE-TALKIE RECONNECT: When WebSocket dies, show "Tap to Reconnect" button.
//    On tap: fetch missed messages via HTTP, destroy dead WebSocket, create new one.
//
// 3. HTTP FALLBACK: When sending while disconnected, use HTTP insert instead of
//    WebSocket broadcast. Message saves to database and appears on next sync.
// ============================================================================

export type WebSocketState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

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
  setTyping: (isTyping: boolean) => void
  isOtherUserTyping: boolean
  isRealtimeConnected: boolean
  loadMoreMessages: () => Promise<void>
  hasMoreMessages: boolean
  isLoadingMore: boolean
  // NEW: WebSocket state management
  wsConnectionState: WebSocketState
  reconnectAvailable: boolean
  reconnectWebSocket: () => Promise<void>
}

export function useChatMessages(threadId: string | undefined): UseChatMessagesReturn {
  const { user, profile } = useAuth()
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
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // NEW: WebSocket state management
  const [wsConnectionState, setWsConnectionState] = useState<WebSocketState>('idle')
  const [reconnectAvailable, setReconnectAvailable] = useState(false)
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string>(new Date().toISOString())
  
  // Law D: useRef to prevent infinite refetch loops
  const isFetchingRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)
  
  // Debounced localStorage write ref
  const localStorageWriteTimeoutRef = useRef<number | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const channelRef = useRef<any>(null)
  
  // App visibility refs for foreground delta sync
  const lastVisibilityChangeRef = useRef<number>(0)
  const isAppVisibleRef = useRef(true)
  
  // Debounced localStorage write function
  const debouncedLocalStorageWrite = useRef((threadId: string | undefined, data: any) => {
    if (localStorageWriteTimeoutRef.current) {
      clearTimeout(localStorageWriteTimeoutRef.current)
    }
    
    localStorageWriteTimeoutRef.current = setTimeout(() => {
      if (threadId) {
        try {
          localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify(data))
        } catch (e) {
          console.error("LocalStorage write error:", e)
        }
      }
    }, 2000) // 2 second debounce
  }).current

  // ============================================================================
  // COLD START HANDOFF: Fetch via HTTP first, then open WebSocket in background
  // ============================================================================
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

  // ============================================================================
  // WEBSOCKET CONNECTION MANAGEMENT
  // ============================================================================
  const connectWebSocket = useCallback(async (isReconnect = false) => {
    if (!user || !threadId || isFetchingRef.current) return

    isFetchingRef.current = true
    if (!isReconnect) {
      setIsSyncing(true)
    }
    setWsConnectionState('connecting')
    setReconnectAvailable(false)

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
      const syncTimeout = setTimeout(() => {
        setWsConnectionState('error')
        setReconnectAvailable(true)
        setIsSyncing(false)
        setIsLoading(false)
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

      // COLD START HANDOFF: Fetch via HTTP first (always works)
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

      clearTimeout(syncTimeout)

      const me = profile
      const them = themRes.data

      if (!me || !them) {
        if (!me) {
          console.error("Current profile missing from context")
        } else {
          toast.error("User not found")
          navigate('/dashboard/messages')
        }
        setWsConnectionState('error')
        setReconnectAvailable(true)
        return
      }

      // Pioneer/Payment guard
      const hasAccess = !!(me.has_paid || me.is_pioneer)
      if (!hasAccess) {
        setIsLocked(true)
        setOtherUser(them)
        setWsConnectionState('error')
        setReconnectAvailable(true)
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

        // Update last successful sync timestamp
        setLastSuccessfulSync(new Date().toISOString())

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
        setLastSuccessfulSync(new Date().toISOString())
      }

      // Mark incoming messages as read
      supabase.from('messages').update({ status: 'READ' }).eq('receiver_id', me.id).eq('sender_id', them.id).neq('status', 'READ').then(() => { })

      // ============================================================================
      // OPEN WEBSOCKET IN BACKGROUND (after HTTP fetch completes)
      // ============================================================================
      const channel = supabase
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
              // Use debounced localStorage write instead of immediate write
              debouncedLocalStorageWrite(threadId, {
                messages: updated,
                otherUser: them
              })
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
        .on('broadcast', { event: 'typing' }, (payload: any) => {
          if (payload.payload?.isTyping === true) {
            setIsOtherUserTyping(true)
            // Clear previous timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            // Reset typing indicator after 3 seconds of no typing events
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherUserTyping(false)
            }, 3000)
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true)
            setWsConnectionState('connected')
            setReconnectAvailable(true)
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.warn('Realtime connection limited - WebSocket disconnected')
            setIsRealtimeConnected(false)
            setWsConnectionState('disconnected')
            setReconnectAvailable(true)
          } else if (status === 'CLOSED') {
            setIsRealtimeConnected(false)
            setWsConnectionState('disconnected')
            setReconnectAvailable(true)
          }
        })
      
      channelRef.current = channel

      // Add visibilitychange and focus listeners for foreground delta sync
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !isAppVisibleRef.current) {
          isAppVisibleRef.current = true
          performForegroundDeltaSync()
        } else if (document.visibilityState === 'hidden') {
          isAppVisibleRef.current = false
        }
      }

      const handleFocus = () => {
        if (!isAppVisibleRef.current) {
          isAppVisibleRef.current = true
          performForegroundDeltaSync()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)

    } catch (err) {
      console.error("Chat setup error:", err)
      setWsConnectionState('error')
      setReconnectAvailable(true)
    } finally {
      setIsSyncing(false)
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [threadId, user, profile, navigate])

  // ============================================================================
  // WALKIE-TALKIE RECONNECT: Function to reconnect WebSocket
  // ============================================================================
  const reconnectWebSocket = useCallback(async () => {
    if (!threadId || !profile) return
    
    // Step 1: Destroy old dead WebSocket
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    setIsRealtimeConnected(false)
    setWsConnectionState('connecting')
    setReconnectAvailable(false)
    
    try {
      // Step 2: Fetch missed messages via HTTP (since last successful sync)
      const { data: missedMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${profile.id})`)
        .gt('created_at', lastSuccessfulSync)
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (missedMessages && missedMessages.length > 0) {
        const newMessages = missedMessages.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: (m.sender_id === profile.id ? 'me' : 'them') as 'me' | 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.created_at,
          status: (m.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
        }))
        
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const filteredNew = newMessages.filter(m => !existingIds.has(m.id))
          const combined = [...prev, ...filteredNew]
          const final = combined.slice(-100)
          
          localStorage.setItem(`roommate_chat_${threadId}`, JSON.stringify({
            messages: final,
            otherUser
          }))
          return final
        })
        
        setLastSuccessfulSync(new Date().toISOString())
      }
      
      // Step 3: Create fresh WebSocket
      await connectWebSocket(true)
      
      toast.success('Reconnected to chat')
    } catch (err) {
      console.error('Reconnect error:', err)
      setWsConnectionState('error')
      setReconnectAvailable(true)
      toast.error('Failed to reconnect. Please try again.')
    }
  }, [threadId, profile, otherUser, lastSuccessfulSync, connectWebSocket])

  // Initial connection
  useEffect(() => {
    if (threadId && profile) {
      connectWebSocket(false)
    }
    
    return () => {
      // CLEAN EXIT: Destroy WebSocket when user leaves chat
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsRealtimeConnected(false)
      setWsConnectionState('idle')
      setReconnectAvailable(false)
      
      // Cleanup timeouts
      if (localStorageWriteTimeoutRef.current) clearTimeout(localStorageWriteTimeoutRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [threadId, profile?.id]) // Only re-run when threadId or profile ID changes

  const performForegroundDeltaSync = async () => {
    if (!threadId || !profile || isFetchingRef.current) return
    
    const now = Date.now()
    // Debounce: prevent rapid syncs (minimum 2 seconds apart)
    if (now - lastVisibilityChangeRef.current < 2000) return
    lastVisibilityChangeRef.current = now
    
    isFetchingRef.current = true
    
    try {
      // Get latest cached timestamp
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
      
      // Quick delta sync for messages missed while app was backgrounded
      const { data: deltaRes } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${profile.id})`)
        .gt('created_at', lastTimestamp)
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (deltaRes && deltaRes.length > 0) {
        const fetchedMessages = deltaRes.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: (m.sender_id === profile.id ? 'me' : 'them') as 'me' | 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.created_at,
          status: (m.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
        }))
        
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMessages = fetchedMessages.filter(m => !existingIds.has(m.id))
          const combined = [...prev, ...newMessages]
          const final = combined.slice(-100)
          
          debouncedLocalStorageWrite(threadId, {
            messages: final,
            otherUser
          })
          return final
        })
        
        setLastSuccessfulSync(new Date().toISOString())
        
        // Mark incoming messages as read
        supabase.from('messages').update({ status: 'READ' })
          .eq('receiver_id', profile.id)
          .eq('sender_id', threadId)
          .neq('status', 'READ')
          .then(() => {})
      }
    } catch (error) {
      console.error('Foreground delta sync error:', error)
    } finally {
      isFetchingRef.current = false
    }
  }

  // ============================================================================
  // HTTP FALLBACK: Send via HTTP when WebSocket is disconnected
  // ============================================================================
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

    // 2. Server Sync - ALWAYS use HTTP (works regardless of WebSocket state)
    const { data, error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: threadId,
      content: text,
      status: 'SENT'
    }).select().single()

    if (error) {
      console.error('Message send error:', error)
      
      // Remove the optimistic message so it doesn't stay as a ghost
      setMessages(prev => prev.filter(m => m.id !== tempId))
      
      // Show user feedback only for actual errors (not network drops)
      if (error.code !== 'PGRST116' && error.message !== 'Failed to fetch') {
        toast.error("Failed to send message")
      }
      
      return
    }

    // Also handle case where data is null/undefined (network drop scenario)
    if (!data) {
      console.error('Message send returned no data - possible network drop')
      setMessages(prev => prev.filter(m => m.id !== tempId))
      return
    }

    // 3. Update status to SENT and replace tempId with real ID + SERVER TIMESTAMP
    setMessages(prev => {
      const updated = prev.map(m => m.id === tempId ? {
        ...m,
        id: data.id,
        status: 'SENT' as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ',
        timestamp: data.created_at // Enforce server timeline!
      } : m)
      // Use debounced localStorage write instead of immediate write
      debouncedLocalStorageWrite(threadId, {
        messages: updated,
        otherUser
      })
      return updated
    })
  }

  const loadMoreMessages = async () => {
    if (!threadId || !profile || isLoadingMore || !hasMoreMessages) return
    
    setIsLoadingMore(true)
    const oldestMessage = messages[0]
    if (!oldestMessage) {
      setIsLoadingMore(false)
      return
    }
    
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${profile.id})`)
        .lt('created_at', oldestMessage.timestamp)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (data && data.length > 0) {
        // Reverse to chronological order for prepending
        const olderMessages = data.reverse().map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: (m.sender_id === profile.id ? 'me' : 'them') as 'me' | 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.created_at,
          status: (m.status || 'PENDING') as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ'
        }))
        
        setMessages(prev => {
          const combined = [...olderMessages, ...prev]
          // Update cache with all messages
          debouncedLocalStorageWrite(threadId, {
            messages: combined,
            otherUser
          })
          return combined
        })
        
        // If we got fewer than 20 messages, we've reached the beginning
        if (data.length < 20) {
          setHasMoreMessages(false)
        }
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
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
      setLastSuccessfulSync(new Date().toISOString())
      // Use debounced localStorage write instead of immediate write
      debouncedLocalStorageWrite(threadId, {
        messages: displayMessages,
        otherUser
      })

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

  // Typing indicator function - only works if WebSocket is connected
  const setTyping = useCallback((isTyping: boolean) => {
    // HTTP FALLBACK: If WebSocket is disconnected, don't try to send typing indicator
    if (wsConnectionState !== 'connected' || !channelRef.current || !threadId || !profile) return
    
    if (isTyping) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: true }
      })
    }
  }, [wsConnectionState, threadId, profile])
  
  return {
    messages,
    otherUser,
    isLoading,
    isSyncing,
    isLocked,
    loadingStep,
    progress,
    sendMessage,
    refreshMessages,
    setTyping,
    isOtherUserTyping,
    isRealtimeConnected,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    // NEW: WebSocket state management
    wsConnectionState,
    reconnectAvailable,
    reconnectWebSocket
  }
}
