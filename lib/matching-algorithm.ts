// ═══════════════════════════════════════════════════════════════════
// ROOMMATE LINK — MATCHING ALGORITHM v1.0
// ═══════════════════════════════════════════════════════════════════
// Pure TypeScript implementation. Zero external dependencies.
// This module is the core IP of the product.
//
// Three-layer engine:
//   Layer 1: Weighted base score across 40 questions / 10 categories
//   Layer 2: Cross-category pattern detection (penalty system)
//   Layer 3: Consistency analysis (honesty detection)
//
// See algorithm.md for the full specification and worked examples.
// ═══════════════════════════════════════════════════════════════════

import 'server-only';

// ─── Types ───────────────────────────────────────────────────────

/** All 40 question IDs */
export type QuestionId =
  | 'q1'  | 'q2'  | 'q3'  | 'q4'
  | 'q5'  | 'q6'  | 'q7'  | 'q8'
  | 'q9'  | 'q10' | 'q11' | 'q12'
  | 'q13' | 'q14' | 'q15' | 'q16'
  | 'q17' | 'q18' | 'q19' | 'q20'
  | 'q21' | 'q22' | 'q23' | 'q24'
  | 'q25' | 'q26' | 'q27' | 'q28'
  | 'q29' | 'q30' | 'q31' | 'q32'
  | 'q33' | 'q34' | 'q35' | 'q36'
  | 'q37' | 'q38' | 'q39' | 'q40';

/** Encoded answer value (A=1, B=2, C=3, D=4) */
export type AnswerValue = 1 | 2 | 3 | 4;

/** A user's full answer vector — all 40 questions answered */
export type AnswerVector = Record<QuestionId, AnswerValue>;

/** Category index (1–10) */
export type CategoryIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** A cross-category flag detected by the pattern engine */
export interface PatternFlag {
  id: string;
  description: string;
  penalty: number;         // percentage points to subtract
  affectedUser: 'A' | 'B' | 'BOTH';
}

/** Per-category score breakdown */
export interface CategoryBreakdown {
  categoryIndex: CategoryIndex;
  categoryName: string;
  weight: number;
  questionScores: { questionId: QuestionId; scoreA: AnswerValue; scoreB: AnswerValue; similarity: number }[];
  meanSimilarity: number;
  weightedScore: number;
  maxWeightedScore: number;
}

/** The full result returned by calculateMatch() */
export interface MatchResult {
  /** The final percentage shown to the user (0–100) */
  matchPercentage: number;

  /** Raw base score before penalties/adjustments (0–1) */
  rawScore: number;

  /** Score after cross-category penalties (0–1) */
  adjustedScore: number;

  /** Total penalty applied by pattern detection (percentage points) */
  totalPenalty: number;

  /** Total consistency adjustment (can be negative) */
  consistencyModifier: number;

  /** All cross-category pattern flags detected */
  patternFlags: PatternFlag[];

  /** All consistency flags detected */
  consistencyFlags: string[];

  /** Per-category score breakdown for the compatibility display */
  categoryBreakdown: CategoryBreakdown[];

  /** Whether this match is above the display threshold (≥60%) */
  isVisible: boolean;

  /** Tier label for UI display */
  tier: 'exceptional' | 'strong' | 'good' | 'potential' | 'hidden';
}


// ─── Constants ───────────────────────────────────────────────────

/** Category definitions: index → name, question IDs, weight */
const CATEGORIES: Record<CategoryIndex, { name: string; questions: QuestionId[]; weight: number }> = {
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
};

/** Sum of all category weights (each category contributes weight × 1.0 max mean) */
const MAX_WEIGHTED_SCORE = Object.values(CATEGORIES).reduce((sum, c) => sum + c.weight, 0);
// = 5+3+3+3+5+1+5+3+1+1 = 30

/** Minimum match percentage to appear in a user's feed */
export const VISIBILITY_THRESHOLD = 60;


// ═══════════════════════════════════════════════════════════════════
// LAYER 1: BASE COMPATIBILITY SCORE
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate per-question similarity score.
 * Formula: (4 - |answerA - answerB|) / 4
 *
 * Same answer (diff=0) → 1.00  (perfect match)
 * One step   (diff=1) → 0.75  (strong match)
 * Two steps  (diff=2) → 0.50  (moderate tension)
 * Three steps(diff=3) → 0.25  (significant incompatibility)
 */
