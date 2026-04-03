// ══════════════════════════════════════════════════════════════════════
// ROOMMATE LINK — COMPREHENSIVE ALGORITHM TEST SUITE
// 50 Targeted Stress Tests + 20-User Full Compatibility Matrix
// ══════════════════════════════════════════════════════════════════════
// Run: npx tsx supabase/functions/match-calculate/test_suite.ts
// ══════════════════════════════════════════════════════════════════════

import { calculateMatch, encodeAnswers, analyseConsistency } from './judge.ts';
import type { AnswerVector } from './types.ts';

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Start from all-B baseline, apply specific overrides */
function base(overrides: Record<string, string> = {}): Record<string, string> {
  const b: Record<string, string> = {};
  for (let i = 1; i <= 40; i++) b[`q${i}`] = 'B';
  return { ...b, ...overrides };
}

/** All 40 questions = same letter */
function uniform(letter: string): Record<string, string> {
  const b: Record<string, string> = {};
  for (let i = 1; i <= 40; i++) b[`q${i}`] = letter;
  return b;
}

/** Encode + calculate a pair, return result + percentage */
function matchPair(a: Record<string, string>, b: Record<string, string>) {
  return calculateMatch(encodeAnswers(a), encodeAnswers(b));
}

// ─── Assertion Framework ──────────────────────────────────────────────────────
let passed = 0; let failed = 0;
const FAILURES: string[] = [];

function check(label: string, condition: boolean, extra = '') {
  if (condition) {
    process.stdout.write(`  ✅ ${label}\n`);
    passed++;
  } else {
    process.stdout.write(`  ❌ FAIL — ${label}${extra ? ` → ${extra}` : ''}\n`);
    failed++;
    FAILURES.push(label);
  }
}

function section(title: string) {
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(68));
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 1 — WEIGHT SYSTEM VERIFICATION
// Prove that dealbreaker categories (×5) affect scores more than
// preference categories (×1) for identical levels of mismatch.
// ══════════════════════════════════════════════════════════════════════

section('SECTION 1 — WEIGHT SYSTEM VERIFICATION (×5 vs ×1)');
console.log('  Using all-B baseline: avoids consistency flags for a clean weight comparison.');

// NOTE: all-B (encoded=2) does NOT trigger any consistency flags (only all-A and all-D do).
// This gives us a clean baseline to isolate the pure weight effect.
const refB = uniform('B');

// Conflict (weight=5): mismatch all 4 questions. q4=D safe — MESSY_UNAPOLOGETIC needs q11=D too.
const conflictMismatch = { ...uniform('B'), q1: 'D', q2: 'D', q3: 'D', q4: 'D' };
// Food (weight=1): mismatch q34+q35+q36 ONLY — NOT q33, to avoid SILENT_FOOD_GRUDGE (needs q33=D AND q36=D together)
const foodMismatch     = { ...uniform('B'), q34: 'D', q35: 'D', q36: 'D' };
// Imposition (weight=5): q25-q28=D. DUAL_IMPOSER needs q26=C(3), q28=D(4). q26=D(4)≠3 → no flag.
const impositionMismatch = { ...uniform('B'), q25: 'D', q26: 'D', q27: 'D', q28: 'D' };

const rConflict   = matchPair(refB, conflictMismatch);
const rFood       = matchPair(refB, foodMismatch);
const rImposition = matchPair(refB, impositionMismatch);

console.log(`\n  refB vs Conflict mismatch  (weight=5, 4 qs): ${rConflict.matchPercentage}%`);
console.log(`  refB vs Food mismatch      (weight=1, 3 qs): ${rFood.matchPercentage}%`);
console.log(`  refB vs Imposition mismatch(weight=5, 4 qs): ${rImposition.matchPercentage}%`);
console.log(`  Expected: conflict(×5) < food(×1) — higher weight = more impact on score\n`);

// Math: conflict — 4 qs diff(B=2 vs D=4)=2, sim=0.5. mean=0.5, weighted=0.5*5=2.5. Others=25. Total=27.5. Raw=91.7% → 92%
// Math: food    — 3 qs diff(B=2 vs D=4)=2, sim=0.5; q33 same sim=1. mean=(1+0.5+0.5+0.5)/4=0.625. weighted=0.625. Others=29. Total=29.625. Raw=98.75% → 99%
const expectedConflict = Math.round(((0.5 * 4 / 4) * 5 + 25) / 30 * 100); // ≈92% before penalties
const expectedFood     = Math.round(((1 + 0.5 + 0.5 + 0.5) / 4 * 1 + 29) / 30 * 100); // ≈99%
console.log(`  Math expectation — Conflict (×5): ~${expectedConflict}%`);
console.log(`  Math expectation — Food    (×1): ~${expectedFood}%`);

