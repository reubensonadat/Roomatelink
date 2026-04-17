# 05 - The Matching Engine & Questionnaire

The Matching Engine is the core value proposition of Roommate Link. It justifies the payment by transforming raw behavioral data into a statistical compatibility score that predicts real-world living harmony.

## ⚙️ The Algorithm: Weighted Vector Similarity
The engine calculates compatibility using a weighted distance formula.

### 1. Answer Encoding
Answers are encoded numerically (`A=1`, `B=2`, `C=3`, `D=4`).

### 2. Base Compatibility Score
For each question, a `question_score` is calculated based on the distance between answers:
`question_score = (4 - |answer_A - answer_B|) / 4`
- **Same answer:** 1.0 (Perfect)
- **1 step apart:** 0.75 (Strong)
- **2 steps apart:** 0.50 (Moderate tension)
- **3 steps apart:** 0.25 (Significant incompatibility)

### 3. Category Weighting
Different lifestyle domains have different impacts on conflict. We apply multipliers to category averages:
- **x5 (DEALBREAKER):** Conflict Style, Lifestyle Imposition, Relationship Expectations.
- **x3 (CORE HABITS):** Sleep/Study, Cleanliness, Social Habits, Romantic Life.
- **x1 (PREFERENCE):** Lifestyle/Maturity, Food/Cooking, Shared Resources.

## 🚩 Pattern Flags (Cross-Category Penalties)
The raw score is modified by "Pattern Flags"—specific combinations that represent high-risk psychological pairings.
- **Triple Ego Flag:** If a user is `D` on Q4 (cannot apologize) AND `D` on Q11 (defensive about hygiene), they receive a massive penalty when matched with anyone who values order and accountability.
- **Surveillance vs. Autonomy:** Penalty applied when a "Surceiver" (Q25: C) matches with an "Autonomist" (Q25: A).

## 🚀 Execution: The "Blind Trigger" Edge Function
The matching engine is a Supabase Edge Function (`match-calculate`).

**The "Why" of the Blind Trigger:**
1.  **Atomicity:** The frontend triggers the calculation once upon questionnaire completion. 
2.  **No Return Value:** The function does not return the matches to the client. It inserts them directly into the `matches` table. This prevents "Stale State" where the UI shows matches that don't exist in the DB.
3.  **Scalability:** Processing 40 logic gates across hundreds of candidates is expensive for a browser. The Edge Function runs this in Deno (next to the database) in milliseconds.

## 🏛️ The Bouncer & Judge Pattern (Database-Level Filtering)
To ensure scalability and performance, the matching engine implements a two-phase filtering approach:

### Phase 1: The Bouncer (Database Query)
Before any algorithm runs, the database filters candidates using a WHERE clause:
```sql
WHERE 
  u.id != :userId
  AND u.is_matched = false
  AND u.status = 'ACTIVE'
  AND u.gender = :matchGender
  AND (u.match_preference = 'any' OR u.match_preference = :userMatchPreference)
```

**Why This Matters:**
- Eliminates 80-90% of candidates before algorithm runs
- Reduces computational load significantly
- Ensures only eligible candidates are processed
- Prevents matching with already matched users

### Phase 2: The Judge (Algorithm Scoring)
The algorithm only scores the filtered candidates, applying:
- Weighted vector similarity
- Category multipliers
- Pattern flags
- Cross-category penalties

**Benefits:**
- Scales to thousands of users efficiently
- Maintains accuracy while improving performance
- Database does the heavy lifting first
- Algorithm only processes viable candidates

## 📋 The Questionnaire Specification (CORE 40)

### Category 1: Conflict Style (Weight x5)
1.  **Door Noise:** (A: Direct, B: Hints, C: Silent, D: Unbothered)
2.  **Betrayal of Confidence:** (A: Immediate Confrontation, B: Cold Distance, C: Calm Address, D: Let it go)
3.  **Acting Normal After Argument:** (A: Relieved, B: Frustrated, C: Needs Acknowledgment, D: Depends)
4.  **Reaction to Feedback:** (A: Apologize, B: Defensive then Apologize, C: Apologize but justify, D: Cannot apologize)

### Category 2: Sleep & Study Schedule (Weight x3)
5.  **1AM Status:** (A: Deep Sleep, B: Studying, C: Awake/Phone, D: Depends)
6.  **Studying While Roommate Sleeps:** (A: Earphones, B: Low Volume, C: Relocate, D: Silence)
7.  **Exam Season Habits:** (A: Schedule, B: Adapt/Earphones, C: Relocate, D: Tension)
8.  **Basal Sleep Time:** (A: <11PM, B: 11-1AM, C: >1AM, D: No pattern)

