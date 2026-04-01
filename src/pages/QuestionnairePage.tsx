import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, ChevronLeft } from 'lucide-react'
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

const STORAGE_KEY = 'roommate_answers'
const ORDER_KEY = 'roommate_question_order'

export function QuestionnairePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY)
    const savedOrder = localStorage.getItem(ORDER_KEY)

    let questionOrder: Question[]

    if (savedOrder) {
      const orderIds: string[] = JSON.parse(savedOrder)
      questionOrder = orderIds
        .map(id => sourceQuestions.find((q: any) => q.id === id))
        .filter(Boolean) as Question[]
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

  useEffect(() => {
    if (!questions.length) return
    const currentQId = questions[currentIndex]?.id
    setSelectedAnswer(answers[currentQId] || null)
  }, [currentIndex, questions, answers])

  const handleSelect = (optionId: string) => {
    if (selectedAnswer !== null && selectedAnswer === optionId) return
    setSelectedAnswer(optionId)

    const currentQ = questions[currentIndex]
    const nextAnswers = { ...answers, [currentQ.id]: optionId }
    setAnswers(nextAnswers)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers))

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsSubmitting(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          // 1. Get internal profile ID
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single()

          if (!profile) throw new Error('Profile not found')

          // 2. Direct Supabase Upsert (Migration Guide Phase 5)
          const { error } = await supabase
            .from('questionnaire_responses')
            .upsert({
              user_id: profile.id,
              answers: nextAnswers,
              completed_at: new Date().toISOString()
            })

          if (error) throw error

          // 3. Trigger Match Calculation via Edge Function
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No session')

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-calculate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId: profile.id })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Match calculation failed')
          }

          toast.success('Questionnaire saved successfully!')
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(ORDER_KEY)
          navigate('/dashboard')
        } catch (error: any) {
          toast.error(error.message || 'Failed to save responses')
          setIsSubmitting(false)
        }
      }
    }, 550)
  }

  if (!ready || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-primary border-t-transparent animate-spin mb-4" />
        <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">Warming Up</span>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const progressPercent = ((currentIndex) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col relative selection:bg-primary/20">
      <div className="fixed top-0 left-0 w-full h-[4px] bg-muted/60 z-50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      </div>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 relative z-10">
        <header className="px-6 pt-10 pb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center active:scale-95 transition-all hover:bg-muted"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex bg-muted/50 border border-border/50 px-5 py-2 rounded-2xl items-center shadow-sm">
            <span className="text-[14px] font-black text-foreground uppercase tracking-tighter tabular-nums">
              Step {currentIndex + 1} <span className="text-muted-foreground/60 mx-1">/</span> {questions.length}
            </span>
          </div>

          <div className="w-12 h-12" />
        </header>

        <main className="flex-1 px-6 pt-8 pb-12 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-center mb-12">
                <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight text-foreground drop-shadow-sm">
                  {currentQ.question}
                </h1>
              </div>

              <div className="grid gap-4">
                {currentQ.options.map((opt: any, idx: number) => {
                  const isSelected = selectedAnswer === opt.id
                  const isDimmed = selectedAnswer !== null && !isSelected

                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      onClick={() => handleSelect(opt.id)}
                      disabled={selectedAnswer !== null && selectedAnswer !== opt.id}
                      className={`
                        relative w-full p-8 rounded-[2rem] border-2 text-left transition-all duration-300 group
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-4 ring-primary/5' 
                          : 'border-border/40 bg-card hover:border-primary/40 hover:bg-muted/30'}
                        ${isDimmed ? 'opacity-30' : 'opacity-100'}
                      `}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300
                          ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'}
                        `}>
                          {isSelected && <Check className="w-5 h-5 text-primary-foreground stroke-[4]" />}
                        </div>
                        <span className={`text-lg md:text-xl font-bold transition-colors ${isSelected ? 'text-primary' : 'text-foreground/80'}`}>
                          {opt.text}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center">
                 <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div className="absolute -inset-8 rounded-full border-2 border-primary/20 animate-ping opacity-20" />
            </div>
            <h3 className="mt-10 text-2xl font-black text-foreground">Syncing Results</h3>
            <p className="mt-3 text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Calculating Compatibility...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
