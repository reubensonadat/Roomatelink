import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface ChatThread {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  isOnline: boolean
}

// ============================================================================
// ISSUE 2 FIX: Dead Chat WebSocket - Same Pattern for Thread List
// ============================================================================
// WebSocket state management for the thread list (messages list page)
// Uses same pattern as useChatMessages for consistency
// ============================================================================

export type WebSocketState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseChatThreadsReturn {
  chats: ChatThread[]
  isLoading: boolean
  refreshChats: () => Promise<void>
  // NEW: WebSocket state management
  wsConnectionState: WebSocketState
  reconnectAvailable: boolean
  reconnectWebSocket: () => Promise<void>
}

export function useChatThreads(): UseChatThreadsReturn {
  const { user, profile } = useAuth()
  
  const [chats, setChats] = useState<ChatThread[]>(() => {
    const cached = localStorage.getItem('roommate_chat_threads')
    return cached ? JSON.parse(cached) : []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  
  // NEW: WebSocket state management
  const [wsConnectionState, setWsConnectionState] = useState<WebSocketState>('idle')
  const [reconnectAvailable, setReconnectAvailable] = useState(false)
  
  // Law D: useRef to prevent infinite refetch loops
  const lastRefreshRef = useRef<number>(0)
  const isFetchingRef = useRef(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchChats(retries = 2) {
      if (!user || isFetchingRef.current) return

      isFetchingRef.current = true
      setIsLoading(true)

      try {
        const currentProfile = profile || await (async () => {
          const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
          return data
        })()

        if (!currentProfile) {
          setIsLoading(false)
          isFetchingRef.current = false
          return
        }

        const isPaid = !!(currentProfile.has_paid || currentProfile.is_pioneer)
        const [, messagesRes] = await Promise.all([
          supabase.from('questionnaire_responses').select('id').eq('user_id', currentProfile.id).maybeSingle(),
          isPaid
            ? supabase.from('messages').select('*').or(`sender_id.eq.${currentProfile.id},receiver_id.eq.${currentProfile.id}`).order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as any[], error: null })
        ])

        if (!isPaid) {
          setIsLoading(false)
          isFetchingRef.current = false
          return
        }

        const msgs = messagesRes.data

        if (msgs && msgs.length > 0) {
          const idsToFetch = new Set<string>()
          msgs.forEach(m => {
             if (m.sender_id !== currentProfile.id) idsToFetch.add(m.sender_id)
             if (m.receiver_id !== currentProfile.id) idsToFetch.add(m.receiver_id)
          })

          if (idsToFetch.size === 0) return
          
          const { data: chatUsers } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, last_active')
            .in('id', Array.from(idsToFetch))

          const usersMap = new Map((chatUsers || []).map(u => [u.id, u]))

          const threads: Record<string, ChatThread> = {}
          msgs.forEach((m: any) => {
            const otherId = m.sender_id === currentProfile.id ? m.receiver_id : m.sender_id
            const other = usersMap.get(otherId) as any

            if (other && !threads[other.id]) {
              const lastActiveDate = new Date(other.last_active)
              const isOnline = (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000

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
          if (isMounted) {
            setChats(threadList)
            localStorage.setItem('roommate_chat_threads', JSON.stringify(threadList))
            lastRefreshRef.current = Date.now()
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error)
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return fetchChats(retries - 1)
        }
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchChats()

    // Real-time subscription for new messages
    const channel = supabase
      .channel('messages-list-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile?.id}`
      }, async (payload: any) => {
        const newMsg = payload.new
        const senderId = newMsg.sender_id

        setChats(prev => {
          const existingIndex = prev.findIndex(c => c.id === senderId)
          const updatedChats = [...prev]

          if (existingIndex !== -1) {
            const thread = { ...updatedChats[existingIndex] }
            thread.lastMessage = newMsg.content
            thread.time = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            thread.unread = (thread.unread || 0) + 1
            
            updatedChats.splice(existingIndex, 1)
            updatedChats.unshift(thread)
          } else {
            fetchChats()
            return prev
          }
          
          localStorage.setItem('roommate_chat_threads', JSON.stringify(updatedChats))
          return updatedChats
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setWsConnectionState('connected')
          setReconnectAvailable(true)
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime connection limited - WebSocket disconnected')
          setWsConnectionState('disconnected')
          setReconnectAvailable(true)
        } else if (status === 'CLOSED') {
          setWsConnectionState('disconnected')
          setReconnectAvailable(true)
        }
      })

    channelRef.current = channel

    return () => {
      isMounted = false
      isFetchingRef.current = false
      if (channel) supabase.removeChannel(channel)
      channelRef.current = null
      setWsConnectionState('idle')
      setReconnectAvailable(false)
    }
  }, [user, profile])

  // ============================================================================
  // WALKIE-TALKIE RECONNECT: Function to reconnect WebSocket
  // ============================================================================
  const reconnectWebSocket = useCallback(async () => {
    if (!user || !profile) return
    
    // Step 1: Destroy old dead WebSocket
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    setWsConnectionState('connecting')
    setReconnectAvailable(false)
    
    try {
      // Step 2: Fetch latest chats via HTTP
      const isPaid = !!(profile.has_paid || profile.is_pioneer)
      const [, messagesRes] = await Promise.all([
        supabase.from('questionnaire_responses').select('id').eq('user_id', profile.id).maybeSingle(),
        isPaid
          ? supabase.from('messages').select('*').or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] as any[], error: null })
      ])

      if (!isPaid) return

      const msgs = messagesRes.data

      if (msgs && msgs.length > 0) {
        const idsToFetch = new Set<string>()
        msgs.forEach(m => {
           if (m.sender_id !== profile.id) idsToFetch.add(m.sender_id)
           if (m.receiver_id !== profile.id) idsToFetch.add(m.receiver_id)
        })

        if (idsToFetch.size === 0) return
        
        const { data: chatUsers } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, last_active')
          .in('id', Array.from(idsToFetch))

        const usersMap = new Map((chatUsers || []).map(u => [u.id, u]))

        const threads: Record<string, ChatThread> = {}
        msgs.forEach((m: any) => {
          const otherId = m.sender_id === profile.id ? m.receiver_id : m.sender_id
          const other = usersMap.get(otherId) as any

          if (other && !threads[other.id]) {
            const lastActiveDate = new Date(other.last_active)
            const isOnline = (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000

            threads[other.id] = {
              id: other.id,
              name: other.full_name,
              avatar: other.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + other.id,
              lastMessage: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: m.receiver_id === profile.id && m.status !== 'READ' ? 1 : 0,
              isOnline
            }
          } else if (other && m.receiver_id === profile.id && m.status !== 'READ') {
            threads[other.id].unread++
          }
        })

        const threadList = Object.values(threads)
        setChats(threadList)
        localStorage.setItem('roommate_chat_threads', JSON.stringify(threadList))
        lastRefreshRef.current = Date.now()
      }
      
      // Step 3: Create fresh WebSocket
      const newChannel = supabase
        .channel('messages-list-sync')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`
        }, async (payload: any) => {
          const newMsg = payload.new
          const senderId = newMsg.sender_id

          setChats(prev => {
            const existingIndex = prev.findIndex(c => c.id === senderId)
            const updatedChats = [...prev]

            if (existingIndex !== -1) {
              const thread = { ...updatedChats[existingIndex] }
              thread.lastMessage = newMsg.content
              thread.time = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              thread.unread = (thread.unread || 0) + 1
              
              updatedChats.splice(existingIndex, 1)
              updatedChats.unshift(thread)
            } else {
              // Trigger full fetch for new conversation
              return prev
            }
            
            localStorage.setItem('roommate_chat_threads', JSON.stringify(updatedChats))
            return updatedChats
          })
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setWsConnectionState('connected')
            setReconnectAvailable(true)
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            setWsConnectionState('disconnected')
            setReconnectAvailable(true)
          } else if (status === 'CLOSED') {
            setWsConnectionState('disconnected')
            setReconnectAvailable(true)
          }
        })
      
      channelRef.current = newChannel
      
    } catch (err) {
      console.error('Reconnect error:', err)
      setWsConnectionState('error')
      setReconnectAvailable(true)
    }
  }, [user, profile])

  const refreshChats = async () => {
    isFetchingRef.current = false
    const now = Date.now()
    if (now - lastRefreshRef.current < 1000) {
      // Debounce: prevent rapid refreshes
      await new Promise(r => setTimeout(r, 1000))
    }
    lastRefreshRef.current = now
    
    // Trigger refetch by re-running the fetch logic
    isFetchingRef.current = false
    setIsLoading(true)
    
    try {
      const currentProfile = profile
      if (!currentProfile) return

      const isPaid = !!(currentProfile.has_paid || currentProfile.is_pioneer)
      const [, messagesRes] = await Promise.all([
        supabase.from('questionnaire_responses').select('id').eq('user_id', currentProfile.id).maybeSingle(),
        isPaid
          ? supabase.from('messages').select('*').or(`sender_id.eq.${currentProfile.id},receiver_id.eq.${currentProfile.id}`).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] as any[], error: null })
      ])

      if (!isPaid) return

      const msgs = messagesRes.data

      if (msgs && msgs.length > 0) {
        const idsToFetch = new Set<string>()
        msgs.forEach(m => {
           if (m.sender_id !== currentProfile.id) idsToFetch.add(m.sender_id)
           if (m.receiver_id !== currentProfile.id) idsToFetch.add(m.receiver_id)
        })

        if (idsToFetch.size === 0) return
        
        const { data: chatUsers } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, last_active')
          .in('id', Array.from(idsToFetch))

        const usersMap = new Map((chatUsers || []).map(u => [u.id, u]))

        const threads: Record<string, ChatThread> = {}
        msgs.forEach((m: any) => {
          const otherId = m.sender_id === currentProfile.id ? m.receiver_id : m.sender_id
          const other = usersMap.get(otherId) as any

          if (other && !threads[other.id]) {
            const lastActiveDate = new Date(other.last_active)
            const isOnline = (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000

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
        localStorage.setItem('roommate_chat_threads', JSON.stringify(threadList))
        lastRefreshRef.current = Date.now()
      }
    } catch (error) {
      console.error('Error refreshing chats:', error)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }

  return {
    chats,
    isLoading,
    refreshChats,
    // NEW: WebSocket state management
    wsConnectionState,
    reconnectAvailable,
    reconnectWebSocket
  }
}
