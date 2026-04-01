import { calculateMatch, encodeAnswers } from './judge.ts';
import type { AnswerVector } from './types.ts';

// ═══════════════════════════════════════════════════════════════════
// SCENARIO A: THE DREAM TEAM (Goal: ~85%)
// ═══════════════════════════════════════════════════════════════════
// Both users are 'B' (Balanced). They match almost perfectly on 
// high-weight categories (Conflict, Mess).
const userA_85: Record<string, string> = {};
const userB_85: Record<string, string> = {};

for (let i = 1; i <= 40; i++) {
  userA_85[`q${i}`] = 'B'; 
  userB_85[`q${i}`] = 'B'; // Baseline perfect match
}

// Introduce subtle 'Boutique' differences (85% shouldn't be 100%)
userB_85['q30'] = 'C'; // Sleep difference
userB_85['q22'] = 'A'; // Social difference

const vectorA_85 = encodeAnswers(userA_85);
const vectorB_85 = encodeAnswers(userB_85);

// ═══════════════════════════════════════════════════════════════════
// SCENARIO B: THE ROOMMATE GAMBLE (Goal: ~55%)
// ═══════════════════════════════════════════════════════════════════
// User A is messy and unapologetic. User B is clean and direct.
// This should trigger the MESSY_UNAPOLOGETIC penalty (-20%).
const userA_55: Record<string, string> = {};
const userB_55: Record<string, string> = {};

for (let i = 1; i <= 40; i++) {
  userA_55[`q${i}`] = 'B';
  userB_55[`q${i}`] = 'B';
}

// TRIGGER: Messy & Unapologetic (User A)
userA_55['q11'] = 'D'; // "I am messy"
userA_55['q4'] = 'D';  // "I don't apologise"

// TRIGGER: Clean (User B)
userB_55['q9'] = 'A';  // "I clean daily"

// TRIGGER: Conflict (Major distance)
userA_55['q1'] = 'D';
userB_55['q1'] = 'A';

const vectorA_55 = encodeAnswers(userA_55);
const vectorB_55 = encodeAnswers(userB_55);

// ═══════════════════════════════════════════════════════════════════
// THE VERDICT
// ═══════════════════════════════════════════════════════════════════

console.log('\n🏛️ ROOMMATE LINK — THE JUDGE VERDICT\n');

const result85 = calculateMatch(vectorA_85, vectorB_85);
console.log('✅ SCENARIO A (THE DREAM TEAM)');
console.log(`   Percentage: ${result85.matchPercentage}%`);
console.log(`   Tier: ${result85.tier.toUpperCase()}`);
console.log(`   Total Penalty: -${result85.totalPenalty}%`);
console.log('   Flags:', result85.patternFlags.map(f => f.id).join(', ') || 'NONE');

console.log('\n⚠️ SCENARIO B (THE ROOMMATE GAMBLE)');
console.log(`   Percentage: ${result85.matchPercentage === 55 ? '55%' : result85.matchPercentage + '%'}`); // Placeholder for run
const result55 = calculateMatch(vectorA_55, vectorB_55);
console.log(`   Actual Percentage: ${result55.matchPercentage}%`);
console.log(`   Tier: ${result55.tier.toUpperCase()}`);
console.log(`   Total Penalty: -${result55.totalPenalty}%`);
console.log('   Flags:', result55.patternFlags.map(f => f.id).join(', '));
