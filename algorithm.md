# ROOMMATE LINK — MATCHING ALGORITHM
## Complete Technical Specification & Real-World Walkthrough

**Version 1.0 — Algorithm Locked**
Companion document to `apparchitecture.md`
This document is the single source of truth for how two students become a "94% Match".

---

## Table of Contents

1. [Algorithm Overview](#1-algorithm-overview)
2. [Answer Encoding & Storage](#2-answer-encoding--storage)
3. [Category Weight System — Why Some Questions Matter 5× More](#3-category-weight-system)
4. [Base Compatibility Score — The Math](#4-base-compatibility-score)
5. [Full Worked Example — Ama vs Kwame](#5-full-worked-example)
6. [Cross-Category Pattern Detection — The Intelligence Layer](#6-cross-category-pattern-detection)
7. [The Complete Cross-Question Relationship Map](#7-cross-question-relationship-map)
8. [Consistency Detection — Catching Dishonesty & Finding Hidden Truths](#8-consistency-detection)
9. [Second Worked Example — Efua vs Nana (With Penalties)](#9-second-worked-example)
10. [Final Score Assembly Pipeline](#10-final-score-assembly-pipeline)
11. [Edge Cases & Failure Modes](#11-edge-cases--failure-modes)
12. [Display Logic & Threshold Behaviour](#12-display-logic--threshold-behaviour)
13. [Algorithm Trigger & Performance](#13-algorithm-trigger--performance)
14. [Supabase Edge Function Implementation Notes](#14-supabase-edge-function-implementation)

---

## 1. Algorithm Overview

The Roommate Link matching algorithm is a **weighted vector similarity engine** with a **behavioural intelligence layer**. It does not simply compare answer strings, it reads cross-category patterns, detects dishonesty, and penalises toxic personality combinations that would create hostile living environments regardless of other surface similarities.

### The Three Layers

```
Layer 1: BASE SCORE        →  Raw weighted percentage similarity across all 40 questions
Layer 2: PATTERN DETECTION  →  Cross-category penalty/bonus system that reads behavioural combinations
Layer 3: CONSISTENCY CHECK  →  Honesty detection that adjusts confidence and recalibrates suspicious profiles
```

The final match percentage a user sees is the product of all three layers:

```
final_score = base_score - pattern_penalties ± consistency_adjustment
```

---

## 2. Answer Encoding & Storage

Every answer maps to a numerical value:

| Answer | Encoded Value | Meaning |
|--------|--------------|---------|
| A | 1 | Typically the most accommodating, direct, or structured response |
| B | 2 | Moderate, balanced, middle-ground response |
| C | 3 | More particular, sensitive, or reactive response |
| D | 4 | Most extreme, rigid, or self-aware response |

### Storage Format

All 40 answers are stored in Supabase as a **single JSONB object** per user in the `questionnaire_responses` table:

```json
{
  "q1": 2, "q2": 1, "q3": 3, "q4": 4,
  "q5": 1, "q6": 1, "q7": 2, "q8": 1,
  "q9": 1, "q10": 2, "q11": 1, "q12": 2,
  "q13": 1, "q14": 2, "q15": 1, "q16": 2,
  "q17": 2, "q18": 3, "q19": 2, "q20": 2,
  "q21": 2, "q22": 3, "q23": 1, "q24": 2,
  "q25": 1, "q26": 2, "q27": 1, "q28": 1,
  "q29": 1, "q30": 2, "q31": 2, "q32": 1,
  "q33": 2, "q34": 2, "q35": 2, "q36": 2,
  "q37": 1, "q38": 2, "q39": 1, "q40": 1
}
```

**Why a single JSONB object and not 40 rows?**
When the algorithm fires, it needs to compare the new user's full answer vector against every active profile in the database. A single-row fetch per user is the difference between the algorithm running in 200ms versus 3 seconds at 500 users. At scale this is critical.

---

## 3. Category Weight System

The questionnaire has 40 questions divided into 10 categories of 4 questions each. **Not all categories are created equal.** The weight multiplier determines how much influence each category has on the final score.

| Category | Questions | Weight | Tier | Why |
|---|---|---|---|---|
| Conflict Style | Q1–Q4 | ×5 | 🔴 DEALBREAKER | How you handle disagreements determines if every other incompatibility is manageable or explosive |
| Roommate Relationship | Q17–Q20 | ×5 | 🔴 DEALBREAKER | Friend vs co-tenant mismatch creates silent, one-sided emotional injury |
| Lifestyle Imposition | Q25–Q28 | ×5 | 🔴 DEALBREAKER | Someone who can't leave your choices alone makes all other compatibility meaningless |
| Sleep & Study | Q5–Q8 | ×3 | 🟡 CORE | Directly affects academic performance and daily functioning |
| Cleanliness | Q9–Q12 | ×3 | 🟡 CORE | Most commonly reported ongoing hostel conflict |
| Social Habits | Q13–Q16 | ×3 | 🟡 CORE | Determines if your room is a sanctuary or a party venue |
| Romantic Life | Q29–Q32 | ×3 | 🟡 CORE | Third-party partner dynamics destabilise two-person agreements |
| Lifestyle & Maturity | Q21–Q24 | ×1 | 🟢 PREFERENCE | Important context but typically manageable with communication |
| Food & Cooking | Q33–Q36 | ×1 | 🟢 PREFERENCE | Ghana-specific food sharing conflicts — real but negotiable |
| Shared Resources | Q37–Q40 | ×1 | 🟢 PREFERENCE | Ownership boundary conflicts — usually resolvable |

### Maximum Possible Weighted Score

```
DEALBREAKERS:  3 categories × 4 questions × weight 5 = 60 weighted points possible
CORE:          4 categories × 4 questions × weight 3 = 48 weighted points possible  
PREFERENCES:   3 categories × 4 questions × weight 1 = 12 weighted points possible
                                                        ─────
TOTAL MAXIMUM:                                          120 weighted points
```

This means:
- **DEALBREAKER categories control 50%** of the total match score (60/120)
- **CORE HABIT categories control 40%** (48/120)
- **PREFERENCE categories control only 10%** (12/120)

Two people who are identical on food preferences but opposite on conflict style will **never** score high. The math makes this impossible by design.

---

## 4. Base Compatibility Score — The Math

### Per-Question Score

For each of the 40 questions, the algorithm compares User A's answer with User B's answer:

```
question_score = (4 - |answer_A - answer_B|) / 4
```

This produces a score between 0 and 1:

| Answer Difference | Example | Score | Interpretation |
|---|---|---|---|
| 0 (identical) | Both answered B (2) | **1.00** | Perfect agreement |
| 1 (one step) | A answered A (1), B answered B (2) | **0.75** | Strong alignment |
| 2 (two steps) | A answered A (1), B answered C (3) | **0.50** | Moderate tension |
| 3 (maximum) | A answered A (1), B answered D (4) | **0.25** | Significant incompatibility |

### Per-Category Score

The four question scores within each category are averaged, then multiplied by the category weight:

```
category_weighted_score = mean(q_score_1, q_score_2, q_score_3, q_score_4) × weight
```

### Overall Raw Score

```
raw_score = sum(all_category_weighted_scores) / 120 × 100
```

Where 120 is the maximum possible weighted score (if every question scored 1.0).

---

## 5. Full Worked Example — Ama vs Kwame

### The Students

**Ama** — A Level 200 Computer Science student. She sleeps early, studies alone in silence, keeps her side of the room spotless, has a close-knit group of friends she sees outside the room, and handles conflict head-on.

**Kwame** — A Level 100 Business student. He sleeps before midnight, studies with light music, keeps things tidy but not obsessive, is social but respects boundaries, and prefers to address problems directly.

### Their Answers (Encoded)

| Q | Category | Ama | Kwame | Difference | Score |
|---|---|---|---|---|---|
| Q1 | Conflict Style ×5 | A (1) | A (1) | 0 | **1.00** |
| Q2 | Conflict Style ×5 | C (3) | C (3) | 0 | **1.00** |
| Q3 | Conflict Style ×5 | C (3) | B (2) | 1 | **0.75** |
| Q4 | Conflict Style ×5 | A (1) | B (2) | 1 | **0.75** |
| Q5 | Sleep & Study ×3 | A (1) | A (1) | 0 | **1.00** |
| Q6 | Sleep & Study ×3 | A (1) | B (2) | 1 | **0.75** |
| Q7 | Sleep & Study ×3 | A (1) | B (2) | 1 | **0.75** |
| Q8 | Sleep & Study ×3 | A (1) | B (2) | 1 | **0.75** |
| Q9 | Cleanliness ×3 | A (1) | B (2) | 1 | **0.75** |
| Q10 | Cleanliness ×3 | C (3) | B (2) | 1 | **0.75** |
| Q11 | Cleanliness ×3 | A (1) | A (1) | 0 | **1.00** |
| Q12 | Cleanliness ×3 | A (1) | B (2) | 1 | **0.75** |
| Q13 | Social ×3 | A (1) | B (2) | 1 | **0.75** |
| Q14 | Social ×3 | B (2) | B (2) | 0 | **1.00** |
| Q15 | Social ×3 | A (1) | B (2) | 1 | **0.75** |
| Q16 | Social ×3 | B (2) | B (2) | 0 | **1.00** |
| Q17 | Relationship ×5 | B (2) | B (2) | 0 | **1.00** |
| Q18 | Relationship ×5 | B (2) | C (3) | 1 | **0.75** |
| Q19 | Relationship ×5 | B (2) | B (2) | 0 | **1.00** |
| Q20 | Relationship ×5 | B (2) | B (2) | 0 | **1.00** |
| Q21 | Maturity ×1 | B (2) | A (1) | 1 | **0.75** |
| Q22 | Maturity ×1 | C (3) | B (2) | 1 | **0.75** |
| Q23 | Maturity ×1 | A (1) | B (2) | 1 | **0.75** |
| Q24 | Maturity ×1 | B (2) | B (2) | 0 | **1.00** |
| Q25 | Imposition ×5 | A (1) | B (2) | 1 | **0.75** |
| Q26 | Imposition ×5 | B (2) | B (2) | 0 | **1.00** |
| Q27 | Imposition ×5 | A (1) | A (1) | 0 | **1.00** |
| Q28 | Imposition ×5 | A (1) | B (2) | 1 | **0.75** |
| Q29 | Romantic ×3 | A (1) | B (2) | 1 | **0.75** |
| Q30 | Romantic ×3 | B (2) | B (2) | 0 | **1.00** |
| Q31 | Romantic ×3 | B (2) | B (2) | 0 | **1.00** |
| Q32 | Romantic ×3 | A (1) | B (2) | 1 | **0.75** |
| Q33 | Food ×1 | B (2) | B (2) | 0 | **1.00** |
| Q34 | Food ×1 | B (2) | B (2) | 0 | **1.00** |
| Q35 | Food ×1 | B (2) | B (2) | 0 | **1.00** |
| Q36 | Food ×1 | B (2) | B (2) | 0 | **1.00** |
| Q37 | Resources ×1 | A (1) | B (2) | 1 | **0.75** |
| Q38 | Resources ×1 | B (2) | B (2) | 0 | **1.00** |
| Q39 | Resources ×1 | A (1) | A (1) | 0 | **1.00** |
| Q40 | Resources ×1 | A (1) | B (2) | 1 | **0.75** |

### Category Score Calculation

| Category | Weight | Q Scores | Mean | Weighted Score | Max Possible |
|---|---|---|---|---|---|
| Conflict Style | ×5 | 1.00, 1.00, 0.75, 0.75 | 0.875 | **4.375** | 5.0 |
| Sleep & Study | ×3 | 1.00, 0.75, 0.75, 0.75 | 0.8125 | **2.4375** | 3.0 |
| Cleanliness | ×3 | 0.75, 0.75, 1.00, 0.75 | 0.8125 | **2.4375** | 3.0 |
| Social Habits | ×3 | 0.75, 1.00, 0.75, 1.00 | 0.875 | **2.625** | 3.0 |
| Relationship | ×5 | 1.00, 0.75, 1.00, 1.00 | 0.9375 | **4.6875** | 5.0 |
| Maturity | ×1 | 0.75, 0.75, 0.75, 1.00 | 0.8125 | **0.8125** | 1.0 |
| Imposition | ×5 | 0.75, 1.00, 1.00, 0.75 | 0.875 | **4.375** | 5.0 |
| Romantic Life | ×3 | 0.75, 1.00, 1.00, 0.75 | 0.875 | **2.625** | 3.0 |
| Food | ×1 | 1.00, 1.00, 1.00, 1.00 | 1.00 | **1.00** | 1.0 |
| Resources | ×1 | 0.75, 1.00, 1.00, 0.75 | 0.875 | **0.875** | 1.0 |

### Raw Score

```
Total Weighted Score = 4.375 + 2.4375 + 2.4375 + 2.625 + 4.6875 + 0.8125 + 4.375 + 2.625 + 1.00 + 0.875
                     = 26.25

Raw Score = (26.25 / 30) × 100 = 87.5%
```

Wait — the maximum here is 30 because we're summing the max weighted score per category (5+3+3+3+5+1+5+3+1+1 = 30). But if we compute it correctly using the full formula:

```
Maximum possible = sum of all (weight × 1.0 per question × 4 questions averaged)
                 = 5 + 3 + 3 + 3 + 5 + 1 + 5 + 3 + 1 + 1 = 30

Raw Score = 26.25 / 30 × 100 = 87.5%
```

### Cross-Category Check

Neither Ama nor Kwame triggers any of the cross-category penalty flags. No pattern detection penalties applied.

### Consistency Check

Both answer consistently within narrow, believable ranges. No flags.

### Final Score: **88% Match** (rounded up from 87.5%)

### What This Means In Real Life

Ama and Kwame would share a room peacefully. They both:
- Sleep early and respect quiet hours
- Handle conflict by talking it out (not avoiding it or exploding)
- Want a friendly-acquaintance relationship, not a forced best-friendship
- Mind their own business when the other makes personal choices
- Have identical food attitudes

Their minor differences (Kwame plays low music while studying vs Ama's silence, Ama is slightly more particular about cleanliness) are manageable because they share the same conflict DNA — they would simply discuss it and adapt.

---

## 6. Cross-Category Pattern Detection — The Intelligence Layer

Raw scores are not enough. Two people can score 85% overall but have a catastrophically dangerous personality combination hidden in the numbers. The pattern detection layer catches these.

### Maximum Penalty Patterns (–15% to –20% reduction)

#### Pattern 1: Q11(D) + Q4(D) — "Messy AND Unapologetic"

- **Q11**: "Your laundry is piling up. Roommate mentions the smell. Reaction?"
  - D = "Disrespected. My laundry is my business, not theirs."
- **Q4**: "You upset your roommate. They confronted you calmly. Reaction?"
  - D = "I find it genuinely very difficult to apologise even when I know I was wrong."

**Why this is maximum penalty:** This person creates mess, gets told about it respectfully, and responds with ego rather than correction. Anyone paired with this person will be living in filth with no mechanism for change. The messy person doesn't see the mess (Q11) AND can't acknowledge wrongdoing (Q4). These two traits compound into an unliveable environment.

**Real-world scenario:** Kofi leaves dirty dishes for a week. His roommate James says "Hey the kitchen smells, could you wash up?" Kofi feels attacked. He doesn't apologise, he doesn't clean. James stops saying anything. The dishes pile up. James starts eating every meal outside. They stop speaking entirely. Two months of cold, hostile silence in a 10×10 room.

**Penalty applied:** –20% to any match where one person has Q11(D)+Q4(D) and the other has Q9(A) or Q11(A). The algorithm protects clean, communicative people from this combination.

---

#### Pattern 2: Q28(D) + Q26(C) — "Two Moral Authorities In One Room"

- **Q28**: "Roommate makes a choice you disagree with. It doesn't affect you."
  - D = "I find it very hard to stay quiet when I see someone making a wrong choice."
- **Q26**: "Roommate is struggling academically. Not your grades."
  - C = "I regularly check in and remind them about their responsibilities. I cannot watch silently."

**Why this is maximum penalty if BOTH people score this way:** Two people who both believe they have the moral authority to correct the other person's choices. Neither will yield. Both believe they are being caring. Both feel the other is being controlling. The room becomes a constant power struggle disguised as concern.

**Real-world scenario:** Grace thinks Abena goes out too much. Abena thinks Grace is too rigid about religion. Grace mentions church every Sunday. Abena mentions grades every Monday. Both believe they're helping. Both feel suffocated. By month two, neither can breathe in their own room.

**Penalty applied:** –20% when BOTH users have this combination. If only one user has it and the other is Q28(A) ("their choices are their business"), this is flagged but not penalised as heavily — the A person can absorb the imposition.

---

### High Penalty Patterns (–10% to –15% reduction)

#### Pattern 3: Q40(D) + Q22(A) — "Lost AND Partying"

- **Q40**: "What kind of roommate are you honestly?"
  - D = "I'm still figuring that out."
- **Q22**: "Wednesday night gathering past midnight?"
  - A = "I go without hesitation. I am young and free."

**Why this is dangerous:** Someone who genuinely doesn't know themselves yet combined with someone who embraces maximum freedom. Neither person provides an anchor. Two people with no internal compass in one room means no routine, no predictability, no stability. This isn't a moral judgement — it's a practical observation that two people in active self-discovery mode create an unpredictable living environment.

**Penalty applied:** –15% when pairing two users who both carry this flag. If only one has it and the other has strong structure scores (Q23(A)), the structured person can provide stability — this pairing is actually flagged as potentially beneficial.

---

#### Pattern 4: Q33(D) + Q36(D) — "The Silent Food Grudge"

- **Q33**: "Roommate ate your food without asking."
  - D = "I say nothing but make a mental note. Trust broken quietly and permanently."
- **Q36**: "How do you feel about a roommate who regularly asks for food?"
  - D = "I find it difficult to respect someone who regularly depends on others for food."

**Why this is high penalty:** This person is simultaneously recording every food-related violation in a silent mental notebook AND judging anyone who asks for food as beneath them. They will never confront. They will never share willingly. Their roommate will sense growing coldness without understanding why. The silent ledger gets heavier until one completely unrelated argument triggers everything stored in it.

**Penalty applied:** –12% to matches where this user is paired with Q34(C) ("I love cooking for others") or Q33(A) ("Genuinely unbothered"). The generous feeder will keep offering, the silent grudge holder will keep silently resenting.

---

#### Pattern 5: Q38(D) + Q40(C) — "Particular About Everything"

- **Q38**: "Roommate used your iron without asking while you were out."
  - D = "I would have a serious conversation. My belongings always require explicit permission."
- **Q40**: "What kind of roommate are you?"
  - C = "Quite particular. I have specific ways I like things."

**Why this is flagged:** This person is not dangerous — they're honest. But their compatible profile is extremely narrow. They MUST be matched with someone equally particular (Q38(D)+Q40(C)) for the relationship to work. Two particular people create clear, explicit boundaries and both feel safe. Matching a particular person with an easygoing person creates invisible boundary violations the easygoing person can't see.

**Penalty applied:** –10% when matched with Q37(A) + Q38(A) users. **+5% bonus** when matched with another Q38(D)+Q40(C) user. This is the only pattern that can INCREASE a match score.

---

### Moderate Penalty Patterns (–5% to –8% reduction)

#### Pattern 6: Q29(C) + Q31(C) — "Romantic Invasion"

- **Q29**: "How often would your partner visit?"
  - C = "Regularly. My partner is part of my life."
- **Q31**: "Partner has visited three times this week."
  - C = "Very uncomfortable. I did not agree to live with two people."

**Why this is flagged:** If BOTH users in a match carry Q29(C), neither will have a problem with frequent visits — they both do it. But if Q29(C) is paired with Q31(C), one person is constantly having their partner over and the other is constantly feeling invaded. The mismatch creates compounding resentment over the phantom third roommate.

**Penalty applied:** –8% when one user has Q29(C) and the other has Q31(C).

---

#### Pattern 7: Q14(B) + Q1(C) — "The Selective Confronter"

- **Q14**: "Roommate bringing friends over when you're tired."
  - B = "I tell them honestly I'm exhausted and ask them to use the common room."
- **Q1**: "Roommate's door noise wakes you five times."
  - C = "I am silently annoyed but say nothing."

**Why this is flagged (not penalised):** This person tolerates daily irritations silently but protects their personal rest. This isn't inconsistency — it's a specific threshold. They don't confront about small things but they do confront when their personal recovery is at stake. This nuance is valuable data. The algorithm reads it as context-specific confrontation and records it for display in the compatibility breakdown.

**Penalty applied:** None. Flagged for the compatibility insight display: "Your match picks their battles — rarely confrontational, but protective of personal rest time."

---

## 7. The Complete Cross-Question Relationship Map

Every question doesn't exist in isolation. Here is the full map of how questions inform each other:

### Conflict DNA Chain: Q1 → Q2 → Q3 → Q4

These four questions build a complete conflict profile:

| Pattern | Reading |
|---|---|
| Q1(A) + Q2(A) + Q3(B) + Q4(A) | **Direct communicator.** Confronts immediately, expects resolution, apologises quickly. The healthiest conflict profile. |
| Q1(C) + Q2(B) + Q3(A) + Q4(C) | **Conflict avoider.** Never confronts, goes cold when betrayed, relieved when tension disappears, internally justifies. Accumulated resentment explodes months later. |
| Q1(A) + Q2(A) + Q3(C) + Q4(D) | **Aggressive communicator.** Confronts everything but cannot apologise. Demands resolution from others but offers none themselves. Extremely difficult roommate. |
| Q1(D) + Q2(D) + Q3(A) + Q4(A) | **Genuinely unbothered.** Nothing registers as conflict. Rare and valuable profile — compatible with almost anyone. |

### Sleep Sensitivity Chain: Q5 → Q6 → Q7 → Q8

| Pattern | Reading |
|---|---|
| Q5(A) + Q6(A) + Q8(A) | **Sleep-sacred.** Early sleeper, earphone user, before 11PM always. Compatible only with other early sleepers or highly considerate night owls. |
| Q5(B) + Q6(B) + Q8(C) | **Night owl, low consideration.** Plays low music while roommate sleeps, studies late. Dangerous for sleep-sacred profiles. |
| Q5(D) + Q8(D) | **No rhythm.** Unpredictable sleep schedule. This is the most underrated difficult roommate — you can't build any routine around them. |

### Imposition Detection Chain: Q25 → Q26 → Q27 → Q28

| Pattern | Reading |
|---|---|
| Q25(A) + Q26(A) + Q27(A) + Q28(A) | **Pure boundary respect.** This person will never comment on your choices, your schedule, your friends, your academics. They are the perfect roommate for independent, private people. |
| Q25(C) + Q26(C) + Q27(D) + Q28(D) | **Full imposer.** Asks where you were at 2AM, monitors your academics, invites you to their activities, cannot stay quiet about your choices. Their compatible roommate is someone who WANTS a parent figure (Q17(C), Q18(A)). |

### The Q40 Truth Test

Q40 is the consistency validator. After 39 situation-based questions, it asks point-blank: "What kind of roommate are you honestly?"

| Q40 Answer | Cross-Reference | Algorithm Response |
|---|---|---|
| Q40(A) "Considerate and easygoing" | But Q9(D) + Q10(D) + Q11(D) pattern | **Flag:** Answered considerate but has messy/defensive pattern. Q40 recalibration: weight Q40 less, trust behavioural questions more. Reduce match confidence. |
| Q40(C) "Quite particular" | But Q37(A) + Q38(A) + Q39(A) pattern | **Flag:** Claims particular but actually communal about belongings. Q40 recalibration: trust Q37-39 pattern over self-assessment. Match with communal profiles. |
| Q40(D) "Still figuring that out" | Any pattern | **No flag.** This is extraordinary self-awareness. Treat as honest signal. Match with patient, adaptable profiles. Reduce hard dealbreaker penalties by 20%. |
| Q40(B) "Well-meaning but imperfect" | Consistent with mixed pattern | **Perfect consistency.** This person knows themselves. Highest confidence weight. |

---

## 8. Consistency Detection — Catching Dishonesty & Finding Hidden Truths

### Flag 1: Sudden Pattern Break

Monitor the dominant answer range across all 40 questions. If a user answers A or B on 35+ questions but suddenly answers D on specific questions, those D answers represent moments of genuine honesty.

**Example:** Someone answers A/B consistently (easy-going, accommodating) but answers Q36(D): "I find it difficult to respect someone who regularly depends on others for food." That D answer is weighted 1.5× because it's the one place they dropped the performance.

### Flag 2: Cross-Category Contradiction

A user answers all C's in Conflict Style (never confronts) but answers Q30(D): "Three times is already two too many. I would have addressed it after the first night."

**This is NOT inconsistency.** This is a specific trigger profile. The algorithm reads: "Conflict-avoidant in daily life, but protective of sleep specifically." This nuance is signal, not noise. The user's match breakdown will display: "Your match rarely confronts about daily issues but will firmly protect their sleep."

### Flag 3: Statistically Perfect Profile

If all 40 answers are A (encoded value 1), the profile is flagged as potentially dishonest. Nobody is perfectly easygoing about everything.

- No ban, no removal
- Match confidence reduced by 15%
- Profile flagged in admin dashboard for monitoring
- A note appears on the user's matches: "This profile has unusually uniform answers"

### Flag 4: Q40 Recalibration

If Q40 contradicts the dominant pattern across the other 39 questions, the algorithm weights Q40 as the more deliberate, reflective statement.

**Example:** 35 questions show a C-dominant pattern (quite particular), but Q40(A) says "Considerate and easygoing." The algorithm reduces overall match confidence by 10% because the user's self-perception doesn't match their behavioural answers. Q40 is weighted as truth, but the discrepancy itself is data.

---

## 9. Second Worked Example — Efua vs Nana (With Penalties)

### The Students

**Efua** — Extremely tidy, non-confrontational conflict avoider, deeply private, sleeps early, doesn't cook for others, tracks her belongings carefully.

**Nana** — Messy but unaware, never apologises, monitors others' academics, invites people to events relentlessly, stays up late.

### Critical Answers

| Q | Efua | Nana | Score |
|---|---|---|---|
| Q1 (Conflict) | C (3) - avoids | A (1) - confronts | 0.50 |
| Q4 (Conflict) | A (1) - apologises | **D (4)** - can't apologise | **0.25** |
| Q9 (Cleanliness) | A (1) - washes all | D (4) - doesn't notice mess | **0.25** |
| Q11 (Cleanliness) | A (1) - appreciates honesty | **D (4)** - feels disrespected | **0.25** |
| Q25 (Imposition) | A (1) - minds business | C (3) - asks where you were | 0.50 |
| Q26 (Imposition) | A (1) - their academics, theirs | **C (3)** - regularly checks in | 0.50 |
| Q28 (Imposition) | A (1) - minds business | **D (4)** - can't stay quiet | **0.25** |

### Base Score Calculation (abbreviated for the critical categories)

**Conflict Style (×5):** mean(0.50, 0.75, 0.50, 0.25) = 0.50 → weighted: 2.50/5.0
**Cleanliness (×3):** mean(0.25, 0.50, 0.25, 0.50) = 0.375 → weighted: 1.125/3.0
**Imposition (×5):** mean(0.50, 0.50, 0.75, 0.25) = 0.50 → weighted: 2.50/5.0

Assume other categories average 0.60:
- Sleep (×3): 1.80/3.0
- Social (×3): 1.80/3.0
- Relationship (×5): 3.00/5.0
- Maturity (×1): 0.60/1.0
- Romantic (×3): 1.80/3.0
- Food (×1): 0.60/1.0
- Resources (×1): 0.60/1.0

```
Total = 2.50 + 1.80 + 1.125 + 1.80 + 3.00 + 0.60 + 2.50 + 1.80 + 0.60 + 0.60 = 16.345
Raw = 16.345 / 30 × 100 = 54.5%
```

### Pattern Penalty Detection

**🔴 Q11(D) + Q4(D) DETECTED on Nana's profile.**
Nana answered Q11(D) — "My laundry is my business" — AND Q4(D) — "I find it very hard to apologise."

Penalty applied: **–15%** because Efua is Q9(A) and Q11(A) — a clean, honest communicator being paired with someone messy and unapologetic.

**🔴 Q28(D) + Q26(C) DETECTED on Nana's profile.**
Nana answered Q28(D) — can't stay quiet about others' choices — AND Q26(C) — regularly monitors academics.

Penalty applied: **–10%** because Efua is Q25(A)+Q26(A)+Q28(A) — a pure boundary-respecting person being paired with an imposer.

### Final Score

```
Raw Score:        54.5%
Pattern Penalty:  -15% (Q11D+Q4D) -10% (Q28D+Q26C) = -25%
Adjusted Score:   54.5% - 25% = 29.5%
```

**Final: 30% Match — BELOW the 60% threshold. This match is HIDDEN from both users.**

### What This Prevented In Real Life

Without this algorithm, Efua and Nana could have ended up sharing a room. Within two weeks:
- Nana's mess would grow. Efua would hint. Nana would feel attacked.
- Nana would start asking why Efua never comes to her church group. Efua would feel suffocated.
- Efua would stop speaking. Nana would think everything is fine.
- By month two, Efua would be eating every meal outside, sleeping with earplugs, and counting the days until she can change rooms.

The algorithm prevented this by reading the combination of Q4(D)+Q11(D)+Q26(C)+Q28(D) as a high-risk personality cluster and mathematically pushing Efua and Nana apart.

---

## 10. Final Score Assembly Pipeline

```
┌──────────────────────────┐
│  User A Completes Q's    │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Encode all 40 answers   │
│  Store as JSONB object   │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Fetch ALL active user   │
│  answer vectors          │
└──────────┬───────────────┘
           ▼
  ┌────────────────────────────────────────┐
  │  FOR EACH active user B:              │
  │                                        │
  │  1. Calculate 40 question_scores       │
  │  2. Group into 10 categories           │
  │  3. Average each category              │
  │  4. Multiply by category weight        │
  │  5. Sum all weighted category scores   │
  │  6. Divide by 30 (max), × 100         │
  │     → RAW SCORE                        │
  │                                        │
  │  7. Run cross-category pattern scan    │
  │     → Apply penalties (0% to –25%)     │
  │                                        │
  │  8. Run consistency analysis on both   │
  │     User A and User B profiles         │
  │     → Adjust confidence (±10%)         │
  │                                        │
  │  9. FINAL SCORE = raw – penalties ±    │
  │     consistency adjustment             │
  │                                        │
  │  10. If final ≥ 60%, INSERT into       │
  │      matches table                     │
  │  11. If final < 60%, skip (no record)  │
  └────────────────────────────────────────┘
           ▼
┌──────────────────────────┐
│  Cache results in the    │
│  matches table           │
│  Notify existing users   │
│  via FCM if new match    │
│  scores above threshold  │
└──────────────────────────┘
```

---

## 11. Edge Cases & Failure Modes

| Edge Case | How The Algorithm Handles It |
|---|---|
| **User answers all A's (perfect profile)** | Flag 3 fires. Match confidence reduced 15%. Admin notified. Matches still generated but at lower confidence. |
| **Only 5 users in database** | Algorithm runs normally. User may get 0-5 matches. If 0 matches above 60% after 7 days, push notification offers to lower threshold. |
| **Two users answer identically on all 40 questions** | 100% raw score. No penalties possible (same answers = no dangerous combinations). This is a genuine 100% match. Very rare but theoretically possible. |
| **User has 0 matches above threshold** | Notification after 7 days: "No highly compatible roommates yet. See closest available?" User can lower their display threshold. |
| **User has 50+ matches above threshold** | UI shows top 20, infinite scroll for rest. Top match gets hero card treatment. The algorithm doesn't cap — the UI manages display. |
| **A matched user marks "Found Roommate"** | Their profile status → COMPLETED. Removed from all active match feeds instantly. All existing match records remain in database for analytics but are hidden from UI. |
| **User reactivates after expiry** | Algorithm runs fresh comparison against all currently active profiles. Old match records are replaced with new calculations. |

---

## 12. Display Logic & Threshold Behaviour

### Minimum Threshold: 60%

Only matches scoring ≥60% after all penalties appear in a user's feed. This threshold was chosen because:
- At 60%, there are enough shared values for peaceful coexistence
- Below 60%, the dealbreaker categories likely have significant mismatches
- At launch with 150-500 users, this threshold should produce 3-15 matches per user on average

### Score Tier Display

| Score Range | Badge Colour | Display Label | UI Treatment |
|---|---|---|---|
| 90–100% | 🔥 Emerald + Fire icon | "Exceptional Match" | Hero card, top position, glow effect |
| 80–89% | 💚 Green | "Strong Match" | Full-size card, prominent placement |
| 70–79% | 💛 Amber | "Good Match" | Standard card |
| 60–69% | ⚪ Neutral | "Potential Match" | Compact card, lower in feed |

### Compatibility Breakdown Categories (Visible to All Users)

Even before payment, users can see:
- Overall match percentage badge
- Category-by-category score indicators (green/amber/red)
- Specific shared traits: "You both prefer quiet study environments"
- Flagged tensions: "Opposite conflict styles — one confronts directly, one avoids"

After payment, the identity (name, photo, bio, course) is revealed.

---

## 13. Algorithm Trigger & Performance

### When The Algorithm Fires

| Trigger | Scope | Expected Duration |
|---|---|---|
| New user completes questionnaire | Compare against ALL active profiles | 200ms–3s depending on database size |
| User reactivates expired profile | Compare against ALL active profiles | Same as above |
| User updates optional extension questions (V2) | Recalculate existing matches only | <500ms |

### Performance at Scale

| Active Users | Comparisons Needed | Estimated Time | Cost |
|---|---|---|---|
| 100 | 100 per new user | <200ms | Free tier |
| 500 | 500 per new user | <1s | Free tier |
| 2,000 | 2,000 per new user | ~2s | Free tier |
| 10,000 | 10,000 per new user | ~5s | Pro tier ($25/mo) |

The JSONB single-object storage means one DB query per user. The algorithm itself is pure arithmetic — no AI, no ML, no external API calls. It runs entirely within the Supabase Edge Function's V8 isolate.

---

## 14. Supabase Edge Function Implementation Notes

### Function: `calculate-matches`

**Trigger:** Database webhook on INSERT into `questionnaire_responses` table.

**Input:** `user_id` of the newly completed profile.

**Process:**
1. Fetch the new user's answer JSONB from `questionnaire_responses`
2. Fetch all active users' answer JSONBs in a single query: `SELECT user_id, answers FROM questionnaire_responses WHERE user_id IN (SELECT id FROM users WHERE status = 'ACTIVE')`
3. For each active user, run the three-layer algorithm
4. INSERT all matches ≥ 60% into the `matches` table
5. For each new match, check if the matched user has an FCM token → send push notification

**Output:** Array of match records inserted into the `matches` table:

```json
{
  "user_a_id": "uuid-of-new-user",
  "user_b_id": "uuid-of-matched-user",
  "match_percentage": 87,
  "raw_score": 0.915,
  "cross_category_flags": ["Q14B_Q1C_nuance"],
  "consistency_modifier": 0.0,
  "calculated_at": "2026-03-23T09:30:00Z"
}
```

### Pseudocode

```typescript
function calculateMatch(userA: Answers, userB: Answers): MatchResult {
  const WEIGHTS = { 1: 5, 2: 3, 3: 3, 4: 3, 5: 5, 6: 1, 7: 5, 8: 3, 9: 1, 10: 1 };
  const CATEGORIES = {
    1: ['q1','q2','q3','q4'],
    2: ['q5','q6','q7','q8'],
    3: ['q9','q10','q11','q12'],
    4: ['q13','q14','q15','q16'],
    5: ['q17','q18','q19','q20'],
    6: ['q21','q22','q23','q24'],
    7: ['q25','q26','q27','q28'],
    8: ['q29','q30','q31','q32'],
    9: ['q33','q34','q35','q36'],
    10: ['q37','q38','q39','q40'],
  };

  // Layer 1: Base Score
  let totalWeighted = 0;
  let maxWeighted = 0;
  
  for (const [catIdx, questionIds] of Object.entries(CATEGORIES)) {
    const weight = WEIGHTS[catIdx];
    const scores = questionIds.map(qId => {
      const diff = Math.abs(userA[qId] - userB[qId]);
      return (4 - diff) / 4;
    });
    const categoryMean = scores.reduce((a, b) => a + b, 0) / scores.length;
    totalWeighted += categoryMean * weight;
    maxWeighted += weight;
  }

  let rawScore = (totalWeighted / maxWeighted) * 100;

  // Layer 2: Cross-Category Pattern Detection
  let penalty = 0;
  const flags: string[] = [];

  // Check Q11D + Q4D on either user
  if ((userA.q11 === 4 && userA.q4 === 4) || (userB.q11 === 4 && userB.q4 === 4)) {
    penalty += 20;
    flags.push('Q11D_Q4D_messy_unapologetic');
  }

  // Check Q28D + Q26C on either user  
  if ((userA.q28 === 4 && userA.q26 === 3) && (userB.q28 === 4 && userB.q26 === 3)) {
    penalty += 20;
    flags.push('Q28D_Q26C_dual_imposer');
  }

  // Check Q40D + Q22A 
  if ((userA.q40 === 4 && userA.q22 === 1) && (userB.q40 === 4 && userB.q22 === 1)) {
    penalty += 15;
    flags.push('Q40D_Q22A_lost_and_partying');
  }

  // Check Q33D + Q36D
  if ((userA.q33 === 4 && userA.q36 === 4) || (userB.q33 === 4 && userB.q36 === 4)) {
    penalty += 12;
    flags.push('Q33D_Q36D_silent_food_grudge');
  }

  // Check Q29C + Q31C cross-user
  if ((userA.q29 === 3 && userB.q31 === 3) || (userB.q29 === 3 && userA.q31 === 3)) {
    penalty += 8;
    flags.push('Q29C_Q31C_romantic_invasion');
  }

  // Layer 3: Consistency Analysis
  let consistencyMod = 0;
  
  // Flag 3: All-A profile
  const allAnswersA = (u: Answers) => Object.values(u).every(v => v === 1);
  if (allAnswersA(userA) || allAnswersA(userB)) {
    consistencyMod -= 15;
    flags.push('all_A_suspicious');
  }

  const finalScore = Math.max(0, Math.min(100, 
    Math.round(rawScore - penalty + consistencyMod)
  ));

  return { 
    match_percentage: finalScore,
    raw_score: rawScore / 100,
    cross_category_flags: flags,
    consistency_modifier: consistencyMod / 100
  };
}
```

---

## Summary

The Roommate Link matching algorithm is not a simple survey comparison tool. It is a three-layer behavioural compatibility engine that:

1. **Reads the math** — 40 questions, weighted by real-world impact, producing a raw similarity score
2. **Reads the patterns** — Cross-category detection catches dangerous personality combinations invisible to raw scores
3. **Reads the honesty** — Consistency analysis identifies people performing a character versus answering truthfully

The result is a match percentage that tells a student: "Based on how you actually live, this person would share your room peacefully." And when that number is wrong, it is wrong in the direction of caution — because a false negative (missing a good match) is inconvenient, but a false positive (matching incompatible people) creates a hostile living environment for an entire academic year.

**The algorithm is the product. Everything else is packaging.**
