import { useState, useEffect, useRef } from 'react'
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

interface UseChatThreadsReturn {
  chats: ChatThread[]
  isLoading: boolean
  refreshChats: () => Promise<void>
}

export function useChatThreads(): UseChatThreadsReturn {
  const { user, profile, setIsTrafficHeavy } = useAuth()
  
  const [chats, setChats] = useState<ChatThread[]>(() => {
    const cached = localStorage.getItem('roommate_chat_threads')
    return cached ? JSON.parse(cached) : []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Law D: useRef to prevent infinite refetch loops
  const lastRefreshRef = useRef<number>(0)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    let channel: any = null

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
    channel = supabase
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
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime connection limited - switching to High Traffic Mode')
          setIsTrafficHeavy(true)
        }
      })

    return () => {
      isMounted = false
      isFetchingRef.current = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [user, profile, setIsTrafficHeavy])

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
    refreshChats
  }
}
