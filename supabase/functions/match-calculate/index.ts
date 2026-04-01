import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno types for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Constants from Blueprint ───────────────────────────────────────

const CATEGORIES: Record<number, { name: string; questions: string[]; weight: number }> = {
  1:  { name: 'Conflict Style',             questions: ['q1','q2','q3','q4'],       weight: 5 },
  2:  { name: 'Sleep & Study Schedule',     questions: ['q5','q6','q7','q8'],       weight: 3 },
  3:  { name: 'Cleanliness & Organisation', questions: ['q9','q10','q11','q12'],    weight: 3 },
  4:  { name: 'Social Habits',              questions: ['q13','q14','q15','q16'],   weight: 3 },
  5:  { name: 'Roommate Relationship',      questions: ['q17','q18','q19','q20'],   weight: 5 },
  6:  { name: 'Lifestyle & Maturity',       questions: ['q21','q22','q23','q24'],   weight: 1 },
  7:  { name: 'Lifestyle Imposition',       questions: ['q25','q26','q27','q28'],   weight: 5 },
  8:  { name: 'Romantic Life',              questions: ['q29','q30','q31','q32'],   weight: 3 },
  9:  { name: 'Food & Cooking',             questions: ['q33','q34','q35','q36'],   weight: 1 },
  10: { name: 'Shared Resources',           questions: ['q37','q38','q39','q40'],   weight: 1 },
}

const MAX_WEIGHTED_SCORE = Object.values(CATEGORIES).reduce((sum, c) => sum + c.weight, 0)
const VISIBILITY_THRESHOLD = 60

// ─── Implementation ───────────────────────────────────────────────

function calculateCompatibility(userA: any, userB: any) {
  let totalWeighted = 0
  const flags: string[] = []
  const ENCODING: any = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 }

  // LAYER 1: Weighted Base Score
  for (const [idx, cat] of Object.entries(CATEGORIES)) {
    let catSimilarity = 0
    let catQuestions = 0
    
    for (const qId of cat.questions) {
      const aVal = ENCODING[userA[qId]?.toUpperCase()]
      const bVal = ENCODING[userB[qId]?.toUpperCase()]
      if (aVal && bVal) {
        catSimilarity += (4 - Math.abs(aVal - bVal)) / 4
        catQuestions++
      }
    }
    
    const meanSimilarity = catQuestions > 0 ? catSimilarity / catQuestions : 0
    totalWeighted += meanSimilarity * cat.weight
  }

  const rawScore = totalWeighted / MAX_WEIGHTED_SCORE

  // LAYER 2: Cross-Category Penalties
  let totalPenalty = 0
  
  // MESSY_UNAPOLOGETIC
  if (userA.q11 === 'D' && userA.q4 === 'D') {
    const isClean = userB.q9 === 'A' || userB.q11 === 'A'
    totalPenalty += isClean ? 20 : 12
    flags.push('MESSY_UNAPOLOGETIC')
  }
  
  // DUAL_IMPOSER
  if (userA.q28 === 'D' && userA.q26 === 'C' && userB.q28 === 'D' && userB.q26 === 'C') {
    totalPenalty += 20
    flags.push('DUAL_IMPOSER')
  }

  // LAYER 3: Consistency Check (all-A suspicion)
  const aAnswers = Object.values(userA)
  const allACount = aAnswers.filter(v => v === 'A').length
  let consistencyModifier = 0
  if (allACount === 40) consistencyModifier = -15
  else if (allACount >= 36) consistencyModifier = -8

  const finalPercent = Math.max(0, Math.min(100, Math.round((rawScore * 100) - totalPenalty + consistencyModifier)))
  
  return { score: finalPercent, flags }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const { userId } = await req.json()
    const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single()
    const { data: userResp } = await supabase.from('questionnaire_responses').select('answers').eq('user_id', userId).single()
    const { data: allResp } = await supabase.from('questionnaire_responses').select('user_id, answers').neq('user_id', userId)

    if (!userResp || !allResp) throw new Error('Missing responses')

    const matches = []
    for (const other of allResp) {
      const { score, flags } = calculateCompatibility(userResp.answers, other.answers)
      if (score >= VISIBILITY_THRESHOLD) {
        matches.push({
          id: crypto.randomUUID(),
          user_a_id: userId,
          user_b_id: other.user_id,
          match_percentage: score,
          cross_category_flags: flags,
          calculated_at: new Date().toISOString()
        })
      }
    }

    await supabase.from('matches').delete().eq('user_a_id', userId)
    if (matches.length > 0) await supabase.from('matches').insert(matches)

    return new Response(JSON.stringify({ matches: matches.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