check('Conflict mismatch (×5) scores LOWER than food mismatch (×1) — weights work',
  rConflict.matchPercentage < rFood.matchPercentage,
  `conflict=${rConflict.matchPercentage}% vs food=${rFood.matchPercentage}%`);

check('Imposition mismatch (×5) scores LOWER than food mismatch (×1)',
  rImposition.matchPercentage < rFood.matchPercentage,
  `imposition=${rImposition.matchPercentage}% vs food=${rFood.matchPercentage}%`);

check('Conflict and Imposition scores within 5% of each other (both weight=5)',
  Math.abs(rConflict.matchPercentage - rImposition.matchPercentage) <= 5,
  `${rConflict.matchPercentage}% vs ${rImposition.matchPercentage}%`);

check(`Conflict score near mathematical prediction (~${expectedConflict}%)`,
  Math.abs(rConflict.matchPercentage - expectedConflict) <= 3,
  `got ${rConflict.matchPercentage}%, expected ~${expectedConflict}%`);

check(`Food score near mathematical prediction (~${expectedFood}%)`,
  Math.abs(rFood.matchPercentage - expectedFood) <= 3,
  `got ${rFood.matchPercentage}%, expected ~${expectedFood}%`);


// ══════════════════════════════════════════════════════════════════════
// SECTION 2 — 50 TARGETED STRESS TESTS
// ══════════════════════════════════════════════════════════════════════

section('SECTION 2 — 50 TARGETED STRESS TESTS');

// ── 2A: Boundary & Extremes ──────────────────────────────────────────
console.log('\n  [2A] Boundary & Extremes');

const allD = uniform('D');
const allB = uniform('B');
const allA = uniform('A');

// AllB is the clean perfect-match test (no consistency flags)
const r_perfectB = matchPair(allB, allB);
check('Perfect match (AllB ↔ AllB) = 100%', r_perfectB.matchPercentage === 100,
  `got ${r_perfectB.matchPercentage}%`);

// AllA and AllD trigger consistency flags — score should be < 100%
const r_perfectA = matchPair(allA, allA);
check('AllA ↔ AllA < 100% — consistency engine correctly penalises suspicious all-A profiles',
  r_perfectA.matchPercentage < 100, `got ${r_perfectA.matchPercentage}%`);
console.log(`     AllA ↔ AllA actual: ${r_perfectA.matchPercentage}% (consistency penalty applied)`);

const r_perfectD = matchPair(allD, allD);
check('AllD ↔ AllD < 100% — consistency engine correctly penalises suspicious all-D profiles',
  r_perfectD.matchPercentage < 100, `got ${r_perfectD.matchPercentage}%`);
console.log(`     AllD ↔ AllD actual: ${r_perfectD.matchPercentage}% (consistency penalty applied)`);

const r_worstCase = matchPair(allA, allD);
check('Worst case (AllA ↔ AllD) scores ≤ 40%', r_worstCase.matchPercentage <= 40,
  `got ${r_worstCase.matchPercentage}%`);
console.log(`     AllA ↔ AllD: ${r_worstCase.matchPercentage}% (raw mismatch + cross-cat penalties + consistency)`);

const r_oneStep = matchPair(allA, allB);
check('One-step difference (AllA ↔ AllB): score >= 60% (at visibility threshold)',
  r_oneStep.matchPercentage >= 60, `got ${r_oneStep.matchPercentage}%`);
console.log(`     AllA ↔ AllB score: ${r_oneStep.matchPercentage}%`);

// ── 2B: Pattern 1 — MESSY_UNAPOLOGETIC ──────────────────────────────
console.log('\n  [2B] Pattern 1 — MESSY_UNAPOLOGETIC (Q11=D, Q4=D)');

const messyUnapologetic = base({ q11: 'D', q4: 'D' });
const cleanDirect       = base({ q9: 'A', q11: 'A' });
const r_messy = matchPair(messyUnapologetic, cleanDirect);
const messyFlag = r_messy.patternFlags.find(f => f.id === 'MESSY_UNAPOLOGETIC');
check('MESSY_UNAPOLOGETIC flag fires when Q11=D + Q4=D',
  !!messyFlag, `flags: ${r_messy.patternFlags.map(f => f.id).join(', ')}`);
