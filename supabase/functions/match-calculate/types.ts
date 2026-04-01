// ═══════════════════════════════════════════════════════════════════
// ROOMMATE LINK — MATCHING ALGORITHM TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════
// Pure TypeScript implementation. Zero external dependencies.
// This module is core IP of the product.
//
// Three-layer engine:
//   Layer 1: Weighted base score across 40 questions / 10 categories
//   Layer 2: Cross-category pattern detection (penalty system)
//   Layer 3: Consistency analysis (honesty detection)
// ═══════════════════════════════════════════════════════════════════

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

/** A cross-category flag detected by pattern engine */
export interface PatternFlag {
  id: string;
  description: string;
  penalty: number;         // percentage points to subtract (negative = bonus)
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
  /** The final percentage shown to user (0–100) */
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

  /** Per-category score breakdown for compatibility display */
  categoryBreakdown: CategoryBreakdown[];

  /** Whether this match is above display threshold (≥60%) */
  isVisible: boolean;

  /** Tier label for UI display */
  tier: 'exceptional' | 'strong' | 'good' | 'potential' | 'hidden';
}

// ─── Constants ───────────────────────────────────────────────────

/** Category definitions: index → name, question IDs, weight */
export const CATEGORIES: Record<CategoryIndex, { name: string; questions: QuestionId[]; weight: number }> = {
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
export const MAX_WEIGHTED_SCORE = Object.values(CATEGORIES).reduce((sum, c) => sum + c.weight, 0);
// = 5+3+3+3+5+1+5+3+1+1 = 30

/** Minimum match percentage to appear in a user's feed */
export const VISIBILITY_THRESHOLD = 60;

/** Answer encoding: letter → number */
export const ENCODING: Record<string, AnswerValue> = {
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4
};
