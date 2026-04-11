import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flag, Lock, CheckCheck, Clock, ChevronLeft, Send, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReportModal } from '../components/dashboard/ReportModal'
import { useChatMessages } from '../hooks/useChatMessages'
import { PAYMENT_AMOUNT } from '../lib/constants'
import DrawingHouseLoader from '../components/ui/DrawingHouseLoader'

// Helper function to format relative time
function formatLastSeen(lastActive: string | null | undefined): string {
  if (!lastActive) return 'Unknown'
  
  const now = new Date()
  const lastSeen = new Date(lastActive)
  const diffMs = now.getTime() - lastSeen.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return lastSeen.toLocaleDateString()
}

export function ChatPage() {
  const { id: receiverId } = useParams()
  const navigate = useNavigate()

  // Use chat messages hook
  const {
    messages,
    otherUser,
    isLoading,
    isSyncing,
    isLocked,
    loadingStep,
    progress,
    sendMessage,
    setTyping,
    isOtherUserTyping,
    isRealtimeConnected,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore
  } = useChatMessages(receiverId)

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  const typingTimeoutRef = useRef<number | null>(null)

  // Scroll to bottom on messages change and on initial mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Also scroll on initial mount when messages are loaded
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isLoading, messages.length])
  
  // Debounced typing indicator
  const handleInputChange = useCallback((value: string) => {
    setMessageText(value)
    
    // Send typing indicator when user starts typing
    if (value.trim()) {
      setTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = window.setTimeout(() => {
        setTyping(false)
      }, 2000)
    }
  }, [setTyping])
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])
  
  // Scroll handler for upward pagination
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || isLoadingMore || !hasMoreMessages) return
    
    // Trigger load more when near top (within 50px)
    if (container.scrollTop < 50) {
      // Save scroll position before prepending
      const oldScrollHeight = container.scrollHeight
      scrollPositionRef.current = container.scrollTop
      
      loadMoreMessages().then(() => {
        // Restore scroll position after React re-renders
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - oldScrollHeight + scrollPositionRef.current
          }
        })
      })
    }
  }, [isLoadingMore, hasMoreMessages, loadMoreMessages])


  return (
    <div className="flex flex-col w-full h-[100dvh] bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30 overflow-x-hidden max-w-[100vw]">
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <DrawingHouseLoader />

            <div className="max-w-xs w-full space-y-6 mt-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Loading Chat</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                  {loadingStep === 0 && "Checking account"}
                  {loadingStep === 1 && "Signing you in"}
                  {loadingStep === 2 && "Updating data"}
                  {loadingStep === 3 && "Opening chatroom"}
                </p>
              </div>

              <div className="relative w-full max-w-[240px] h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                />
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </div>

              <p className="text-[13px] font-bold text-muted-foreground/60">
                Opening your conversation...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="chat-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <DrawingHouseLoader />

            <div className="max-w-xs w-full space-y-6 mt-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Checking messages</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                  {loadingStep === 0 && "Checking account"}
                  {loadingStep === 1 && "Signing you in"}
                  {loadingStep === 2 && "Almost done"}
                  {loadingStep === 3 && "Opening chatroom"}
                </p>
              </div>

              <div className="relative w-full max-w-[240px] h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                />
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </div>

              <p className="text-[13px] font-bold text-muted-foreground/60">
                One moment...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !isSyncing && (
        <>
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2rem]" />
                <Lock className="w-9 h-9 text-primary z-10" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Messages Locked</h2>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  Unlock your matches for GHS {PAYMENT_AMOUNT} to start private conversations with your top roommate matches.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Network Status Indicator */}
              <AnimatePresence>
                {!isRealtimeConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-amber-500/90 backdrop-blur-sm text-white px-4 py-2 text-sm font-bold flex items-center gap-2"
                  >
                    <WifiOff className="w-4 h-4" />
                    Waiting for network...
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/40">
                <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => navigate('/dashboard/messages')}
                      className="p-2 rounded-xl hover:bg-muted/50 transition-colors flex-shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    {otherUser && (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-muted border border shadow-inner overflow-hidden relative flex-shrink-0">
                          <img src={otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + otherUser.id} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[16px] font-black text-foreground truncate tracking-tight">{otherUser.full_name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {formatLastSeen(otherUser.last_active)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors flex-shrink-0"
                  >
                    <Flag className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 pb-4"
              >
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Load more indicator at top */}
                  {isLoadingMore && (
                    <div className="py-4 flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div className={`flex gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`relative flex-shrink-0 overflow-hidden ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} p-3 rounded-[22px] max-w-[260px] sm:max-w-[320px] shadow-sm flex flex-col min-w-0`}>
                            <p className={`text-sm leading-relaxed break-words overflow-wrap-anywhere ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                              {msg.text}
                            </p>
                            <div className={`flex items-center gap-1.5 mt-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                              {msg.sender === 'me' && msg.status === 'READ' && (
                                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <CheckCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              {msg.sender === 'me' && msg.status === 'DELIVERED' && (
                                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                  <CheckCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              {msg.sender === 'me' && msg.status === 'SENT' && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              {msg.sender === 'me' && msg.status === 'PENDING' && (
                                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                  <Clock className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              <span className={`text-[11px] font-black uppercase tracking-widest ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {/* Bottom scroll anchor */}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Typing Indicator - iOS iMessage Style */}
              <AnimatePresence>
                {isOtherUserTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 py-2 flex justify-start"
                  >
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input Bar */}
              <div className="px-4 py-3 bg-card border-t border-border/40">
                <div className="max-w-2xl mx-auto flex gap-3 items-center">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        sendMessage(messageText.trim())
                        setMessageText('')
                        setTyping(false)
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-muted/50 rounded-2xl border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium"
                  />
                  <button
                    onClick={() => {
                      if (messageText.trim()) {
                        sendMessage(messageText.trim())
                        setMessageText('')
                        setTyping(false)
                      }
                    }}
                    disabled={!messageText.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {receiverId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedId={receiverId}
          reportedName={otherUser?.full_name || 'User'}
        />
      )}
    </div>
  )
}