check('MESSY_UNAPOLOGETIC applies max penalty (20) vs clean person',
  messyFlag?.penalty === 20, `got penalty: ${messyFlag?.penalty}`);
check('Messy+Unapologetic ↔ Clean+Direct scores lower than without penalty',
  r_messy.matchPercentage < r_messy.rawScore * 100,
  `final: ${r_messy.matchPercentage}%, raw: ${Math.round(r_messy.rawScore * 100)}%`);

// ── 2C: Pattern 2 — DUAL_IMPOSER ────────────────────────────────────
console.log('\n  [2C] Pattern 2 — DUAL_IMPOSER (Q28=D + Q26=C, both)');

const imposer = base({ q28: 'D', q26: 'C' });
const r_dual_imposer = matchPair(imposer, imposer);
const dualFlag = r_dual_imposer.patternFlags.find(f => f.id === 'DUAL_IMPOSER');
check('DUAL_IMPOSER flag fires when both users have Q28=D + Q26=C',
  !!dualFlag, `flags: ${r_dual_imposer.patternFlags.map(f => f.id).join(', ')}`);
check('DUAL_IMPOSER applies 20% penalty',
  dualFlag?.penalty === 20, `penalty: ${dualFlag?.penalty}`);

const imposerVsEasygoing = matchPair(imposer, base({ q28: 'A' }));
const singleFlag = imposerVsEasygoing.patternFlags.find(f => f.id === 'SINGLE_IMPOSER');
// Note: if other user has q28=A (pure boundary respect), no SINGLE_IMPOSER
check('No SINGLE_IMPOSER when paired with pure boundary-respecter (Q28=A)',
  !singleFlag, `unexpected flag found`);

// ── 2D: Pattern 3 — LOST_PARTYING ───────────────────────────────────
console.log('\n  [2D] Pattern 3 — LOST_PARTYING (Q40=D + Q22=A, both)');

const lostParty = base({ q40: 'D', q22: 'A' });
const r_dual_lost = matchPair(lostParty, lostParty);
const dualLost = r_dual_lost.patternFlags.find(f => f.id === 'DUAL_LOST_PARTYING');
check('DUAL_LOST_PARTYING fires when both have Q40=D + Q22=A',
  !!dualLost, `flags: ${r_dual_lost.patternFlags.map(f => f.id).join(', ')}`);
check('DUAL_LOST_PARTYING applies 15% penalty',
  dualLost?.penalty === 15, `penalty: ${dualLost?.penalty}`);

const anchor = base({ q23: 'A' }); // structured person
const r_lost_with_anchor = matchPair(lostParty, anchor);
const anchorFlag = r_lost_with_anchor.patternFlags.find(f => f.id === 'LOST_WITH_ANCHOR');
check('LOST_WITH_ANCHOR (0 penalty) fires when lost person paired with structured one',
  !!anchorFlag, `flags: ${r_lost_with_anchor.patternFlags.map(f => f.id).join(', ')}`);

// ── 2E: Pattern 4 — SILENT_FOOD_GRUDGE ──────────────────────────────
console.log('\n  [2E] Pattern 4 — SILENT_FOOD_GRUDGE (Q33=D + Q36=D)');

const silentFoodGrudge = base({ q33: 'D', q36: 'D' });
const generous = base({ q34: 'C' }); // natural food sharer
const r_food_grudge = matchPair(silentFoodGrudge, generous);
const grudgeFlag = r_food_grudge.patternFlags.find(f => f.id === 'SILENT_FOOD_GRUDGE');
check('SILENT_FOOD_GRUDGE fires when Q33=D + Q36=D',
  !!grudgeFlag, `flags: ${r_food_grudge.patternFlags.map(f => f.id).join(', ')}`);
check('SILENT_FOOD_GRUDGE penalty = 12 when paired with generous person',
  grudgeFlag?.penalty === 12, `penalty: ${grudgeFlag?.penalty}`);

// ── 2F: Pattern 5 — DUAL_PARTICULAR_BONUS ───────────────────────────
console.log('\n  [2F] Pattern 5 — DUAL_PARTICULAR_BONUS (Q38=D + Q40=C, both)');

