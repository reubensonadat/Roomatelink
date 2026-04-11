import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Edit2, Sparkles } from 'lucide-react'
import { questions as sourceQuestions, Question } from '../lib/questions'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import ClassicLoader from '../components/ui/ClassicLoader'

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Diagnostic Timeout Helper
function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ])
}

const STORAGE_KEY = 'roommate_answers'
const ORDER_KEY = 'roommate_question_order'

export function QuestionnairePage() {
  const { user, profile, session } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [editCount, setEditCount] = useState(0)
  const navigate = useNavigate()

  // 1. Auto-Scroll to Top on Question Change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  useEffect(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY)
    const savedOrder = localStorage.getItem(ORDER_KEY)
    const savedEditCount = localStorage.getItem('roommate_edit_count')

    if (savedEditCount) {
      setEditCount(parseInt(savedEditCount) || 0)
    }

    let questionOrder: Question[]

    if (savedOrder) {
      try {
        const orderIds: string[] = JSON.parse(savedOrder)
        questionOrder = orderIds
          .map(id => sourceQuestions.find((q: any) => q.id === id))
          .filter(Boolean) as Question[]
        
        if (questionOrder.length === 0) throw new Error("Empty order")
      } catch {
        questionOrder = shuffle(sourceQuestions)
        localStorage.setItem(ORDER_KEY, JSON.stringify(questionOrder.map(q => q.id)))
      }
    } else {
      questionOrder = shuffle(sourceQuestions)
      localStorage.setItem(ORDER_KEY, JSON.stringify(questionOrder.map(q => q.id)))
    }

    setQuestions(questionOrder)

    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers)
        setAnswers(parsed)
        const count = Object.keys(parsed).length
        if (count === questionOrder.length) {
          setIsReviewing(true)
        } else {
          setCurrentIndex(count)
        }
      } catch { 
        // Fresh start on catch
      }
    }

    setReady(true)
  }, [])

  const currentQ = questions[currentIndex]
  const progressPercent = ((currentIndex) / questions.length) * 100

  const performSubmission = async (currentAnswers: Record<string, string>) => {
    if (!user || !profile || !session) {
      toast.error('Session expired or identity missing. Please refresh the page.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const { error: upsertError } = await withTimeout(
        supabase.from('questionnaire_responses').upsert({
          user_id: profile.id,
          answers: currentAnswers,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' }),
        30000,
        "Data transfer timeout."
      )
      if (upsertError) throw upsertError

      const response = await withTimeout(
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ userId: profile.id })
        }),
        45000,
        "Calculation engine timeout."
      )

      if (!response.ok) {
        console.warn('Edge Function offline.')
      }

      toast.success('DNA Sync Complete!')
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ORDER_KEY)
      localStorage.removeItem('roommate_edit_count')
      navigate('/questionnaire/calculation')
    } catch (error: any) {
      setSubmitError(error.message || 'Network unresponsive.')
      toast.error('Sync Interrupted')
    }
  }

  const handleSelect = (optionId: string) => {
    if (selectedAnswer !== null && selectedAnswer === optionId) return
    setSelectedAnswer(optionId)
    
    // Play boutique click sound and vibrate
    try {
      const CLICK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFRm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT18AZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABk"
      const audio = new Audio(CLICK_SOUND)
      audio.volume = 0.1
      audio.play().catch(() => {})
      if (navigator.vibrate) navigator.vibrate(10)
    } catch (_e) {
      // Sound play error ignored
    }

    const nextAnswers = { ...answers, [currentQ.id]: optionId }
    setAnswers(nextAnswers)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers))

    setTimeout(() => {
      // If we've answered all 40 questions, proceed to Review Stage automatically
      if (Object.keys(nextAnswers).length === questions.length) {
        setSelectedAnswer(null)
        setIsReviewing(true)
      } else if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
      }
    }, 550)
  }

  const LoadingOverlay = () => (
    <AnimatePresence>
      {isSubmitting && (
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center"
         >
            <div className="relative">
               <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <ClassicLoader />
               </div>
               <div className="absolute -inset-4 rounded-full border-2 border-primary/20 animate-ping opacity-20" />
            </div>
            
            <h3 className="mt-8 text-[18px] font-black text-foreground">Analyzing Your DNA</h3>
            
            {!submitError ? (
               <p className="mt-2 text-[13px] font-medium text-muted-foreground animate-pulse">Syncing with campus records...</p>
            ) : (
               <div className="mt-4 flex flex-col items-center">
                  <p className="text-sm font-bold text-red-500 mb-6 bg-red-500/10 dark:bg-red-500/20 px-4 py-2 rounded-2xl">{submitError}</p>
                  <div className="flex gap-4">
                     <button onClick={() => performSubmission(answers)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-sm">Retry Sync</button>
                     <button onClick={() => { setIsSubmitting(false); setSubmitError(null); }} className="px-6 py-2.5 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-2xl font-bold">Abort</button>
                  </div>
               </div>
            )}
         </motion.div>
      )}
    </AnimatePresence>
  )

  if (!ready || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <ClassicLoader />
      <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Loading Questions</span>
      </div>
    )
  }

  if (isReviewing) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative selection:bg-primary/20 overflow-x-hidden max-w-[100vw]">
        <div className="fixed top-0 left-0 w-full h-[4px] bg-muted/30 z-50">
          <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: '100%' }} />
        </div>
        <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 relative z-10 px-6 pt-16 pb-24">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Review Your Preferences</h1>
          <p className="text-muted-foreground font-semibold mb-8">Confirm your answers before running the matching engine.</p>
          
          <div className="space-y-4 mb-12">
            {questions.map((q, idx) => {
              const selectedOpt = q.options.find(o => o.id === answers[q.id])
              return (
                <div key={q.id} className="p-6 rounded-[22px] border-2 border-border/40 bg-card flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                  <div className="flex-1">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Check className="w-3 h-3 text-primary" /> Question {idx + 1}
                    </h3>
                    <p className="text-base font-black text-foreground mb-2 leading-snug">{q.question}</p>
                    <p className="text-primary font-bold text-sm bg-primary/10 inline-block px-3 py-1 rounded-xl">
                      {selectedOpt?.text || 'Unanswered'}
                    </p>
                  </div>
                    <button
                    onClick={() => {
                      if (editCount >= 2) {
                        toast.error("You can only revise a maximum of 2 answers to maintain honesty.")
                        return
                      }
                      setEditCount(prev => {
                        const newCount = prev + 1
                        localStorage.setItem('roommate_edit_count', newCount.toString())
                        return newCount
                      })
                      setCurrentIndex(idx)
                      setIsReviewing(false)
                    }}
                    className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-8 py-4 sm:py-5 rounded-[22px] font-black text-[13px] sm:text-[14px] uppercase tracking-wider sm:tracking-widest group shrink-0 transition-all ${
                      editCount >= 2 
                        ? 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed' 
                        : 'bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" /> {editCount >= 2 ? 'Locked' : 'Revise'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="sticky bottom-6 mt-4">
            <button
               onClick={() => performSubmission(answers)}
               className="w-full py-6 bg-foreground text-background rounded-[22px] font-extrabold uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:text-white active:scale-95 transition-all text-[15px] flex justify-center items-center gap-4 border border-white/5"
            >
               <Sparkles className="w-5 h-5 opacity-60" /> Synchronize DNA
            </button>
          </div>
        </div>
        
        <LoadingOverlay />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative selection:bg-primary/20 overflow-x-hidden">
      {/* Floating Glass Progress Pill */}
      {/* Top Edge Progress Bar: Boutique Cleaner UX */}
      <div className="fixed top-0 left-0 w-full h-[4px] bg-muted/20 z-[100] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-primary shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
        />
      </div>

      <div className="w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 relative z-10">
        <header className="px-6 pt-12 pb-6 flex items-center justify-between">
          <button
            onClick={() => {
              // Exit questionnaire and return to dashboard
              navigate('/dashboard');
            }}
            className="w-14 h-14 rounded-[22px] bg-muted/50 border border-border/50 flex items-center justify-center active:scale-90 transition-all hover:bg-muted shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex bg-muted/50 border border-border/50 px-4 sm:px-8 py-3 rounded-[22px] items-center cursor-pointer hover:bg-muted transition-colors shadow-sm" onClick={() => {
             // Let them peek at the review screen early if they have answered questions
             if (Object.keys(answers).length > 0) setIsReviewing(true)
          }}>
            <span className="text-[14px] font-black text-foreground uppercase tracking-[0.3em] tabular-nums flex items-center gap-2">
              {currentIndex + 1} <span className="opacity-30 text-[10px] mx-1">/</span> {questions.length}
            </span>
          </div>

          <div className="w-12 h-12" />
        </header>

        <main className="flex-1 px-6 pt-24 pb-16 flex flex-col min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-center items-center text-center py-20">
                <h1 className="text-[32px] md:text-[48px] font-black leading-[1.1] tracking-tight text-foreground max-w-[90%] mx-auto">
                  {currentQ.question}
                </h1>
              </div>

              <div className="flex flex-col gap-3.5 mt-auto max-w-lg mx-auto w-full pb-10">
                {currentQ.options.map((opt: any, idx: number) => {
                  const isSelected = selectedAnswer === opt.id
                  const isDimmed = selectedAnswer !== null && !isSelected

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.1 + (idx * 0.05), 
                        type: "spring",
                        stiffness: 260,
                        damping: 20 
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                        <button
                          onClick={() => handleSelect(opt.id)}
                          disabled={selectedAnswer !== null && selectedAnswer !== opt.id}
                          className={`
                            relative w-full p-6 md:p-7 rounded-[22px] border-2 text-left transition-all duration-300 group flex items-center gap-5 shadow-sm
                            ${isSelected 
                              ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 ring-[8px] ring-primary/5 z-10' 
                              : 'border-border/40 bg-card hover:border-primary/30 hover:bg-muted/40'}
                            ${isDimmed ? 'opacity-20 grayscale-[80%]' : 'opacity-100'}
                          `}
                        >
                        <div className={`
                          w-6 h-6 rounded-[0.7rem] border-2 flex items-center justify-center shrink-0 transition-all duration-300
                          ${isSelected ? 'border-primary bg-primary scale-110 shadow-md' : 'border-muted-foreground/30 group-hover:border-primary/40'}
                        `}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[4]" />}
                        </div>
                        <span className={`text-[16px] md:text-[19px] font-black transition-colors tracking-tight ${isSelected ? 'text-primary' : 'text-foreground/90'}`}>
                          {opt.text}
                        </span>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <LoadingOverlay />
    </div>
  )
}
