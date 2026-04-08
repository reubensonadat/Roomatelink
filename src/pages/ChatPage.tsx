import { useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Flag, Lock, CheckCheck, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReportModal } from '../components/dashboard/ReportModal'
import { useChatMessages } from '../hooks/useChatMessages'
import { PAYMENT_AMOUNT } from '../lib/constants'
import DrawingHouseLoader from '../components/ui/DrawingHouseLoader'

export function ChatPage() {
  const { id: receiverId } = useParams()
  
  // Use chat messages hook
  const {
    messages,
    otherUser,
    isLoading,
    isSyncing,
    isLocked,
    loadingStep,
    progress
  } = useChatMessages(receiverId)
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/10 relative selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
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
                <h3 className="text-2xl font-black text-foreground tracking-tight">Syncing Vault</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                  {loadingStep === 0 && "Establishing Secure Link"}
                  {loadingStep === 1 && "Verifying Credentials"}
                  {loadingStep === 2 && "Recovering Records"}
                  {loadingStep === 3 && "Optimizing Inbox"}
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

              <p className="text-[13px] font-bold text-muted-foreground">
                Synchronizing with Institutional Servers...
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
                <h3 className="text-2xl font-black text-foreground tracking-tight">Syncing Vault</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary h-4">
                  {loadingStep === 0 && "Establishing Secure Link"}
                  {loadingStep === 1 && "Verifying Credentials"}
                  {loadingStep === 2 && "Recovering Records"}
                  {loadingStep === 3 && "Optimizing Inbox"}
                </p>
              </div>

              {/* Boutique Progress Bar */}
              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                />
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </div>

              <p className="text-[13px] font-bold text-muted-foreground">
                Synchronizing with Institutional Servers...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !isSyncing && (
        <>
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2.5rem]" />
                <Lock className="w-10 h-10 text-primary z-10" />
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
              <div className="flex flex-col items-center justify-between px-4 py-3 bg-card border-b border-border/40">
                <div className="flex items-center gap-3">
                  {otherUser && (
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-muted border border shadow-inner overflow-hidden relative">
                        <img src={otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + otherUser.id} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[17px] font-black text-foreground truncate tracking-tight">{otherUser.full_name}</span>
                        {otherUser.last_active ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Last seen today
                          </>
                        ) : (
                          <span>Last seen {otherUser.last_active}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <Flag className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-32">
                <div className="max-w-2xl mx-auto space-y-4">
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
                          <div className={`flex-shrink-0 ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} p-3.5 rounded-[22px] max-w-[280px] shadow-sm`}>
                            {msg.sender === 'me' && msg.status === 'READ' && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-card flex items-center justify-center">
                                <CheckCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {msg.sender === 'me' && msg.status === 'SENT' && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-card flex items-center justify-center">
                                <CheckCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {msg.sender === 'me' && msg.status === 'PENDING' && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-4 border-card flex items-center justify-center">
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <p className={`text-sm leading-relaxed ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                              {msg.text}
                            </p>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