const particular = base({ q38: 'D', q40: 'C' });
const r_dual_particular = matchPair(particular, particular);
const bonusFlag = r_dual_particular.patternFlags.find(f => f.id === 'DUAL_PARTICULAR_BONUS');
check('DUAL_PARTICULAR_BONUS fires when both are Q38=D + Q40=C',
  !!bonusFlag, `flags: ${r_dual_particular.patternFlags.map(f => f.id).join(', ')}`);
check('DUAL_PARTICULAR_BONUS gives NEGATIVE penalty (bonus = -5)',
  bonusFlag?.penalty === -5, `penalty: ${bonusFlag?.penalty}`);
check('DUAL_PARTICULAR_BONUS pair scores HIGHER than raw (bonus applied)',
  r_dual_particular.matchPercentage >= Math.round(r_dual_particular.rawScore * 100),
  `final: ${r_dual_particular.matchPercentage}%, raw: ${Math.round(r_dual_particular.rawScore * 100)}%`);

const easygoingBorrower = base({ q37: 'A', q38: 'A' });
const r_particular_vs_easy = matchPair(particular, easygoingBorrower);
const particularVsEasyFlag = r_particular_vs_easy.patternFlags
  .find(f => f.id === 'PARTICULAR_VS_EASYGOING');
check('PARTICULAR_VS_EASYGOING fires when particular meets casual borrower',
  !!particularVsEasyFlag,
  `flags: ${r_particular_vs_easy.patternFlags.map(f => f.id).join(', ')}`);

// ── 2G: Pattern 6 — ROMANTIC_INVASION ───────────────────────────────
console.log('\n  [2G] Pattern 6 — ROMANTIC_INVASION (Q29=C vs Q31=C)');

const frequentPartner = base({ q29: 'C' }); // partner visits regularly
const spaceNeeder     = base({ q31: 'C' }); // feels invaded by third parties
const r_romantic = matchPair(frequentPartner, spaceNeeder);
const romanticFlag = r_romantic.patternFlags.find(f => f.id === 'ROMANTIC_INVASION');
check('ROMANTIC_INVASION fires: User A Q29=C ↔ User B Q31=C',
  !!romanticFlag, `flags: ${r_romantic.patternFlags.map(f => f.id).join(', ')}`);
check('ROMANTIC_INVASION penalty = 8',
  romanticFlag?.penalty === 8, `penalty: ${romanticFlag?.penalty}`);

// ── 2H: Pattern 7 — SELECTIVE_CONFRONTER ────────────────────────────
console.log('\n  [2H] Pattern 7 — SELECTIVE_CONFRONTER (Q14=B + Q1=C)');

const selectiveConfroner = base({ q14: 'B', q1: 'C' });
const r_selective = matchPair(selectiveConfroner, allB);
const selectiveFlag = r_selective.patternFlags.find(f => f.id === 'SELECTIVE_CONFRONTER');
check('SELECTIVE_CONFRONTER flag fires when Q14=B + Q1=C',
  !!selectiveFlag, `flags: ${r_selective.patternFlags.map(f => f.id).join(', ')}`);
check('SELECTIVE_CONFRONTER has 0 penalty (just informational)',
  selectiveFlag?.penalty === 0, `penalty: ${selectiveFlag?.penalty}`);

// ── 2I: Consistency Detection ────────────────────────────────────────
console.log('\n  [2I] Consistency Detection Flags');

const allAConsistency = analyseConsistency(encodeAnswers(uniform('A')));
check('ALL_A profile flagged as suspicious',
  allAConsistency.flags.some(f => f.includes('ALL_A_SUSPICIOUS')));
check('ALL_A consistency modifier = -15',
  allAConsistency.modifier === -15, `got ${allAConsistency.modifier}`);

const allDConsistency = analyseConsistency(encodeAnswers(uniform('D')));
check('ALL_D profile flagged as suspicious',
  allDConsistency.flags.some(f => f.includes('ALL_D_SUSPICIOUS')));

// Trigger profile: conflict avoidant (all C in q1-q4) + firm on sleep (q30=D)
const triggerProfile = encodeAnswers(base({ q1: 'C', q2: 'C', q3: 'C', q4: 'C', q30: 'D' }));
const triggerConsistency = analyseConsistency(triggerProfile);
check('TRIGGER_PROFILE flag detected (conflict avoidant + sleep-protective)',
  triggerConsistency.flags.some(f => f.includes('TRIGGER_PROFILE')));

