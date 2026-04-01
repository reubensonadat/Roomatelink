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
import type { AnswerVector, MatchResult } from './types.ts';
import { encodeAnswers, calculateMatchesForUser } from './judge.ts';
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

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── STEP 1: Fetch the new user's profile and answers ─────────────────
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, gender, gender_preference, has_paid')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Encode letter answers to numeric values
    const newUserAnswers: AnswerVector = encodeAnswers(userResponses.answers);

    // ── STEP 2: THE BOUNCER — Filter at DATABASE level ───────────────
    // The database is infinitely faster at filtering than TypeScript code.
    // We eliminate anyone who fails strict dealbreakers BEFORE any math happens.

    // Build the gender filter based on user's preference
    let genderFilter: { gender?: string } = {};
    if (userProfile.gender_preference === 'SAME_GENDER') {
      genderFilter = { gender: userProfile.gender };
    }
    // If gender_preference is 'ANY_GENDER', no filter applied

    // Fetch only ACTIVE, PAID users who match gender preference
    // This is a critical scalability optimization
    const { data: activeCandidates, error: candidatesError } = await supabase
      .from('users')
      .select('id, gender, has_paid')
      .eq('status', 'ACTIVE')
      .eq('has_paid', true)
      .neq('id', userId)
      // Apply gender filter if needed
      .match(genderFilter);

    if (candidatesError) {
      throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
    }

    if (!activeCandidates || activeCandidates.length === 0) {
      // No eligible candidates - return early
      return new Response(JSON.stringify({
        matches: [],
        message: 'No eligible candidates found. Check back later.',
        candidatesFound: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch questionnaire answers for all filtered candidates
    const candidateIds = activeCandidates.map((u: { id: string }) => u.id);
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

    // ── STEP 4: Store matches in database ───────────────────────────────
    // Delete old matches for this user first
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('user_a_id', userId);

    if (deleteError) {
      throw new Error(`Failed to delete old matches: ${deleteError.message}`);
    }

    // Insert new matches
    if (matches.length > 0) {
      const matchesToInsert = matches.map(match => ({
        user_a_id: userId,
        user_b_id: match.userId,
        match_percentage: match.result.matchPercentage,
        raw_score: match.result.rawScore,
        cross_category_flags: match.result.patternFlags,
        consistency_modifier: match.result.consistencyModifier,
        category_scores: match.result.categoryBreakdown,
        calculated_at: new Date().toISOString()
      }));

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
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Match calculation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
