// ═══════════════════════════════════════════════════════════════
// MATCHING ALGORITHM — TEST SCRIPT
// ═══════════════════════════════════════════════════════════════
// Run: npx tsx test-algorithm.ts
//
// Verifies the algorithm against the worked examples in algorithm.md:
//   1. Ama vs Kwame  → expected ~88%
//   2. Efua vs Nana  → expected ~30% (with penalties)
//   3. Perfect match → expected 100%
//   4. Worst match   → expected very low
//   5. All-A profile → expected penalty flag
// ═══════════════════════════════════════════════════════════════

import { calculateMatch, AnswerVector, MatchResult } from './lib/matching-algorithm';

// ─── Helper ──────────────────────────────────────────────────

function printResult(label: string, result: MatchResult) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Final Match:  ${result.matchPercentage}%  (${result.tier.toUpperCase()})`);
  console.log(`  Raw Score:    ${(result.rawScore * 100).toFixed(1)}%`);
  console.log(`  Penalty:      -${result.totalPenalty}%`);
  console.log(`  Consistency:  ${result.consistencyModifier >= 0 ? '+' : ''}${result.consistencyModifier}%`);
  console.log(`  Visible:      ${result.isVisible ? '✅ YES' : '❌ NO (below 60%)'}`);
  
  if (result.patternFlags.length > 0) {
    console.log(`\n  Pattern Flags:`);
    for (const f of result.patternFlags) {
      console.log(`    ${f.penalty > 0 ? '🔴' : f.penalty < 0 ? '🟢' : '🔵'} [${f.id}] -${f.penalty}%`);
      console.log(`      ${f.description}`);
    }
  }

  if (result.consistencyFlags.length > 0) {
    console.log(`\n  Consistency Flags:`);
    for (const f of result.consistencyFlags) {
      console.log(`    ⚠️  ${f}`);
    }
  }

  console.log(`\n  Category Breakdown:`);
  for (const cat of result.categoryBreakdown) {
    const bar = '█'.repeat(Math.round(cat.meanSimilarity * 10)) + '░'.repeat(10 - Math.round(cat.meanSimilarity * 10));
    const pct = (cat.meanSimilarity * 100).toFixed(0);
    console.log(`    ${bar} ${pct.padStart(3)}%  ${cat.categoryName} (×${cat.weight})`);
  }
}


// ─── Test 1: Ama vs Kwame (from algorithm.md — expected ~88%) ──

const ama: AnswerVector = {
  q1: 1, q2: 3, q3: 3, q4: 1,     // Conflict Style
  q5: 1, q6: 1, q7: 1, q8: 1,     // Sleep & Study
  q9: 1, q10: 3, q11: 1, q12: 1,  // Cleanliness
  q13: 1, q14: 2, q15: 1, q16: 2, // Social
  q17: 2, q18: 2, q19: 2, q20: 2, // Relationship
  q21: 2, q22: 3, q23: 1, q24: 2, // Maturity
  q25: 1, q26: 2, q27: 1, q28: 1, // Imposition
  q29: 1, q30: 2, q31: 2, q32: 1, // Romantic
  q33: 2, q34: 2, q35: 2, q36: 2, // Food
  q37: 1, q38: 2, q39: 1, q40: 1, // Resources
};

const kwame: AnswerVector = {
  q1: 1, q2: 3, q3: 2, q4: 2,     // Conflict Style
  q5: 1, q6: 2, q7: 2, q8: 2,     // Sleep & Study
  q9: 2, q10: 2, q11: 1, q12: 2,  // Cleanliness
  q13: 2, q14: 2, q15: 2, q16: 2, // Social
  q17: 2, q18: 3, q19: 2, q20: 2, // Relationship
  q21: 1, q22: 2, q23: 2, q24: 2, // Maturity
  q25: 2, q26: 2, q27: 1, q28: 2, // Imposition
  q29: 2, q30: 2, q31: 2, q32: 2, // Romantic
  q33: 2, q34: 2, q35: 2, q36: 2, // Food
  q37: 2, q38: 2, q39: 1, q40: 2, // Resources
};


// ─── Test 2: Efua vs Nana (with penalties — expected ~30%) ─────

const efua: AnswerVector = {
  q1: 3, q2: 3, q3: 3, q4: 1,     // Conflict avoidant but apologises
  q5: 1, q6: 1, q7: 3, q8: 1,     // Sleeps early, relocates when needed
  q9: 1, q10: 3, q11: 1, q12: 1,  // Very clean
  q13: 1, q14: 2, q15: 1, q16: 2, // Private, honest about boundaries
  q17: 2, q18: 2, q19: 2, q20: 2, // Friendly acquaintance
  q21: 2, q22: 3, q23: 1, q24: 2, // Disciplined, declines weeknight outings
  q25: 1, q26: 1, q27: 1, q28: 1, // Pure boundary respect
  q29: 1, q30: 2, q31: 2, q32: 1, // Private romantic life
  q33: 2, q34: 1, q35: 2, q36: 2, // Cooks for self only
  q37: 2, q38: 2, q39: 1, q40: 1, // Tracks belongings, easygoing self-assessment
};

const nana: AnswerVector = {
  q1: 1, q2: 1, q3: 1, q4: 4,     // Confronts everything but NEVER apologises
  q5: 3, q6: 2, q7: 4, q8: 3,     // Night owl, frustrated by noise constraints
  q9: 4, q10: 1, q11: 4, q12: 4,  // Doesn't notice mess, feels disrespected if told
  q13: 3, q14: 4, q15: 3, q16: 1, // Very social, room is the hangout spot
  q17: 3, q18: 1, q19: 1, q20: 1, // Wants deep friendship
  q21: 1, q22: 1, q23: 3, q24: 3, // Fully embracing freedom, low discipline
  q25: 3, q26: 3, q27: 4, q28: 4, // Full imposer
  q29: 3, q30: 1, q31: 1, q32: 1, // Partner visits often, unbothered by others' calls
  q33: 1, q34: 3, q35: 1, q36: 1, // Generous with food
  q37: 1, q38: 1, q39: 1, q40: 3, // Easygoing about borrowing but self-aware as particular
};


// ─── Test 3: Perfect Match (identical answers) ─────────────────

const perfectA: AnswerVector = {
  q1: 2, q2: 2, q3: 2, q4: 2,
  q5: 2, q6: 2, q7: 2, q8: 2,
  q9: 2, q10: 2, q11: 2, q12: 2,
  q13: 2, q14: 2, q15: 2, q16: 2,
  q17: 2, q18: 2, q19: 2, q20: 2,
  q21: 2, q22: 2, q23: 2, q24: 2,
  q25: 2, q26: 2, q27: 2, q28: 2,
  q29: 2, q30: 2, q31: 2, q32: 2,
  q33: 2, q34: 2, q35: 2, q36: 2,
  q37: 2, q38: 2, q39: 2, q40: 2,
};

// ─── Test 4: All-A Suspicious Profile ──────────────────────────

const allA: AnswerVector = {
  q1: 1, q2: 1, q3: 1, q4: 1,
  q5: 1, q6: 1, q7: 1, q8: 1,
  q9: 1, q10: 1, q11: 1, q12: 1,
  q13: 1, q14: 1, q15: 1, q16: 1,
  q17: 1, q18: 1, q19: 1, q20: 1,
  q21: 1, q22: 1, q23: 1, q24: 1,
  q25: 1, q26: 1, q27: 1, q28: 1,
  q29: 1, q30: 1, q31: 1, q32: 1,
  q33: 1, q34: 1, q35: 1, q36: 1,
  q37: 1, q38: 1, q39: 1, q40: 1,
};


// ─── Run All Tests ─────────────────────────────────────────────

console.log('\n🧪 ROOMMATE LINK — MATCHING ALGORITHM TEST SUITE\n');

const result1 = calculateMatch(ama, kwame);
printResult('TEST 1: Ama vs Kwame (Expected: ~88%)', result1);

const result2 = calculateMatch(efua, nana);
printResult('TEST 2: Efua vs Nana (Expected: ~30% with penalties)', result2);

const result3 = calculateMatch(perfectA, { ...perfectA });
printResult('TEST 3: Perfect Match — Identical Answers (Expected: 100%)', result3);

const result4 = calculateMatch(allA, { ...perfectA });
printResult('TEST 4: All-A Suspicious vs Normal (Expected: penalty flag)', result4);

const result5 = calculateMatch(allA, allA);
printResult('TEST 5: All-A vs All-A (Expected: 100% raw but -15% suspicious)', result5);

// ─── Summary ───────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('  TEST SUMMARY');
console.log(`${'═'.repeat(60)}`);
console.log(`  Test 1 (Ama vs Kwame):     ${result1.matchPercentage}%  ${result1.matchPercentage >= 80 && result1.matchPercentage <= 95 ? '✅ PASS' : '⚠️ CHECK'}`);
console.log(`  Test 2 (Efua vs Nana):      ${result2.matchPercentage}%  ${result2.matchPercentage < 60 ? '✅ PASS (hidden)' : '⚠️ CHECK'}`);
console.log(`  Test 3 (Perfect Match):     ${result3.matchPercentage}%  ${result3.matchPercentage === 100 ? '✅ PASS' : '⚠️ CHECK'}`);
console.log(`  Test 4 (All-A vs Normal):   ${result4.matchPercentage}%  ${result4.consistencyFlags.some(f => f.includes('ALL_A')) ? '✅ PASS (flagged)' : '⚠️ CHECK'}`);
console.log(`  Test 5 (All-A vs All-A):    ${result5.matchPercentage}%  ${result5.matchPercentage === 85 ? '✅ PASS' : '⚠️ CHECK (raw 100% - 15% penalty = 85%)'}`);
console.log('');