// Q40 contradiction: claims easygoing (A) but messy behaviour
const contradictoryQ40 = encodeAnswers(base({
  q40: 'A',    // claims easygoing
  q9: 'D', q10: 'D', q11: 'D', q12: 'D'  // but very messy
}));
const q40Consistency = analyseConsistency(contradictoryQ40);
check('Q40_CONTRADICTION fires when claims easygoing but messy behaviour',
  q40Consistency.flags.some(f => f.includes('Q40_CONTRADICTION')));
check('Q40_CONTRADICTION applies -8 modifier',
  q40Consistency.modifier === -8, `got ${q40Consistency.modifier}`);

// ── 2J: Threshold & Visibility ───────────────────────────────────────
console.log('\n  [2J] Visibility Threshold (≥60%)');

// Perfect match: visible
check('Perfect match is visible', r_perfectA.isVisible === true);
// Worst case: not visible
check('Worst case (AllA ↔ AllD) is NOT visible', r_worstCase.isVisible === false);
// AllA ↔ AllB (one-step diff): should be visible
check('One-step difference still visible', r_oneStep.isVisible === true);

// ── 2K: Tier Labels ──────────────────────────────────────────────────
console.log('\n  [2K] Tier Labels');

check('100% match (AllB) = exceptional tier', r_perfectB.tier === 'exceptional',
  `got ${r_perfectB.tier} at ${r_perfectB.matchPercentage}%`);
check('AllA ↔ AllD = hidden tier', r_worstCase.tier === 'hidden');
const strongMatch = matchPair(base(), base({ q1: 'A' }));
check('Near-perfect match ≥ strong tier',
  ['exceptional','strong'].includes(strongMatch.tier),
  `got ${strongMatch.tier}`);

// ── 2L: Symmetry (A↔B = B↔A) ────────────────────────────────────────
console.log('\n  [2L] Symmetry — A↔B must equal B↔A');

const pA = base({ q1: 'A', q13: 'C', q28: 'D' });
const pB = base({ q1: 'D', q13: 'A', q28: 'A' });
const rAB = matchPair(pA, pB);
const rBA = matchPair(pB, pA);
check('Match score is symmetric (A↔B = B↔A)',
  rAB.matchPercentage === rBA.matchPercentage,
  `A→B: ${rAB.matchPercentage}%, B→A: ${rBA.matchPercentage}%`);

// ── 2M: No division-by-zero on identical edge vectors ────────────────
console.log('\n  [2M] Edge Cases — No crashes');

const edge1 = matchPair(uniform('A'), uniform('A'));
check('No crash: AllA ↔ AllA', edge1.matchPercentage >= 0);
const edge2 = matchPair(uniform('D'), uniform('D'));
check('No crash: AllD ↔ AllD', edge2.matchPercentage >= 0);
const edge3 = matchPair(uniform('C'), uniform('A'));
check('No crash: AllC ↔ AllA', edge3.matchPercentage >= 0);

// ── 2N: Score Clamping (0-100) ───────────────────────────────────────
console.log('\n  [2N] Score Clamping (always 0–100)');

// Worst case with all penalties
const superBad = base({ q11: 'D', q4: 'D', q28: 'D', q26: 'C', q40: 'D', q22: 'A' });
const r_super = matchPair(superBad, base({ q9: 'A', q28: 'D', q26: 'C' }));
check('Score never goes below 0', r_super.matchPercentage >= 0,
  `got ${r_super.matchPercentage}%`);
check('Score never exceeds 100', r_super.matchPercentage <= 100,
  `got ${r_super.matchPercentage}%`);


// ══════════════════════════════════════════════════════════════════════
// SECTION 3 — 20-USER FULL COMPATIBILITY MATRIX
// ══════════════════════════════════════════════════════════════════════

section('SECTION 3 — 20-USER FULL COMPATIBILITY MATRIX (190 pairs)');
console.log('  Creating 20 distinct personality archetypes...\n');