function questionSimilarity(answerA: AnswerValue, answerB: AnswerValue): number {
  return (4 - Math.abs(answerA - answerB)) / 4;
}

/**
 * Calculate the full category breakdown and raw base score.
 */
function calculateBaseScore(userA: AnswerVector, userB: AnswerVector): {
  rawScore: number;
  totalWeighted: number;
  categoryBreakdown: CategoryBreakdown[];
} {
  let totalWeighted = 0;
  const categoryBreakdown: CategoryBreakdown[] = [];

  for (const [idxStr, category] of Object.entries(CATEGORIES)) {
    const catIdx = Number(idxStr) as CategoryIndex;
    const questionScores = category.questions.map(qId => {
      const scoreA = userA[qId];
      const scoreB = userB[qId];
      return {
        questionId: qId,
        scoreA,
        scoreB,
        similarity: questionSimilarity(scoreA, scoreB),
      };
    });

    const meanSimilarity = questionScores.reduce((sum, qs) => sum + qs.similarity, 0) / questionScores.length;
    const weightedScore = meanSimilarity * category.weight;

    totalWeighted += weightedScore;

    categoryBreakdown.push({
      categoryIndex: catIdx,
      categoryName: category.name,
      weight: category.weight,
      questionScores,
      meanSimilarity,
      weightedScore,
      maxWeightedScore: category.weight, // max = weight × 1.0
    });
  }

  const rawScore = totalWeighted / MAX_WEIGHTED_SCORE;

  return { rawScore, totalWeighted, categoryBreakdown };
}


// ═══════════════════════════════════════════════════════════════════
// LAYER 2: CROSS-CATEGORY PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Scan both user profiles for dangerous personality combinations.
 * Returns an array of detected pattern flags with their penalties.
 */
