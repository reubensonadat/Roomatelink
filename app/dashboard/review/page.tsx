"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { questions as allQuestions, Question } from '@/lib/questions';

const STORAGE_KEY = 'roommate_answers';

// Group questions by category
function groupByCategory(questions: Question[]): Record<string, Question[]> {
  const groups: Record<string, Question[]> = {};
  for (const q of questions) {
    if (!groups[q.category]) groups[q.category] = [];
    groups[q.category].push(q);
  }
  return groups;
}

const WEIGHT_LABELS: Record<number, { label: string; color: string }> = {
  5: { label: 'DEALBREAKER', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  3: { label: 'CORE', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  1: { label: 'PREFERENCE', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

export default function QuestionnaireReviewPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch { }
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  const answeredCount = Object.keys(answers).length;
  const grouped = groupByCategory(allQuestions);
  const categories = Object.entries(grouped);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-foreground">Your Answers</h1>
            <span className="text-[12px] text-muted-foreground font-medium">
              {answeredCount} of 40 questions answered • Read only
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 rounded-full border border-border/50">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Locked</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-2xl mx-auto w-full px-5 mt-6">
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3">
          <div className="bg-primary/10 p-1.5 rounded-full flex-shrink-0 h-fit mt-0.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-foreground mb-0.5">Answers are final</span>
            <span className="text-[12px] text-muted-foreground leading-relaxed">
              Your answers cannot be changed after submission. This ensures honest, spontaneous responses that produce the most accurate matches.
            </span>
          </div>
        </div>
      </div>

      {/* Questions by Category */}
      <div className="max-w-2xl mx-auto w-full px-5 mt-6 flex flex-col gap-8">
        {categories.map(([category, qs], catIdx) => {
          const weight = qs[0]?.weight ?? 1;
          const wInfo = WEIGHT_LABELS[weight] || WEIGHT_LABELS[1];

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.06 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[15px] font-bold text-foreground">{category}</h2>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${wInfo.color}`}>
                  {wInfo.label} ×{weight}
                </span>
              </div>

              {/* Questions in this category */}
              <div className="flex flex-col gap-4">
                {qs.map((q, qIdx) => {
                  const userAnswer = answers[q.id];
                  const selectedOption = q.options.find(o => o.id === userAnswer);

                  return (
                    <div
                      key={q.id}
                      className="bg-card border border-border rounded-2xl p-5 shadow-sm"
                    >
                      <p className="text-[12px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                        Q{q.id.replace('q', '')}
                      </p>
                      <p className="text-[14px] font-medium text-foreground leading-relaxed mb-4">
                        {q.question}
                      </p>

                      {/* Answer Options */}
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt) => {
                          const isSelected = opt.id === userAnswer;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${isSelected
                                  ? 'bg-primary/10 border-2 border-primary/30 text-foreground'
                                  : 'bg-muted/30 border border-transparent text-muted-foreground opacity-60'
                                }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold ${isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                                }`}>
                                {isSelected ? <Check className="w-3 h-3" /> : opt.id}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {!userAnswer && (
                        <p className="text-[12px] text-muted-foreground italic mt-3">Not answered</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