const PERSONAS: Record<string, Record<string, string>> = {

  // ── CLUSTER 1: Balanced, Communicative Ideal Roommates ──────────────
  'Ama': base({                          // The Gold Standard
    q1:'A', q2:'C', q3:'B', q4:'A',
    q5:'A', q6:'A', q7:'B', q8:'A',
    q9:'A', q10:'A', q11:'A', q12:'A',
    q13:'B', q14:'B', q15:'A', q16:'B',
    q17:'B', q18:'C', q19:'B', q20:'B',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'A', q30:'B', q31:'A', q32:'B',
    q37:'B', q38:'B', q39:'B', q40:'A',
  }),
  'Kofi': base({                         // Near-Ama, slightly more social
    q1:'A', q2:'C', q3:'A', q4:'A',
    q5:'A', q6:'A', q7:'B', q8:'B',
    q9:'A', q10:'A', q11:'A', q12:'B',
    q13:'B', q14:'B', q15:'B', q16:'B',
    q17:'B', q18:'B', q19:'B', q20:'B',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'B', q30:'B', q31:'A', q32:'B',
    q37:'A', q38:'B', q39:'B', q40:'A',
  }),
  'Adwoa': base({                        // Cooperative, very considerate
    q1:'A', q2:'A', q3:'A', q4:'A',
    q5:'A', q6:'A', q7:'D', q8:'A',
    q9:'A', q10:'B', q11:'B', q12:'A',
    q13:'A', q14:'C', q15:'A', q16:'B',
    q17:'B', q18:'B', q19:'A', q20:'B',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'A', q30:'B', q31:'A', q32:'A',
    q37:'B', q38:'B', q39:'C', q40:'A',
  }),

  // ── CLUSTER 2: Night Owls & Private Types ───────────────────────────
  'Kwame': base({                        // Night owl, co-tenant only
    q1:'B', q2:'B', q3:'B', q4:'B',
    q5:'C', q6:'B', q7:'B', q8:'C',
    q9:'B', q10:'A', q11:'B', q12:'B',
    q13:'A', q14:'C', q15:'A', q16:'D',
    q17:'A', q18:'B', q19:'B', q20:'C',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'A', q30:'B', q31:'A', q32:'C',
    q40:'D',
  }),
  'Fiifi': base({                        // Also night owl, very private
    q1:'B', q2:'B', q3:'B', q4:'B',
    q5:'C', q6:'B', q7:'C', q8:'C',
    q9:'B', q10:'A', q11:'B', q12:'C',
    q13:'A', q14:'B', q15:'A', q16:'C',
    q17:'A', q18:'B', q19:'B', q20:'C',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'A', q30:'B', q31:'A', q32:'C',
    q40:'D',
  }),
  'Akua': base({                         // Night owl but moderately social
    q1:'B', q2:'B', q3:'B', q4:'B',
    q5:'B', q6:'B', q7:'B', q8:'C',
    q9:'B', q10:'A', q11:'B', q12:'B',
    q13:'B', q14:'B', q15:'B', q16:'B',
    q17:'B', q18:'C', q19:'B', q20:'B',
    q25:'B', q26:'A', q27:'A', q28:'A',
  }),

  // ── CLUSTER 3: Social Butterflies ───────────────────────────────────
  'Abena': base({                        // Very social, emotionally open, wants friendship
    q1:'B', q2:'B', q3:'A', q4:'A',
    q5:'B', q6:'C', q7:'B', q8:'B',
    q13:'C', q14:'D', q15:'C', q16:'A',
    q17:'C', q18:'A', q19:'A', q20:'A',
    q25:'A', q26:'B', q27:'A', q28:'B',
    q29:'C', q30:'B', q31:'A', q32:'A',
  }),
  'Yaw': base({                          // Matches Abena's social/friendship energy
    q1:'B', q2:'B', q3:'A', q4:'A',
    q5:'B', q6:'B', q7:'B', q8:'B',
    q13:'C', q14:'D', q15:'B', q16:'A',
    q17:'C', q18:'A', q19:'A', q20:'A',
    q25:'A', q26:'B', q27:'A', q28:'A',
    q29:'B', q30:'A', q31:'A', q32:'A',
  }),
  'Baaba': base({                        // Social but considerate — mid-ground
    q1:'A', q2:'B', q3:'A', q4:'A',
    q5:'B', q6:'A', q7:'B', q8:'B',
    q13:'B', q14:'B', q15:'B', q16:'B',
    q17:'B', q18:'C', q19:'B', q20:'B',
    q25:'A', q26:'A', q27:'A', q28:'A',
    q29:'B', q30:'B', q31:'B', q32:'B',
  }),

  // ── CLUSTER 4: Pastoral / Lifestyle Imposers ─────────────────────────
  'Maame': base({                        // TRIGGERS: DUAL/SINGLE_IMPOSER
    q1:'B', q2:'B', q3:'B', q4:'B',
    q5:'A', q6:'A', q7:'A', q8:'A',
    q13:'A', q15:'A',
    q17:'C', q18:'A', q19:'A', q20:'A',
    q25:'C', q26:'C', q27:'C', q28:'D',
  }),
  'Adjoa': base({                        // Religious imposer, softer version
    q1:'B', q2:'B', q3:'B', q4:'B',
    q25:'B', q26:'C', q27:'C', q28:'C',
    q17:'C', q18:'A', q19:'A', q20:'A',
  }),
  'Ekua': base({                         // Imposer AND highly social — double difficult
    q1:'B', q2:'B', q3:'B', q4:'A',
    q13:'C', q14:'D', q15:'C', q16:'A',
    q25:'C', q26:'C', q27:'C', q28:'D',
    q17:'C', q18:'A', q19:'A', q20:'A',
    q29:'C', q31:'A',
  }),

  // ── CLUSTER 5: Messy / Conflict-Difficult ───────────────────────────
  'Nana': base({                         // TRIGGERS: MESSY_UNAPOLOGETIC (max)
    q1:'C', q2:'B', q3:'A', q4:'D',
    q9:'D', q10:'A', q11:'D', q12:'D',
    q13:'B', q14:'B', q15:'B', q16:'B',
  }),
  'Serwaa': base({                       // Also MESSY_UNAPOLOGETIC
    q1:'C', q2:'C', q3:'A', q4:'D',
    q9:'C', q10:'B', q11:'D', q12:'C',
    q13:'B', q14:'A', q15:'B', q16:'B',
  }),
  'Kojo': base({                         // Messy but apologizes — less dangerous
    q1:'D', q2:'C', q3:'B', q4:'A',
    q9:'C', q10:'A', q11:'D', q12:'C',
    q13:'B', q14:'B', q15:'B', q16:'B',
  }),

  // ── CLUSTER 6: Hyper-Particular About Space ──────────────────────────
  'Akosua': base({                       // TRIGGERS: Q38(D)+Q40(C)
    q9:'A', q10:'C', q11:'A', q12:'A',
    q37:'D', q38:'D', q39:'C', q40:'C',
    q25:'B', q26:'A', q27:'A', q28:'B',
  }),
  'Kwabena': base({                      // Also particular — DUAL_PARTICULAR_BONUS
    q9:'A', q10:'C', q11:'A', q12:'A',
    q37:'D', q38:'D', q39:'C', q40:'C',
    q25:'B', q26:'A', q27:'A', q28:'A',
  }),
  'AmaPokuaa': base({                    // Ultra-organized but communal — easygoing lender
    q9:'A', q10:'B', q11:'A', q12:'A',
    q37:'A', q38:'A', q39:'A', q40:'A',
    q25:'A', q26:'A', q27:'A', q28:'A',
  }),

  // ── CLUSTER 7: Special Cases ─────────────────────────────────────────
  'Dede': base({                         // TRIGGERS: DUAL_LOST_PARTYING
    q1:'D', q2:'C', q3:'D', q4:'B',
    q22:'A', q23:'D', q40:'D',
    q13:'C', q15:'C', q16:'A',
  }),
  'Mensah': base({                       // TRIGGERS: TRIGGER_PROFILE consistency flag
    q1:'C', q2:'C', q3:'C', q4:'C',
    q5:'A', q8:'A', q30:'D',
    q25:'A', q26:'A', q27:'B', q28:'A',
  }),
};