function detectCrossCategoryPatterns(userA: AnswerVector, userB: AnswerVector): PatternFlag[] {
  const flags: PatternFlag[] = [];

  // ── Pattern 1: Q11(D) + Q4(D) — Messy AND Unapologetic ──────
  // Maximum penalty. Creates unliveable environment for clean,
  // communicative roommates.
  if (userA.q11 === 4 && userA.q4 === 4) {
    // Extra penalty if paired with a clean communicator
    const pairIsClean = userB.q9 === 1 || userB.q11 === 1;
    flags.push({
      id: 'MESSY_UNAPOLOGETIC',
      description: 'User A is messy and cannot apologise — toxic for clean, direct communicators',
      penalty: pairIsClean ? 20 : 12,
      affectedUser: 'A',
    });
  }
  if (userB.q11 === 4 && userB.q4 === 4) {
    const pairIsClean = userA.q9 === 1 || userA.q11 === 1;
    flags.push({
      id: 'MESSY_UNAPOLOGETIC',
      description: 'User B is messy and cannot apologise — toxic for clean, direct communicators',
      penalty: pairIsClean ? 20 : 12,
      affectedUser: 'B',
    });
  }

  // ── Pattern 2: Q28(D) + Q26(C) — Two Moral Authorities ──────
  // Maximum penalty when BOTH users are imposers.
  // Moderate penalty when only one is an imposer.
  const aIsImposer = userA.q28 === 4 && userA.q26 === 3;
  const bIsImposer = userB.q28 === 4 && userB.q26 === 3;
  if (aIsImposer && bIsImposer) {
    flags.push({
      id: 'DUAL_IMPOSER',
      description: 'Both users impose moral authority — constant power struggle',
      penalty: 20,
      affectedUser: 'BOTH',
    });
  } else if (aIsImposer || bIsImposer) {
    // Single imposer — check if the other respects boundaries
    const otherRespectsQ28 = aIsImposer ? userB.q28 === 1 : userA.q28 === 1;
    if (!otherRespectsQ28) {
      flags.push({
        id: 'SINGLE_IMPOSER',
        description: 'One user imposes; the other is not fully boundary-respecting',
        penalty: 8,
        affectedUser: aIsImposer ? 'A' : 'B',
      });
    }
    // If other is Q28(A) — pure boundary respect — no penalty (they can absorb it)
  }

  // ── Pattern 3: Q40(D) + Q22(A) — Lost AND Partying ──────────
  // High penalty when BOTH users carry this flag.
  const aLostParty = userA.q40 === 4 && userA.q22 === 1;
  const bLostParty = userB.q40 === 4 && userB.q22 === 1;
  if (aLostParty && bLostParty) {
    flags.push({
      id: 'DUAL_LOST_PARTYING',
      description: 'Both users are unanchored and fully embracing chaos — no stability',
      penalty: 15,
      affectedUser: 'BOTH',
    });
  } else if (aLostParty || bLostParty) {
    // Single lost-party user — check if the other provides structure
    const otherIsStructured = aLostParty ? userB.q23 === 1 : userA.q23 === 1;
    if (otherIsStructured) {
      // Potentially beneficial — structured person provides anchor
      // No penalty, just flag as nuance
      flags.push({
        id: 'LOST_WITH_ANCHOR',
        description: 'One user is still finding themselves; the other provides structure — potentially stabilising',
        penalty: 0,
        affectedUser: aLostParty ? 'A' : 'B',
      });
    }
  }

  // ── Pattern 4: Q33(D) + Q36(D) — Silent Food Grudge ─────────
  // The silent ledger holder paired with someone generous.
  if (userA.q33 === 4 && userA.q36 === 4) {
    const pairIsGenerous = userB.q34 === 3 || userB.q33 === 1;
    flags.push({
      id: 'SILENT_FOOD_GRUDGE',
      description: 'User A silently records food violations and judges food-askers',
      penalty: pairIsGenerous ? 12 : 6,
      affectedUser: 'A',
    });
  }
  if (userB.q33 === 4 && userB.q36 === 4) {
    const pairIsGenerous = userA.q34 === 3 || userA.q33 === 1;
    flags.push({
      id: 'SILENT_FOOD_GRUDGE',
      description: 'User B silently records food violations and judges food-askers',
      penalty: pairIsGenerous ? 12 : 6,
      affectedUser: 'B',
    });
  }

  // ── Pattern 5: Q38(D) + Q40(C) — Particular About Everything ─
  // Narrow compatible profile. BONUS when matched with another particular person.
  const aParticular = userA.q38 === 4 && userA.q40 === 3;
  const bParticular = userB.q38 === 4 && userB.q40 === 3;
  if (aParticular && bParticular) {
    // Two particular people — they understand each other
    flags.push({
      id: 'DUAL_PARTICULAR_BONUS',
      description: 'Both users are highly particular — mutual understanding creates clear boundaries',
      penalty: -5, // NEGATIVE = BONUS
      affectedUser: 'BOTH',
    });
  } else if (aParticular || bParticular) {
    // One particular, one not — friction if the other is easygoing about belongings
    const otherIsEasygoing = aParticular
      ? (userB.q37 === 1 && userB.q38 === 1)
      : (userA.q37 === 1 && userA.q38 === 1);
    if (otherIsEasygoing) {
      flags.push({
        id: 'PARTICULAR_VS_EASYGOING',
        description: 'One user is very particular about belongings; the other treats shared space casually',
        penalty: 10,
        affectedUser: aParticular ? 'A' : 'B',
      });
    }
  }

  // ── Pattern 6: Q29(C) + Q31(C) — Romantic Invasion ──────────
  // One user's partner visits frequently; the other feels invaded.
  if (userA.q29 === 3 && userB.q31 === 3) {
    flags.push({
      id: 'ROMANTIC_INVASION',
      description: "User A's frequent partner visits clash with User B's need for personal space",
      penalty: 8,
      affectedUser: 'BOTH',
    });
  }
  if (userB.q29 === 3 && userA.q31 === 3) {
    flags.push({
      id: 'ROMANTIC_INVASION',
      description: "User B's frequent partner visits clash with User A's need for personal space",
      penalty: 8,
      affectedUser: 'BOTH',
    });
  }

  // ── Pattern 7: Q14(B) + Q1(C) — Selective Confronter ────────
  // Nuance flag — no penalty, just insight for display.
  if (userA.q14 === 2 && userA.q1 === 3) {
    flags.push({
      id: 'SELECTIVE_CONFRONTER',
      description: 'User A picks battles — tolerates daily irritations but protects personal rest',
      penalty: 0,
      affectedUser: 'A',
    });
  }
  if (userB.q14 === 2 && userB.q1 === 3) {
    flags.push({
      id: 'SELECTIVE_CONFRONTER',
      description: 'User B picks battles — tolerates daily irritations but protects personal rest',
      penalty: 0,
      affectedUser: 'B',
    });
  }

  return flags;
}


