import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { questions as sourceQuestions } from '../lib/questions'

export function QuestionnaireReviewPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!profile) return
      
      try {
        const { data } = await supabase
          .from('questionnaire_responses')
          .select('answers')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (data && data.answers) {
          setAnswers(data.answers)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnswers()
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!answers) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black mb-2">No DNA Found</h2>
        <p className="text-muted-foreground mb-8">You haven't completed the matching questionnaire yet.</p>
        <button onClick={() => navigate('/questionnaire')} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-95 transition-all">
          Start Questionnaire
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative selection:bg-primary/20">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-background z-20 sticky top-0 border-b border-border/40 shrink-0">
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="w-12 h-12 rounded-[1.5rem] bg-muted/50 border border-border/50 flex items-center justify-center active:scale-90 transition-all hover:bg-muted shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground tracking-tight">Match Responses</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Your Campus DNA</p>
        </div>
      </header>

      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 relative z-10 px-6 pt-8 pb-24">
        <div className="space-y-4">
          {sourceQuestions.map((q, idx) => {
            const answeredId = answers[q.id]
            const selectedOpt = q.options.find(o => o.id === answeredId)
            
            return (
              <div key={q.id} className="p-5 rounded-[1.5rem] border-2 border-border/40 bg-card flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" /> Question {idx + 1}
                </h3>
                <p className="text-[16px] font-black text-foreground leading-snug">{q.question}</p>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex">
                  <span className="text-[14px] font-bold text-primary">
                    {selectedOpt?.text || <span className="text-muted-foreground">Unanswered</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