// ─── Run all 190 pair combinations ────────────────────────────────────────────
const names = Object.keys(PERSONAS);
const allPairs: { a: string; b: string; pct: number; tier: string; flags: string }[] = [];

for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = names[i], b = names[j];
    const result = matchPair(PERSONAS[a], PERSONAS[b]);
    allPairs.push({
      a, b,
      pct: result.matchPercentage,
      tier: result.tier,
      flags: result.patternFlags.filter(f => f.penalty !== 0).map(f => `${f.id}(${f.penalty > 0 ? '-' : '+'}${Math.abs(f.penalty)}%)`).join(', ') || '—'
    });
  }
}

// Sort pairs by percentage
allPairs.sort((x, y) => y.pct - x.pct);

console.log('  TOP 15 BEST MATCHES:');
console.log('  ' + '─'.repeat(62));
allPairs.slice(0, 15).forEach((p, i) => {
  const tierEmoji = p.tier === 'exceptional' ? '🟣' : p.tier === 'strong' ? '🔵' : p.tier === 'good' ? '🟢' : '🟡';
  console.log(`  ${String(i+1).padStart(2)}. ${tierEmoji} ${p.a.padEnd(12)} ↔ ${p.b.padEnd(12)} ${String(p.pct).padStart(3)}%  ${p.tier.toUpperCase()} | Flags: ${p.flags}`);
});

