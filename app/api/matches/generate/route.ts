import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { calculateMatch, encodeAnswers } from '@/lib/matching-algorithm'

/**
 * POST /api/matches/generate
 * 
 * Generates roommate matches for the current user
 * Uses the matching algorithm to find compatible roommates
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 2. Get current student's ID and Answers
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, gender, gender_pref')
      .eq('auth_id', user.id)
      .single()
    
    const { data: currentAnswers } = await supabase
      .from('questionnaire_responses')
      .select('answers')
      .eq('user_id', currentUser?.id)
      .single()
    
    if (!currentUser || !currentAnswers) {
      return NextResponse.json(
        { error: 'Profile or answers missing' },
        { status: 400 }
      )
    }
    
    // 3. Get all OTHER students who:
    //    - Have completed the questionnaire
    //    - Have PAID (or are Pioneers — both have has_paid=true)
    //    - Are ACTIVELY LOOKING (not paused, not found a roommate)
    //    - Match the gender preference filter
    let query = supabase
      .from('users')
      .select(`
        id,
        gender,
        gender_pref,
        questionnaire_responses(answers)
      `)
      .neq('id', currentUser.id)
      .not('questionnaire_responses', 'is', null)
      .eq('has_paid', true)
      .eq('status', 'ACTIVE')
    
    // Basic Gender Filtering (matching your logic)
    if (currentUser.gender_pref === 'SAME_GENDER') {
      query = query.eq('gender', currentUser.gender)
    }
    
    const { data: otherStudents, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Fetch students error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch potentially compatible students' },
        { status: 500 }
      )
    }
    
    // 4. Process compatibility for each student
    const myAnswersNumeric = encodeAnswers(currentAnswers.answers as Record<string, string>)
    const matchResults = []
    
    for (const other of otherStudents) {
      // Only process if they have answers
      const otherAnsRaw = other.questionnaire_responses as any
      if (!otherAnsRaw || !otherAnsRaw[0]?.answers) continue
      
      const otherAnswersNumeric = encodeAnswers(otherAnsRaw[0].answers as Record<string, string>)
      const result = calculateMatch(myAnswersNumeric, otherAnswersNumeric)
      
      // Only save if highly compatible (above threshold)
      if (result.isVisible) {
        matchResults.push({
          user_a_id: currentUser.id,
          user_b_id: other.id,
          match_percentage: result.matchPercentage,
          raw_score: result.rawScore,
          adjusted_score: result.adjustedScore,
          total_penalty: result.totalPenalty,
          consistency_modifier: result.consistencyModifier,
          cross_category_flags: result.patternFlags,
          category_scores: result.categoryBreakdown.map(cat => ({
            name: cat.categoryName,
            score: Math.round(cat.weightedScore * 100 / cat.maxWeightedScore),
            insight: getInsightForCategory(cat.categoryName, Math.round(cat.weightedScore * 100 / cat.maxWeightedScore))
          })),
          calculated_at: new Date().toISOString()
        })
      }
    }
    
    // 5. Batch upsert matches
    if (matchResults.length > 0) {
      const { error: matchError } = await supabase
        .from('matches')
        .upsert(matchResults, { onConflict: 'user_a_id, user_b_id' })
      
      if (matchError) {
        console.error('Match upsert error:', matchError)
        return NextResponse.json(
          { error: 'Failed to save compatibility scores' },
          { status: 500 }
        )
      }
    }
    
    // 6. Return success response
    return NextResponse.json({ 
      success: true, 
      count: matchResults.length 
    })
    
  } catch (error) {
    console.error('Generate matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function for category insights (imported from matching-algorithm)
function getInsightForCategory(categoryName: string, score: number): string {
  // This should be imported from matching-algorithm
  // For now, return a generic message
  if (score >= 80) return 'Excellent match!'
  if (score >= 60) return 'Good compatibility'
  if (score >= 40) return 'Moderate match'
  return 'Some differences'
}