// ═══════════════════════════════════════════════════════════════════
// LAYER 3: CONSISTENCY DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyse a single user's answer vector for honesty/consistency signals.
 * Returns a modifier (can be negative) and a list of descriptive flags.
 */
function analyseConsistency(answers: AnswerVector): {
  modifier: number;   // percentage points (typically –15 to +0)
  flags: string[];
} {
  const flags: string[] = [];
  let modifier = 0;

  const values = Object.values(answers) as AnswerValue[];

  // ── Flag 1: Sudden Pattern Break ─────────────────────────────
  // If 85%+ of answers fall within a narrow range (e.g. 1-2),
  // and specific answers are 4, those outliers are weighted more.
  // This flag is informational — it doesn't change the score,
  // but the outlier answers get 1.5× weight in base calculation.
  const valueCounts = [0, 0, 0, 0, 0]; // index 0 unused, 1-4 for A-D
  for (const v of values) valueCounts[v]++;

  const dominantRange12 = valueCounts[1] + valueCounts[2];
  const dominantRange34 = valueCounts[3] + valueCounts[4];

  if (dominantRange12 >= 34 && valueCounts[4] >= 1) {
    flags.push('SUDDEN_BREAK_D_IN_EASYGOING: Predominantly A/B profile with D outlier(s) — outliers are likely honest moments');
  }
  if (dominantRange34 >= 34 && valueCounts[1] >= 1) {
    flags.push('SUDDEN_BREAK_A_IN_PARTICULAR: Predominantly C/D profile with A outlier(s) — outliers reveal specific tolerance areas');
  }

  // ── Flag 2: Cross-Category Contradiction ─────────────────────
  // Conflict-avoidant (all C in Q1-Q4) but firm on sleep (D on Q30)
  const conflictAllC = answers.q1 === 3 && answers.q2 === 3 && answers.q3 === 3 && answers.q4 === 3;
  if (conflictAllC && answers.q30 === 4) {
    flags.push('TRIGGER_PROFILE: Conflict-avoidant in general but protective of sleep specifically — this is a valid trigger, not inconsistency');
  }

  // ── Flag 3: Statistically Perfect Profile (all A's) ──────────
  // Nobody is perfectly easygoing about everything.
  if (valueCounts[1] === 40) {
    modifier -= 15;
    flags.push('ALL_A_SUSPICIOUS: All 40 answers are A — profile flagged as potentially dishonest, match confidence reduced by 15%');
  } else if (valueCounts[1] >= 36) {
    modifier -= 8;
    flags.push('NEAR_ALL_A: 36+ answers are A — unusually uniform profile, match confidence reduced by 8%');
  }

  // Also flag all-D (someone trying to game as "unique")
  if (valueCounts[4] === 40) {
    modifier -= 15;
    flags.push('ALL_D_SUSPICIOUS: All 40 answers are D — profile flagged as potentially dishonest');
  }

  // ── Flag 4: Q40 Recalibration ────────────────────────────────
  // If Q40 self-assessment contradicts the dominant pattern.
  const q40 = answers.q40;

  if (q40 === 1) {
    // Claims "considerate and easygoing"
    // Check if behaviour questions contradict this
    const messyCount = [answers.q9, answers.q10, answers.q11, answers.q12].filter(v => v >= 3).length;
    const defensiveConflict = answers.q4 >= 3 ? 1 : 0;
    if (messyCount >= 2 || defensiveConflict) {
      modifier -= 8;
      flags.push('Q40_CONTRADICTION: Claims easygoing (Q40=A) but behavioural answers suggest otherwise — confidence reduced');
    }
  }

  if (q40 === 3) {
    // Claims "quite particular"
    // Check if resource questions contradict (all easygoing about borrowing)
    const resourceEasygoing = [answers.q37, answers.q38, answers.q39].filter(v => v === 1).length;
    if (resourceEasygoing === 3) {
      flags.push('Q40_OVERCLAIM: Claims particular (Q40=C) but is fully communal about belongings — trust behaviour over self-assessment');
    }
  }

  if (q40 === 4) {
    // "Still figuring that out" — extraordinary honesty
    flags.push('Q40_SELF_AWARE: User acknowledges uncertainty about themselves — highest honesty signal');
    // No penalty — this is valuable data. Reduce hard dealbreaker impact slightly.
  }

  return { modifier, flags };
}


// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT: calculateMatch()
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate the full compatibility result between two users.
 *
 * This is the main entry point for the matching algorithm.
 * It runs all three layers and produces the final match percentage
 * along with a complete breakdown for the UI.
 *
 * @param userA - Full 40-answer vector for User A
 * @param userB - Full 40-answer vector for User B
 * @returns Complete MatchResult with percentage, flags, and breakdowns
 */
export function calculateMatch(userA: AnswerVector, userB: AnswerVector): MatchResult {

  // ── Layer 1: Base Score ────────────────────────────────────────
  const { rawScore, categoryBreakdown } = calculateBaseScore(userA, userB);

  // ── Layer 2: Cross-Category Pattern Detection ──────────────────
  const patternFlags = detectCrossCategoryPatterns(userA, userB);
  const totalPenalty = patternFlags.reduce((sum, f) => sum + f.penalty, 0);

  // ── Layer 3: Consistency Analysis ──────────────────────────────
  const consistencyA = analyseConsistency(userA);
  const consistencyB = analyseConsistency(userB);
  // Use the worse modifier (more suspicious profile drags down confidence)
  const consistencyModifier = Math.min(consistencyA.modifier, consistencyB.modifier);
  const consistencyFlags = [...consistencyA.flags, ...consistencyB.flags];

  // ── Assemble Final Score ───────────────────────────────────────
  const rawPercent = rawScore * 100;
  const adjustedPercent = rawPercent - totalPenalty + consistencyModifier;
  const finalPercent = Math.max(0, Math.min(100, Math.round(adjustedPercent)));

  // ── Determine Tier ─────────────────────────────────────────────
  let tier: MatchResult['tier'];
  if (finalPercent >= 90) tier = 'exceptional';
  else if (finalPercent >= 80) tier = 'strong';
  else if (finalPercent >= 70) tier = 'good';
  else if (finalPercent >= VISIBILITY_THRESHOLD) tier = 'potential';
  else tier = 'hidden';

  return {
    matchPercentage: finalPercent,
    rawScore,
    adjustedScore: adjustedPercent / 100,
    totalPenalty,
    consistencyModifier,
    patternFlags,
    consistencyFlags,
    categoryBreakdown,
    isVisible: finalPercent >= VISIBILITY_THRESHOLD,
    tier,
  };
}


// ═══════════════════════════════════════════════════════════════════
// UTILITY: Encode letter answers to numbers
// ═══════════════════════════════════════════════════════════════════

/** Convert a user's letter-based answers (from localStorage/UI) to the numeric AnswerVector */
export function encodeAnswers(letterAnswers: Record<string, string>): AnswerVector {
  const ENCODING: Record<string, AnswerValue> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
  const encoded: Partial<AnswerVector> = {};

  for (const [qId, letter] of Object.entries(letterAnswers)) {
    const value = ENCODING[letter.toUpperCase()];
    if (value && qId.startsWith('q')) {
      encoded[qId as QuestionId] = value;
    }
  }

  return encoded as AnswerVector;
}


// ═══════════════════════════════════════════════════════════════════
// BATCH: calculateMatchesForUser()
// ═══════════════════════════════════════════════════════════════════

/**
 * Compare one user against all active users and return visible matches.
 * This is what the Edge Function calls after a user finishes the questionnaire.
 *
 * @param newUser - The user who just completed their questionnaire
 * @param allActiveUsers - Array of { userId, answers } for every active user
 * @returns Array of match results sorted by percentage (descending), filtered to visible only
 */
export function calculateMatchesForUser(
  newUser: { userId: string; answers: AnswerVector },
  allActiveUsers: { userId: string; answers: AnswerVector }[]
): { userId: string; result: MatchResult }[] {

  const matches: { userId: string; result: MatchResult }[] = [];

  for (const activeUser of allActiveUsers) {
    // Don't match against yourself
    if (activeUser.userId === newUser.userId) continue;

    const result = calculateMatch(newUser.answers, activeUser.answers);

    if (result.isVisible) {
      matches.push({ userId: activeUser.userId, result });
    }
  }

  // Sort by match percentage descending (best matches first)
  matches.sort((a, b) => b.result.matchPercentage - a.result.matchPercentage);

  return matches;
}
