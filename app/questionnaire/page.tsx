"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { questions as sourceQuestions, Question } from '@/lib/questions';
import { saveQuestionnaireResponses, generateMatches } from '@/lib/auth-actions';
import { toast } from 'sonner';

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const STORAGE_KEY = 'roommate_answers';
const ORDER_KEY = 'roommate_question_order';

export default function QuestionnairePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage (contiguous memory) or create fresh shuffled order
  useEffect(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY);
    const savedOrder = localStorage.getItem(ORDER_KEY);

    let questionOrder: Question[];

    if (savedOrder) {
      // Restore exact order
      const orderIds: string[] = JSON.parse(savedOrder);
      questionOrder = orderIds
        .map(id => sourceQuestions.find(q => q.id === id))
        .filter(Boolean) as Question[];
    } else {
      // Fresh start
      questionOrder = shuffle(sourceQuestions);
      localStorage.setItem(ORDER_KEY, JSON.stringify(questionOrder.map(q => q.id)));
    }

    setQuestions(questionOrder);

    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed);
        const count = Object.keys(parsed).length;
        if (count < questionOrder.length) {
          setCurrentIndex(count);
        }
      } catch { /* fresh start */ }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!questions.length) return;
    const currentQId = questions[currentIndex]?.id;
    if (answers[currentQId]) {
      setSelectedAnswer(answers[currentQId]);
    } else {
      setSelectedAnswer(null);
    }
  }, [currentIndex, questions, answers]);

  const handleSelect = (optionId: string) => {
    if (selectedAnswer !== null && selectedAnswer === optionId) return; // Prevent double trigger on same
    setSelectedAnswer(optionId);

    const currentQ = questions[currentIndex];
    const nextAnswers = { ...answers, [currentQ.id]: optionId };
    setAnswers(nextAnswers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers));

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Final question answered! Save to DB chip chop.
        setIsSubmitting(true);
        const result = await saveQuestionnaireResponses(nextAnswers);
        
        if (result.error) {
          toast.error(result.error);
          setIsSubmitting(false);
        } else {
          // Answers saved! Now generate matches chip chop.
          await generateMatches();
          router.push('/questionnaire/calculation');
        }
      }
    }, 550);
  };

  if (!ready || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-primary border-t-transparent animate-spin mb-4" />
        <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">Loading Engine</span>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  // Calculate exact percentage
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300 relative selection:bg-primary/20">

      {/* Edge-to-Edge Progress Bar at absolute top */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-muted/60 z-50">
        <motion.div
          initial={{ width: `${((currentIndex - 1) / questions.length) * 100}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-primary"
        />
      </div>

      <div className="w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 relative z-10 overflow-y-auto">

        {/* Top Navbar */}
        <header className="px-5 pt-8 pb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
            title="Exit questionnaire (answers are saved)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <div className="flex bg-muted/50 border border-border/50 px-4 py-1.5 rounded-full items-center">
            <span className="text-[12px] font-bold text-foreground uppercase tracking-widest tabular-nums">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="w-10 h-10" /> {/* Spacer to center the pill */}
        </header>

        {/* Content Area */}
        <main className="flex-1 px-5 pt-4 pb-12 flex flex-col justify-between overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col h-full"
            >

              {/* Question Text */}
              <div className="flex-1 flex flex-col justify-center min-h-[30vh]">
                <h1 className="text-[26px] md:text-[34px] font-extrabold leading-[1.25] tracking-tight text-foreground">
                  {currentQ.question}
                </h1>
              </div>

              {/* Options Stack */}
              <div className="flex flex-col gap-3 mt-auto">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswer === opt.id;
                  const isDimmed = selectedAnswer !== null && !isSelected;

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.15 + optIdx * 0.06,
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <button
                        onClick={() => handleSelect(opt.id)}
                        disabled={selectedAnswer !== null && selectedAnswer !== opt.id}
                        className={`relative w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-[2.5px] text-left transition-all duration-300 ease-out
                        ${isSelected
                            ? 'border-primary bg-primary/10 shadow-[0_4px_20px_rgba(79,70,229,0.15)] ring-4 ring-primary/5'
                            : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'}
                        ${isDimmed ? 'opacity-30 grayscale-[50%]' : 'opacity-100'}
                      `}
                      >
                        {/* Check Circle */}
                        <div className={`w-6 h-6 rounded-full border-[2.5px] flex items-center justify-center shrink-0 transition-all duration-300
                        ${isSelected
                            ? 'border-primary bg-primary shadow-sm'
                            : 'border-muted-foreground/30'}
                      `}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[4]" />}
                        </div>

                        <span className={`text-[15px] md:text-[16px] leading-snug font-bold transition-colors duration-300
                        ${isSelected ? 'text-primary drop-shadow-sm' : 'text-foreground/80'}
                      `}>
                          {opt.text}
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Submission Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-primary/20 animate-ping opacity-20" />
            </div>
            <h3 className="mt-8 text-[18px] font-black text-foreground">Analyzing Your DNA</h3>
            <p className="mt-2 text-[13px] font-medium text-muted-foreground animate-pulse">Syncing with campus records...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