### Category 3: Cleanliness & Organization (Weight x3)
9.  **The Dishes Pile:** (A: Wash all, B: Wash own, C: Add to pile, D: Don't notice)
10. **Roommate's Hurricane:** (A: Unbothered, B: Irritated, C: Affects peace, D: Quietly clean it)
11. **Hygiene Feedback:** (A: Appreciated, B: Embarrassed, C: Defensive, D: Disrespected)
12. **Settling Speed:** (A: 1 Day, B: 1 Week, C: Weeks, D: Never settled)

### Category 4: Social Habits (Weight x3)
13. **Friday Evening:** (A: Sanctuary/Alone, B: Out/Back Early, C: Out/Bring guests, D: Unpredictable)
14. **Unannounced Guests:** (A: Endure, B: Ask to move, C: Relocate, D: Join them)
15. **Guest Frequency:** (A: Never, B: Occasional, C: Daily spot, D: SO visits)
16. **9PM Housewarming:** (A: Join/Sleep through, B: Ask for quiet, C: Silent frustration, D: Needs relocation)

### Category 5: Relationship Expectation (Weight x5)
17. **1-Month Goal:** (A: Warm Coexistence, B: Check-ins, C: Genuine Friends, D: Reliable Strangers)
18. **Exhausted Day Return:** (A: Notice me, B: Give space, C: Bring it up myself, D: Warm but silent)
19. **Greeting Philosophy:** (A: Warm small talk, B: Simple nod, C: Nothing mandatory, D: Draining)
20. **Honest Goal:** (A: Friends, B: Acquaintances, C: Co-tenants, D: Adaptable)

### Category 6: Lifestyle & Maturity (Weight x1)
21. **Living Independently:** (A: Liberating, B: Structured, C: Overwhelming, D: Normal)
22. **Wednesday Late Night:** (A: Go, B: Limit, C: Decline, D: Never)
23. **Self-Discipline:** (A: High, B: Reseting, C: Accountability seeker, D: Flow)
24. **Stranger's Description:** (A: Serious, B: Balanced, C: Party life, D: Transitioning)

### Category 7: Lifestyle Imposition (Weight x5)
25. **2AM Surveillance:** (A: Ignore, B: Casualty mention, C: Ask where they were, D: Set boundary)
26. **Roommate Failing:** (A: Do nothing, B: Mention once, C: Remind regularly, D: Responsible)
27. **Belief Invitation:** (A: Fine, B: Managed, C: Suffocated, D: Boundary set)
28. **Disagreeable Choices:** (A: None of business, B: Notice privately, C: One mention, D: Hard to stay quiet)

### Category 8: Romantic Life (Weight x3)
29. **Partner Visits:** (A: Never, B: Occasional, C: Regular, D: Single)
30. **11PM Calls:** (A: Endure, B: Ask to move, C: Frustrated, D: Address immediately)
31. **3 Visits/Week:** (A: Fine, B: Irritated, C: Invaded, D: Energy dependent)
32. **Midnight Crisis:** (A: Check genuinely, B: Quiet check, C: Address disruption, D: Firm consideration)

### Category 9: Food & Cooking (Weight x1)
33. **Stolen Portion:** (A: Unbothered, B: Boundary, C: Upset, D: Broke trust)
34. **Food Philosophy:** (A: Separate, B: Ask first, C: Share always, D: Buy only)
35. **Resource Theft:** (A: Let go, B: Mention, C: Disrespected, D: Lock things)
36. **Asking for Food:** (A: Fine, B: Uncomfortable if pattern, C: Obligated, D: Contemptuous)

### Category 10: Shared Resources (Weight x1)
37. **Charger Borrowing:** (A: Fine, B: Preference, C: Annoyed, D: Violation)
38. **Iron Usage:** (A: Shared Living, B: Text next time, C: Upset, D: Permission required)
39. **Unreturned Cord:** (A: Forgot, B: Silent wait, C: Tracked, D: Expectation set)
40. **Honest Self-Reflection:** (A: Easygoing, B: Imperfect, C: Particular, D: Figuring it out)

## 🔄 Match Lifecycle

### 1. Questionnaire Completion
- User completes all 40 questions
- Responses saved to `questionnaire_responses` table
- Frontend triggers `match-calculate` edge function

### 2. Match Calculation
- Edge function queries eligible candidates (Bouncer phase)
- Calculates compatibility scores (Judge phase)
- Stores matches in `matches` table
- Returns success to frontend

### 3. Match Display
- Frontend fetches matches from database
- Displays in dashboard with tier system (Platinum, Gold, Silver, Bronze)
- Users can unlock matches after payment

### 4. Match Selection
- User selects a match
- Both users marked as `is_matched = true`
- Chat thread created
- Both users can no longer see other matches

## 🎯 Tier System
Matches are categorized based on compatibility percentage:
- **Platinum (90%+):** Exceptional compatibility
- **Gold (80-89%):** Strong compatibility
- **Silver (70-79%):** Good compatibility
- **Bronze (60-69%):** Moderate compatibility

## 🔍 Match Ambiguity Handling
To prevent confusion when two users match each other differently:
- **Reciprocal Matches Only:** Only display matches where both users scored each other highly
- **Symmetric Display:** Both users see the same compatibility score
- **No False Positives:** Don't show matches that aren't mutual

## ⚡ Performance Optimization

### 1. Database-Level Filtering
- WHERE clause eliminates 80-90% of candidates before algorithm runs
- Reduces computational load significantly

### 2. Caching
- Match results cached in `matches` table
- No need to recalculate on every dashboard load

### 3. Lazy Loading
- Matches loaded on demand
- Pagination for large result sets

### 4. Edge Function Optimization
- Deno runtime for fast execution
- Next to database for low latency
- No return value to client (async processing)

## 🚨 Error Handling

### 1. Retry Logic
- Automatic retry on network failure (up to 3 attempts)
- Exponential backoff between retries

### 2. Timeout Protection
- 20-second timeout for match calculation
- Prevents infinite loops

### 3. Fallback Behavior
- If calculation fails, user can manually trigger recalculation
- Dashboard shows error state with retry option

## 📊 Match Analytics

### Tracked Metrics
- Number of matches per user
- Average compatibility score
- Match conversion rate (selection rate)
- Time to match selection

### Quality Metrics
- User satisfaction with matches
- Long-term roommate success
- Conflict reduction
- Retention rates
