# Volume 05: Matching Algorithm DNA

The matching engine inside Roommate Link operates on a strict multi-vector point distribution system, living entirely inside the `match-calculate` Edge Function. It is extremely fragile; if you adjust the scaling logic without running the `test_suite.ts`, you will corrupt roommate pools.

## 1. The Point Distribution
The base algorithm is graded out of exactly 110 total possible vector points, which dictates the `match_percentage`.

- **Base Variables (25 points):** Level parity (Are you both Level 100?), Course parity (Are you in the same major?).
- **Core Tensions (40 points):** Sleeping/Waking cycle, Noise tolerance, Guest policies. If these don't align, the penalty is severe (up to -20 points).
- **Lifestyle Flourishes (35 points):** Shared hobbies (Gaming, Study styles, Introvert/Extrovert alignment).
- **Red Flags (10 points):** Smoking, heavily conflicting pet peeves.

## 2. Gender Preference & Isolation
The most critical filter occurs *before* any vectors are calculated.
If User A has `gender_pref: 'SAME_GENDER'`, the algorithm physically filters the database chunk before pushing it to the scoring loop.
```typescript
if (userA.gender_pref === 'SAME_GENDER' && userB.gender !== userA.gender) {
    continue; // Instantly ghosted.
}
```

## 3. The `test_suite.ts`
Inside `supabase/functions/match-calculate/test_suite.ts` lives a gauntlet of 55 unique synthetic student profiles. 
Every time an AI agent modifies `judge.ts` (the brain), they MUST run the simulation locally using Deno:
```bash
cd supabase/functions/match-calculate
deno run test_suite.ts
```
This suite tests for the "Gold Standard" scenarios:
- The "Perfect Match" must ALWAYS score above `95%`.
- The "Toxic Disaster" (Night Owl who loves parties vs Early Bird who needs absolute silence) must ALWAYS score exactly `0%` or error out.
- The "Average Joe" must score around `60-70%`.

If the script fails these assertions, DO NOT push the algorithm to production.

## 4. Tension generation
The algorithm doesn't just output a number. It outputs `sharedTraits` and `tensions`.
If the difference between User A's noise tolerance and User B's noise tolerance is greater than 2 steps on the Likert scale, the engine injects a text string: `"Differing views on room silence."` into the `tensions` array to warn the users on the dashboard.