console.log('\n  BOTTOM 10 WORST MATCHES (Showing why they fail):');
console.log('  ' + '─'.repeat(62));
allPairs.slice(-10).reverse().forEach((p, i) => {
  const visible = p.pct >= 60 ? '👁 visible' : '🚫 hidden';
  console.log(`  ${String(i+1).padStart(2)}. ${p.a.padEnd(12)} ↔ ${p.b.padEnd(12)} ${String(p.pct).padStart(3)}%  ${visible} | ${p.flags}`);
});

// ─── Each persona's best and worst match ──────────────────────────────────────
console.log('\n  EACH PERSONA — BEST & WORST MATCH:');
console.log('  ' + '─'.repeat(62));
for (const name of names) {
  const involving = allPairs.filter(p => p.a === name || p.b === name);
  const best  = involving[0];
  const worst = involving[involving.length - 1];
  const bestOther  = best.a  === name ? best.b  : best.a;
  const worstOther = worst.a === name ? worst.b : worst.a;
  console.log(`  ${name.padEnd(12)} | Best: ${bestOther.padEnd(12)} ${best.pct.toString().padStart(3)}% | Worst: ${worstOther.padEnd(12)} ${worst.pct.toString().padStart(3)}%`);
}

// ─── Cluster-level assertions ──────────────────────────────────────────
console.log('\n  CLUSTER ASSERTIONS:');
function getPct(a: string, b: string) {
  const p = allPairs.find(x => (x.a===a&&x.b===b)||(x.a===b&&x.b===a));
  return p?.pct ?? -1;
}

check('Ama ↔ Kofi ≥ 80% (near-ideal match)',
  getPct('Ama','Kofi') >= 80, `got ${getPct('Ama','Kofi')}%`);
check('Kwame ↔ Fiifi ≥ 80% (night owl pair)',
  getPct('Kwame','Fiifi') >= 80, `got ${getPct('Kwame','Fiifi')}%`);
check('Abena ↔ Yaw ≥ 80% (social pair)',
  getPct('Abena','Yaw') >= 80, `got ${getPct('Abena','Yaw')}%`);
check('Akosua ↔ Kwabena ≥ 80% (particular pair gets bonus)',
  getPct('Akosua','Kwabena') >= 80, `got ${getPct('Akosua','Kwabena')}%`);
check('Maame ↔ Adjoa ≥ 75% (both imposers — they clash with others, not each other)',
  getPct('Maame','Adjoa') >= 75, `got ${getPct('Maame','Adjoa')}%`);
check('Nana ↔ Ama < 75% (messy+unapologetic vs clean communicator)',
  getPct('Nana','Ama') < 75, `got ${getPct('Nana','Ama')}%`);
check('Maame ↔ Ama < 80% (imposer vs autonomy-respecter)',
  getPct('Maame','Ama') < 80, `got ${getPct('Maame','Ama')}%`);
check('Kwame ↔ Abena — night owl+private vs social butterfly scores lower',
  getPct('Kwame','Abena') < getPct('Kwame','Fiifi'),
  `Kwame↔Abena=${getPct('Kwame','Abena')}% vs Kwame↔Fiifi=${getPct('Kwame','Fiifi')}%`);

// ══════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ══════════════════════════════════════════════════════════════════════

section('FINAL REPORT');
console.log(`\n  Total targeted tests:   50+`);
console.log(`  Total pair comparisons: ${allPairs.length} (from 20 personas)`);
console.log(`  ✅ PASSED: ${passed}`);
if (failed > 0) {
  console.log(`  ❌ FAILED: ${failed}`);
  console.log('\n  Failed tests:');
  FAILURES.forEach(f => console.log(`    — ${f}`));
} else {
  console.log(`  ❌ FAILED: 0`);
}

const passRate = Math.round((passed / (passed + failed)) * 100);
console.log(`\n  Pass rate: ${passRate}%`);

if (failed === 0) {
  console.log('\n  🏆 Algorithm is SOLID. All weights, patterns, and consistency flags verified.');
  console.log('  Safe to deploy to Supabase Edge Functions.\n');
} else {
  console.log('\n  ⚠️  Fix failing tests before deployment.\n');
  process.exit(1);
}
