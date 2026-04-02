import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, RefreshCw, ChevronLeft, AlertCircle } from 'lucide-react'
import { questions as sourceQuestions, Question } from '../lib/questions'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

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
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY)
    const savedOrder = localStorage.getItem(ORDER_KEY)

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
        if (count < questionOrder.length) {
          setCurrentIndex(count)
        }
      } catch { /* fresh start */ }
    }

    setReady(true)
  }, [])

  const currentQ = questions[currentIndex]
  const progressPercent = ((currentIndex) / questions.length) * 100

  const performSubmission = async (currentAnswers: Record<string, string>) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 15000, "Auth handshake timeout.")
      if (!user) throw new Error('Session expired.')

      const { data: profile } = await withTimeout(
        supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle(),
        20000,
        "Database handshake timeout."
      )
      if (!profile) throw new Error('Identity Hub not found.')

      const { error: upsertError } = await withTimeout(
        supabase.from('questionnaire_responses').upsert({
          user_id: profile.id,
          answers: currentAnswers,
          completed_at: new Date().toISOString()
        }),
        30000,
        "Data transfer timeout."
      )
      if (upsertError) throw upsertError

      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000, "Security timeout.")
      if (!session) throw new Error('Verification failed.')

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
      navigate('/questionnaire/calculation')
    } catch (error: any) {
      setSubmitError(error.message || 'Network unresponsive.')
      toast.error('Sync Interrupted')
    }
  }

  const handleSelect = (optionId: string) => {
    if (selectedAnswer !== null && selectedAnswer === optionId) return
    setSelectedAnswer(optionId)

    const nextAnswers = { ...answers, [currentQ.id]: optionId }
    setAnswers(nextAnswers)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers))

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
      } else {
        await performSubmission(nextAnswers)
      }
    }, 550)
  }

  if (!ready || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">Warming Engine</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative selection:bg-primary/20">
      <div className="fixed top-0 left-0 w-full h-[4px] bg-muted/30 z-50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />
      </div>

      <div className="w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 relative z-10">
        <header className="px-6 pt-12 pb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-[1.5rem] bg-muted/50 border border-border/50 flex items-center justify-center active:scale-90 transition-all hover:bg-muted"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex bg-muted/50 border border-border/50 px-6 py-2 rounded-[1.5rem] items-center">
            <span className="text-[13px] font-black text-foreground uppercase tracking-[0.2em] tabular-nums">
              {currentIndex + 1} <span className="opacity-30 text-[10px] mx-1">/</span> {questions.length}
            </span>
          </div>

          <div className="w-12 h-12" />
        </header>

        <main className="flex-1 px-6 pt-10 pb-16 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-center min-h-[35vh]">
                <h1 className="text-[34px] md:text-[52px] font-black leading-[1.05] tracking-tight text-foreground">
                  {currentQ.question}
                </h1>
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                {currentQ.options.map((opt: any, idx: number) => {
                  const isSelected = selectedAnswer === opt.id
                  const isDimmed = selectedAnswer !== null && !isSelected

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => handleSelect(opt.id)}
                        disabled={selectedAnswer !== null && selectedAnswer !== opt.id}
                        className={`
                          relative w-full p-7 rounded-[1.5rem] border-2 text-left transition-all duration-400 group flex items-center gap-5 shadow-sm
                          ${isSelected 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-[6px] ring-primary/5 z-10' 
                            : 'border-border/40 bg-card hover:border-primary/30 hover:bg-muted/40'}
                          ${isDimmed ? 'opacity-20 grayscale-[80%]' : 'opacity-100'}
                        `}
                      >
                        <div className={`
                          w-7 h-7 rounded-[0.8rem] border-2 flex items-center justify-center shrink-0 transition-all duration-400
                          ${isSelected ? 'border-primary bg-primary scale-110 shadow-md' : 'border-muted-foreground/20 group-hover:border-primary/40'}
                        `}>
                          {isSelected && <Check className="w-4 h-4 text-primary-foreground stroke-[4]" />}
                        </div>
                        <span className={`text-[17px] md:text-[20px] font-black transition-colors tracking-tight ${isSelected ? 'text-primary' : 'text-foreground/90'}`}>
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

      {/* Sync Diagnostic Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center px-10 text-center"
          >
            <div className="relative mb-12">
               <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-[1.5rem] bg-primary/10 flex items-center justify-center"
               >
                 <RefreshCw className="w-12 h-12 text-primary" />
               </motion.div>
              <div className="absolute -inset-10 rounded-[1.5rem] border-2 border-primary/20 animate-ping opacity-20" />
            </div>

            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Analyzing Your DNA</h3>
            
            {!submitError ? (
              <p className="max-w-md text-[14px] font-bold text-muted-foreground uppercase tracking-[0.3em] animate-pulse">
                Syncing with campus records...
              </p>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="max-w-md text-[14px] font-black text-red-500 uppercase tracking-widest mb-10 leading-relaxed shadow-sm">
                  {submitError}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => performSubmission(answers)}
                    className="px-10 py-5 bg-foreground text-background rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Retry Sync
                  </button>
                  <button
                    onClick={() => { setIsSubmitting(false); setSubmitError(null); }}
                    className="px-10 py-5 bg-muted text-muted-foreground rounded-[1.5rem] font-black uppercase tracking-widest"
                  >
                    Abort
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
