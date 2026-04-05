// ═══════════════════════════════════════════════════════════════════
// ROOMMATE LINK — MATCH CALCULATE EDGE FUNCTION
// ═══════════════════════════════════════════════════════════════════
// Implements the "Bouncer & Judge" architecture:
//   - Bouncer: PostgreSQL query filters users BEFORE math runs
//   - Judge: Pure TypeScript logic calculates compatibility
//
// This ensures scalability by eliminating incompatible candidates
// at the database level rather than in memory.
// ═══════════════════════════════════════════════════════════════════

import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import type { AnswerVector } from './types.ts';
import { encodeAnswers, calculateMatchesForUser, analyseConsistency } from './judge.ts';
import { VISIBILITY_THRESHOLD } from './types.ts';

// @ts-ignore - Deno types for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ═══════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ── STEP 1: Fetch the new user's profile and answers ─────────────────
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, gender, gender_pref, has_paid')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: userResponses } = await supabase
      .from('questionnaire_responses')
      .select('answers')
      .eq('user_id', userId)
      .single();

    if (!userResponses || !userResponses.answers) {
      return new Response(JSON.stringify({ error: 'Questionnaire responses not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Encode letter answers to numeric values
    const newUserAnswers: AnswerVector = encodeAnswers(userResponses.answers);

    // ── STEP 2: THE BOUNCER — Filter at DATABASE level ───────────────
    // We only fetch "Fresh" users (created in the last 60 days) to keep the pool relevant.
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch only ACTIVE, PAID, FRESH users
    // This is the primary scalability filter.
    let query = supabase
      .from('users')
      .select('id, gender, gender_pref, has_paid')
      .eq('status', 'ACTIVE')
      .eq('has_paid', true)
      .gt('created_at', sixtyDaysAgo)
      .neq('id', userId);

    // 2. Apply current user's gender preference
    if (userProfile.gender_pref === 'SAME_GENDER') {
      query = query.eq('gender', userProfile.gender);
    }

    const { data: activeCandidates, error: candidatesError } = await query;

    if (candidatesError) {
      throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
    }

    // 3. RECIPROCAL GENDER FILTER:
    // If a candidate only wants "SAME_GENDER", but the current user is NOT their gender,
    // they should be filtered out from this specific match.
    const reciprocalCandidates = (activeCandidates || []).filter(candidate => {
      if (candidate.gender_pref === 'SAME_GENDER') {
        return candidate.gender === userProfile.gender;
      }
      return true; // They want ANY_GENDER, so the current user is fine.
    });

    if (reciprocalCandidates.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        message: 'No fresh, eligible candidates found in your area. Check back later!',
        candidatesFound: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Fetch questionnaire answers only for those who passed the reciprocal filter
    const candidateIds = reciprocalCandidates.map((u: { id: string }) => u.id);
    const { data: candidateResponses, error: responsesError } = await supabase
      .from('questionnaire_responses')
      .select('user_id, answers')
      .in('user_id', candidateIds);

    if (responsesError) {
      throw new Error(`Failed to fetch candidate responses: ${responsesError.message}`);
    }

    // Merge candidate data
    const candidates = candidateResponses?.map((resp: { user_id: string; answers: Record<string, string> }) => ({
      userId: resp.user_id,
      answers: encodeAnswers(resp.answers)
    })) || [];

    // ── STEP 3: THE JUDGE — Run the matching algorithm ─────────────
    // Now we have a small, highly qualified list of candidates.
    // The Judge (pure TypeScript math) processes this efficiently.

    const matches = calculateMatchesForUser(
      { userId, answers: newUserAnswers },
      candidates
    );

    // ── STEP 4: Write consistency_score back to questionnaire_responses ──
    // The consistency analysis runs inside calculateMatch per-pair,
    // but we also want a standalone score for this user's profile.
    const userConsistency = analyseConsistency(newUserAnswers);
    
    await supabase
      .from('questionnaire_responses')
      .update({
        consistency_score: userConsistency.modifier,
        profile_flags: userConsistency.flags
      })
      .eq('user_id', userId);

    // ── STEP 5: Store matches in database ───────────────────────────────
    // Delete old matches involving this user first
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (deleteError) {
      throw new Error(`Failed to delete old matches: ${deleteError.message}`);
    }

    // Insert new matches symmetrically
    if (matches.length > 0) {
      const matchesToInsert: any[] = [];
      const now = new Date().toISOString();

      matches.forEach(match => {
        // Forward Match (You -> Them)
        matchesToInsert.push({
          user_a_id: userId,
          user_b_id: match.userId,
          match_percentage: match.result.matchPercentage,
          raw_score: match.result.rawScore,
          cross_category_flags: match.result.patternFlags,
          consistency_modifier: match.result.consistencyModifier,
          category_scores: match.result.categoryBreakdown,
          calculated_at: now
        });
        
        // Reciprocal Match (Them -> You)
        matchesToInsert.push({
          user_a_id: match.userId,
          user_b_id: userId,
          match_percentage: match.result.matchPercentage,
          raw_score: match.result.rawScore,
          cross_category_flags: match.result.patternFlags,
          consistency_modifier: match.result.consistencyModifier,
          category_scores: match.result.categoryBreakdown,
          calculated_at: now
        });
      });

      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (insertError) {
        throw new Error(`Failed to insert matches: ${insertError.message}`);
      }
    }

    // ── STEP 5: Return response ───────────────────────────────────────────
    return new Response(JSON.stringify({
      success: true,
      matchesCount: matches.length,
      matches: matches.map(m => ({
        userId: m.userId,
        matchPercentage: m.result.matchPercentage,
        tier: m.result.tier,
        isVisible: m.result.isVisible,
        categoryBreakdown: m.result.categoryBreakdown,
        patternFlags: m.result.patternFlags
      })),
      candidatesEvaluated: candidates.length,
      threshold: VISIBILITY_THRESHOLD
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Match calculation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
