ROOMMATE LINK
Comprehensive Product Architecture & Specification


The Ultimate Student Roommate Compatibility Platform
University of Cape Coast


Version 2.0  —  Architecture Revised (React + Vite)
Built for UCC Freshmen. Built on Real Conflict. Built to Last.
Status: Architecture Revised — Next.js Abandoned (March 2026)
Reason for Revision: 30+ failed Cloudflare Pages builds caused by incompatibility between Next.js and Cloudflare Edge Workers.


CONFIDENTIAL PRODUCT DOCUMENT
 
 
Table of Contents
Table of Contents	2
1. Introduction & Vision	5
1.1 The Problem	5
1.2 The Solution	5
1.3 Core Principles	6
2. Launch Strategy	7
2.1 Target Market	7
2.2 Distribution Channel	7
2.3 Launch Timing	8
3. Visual Identity & Design System	9
3.1 Colour Palette	9
3.2 Typography	9
3.3 PWA Configuration	9
3.4 Avatar System	10
4. Detailed User Flows	11
4.1 Phase 1 — Onboarding	11
Step 1: Landing Page	11
Step 2: Authentication	11
Step 3: Profile Creation	11
Step 4: The Questionnaire	12
4.2 Phase 2 — The Match Calculation & Paywall	12
Match Calculation Sequence	12
The Locked Dashboard State	12
The Payment	13
4.3 Phase 3 — Interaction & Chat	13
Unlocked Dashboard State	13
Messaging System	14
4.4 Phase 4 — Resolution	14
Found Roommate Prompts	14
Profile Expiry	14
5. The Questionnaire	15
5.1 Philosophy & Design Principles	15
5.2 Question Categories & Weights	15
5.3 The 40 Core Questions	16
Category 1: Conflict Style (Q1–Q4)  |  Weight x5	16
Category 2: Sleep & Study Schedule (Q5–Q8)  |  Weight x3	17
Category 3: Cleanliness & Organisation (Q9–Q12)  |  Weight x3	18
Category 4: Social Habits (Q13–Q16)  |  Weight x3	19
Category 5: Roommate Relationship Expectation (Q17–Q20)  |  Weight x5	20
Category 6: Lifestyle & Maturity (Q21–Q24)  |  Weight x1	22
Category 7: Lifestyle Imposition (Q25–Q28)  |  Weight x5	23
Category 8: Romantic Life (Q29–Q32)  |  Weight x3	24
Category 9: Food & Cooking (Q33–Q36)  |  Weight x1	25
Category 10: Shared Resources & Borrowing (Q37–Q40)  |  Weight x1	27
6. The Matching Algorithm	29
6.1 Answer Encoding	29
6.2 Category Weight Assignment	29
6.3 Base Compatibility Score Calculation	30
6.4 Cross-Category Pattern Detection	30
6.5 Consistency Detection	31
Flag 1: Sudden Pattern Break	31
Flag 2: Cross-Category Contradiction	31
Flag 3: Statistically Perfect Profile	31
Flag 4: Q40 Recalibration	31
6.6 Compatibility Threshold & Display Logic	31
6.7 Algorithm Trigger	32
7. Database Schema (Supabase PostgreSQL)	33
7.1 Entity: users	33
7.2 Entity: questionnaire_responses	33
7.3 Entity: matches	34
7.4 Entity: messages	34
7.5 Entity: reports	34
8. Technology Stack	36
9. Business Model	37
9.1 Pricing Structure	37
9.2 Revenue Projections — Year 1 (Conservative)	37
9.3 Future Revenue Streams — V2	37
10. Security, Verification & Moderation	39
10.1 Student Verification	39
10.2 Account Security	39
10.3 Moderation System	39
10.4 Gender Matching	40
11. Ghost User Prevention System	41
12. Edge Cases & Failure Modes	42
13. Optional Question Bank — V2 Roadmap	43
Appendix A: Compatibility Matrix — High Risk Pairings	44
Appendix B: Architecture Decision Log	46
Status: Architecture Approved & Locked	48

 
1. Introduction & Vision

1.1 The Problem
Living with a stranger is one of the biggest unaddressed gambles in a student's academic life. A student who sleeps at 9PM and needs absolute silence will suffer profoundly if paired with a roommate who studies with loud music at 2AM. A deeply tidy person will become quietly resentful living with someone whose clothes permanently hang from the door handle.

These are not hypothetical scenarios. They are real stories from real UCC hostels.

Real Story 1: Two girls in a hostel managed by a UCC hostel owner. One studied for a quiz while the other played music at high volume. The music player assumed silence meant approval because she remembered her roommate playing music just days before. The studying student said nothing out of conflict avoidance. The situation escalated to the point where the hostel manager had to intervene personally. The root cause: they were never friends, so neither felt safe expressing a simple preference.

Real Story 2: An antisocial student paired with a highly social one. Every free day the social student brought friends over to what was supposed to be a shared private room. The antisocial student had no language to express that her room was being converted into a community lounge. She had no mechanism to communicate it before they were already living together.

Real Story 3: One roommate acts as an unofficial house mother, commenting on the other's dress choices, reminding them about church attendance, monitoring their academic performance. The other roommate is not looking for a parent. She is looking for someone to quietly share a room with. Neither person is wrong. They are simply catastrophically mismatched in what they expect from a shared living relationship.

These conflicts lead directly to academic failure, deteriorating mental health, hostile living environments, and in worst cases, students dropping out or changing accommodation mid-semester at significant financial cost.
1.2 The Solution
Roommate Link is a weighted-algorithm matchmaking platform that treats finding a compatible roommate with the same seriousness as a high-end compatibility application. Users complete a carefully designed behavioural questionnaire. The platform runs a sophisticated similarity analysis and surfaces highly compatible matches behind a transparent, justified paywall.

The questionnaire is not a form. It is a mirror. Every question is designed to surface honest self-knowledge rather than idealized self-presentation. Every answer feeds an algorithm that understands that a 96% compatibility score on a well-designed questionnaire is worth infinitely more than a profile picture and a phone number.
1.3 Core Principles
•	The Questionnaire Is the Product: The investment of time and honest self-reflection is not a barrier to the product. It IS the product. A student who answers 40 deep behavioural questions honestly has already done 80% of the compatibility work before meeting a single match.
•	Transparency Before Commitment: The GHS 25 fee (GHS 15 via partner promo codes) is communicated before the user answers a single question. There is no bait-and-switch. No betrayal moment. The paywall is expected, justified, and framed correctly from the first screen.
•	Privacy First: Users uncomfortable with sharing photos can use beautifully designed preset avatars. Matches are judged on values and compatibility scores first, identity second.
•	Self-Cleaning Database: Ghost profiles are eliminated through automated expiry, strategic prompts, and a frictionless found-roommate confirmation system.
•	We Are Building a System, Not Just Software: Every design decision exists to solve a real human problem that has been documented in real UCC hostel conflicts. This is not a generic roommate app. It is a UCC-specific behavioural compatibility engine.
 
2. Launch Strategy

2.1 Target Market
Version 1.0 targets exclusively the University of Cape Coast (UCC) student population. UCC has approximately 20,000+ enrolled students. The primary target segment within this population is incoming freshmen, for the following evidence-based reasons:

•	Freshmen are the most motivated users. They are anxious, unestablished, and have no existing roommate network. They face genuine accommodation blocking, with many hostel managers explicitly requiring students to arrive with a pre-arranged roommate before a room can be assigned.
•	Freshmen have the highest urgency. Finding a roommate is not a nice-to-have for this group. In many cases it is functionally blocking them from getting accommodation at all.
•	Freshmen are the least served by existing informal channels. Returning students have social networks and WhatsApp groups. Freshmen have nothing.
•	Word of mouth spreads fastest within cohorts. A freshman who finds a perfect roommate through Roommate Link will tell every freshman they know. This organic referral is the only marketing channel that matters on a university campus.
2.2 Distribution Channel
Roommate Link will be distributed exclusively through an existing, SRC-backed Student Campus Guide platform. This is not a secondary strategy. It is the primary go-to-market mechanism and it solves the cold start problem entirely.

The campus guide platform is already built and live. It carries SRC endorsement, meaning freshmen trust the information on it as accurate and institutional. A link to Roommate Link placed within this trusted environment carries immediate credibility.

WHY THIS MATTERS	A student who clicks a link from an SRC-backed platform arrives at Roommate Link pre-primed to trust it. They are not a cold stranger evaluating an unknown app. They are a student who already trusts the source that referred them. This eliminates the single biggest conversion barrier for a new platform.

Additional distribution channels to activate at launch:
•	Hall JCR Executive partnerships: JCR executives have direct access to fresher WhatsApp groups, orientation events, and hall notice boards.
•	Orientation week presence: Coordinate with student orientation organizers to include Roommate Link in official fresher information packs.
•	Peer ambassador program: Identify five to ten respected sophomore or junior students willing to champion the platform within their social networks in exchange for extended free access.
2.3 Launch Timing
The optimal launch window is the final two weeks of the first semester and the first two weeks of the second semester. This is the peak accommodation scramble period when:
•	First semester results create hostel reshuffling as some students change programmes or fail out.
•	Freshmen who settled informally in first semester begin experiencing the consequences of poor roommate matching and actively seek alternatives.
•	Accommodation hunting for second semester accommodation begins in earnest.

Launching in the middle of a semester produces dramatically lower conversion because urgency is at its lowest point. Timing the launch to the peak anxiety window is as important as the product itself.

CRITICAL WARNING	Do not launch without at least 150-200 seed profiles already in the database. Arrange for a closed beta with JCR partners, campus guide users, and ambassador networks before public launch. The first public user must see meaningful matches on day one or word of mouth immediately turns negative.
 
3. Visual Identity & Design System

3.1 Colour Palette
Colour	Usage & Hex Code
Primary Brand	Indigo 600 — #4f46e5 — Primary actions, CTA buttons, headings
Secondary Accent	Violet 500 — #8b5cf6 — Match percentage badges, premium UI elements
Background	Slate 50 — #f8fafc — Clean, distraction-free reading surface
Surface	White — #ffffff — Questionnaire cards, chat bubbles, profile cards
Paywall / Lock	Amber 500 — #f59e0b — Premium locked content indicators
Danger / Alert	Red 600 — #dc2626 — Dealbreaker flags, suspension notices
Success	Emerald 600 — #059669 — High compatibility scores, confirmed matches

3.2 Typography
•	Font Family: Inter — Clean, legible for long questionnaires and reading-heavy screens
•	Display: Bold Inter at 32-40px for match percentage badges and key metrics
•	Body: Regular Inter at 14-16px for questionnaire options and profile bios
•	Captions: Medium Inter at 12px for timestamps, metadata, category labels
3.3 — PWA Configuration (REWRITTEN)
Roommate Link is a Progressive Web Application (PWA) built with React (Vite) using the vite-plugin-pwa package. This replaces the previous next-pwa package.

• Zero download friction: A student clicks a link from the SRC campus guide and lands directly inside the application. No Play Store. No App Store. No install prompt before value delivery.
• Cross-device access: Works identically on mobile phones, tablets, and laptops.
• Installable to home screen: After first visit, the browser prompts installation. App icon, full-screen mode, offline capability for cached screens.
• Faster shipping: No app store review process. New versions deploy to Cloudflare Pages in under 30 seconds.
• PWA manifest (public/manifest.json) includes: app name, short name, theme colour (#4f46e5), background colour (#f8fafc), display mode standalone, icons at 192px and 512px.
• Service worker configured via vite.config.ts using VitePWA() plugin with registerType: 'autoUpdate'.
3.4 Avatar System
Users who do not wish to upload a photo may select from a curated grid of ten high-quality vector avatar illustrations. Avatars are designed to feel personality-expressive rather than generic. Example names:
•	The Night Owl — Dark aesthetic, headphones, late-night energy
•	The Early Bird — Bright, morning energy, coffee in hand
•	The Studious Fox — Books, glasses, focused intensity
•	The Social Butterfly — Warm, expressive, crowd energy
•	The Quiet One — Minimal, calm, introspective

Avatars serve a secondary function: they signal to matches that this person values privacy and personality-first evaluation. That itself is compatibility information.
 
4. Detailed User Flows

4.1 Phase 1 — Onboarding
Steps 1: Landing Page
The landing page communicates three things before the user does anything:
1.	What the app does: "Find your perfect UCC roommate before you ever meet them."
2.	That it costs money: "Free to join. Unlock your matches for GHS 25 — less than a bowl of waakye."
3.	Why it is trustworthy: "Every profile is a verified UCC student. No strangers. No fake accounts."

The framing of the fee on the landing page is non-negotiable. A student who discovers the fee after completing a 40-question questionnaire feels betrayed. A student who knew the fee existed before they started feels like they made an informed investment.
Step 2: Authentication
Sign up is open to ANY valid email address (including Gmail via Google OAuth). However, to build trust within the platform, users who sign up with their official student email or link it later receive a special "Verified Student" checkmark. The system manages this via:
1.  **Direct Email/Password:** Verification link sent to the provided address.
2.  **Google OAuth:** Seamless sign-in. If the Google account uses a student domain, verification is automatic.
3.  **The "Add Student Email" Hook:** For users who sign up with Gmail, a button in Settings allows them to add and verify their `@stu.ucc.edu.gh` address, flipping the `is_student_verified` flag.


TECHNICAL NOTE	By allowing any email, we maximize the top of the funnel for users who do not remember their student email logins. By rewarding official emails with a checkmark, we maintain the "safe, verified student ecosystem" psychology without blocking access.

Phone number is collected but not verified at this stage. It is used later exclusively for Firebase Cloud Messaging push notification delivery.
Step 3: Profile Creation
Field	Details
Full Name	Display name shown to matches after payment unlock
Course / Programme	Used for contextual matching information
Level / Year	100, 200, 300, 400, 500, 600 — informs lifestyle and maturity matching
Gender Preference	Same gender only OR open to any gender — applied as hard database exclusion before algorithm runs
Avatar / Photo	Upload real photo OR choose from 10 preset vector avatars
Short Bio	Optional 2-3 sentence self-description, visible after payment unlock
Step 4: The Questionnaire
The questionnaire is the core data collection event of the onboarding flow. Design requirements:
•	Typeform-style single question display: One question occupies the full screen at a time. No scrolling through a form. No visible question list. Each answer tap immediately advances to the next question.
•	Fixed progress bar: A persistent progress indicator at the top of the screen shows completion percentage. This is psychologically critical. Users who cannot see progress will abandon the form. The progress bar transforms "I do not know how long this will take" into "I am 60% done, I will finish this."
•	Question randomisation: Questions are presented in randomised order on every session. This prevents users from recognising category patterns and performing a consistent character rather than answering honestly. Answer values are fixed to question IDs regardless of display order.
•	No back button: Once an answer is submitted it is final. This prevents overthinking and rationalisation that produces dishonest answers.
•	Completion celebration: On answering the final question, a brief animated celebration screen appears before transitioning to the match calculation sequence.
4.2 — Match Calculation & Paywall (REWRITTEN)
Match Calculation Sequence
Immediately on questionnaire completion, the frontend calls a Supabase Edge Function (match-calculate). This replaces the old Next.js API Route.

The Edge Function:
1. Receives the new user's ID from the frontend
2. Fetches the new user's answers from questionnaire_responses
3. Fetches ALL active users' answers from questionnaire_responses
4. Runs calculateMatchesForUser() (pure TypeScript math, zero external dependencies)
5. Inserts visible matches into the matches table
6. Returns the top matches to the frontend

While this runs (typically 2-5 seconds), the user sees the animated sequence:
• "Analysing your sleep and study habits..."
• "Comparing conflict styles..."
• "Checking social compatibility..."
• "Mapping lifestyle expectations..."
• "Finalising your matches..."

WHY SUPABASE EDGE FUNCTION: The matching algorithm is pure math (Math.abs, array operations, object comparisons). It has ZERO Node.js dependencies. It runs perfectly in Deno (Supabase Edge Functions) because Deno supports standard JavaScript APIs. Running it inside Supabase also means zero network latency to the database — the function lives next to the data.

The Payment System (SPLIT ARCHITECTURE)
The payment system is now deliberately split between client-side and server-side:

Client-Side (React Frontend) — Transaction Initialization:
• Uses the react-paystack library OR the Paystack inline JS popup
• Only requires the Paystack PUBLIC key (pk_test_... or pk_live_...)
• Stored in environment variable VITE_PAYSTACK_PUBLIC_KEY
• Opens the Paystack popup so the user enters their MoMo details and pays
• On successful payment, the frontend calls /api/paystack/verify (NOW a Supabase Edge Function) with the transaction reference for immediate UI unlock

Server-Side (Supabase Edge Function) — Webhook Verification:
• Endpoint: supabase/functions/paystack-webhook/index.ts
• Receives Paystack's server-to-server webhook notification
• Verifies the signature using the Web Crypto API (crypto.subtle.sign with HMAC-SHA-512) — NOT Node's crypto module
• Uses the Paystack SECRET key stored securely in Supabase Edge Function secrets (PAYSTACK_SECRET_KEY)
• On valid signature: updates has_paid = true and payment_date = now() in the users table
• Returns 200 to Paystack

WHY THIS SPLIT IS NON-NEGOTIABLE: The public key is safe in the frontend — it can only open a payment popup, it cannot process transactions. The secret key MUST live on a server. If you put the secret key in the frontend, anyone can open Chrome DevTools, steal it, and fake successful payments to unlock accounts for free. The Supabase Edge Function keeps the secret key invisible to the browser.

Dual-Layer Verification Still Applies:
1. Frontend calls the verify Edge Function with the transaction reference for instant UI feedback
2. Paystack's background webhook guarantees the database updates even if the user's Wi-Fi drops mid-payment
4.3 — Interaction & Chat (MINOR UPDATES)
Real-time chat powered by Supabase WebSockets — unchanged from v1.0.

• Only paid users can initiate or receive messages
• Message delivery via Firebase Cloud Messaging push notifications
• Message lifecycle (PENDING → SENT → DELIVERED → READ) tracked in the messages table
• No phone number or external contact exchange facilitated in the app

Implementation Change: The message status updates now happen via Supabase Realtime subscriptions in the React frontend, not through Next.js server actions. When a message is inserted, the sender subscribes to real-time updates on that message row to watch for read/delivery status changes.
4.4 Phase 4 — Resolution
Found Roommate Prompts
The platform prompts users to confirm their roommate search status at three strategic points rather than relying on voluntary self-reporting:
Trigger	Prompt & Action
Day 7 after payment	"Have you found your roommate yet? Tap to confirm or keep searching."
Day 30 after payment	"Still searching? We will keep your profile active. Found someone? Let us know so others are not waiting."
Day 50 after payment	"Your profile expires in 10 days. Still looking? Confirm to stay active. Found your roommate? Mark complete."

Tapping "Found My Roommate" immediately sets profile status to COMPLETED and removes the profile from all active match feeds. This is instant. No delay. No grace period.
Profile Expiry
All profiles automatically expire 60 days after the payment date regardless of activity. Expiry is handled gracefully:
•	Day 50: Push notification sent — "Your Roommate Link access expires in 10 days. Still searching? Tap to confirm."
•	Day 60: Profile status changes to EXPIRED. Profile is hidden from all match feeds.
•	Reactivation: One tap from the app homepage. Profile re-enters active match feeds immediately. No additional payment for reactivation within the same academic year.
 
5. The Questionnaire

5.1 Philosophy & Design Principles
The questionnaire is the most important engineering decision in Roommate Link. A perfect algorithm on bad questions produces confidently wrong matches. The following principles govern every question in this bank:

•	Situation-Based, Not Opinion-Based: Questions place users in specific real-world scenarios rather than asking abstract opinions. "You finished eating, there is a pile of dishes in the sink — what do you do?" captures behaviour more accurately than "Are you a clean person?" Nobody identifies as a dirty person, but behaviour under specific circumstances reveals the truth.
•	Dual Capture: Every question captures two things simultaneously — your own behaviour AND your tolerance of someone whose behaviour differs from yours. Both dimensions are essential for accurate matching.
•	No Obvious Correct Answer: Questions are designed so that no single answer feels more socially desirable than others. Someone answering D should not feel like they are admitting a flaw. Someone answering A should not feel like they are performing virtue.
•	Randomised Presentation: Questions are displayed in randomised order on every session. This prevents category pattern recognition and the conscious or unconscious performance of a consistent character.
•	Consistency Detection: The algorithm monitors answer patterns across all 40 questions and flags suspicious consistency, sudden pattern breaks, and cross-category contradictions. See Section 6.5 for full details.
•	Rooted in Real UCC Conflicts: Every question in this bank traces directly to a documented real-world conflict from UCC hostel life. This is not a generic questionnaire adapted from Western university research. It was built from the ground up from the specific social, cultural, and material realities of Ghanaian student accommodation.
5.2 Question Categories & Weights
Category	Weight & Rationale
Conflict Style	x5 DEALBREAKER — How someone handles conflict determines whether every other incompatibility is manageable or explosive
Lifestyle Imposition	x5 DEALBREAKER — Someone who cannot leave your choices alone creates a hostile environment that no other compatibility can overcome
Roommate Relationship Expectation	x5 DEALBREAKER — Friend vs co-tenant mismatch creates one-sided emotional dynamics that feel like rejection without anyone meaning harm
Sleep & Study Schedule	x3 CORE — Directly affects academic performance and daily functioning. Incompatibility here has measurable consequences.
Cleanliness & Organisation	x3 CORE — The most commonly reported source of ongoing hostel conflict. Affects daily living quality continuously.
Social Habits	x3 CORE — Directly determines whether your shared room feels like a private sanctuary or a public social venue
Romantic Life	x3 CORE — Partner visits and late-night calls introduce third-party dynamics into a two-person agreement
Lifestyle & Maturity	x1 PREFERENCE — Important context but more manageable with communication than dealbreaker categories
Food & Cooking	x1 PREFERENCE — Ghana-specific conflicts around food ownership and sharing culture
Shared Resources & Borrowing	x1 PREFERENCE — Ownership boundary conflicts that are real but typically negotiable

5.3 The 40 Core Questions

Category 1: Conflict Style (Q1–Q4)  |  Weight x5
These questions are the hidden backbone of the entire questionnaire. They do not ask whether you are confrontational — nobody self-identifies honestly with that label. Instead, they place users in specific high-stakes and low-stakes conflict scenarios and capture their actual instinctive behaviour.

Q1.  Your roommate comes back late every night and the door noise wakes you up. It has happened five times already. You have not said anything. What do you do?
A  I tell them directly it is disturbing my sleep and ask them to be more careful.
B  I drop hints hoping they notice without me having to say it directly.
C  I am silently annoyed but say nothing to avoid creating conflict.
D  It genuinely would not bother me enough to think about.
Algorithm Note: A+C pairing is dangerous. One person confronts, one avoids. The A person will feel unheard. The C person will feel attacked. Over time the C person's stored resentment becomes explosive.

Q2.  You told your roommate something personal in confidence. Later you overhear them telling another person exactly what you said. How do you handle it?
A  I confront them immediately and directly. That is a serious betrayal.
B  I become cold and distant but never bring it up directly.
C  I address it later when I have calmed down and can speak without anger.
D  I let it go. I probably should not have shared it in the first place.
Algorithm Note: Pairing with Q1 creates conflict style profile. Someone who answered C on Q1 but A on Q2 picks their battles carefully but has real lines. The algorithm reads cross-question nuance.

Q3.  You and your roommate had a serious argument yesterday. This morning they are acting completely normal like nothing happened. How does that make you feel?
A  Relieved. I hate tension. If they have moved on, so have I.
B  Confused and frustrated. We never actually resolved anything.
C  Uncomfortable. I need us to acknowledge what happened before I can move on.
D  It depends on what the argument was about.
Algorithm Note: A+C is a silent disaster. One person thinks peace is restored. The other is lying in bed replaying the argument waiting for resolution that never comes. That resentment compounds for months.

Q4.  You did something that genuinely upset your roommate. They confronted you about it calmly. What is your natural first reaction?
A  I apologise immediately and genuinely. If I was wrong I own it completely.
B  I get defensive first, then apologise later when I have processed it.
C  I apologise in the moment but internally I am still justifying my actions.
D  I find it genuinely very difficult to apologise even when I know I was wrong.
Algorithm Note: D is the ego flag. A+D creates one person always apologising, one person never apologising. That is not a roommate relationship. Cross-reference with Q11 (hygiene feedback) and Q28 (lifestyle imposition) for compounding ego pattern.

Category 2: Sleep & Study Schedule (Q5–Q8)  |  Weight x3
These questions capture not just when you sleep and study, but your tolerance for someone whose schedule is completely opposite to yours. The music conflict story from your grandfather's hostel — one person's productive peak hour being another person's deepest sleep — lives in this category.

Q5.  It is 1AM on a Tuesday night. Where are you most likely?
A  Deep asleep. I sleep before midnight always.
B  Just getting into my reading. Night is when my brain works best.
C  Still awake but not studying. On my phone or watching something.
D  It depends entirely on whether I have something due the next day.
Algorithm Note: A+B is the core sleep conflict. The B person's productive peak is the A person's deepest sleep. This is not a preference difference. It is a fundamentally incompatible biological rhythm. High weight.

Q6.  Your roommate is asleep and you need to study. You think better with some background noise. What do you do?
A  I use earphones always. My noise is never my roommate's problem.
B  I play something low. If they are really asleep they will not notice.
C  I go somewhere else entirely — library, common room, anywhere but the room.
D  I study in silence. My roommate's sleep matters more than my preference.
Algorithm Note: A and C answers indicate naturally considerate people who have already built their roommate into their decision-making. B answers indicate close-enough consideration that creates close-enough resentment.

Q7.  It is exam season. Your roommate studies by reading aloud, muttering to themselves and pacing the room. It helps them but affects your concentration. What happens?
A  We agree on a schedule — dedicated quiet hours and freedom hours.
B  I put on earphones and adapt. Their space is their space too.
C  I relocate. I would rather find somewhere else than create tension during exams.
D  It would genuinely affect my results and I would struggle to hide my frustration.
Algorithm Note: This question deliberately removes the moral high ground. Neither person is wrong. This tests conflict management where nobody is at fault — the hardest tension to navigate. D answers during exam season indicate emotional regulation problems under pressure.

Q8.  Be honest. On a normal night with no exams and nothing due tomorrow — what time do you actually sleep?
A  Before 11PM. I need my full sleep no matter what.
B  Between 11PM and 1AM. I am a natural night person but not extreme.
C  After 1AM regularly. Night time is when I come alive.
D  I have no consistent sleep time. It changes completely day to day.
Algorithm Note: D is the most underrated difficult roommate. Unpredictability is exhausting. You cannot build a shared routine around someone with no rhythm. Q5 captures high-pressure moments. Q8 captures baseline natural rhythm. Both are required.

Category 3: Cleanliness & Organisation (Q9–Q12)  |  Weight x3
Everyone believes they are reasonably clean. Nobody self-identifies as a dirty person. These questions catch people through specific behaviours rather than self-assessment. The plate scenario — which inspired this entire questionnaire — lives here.

Q9.  You just finished eating. There is a pile of dishes already in the sink from yesterday. What do you do?
A  I wash everything in the sink including my own. A clean sink is everyone's responsibility.
B  I wash only my own dishes immediately. Mine are done, the rest is not my problem.
C  I add mine to the pile. I will wash everything together when I have time.
D  I wash mine eventually but I genuinely do not notice the pile until it becomes a mountain.
Algorithm Note: D is the hidden danger. This person is not lazy. Their brain genuinely filters out mess. But try explaining that to an A person. A+D is highly dangerous not because of bad intent but because of fundamentally different sensory relationships with disorder.

Q10.  Your roommate's side of the room looks like a hurricane passed through it — clothes on the floor, books everywhere, food wraps on the desk. Their mess does not cross to your side. How do you feel?
A  Completely unbothered. Their side is their side. My side is my side.
B  Mildly irritated but I say nothing. It is their space technically.
C  It affects my peace even though it is not my side. I cannot relax in a messy environment.
D  I would quietly start cleaning their side. I cannot help myself.
Algorithm Note: D is dangerous in a specific way. They are not malicious — they are helping. But touching someone's belongings without permission, even to clean them, violates boundaries disguised as kindness. When told to stop they feel unappreciated. C+A is also dangerous — one cannot relax in mess, one is completely unbothered.

Q11.  You have been busy all week. Your laundry is piling up. Your roommate mentions casually that the room is starting to smell. What is your honest reaction?
A  I appreciate it. That is exactly the kind of honesty I want from a roommate.
B  Embarrassed but grateful they told me privately rather than ignoring it.
C  Called out and slightly defensive, even though I know they are right.
D  Disrespected. My laundry situation is my business, not theirs.
Algorithm Note: CROSS-CATEGORY FLAG: Q11 D + Q4 D = maximum weight penalty. Messy AND unable to receive feedback AND unable to apologise. This combination is a serious compatibility red flag regardless of other scores. Cross-category pattern detection must fire here.

Q12.  Be honest. When you move into a new room, how long before it looks like you have fully settled in?
A  Within the first day. Everything has a place and I put everything there immediately.
B  Within the first week. I unpack gradually but I get there.
C  Weeks. I live out of my bag longer than I should admit.
D  My room always looks like I just moved in or I am about to move out. That is just my natural state.
Algorithm Note: D answered matter-of-factly — this person knows themselves. Self-aware people are more predictable and manageable as roommates than people who answered A everywhere but live like D. Honesty in Q12 recalibrates algorithm confidence upward.

Category 4: Social Habits (Q13–Q16)  |  Weight x3
The antisocial student whose room became a community centre. The introvert who counted the friends who visited every day. The person who could not sleep through the noise. These questions capture how much of your social life enters your shared physical space.

Q13.  On a free Friday evening with no obligations, where are you most likely?
A  In the room relaxing. My room is my sanctuary and I recharge alone.
B  Out with friends but back before midnight. I balance social and personal time.
C  Out all evening and probably bringing people back to the room later.
D  It completely depends on my mood. I am genuinely unpredictable.
Algorithm Note: A+D is a time bomb. The A person builds their peace around predictability. The D person destroys that peace randomly. Some weekends quiet, some weekends chaos. The A person can never fully relax because they never know which version is coming home.

Q14.  Your roommate calls to say they are bringing three friends over in 30 minutes. You were tired and looking forward to a quiet evening. What do you do?
A  I say okay but I am privately frustrated. I put on earphones and endure it.
B  I tell them honestly I am exhausted and ask if they can use the common room instead.
C  I leave the room and give them their space. I will return when they are done.
D  I join them. Company actually sounds better than being alone right now.
Algorithm Note: CROSS-CATEGORY: B here + C in Q1 reveals someone who tolerates daily irritations silently but will protect personal rest. The algorithm reads this nuanced pattern. A here is a silent sufferer in social situations specifically — that silent suffering becomes explosive eventually.

Q15.  How often do you realistically have guests in your room on a typical week?
A  Rarely or never. My room is my private space. I meet people outside.
B  Once or twice. Close friends occasionally but not regularly.
C  Almost every day. My friends are always around and my room is the hangout spot.
D  My significant other visits very regularly. That is mostly who comes.
Algorithm Note: A+C is the exact hostel conflict described from insider accounts — one person's sanctuary is the other's community centre. D is an early romantic life signal that connects to Category 8 — the algorithm reads this cross-category indicator.

Q16.  Your roommate has friends over and they are being loud and laughing. It is 9PM — not unreasonably late. You have an 8AM class tomorrow. What do you do?
A  I join the conversation briefly then excuse myself and sleep through the noise.
B  I let them know politely that I have an early class and ask them to keep it down.
C  I say nothing but lie awake frustrated waiting for them to leave.
D  I cannot sleep with noise and would seriously consider sleeping somewhere else.
Algorithm Note: D is a high-needs signal. This person requires near-perfect conditions to function. Their compatible roommate has a very narrow profile. The algorithm must protect this person by surfacing matches who are naturally quiet and private. D+C from Q15 is a dealbreaker.

Category 5: Roommate Relationship Expectation (Q17–Q20)  |  Weight x5
This is the most important category in the entire questionnaire. Someone who wants a lifelong friend paired with someone who wants a bill-splitting stranger is a slow, painful, invisible disaster. Nobody fights about it. Nobody names it. It just erodes, silently, for an entire academic year.

Q17.  You and your roommate have lived together for one month. What does your ideal relationship with them look like at this point?
A  We greet each other warmly, respect each other's space, and that is enough for me.
B  We have had real conversations, know basic things about each other, and check in occasionally.
C  We are already becoming genuine friends. I want someone I can talk to about real things.
D  I have not really thought about it. I just need someone reliable to share the space.
Algorithm Note: D is purely practical. That practicality paired with a C person who is emotionally investing in the relationship from week one creates a one-sided dynamic that feels like rejection without anyone meaning harm.

Q18.  After a long exhausting day where everything went wrong — bad lecture, missed assignment, argument with a friend — you come back to the room. What do you actually want from your roommate in that moment?
A  I want them to notice I am not okay and ask about it without me saying anything.
B  I want them to give me complete space. I need silence to reset alone.
C  I would bring it up myself if I wanted to talk. Otherwise I just want normal energy.
D  I want the room to feel warm and comfortable but I do not need to talk about what happened.
Algorithm Note: A+B is painful in a specific way. The A person is silently waiting to be noticed. The B person has given them what they genuinely believe is a gift — space and silence. Neither person is wrong. Neither person feels understood.

Q19.  Your roommate comes back to the room while you are there. What does your ideal greeting look like on a normal everyday basis?
A  A genuine warm greeting, some small talk, checking in on each other's day briefly.
B  A simple acknowledgment — hey, nod, smile. Warm but not conversation-starting.
C  Nothing mandatory. If we feel like talking we talk. No expectation either way.
D  I honestly prefer minimal interaction. I find constant daily greetings draining.
Algorithm Note: This happens multiple times every single day. A+D means one person greets warmly every time and receives minimal response. They start wondering what they did wrong. They feel unwelcome in their own room. They never realise it has nothing to do with them.

Q20.  Forget everything you wish you wanted. What are you actually looking for in a roommate relationship?
A  A genuine friendship. Someone I can laugh with, confide in and build memories with at university.
B  A friendly acquaintance. Warm, respectful, easy to live with, but not necessarily a close friend.
C  A reliable co-tenant. Someone who pays their share, respects the space, and stays out of my personal life.
D  Honestly no preference. I adapt to whoever I am living with naturally.
Algorithm Note: CONSISTENCY VALIDATOR: Q20 is the final relationship expectation question. If someone answered A throughout Q17-Q19 but answers C here, the algorithm weights the C answer heavily as their most honest statement. A+C across users is a dealbreaker. Q20 C + Q18 A is a cross-category dealbreaker weighted maximally.

Category 6: Lifestyle & Maturity (Q21–Q24)  |  Weight x1
This category captures the age-gap conflict — the 18-year-old living independently for the first time versus the 22-year-old who has been independent for years. But more precisely, it captures the difference between someone discovering freedom for the first time and someone who has already found their internal compass.

Q21.  You are now living away from your parents for the first time. How does that honestly feel?
A  Liberating. I finally have freedom and I intend to fully enjoy it.
B  Exciting but I am keeping the structure and discipline I had at home.
C  A little overwhelming. I function better with some structure and accountability.
D  Nothing has really changed. I was already quite independent before university.
Algorithm Note: A+B pairing creates the pastoral roommate dynamic. The B person has internalised structure. The A person is experiencing their first taste of complete freedom. The B person does not intend to police the A person. But every comment feels like surveillance to someone who has never had freedom before.

Q22.  It is a Wednesday night. No classes tomorrow. Someone invites you to a late night gathering that will probably go past midnight. What do you do?
A  I go without hesitation. Wednesday, Thursday, it does not matter. I am young and free.
B  I go but set a personal limit. Home by 1AM and I stick to it.
C  I probably decline. Weeknight late nights affect my entire next day badly.
D  I would never do that during the week. My academic schedule is non-negotiable.
Algorithm Note: A+D is a dealbreaker. One person's first experience of complete freedom. One person with a firmly established internal compass. CROSS-CATEGORY: A here + D in Q23 (no self-discipline) compounds into a serious lifestyle incompatibility.

Q23.  Your personal space, your academics, your social life — how would you honestly describe your self-discipline?
A  Very disciplined. I set rules for myself and follow them without needing reminders.
B  Mostly disciplined, but I have moments where I completely fall off and need to reset.
C  I struggle honestly. I work better under external pressure or accountability.
D  I do not think about it much. I go with how I feel each day.
Algorithm Note: C is not a bad roommate. But they need structure from their environment. C+D creates a chaos environment where neither person provides anchor. Two people with no internal compass in a small room is an academic disaster. C+A can be beautiful — the A person's natural discipline lifts the C person without effort.

Q24.  A close friend or sibling is describing you to a stranger. Which do you think they would most honestly say?
A  "They are very serious and focused. Academics come first always with them."
B  "They work hard but they know how to have fun. They balance it well."
C  "They are the life of the party honestly. Very social, very fun, sometimes too much."
D  "They are still figuring themselves out. University is changing them a lot right now."
Algorithm Note: The psychological distance of imagining another person's description reduces self-idealisation. D is extraordinary self-awareness. This person knows they are in transition and will not pretend otherwise. The algorithm matches them with patient, flexible profiles. A+C at scale creates slow tension.

Category 7: Lifestyle Imposition (Q25–Q28)  |  Weight x5
These people are not evil. They are not even unkind. They genuinely believe they are helping. That is what makes them so uniquely difficult to live with. This category catches the person who cannot leave other people's choices alone — whether that manifests as surveillance disguised as concern, pastoral urgency, academic anxiety on your behalf, or silent disapproving judgment.

Q25.  Your roommate comes back at 2AM on a Tuesday. The door noise wakes you accidentally. The next morning, what do you do?
A  Nothing. Their life is their business. I go back to sleep and forget it happened.
B  I mention it casually and ask them to be more careful with the door.
C  I ask them where they were coming from at that hour. I am genuinely concerned.
D  I let them know that kind of schedule affects me and we need to discuss boundaries.
Algorithm Note: C is surveillance wrapped in care. The boundary-setting of D is healthy and already captured in Conflict Style. But C is not setting a boundary about the noise. They are asking where you were. At 2AM. On a Tuesday. That is not concern. That is intrusion dressed in the language of friendship.

Q26.  Your roommate is visibly struggling academically. They are sleeping through classes, missing assignments, and spending more time on their phone than studying. It has nothing to do with your grades. What do you do?
A  Nothing. Their academics are entirely their responsibility, not mine.
B  I mention it once genuinely as a friend, then leave it completely alone.
C  I regularly check in and remind them about their responsibilities. I cannot watch silently.
D  I would feel somehow responsible and find it very hard to mind my own business.
Algorithm Note: A+C is Hellfire. The A person is minding their business completely. The C person thinks they are being a good friend. The A person hears: "You are incompetent and I do not trust you to manage your own life." The A person says: "You are not my mother." The room becomes a battlefield. C+D = two anxiety-carriers feeding each other.

Q27.  Your roommate is very passionate about their beliefs and activities — religious, social, or otherwise. They regularly invite you to join them, and whenever you decline they always ask why. This happens consistently. How do you feel after two weeks?
A  Completely fine. They are sharing something they love. I decline politely and move on.
B  Mildly tired of explaining myself but I understand they mean well so I manage.
C  Genuinely exhausted and suffocated. I need my choices respected without explanation.
D  I would have a direct conversation early. I respect your passion but please respect my boundaries.
Algorithm Note: C paired with the type of person doing the inviting creates the exact hostel dynamic described in real UCC accounts: the person being invited is exhausted from saying no, exhausted from explaining themselves, exhausted from feeling like their autonomy is perpetually being tested by someone who genuinely believes they are caring.

Q28.  Be completely honest. When you see your roommate making a choice you personally disagree with — something that does not affect you at all — what is your natural instinct?
A  Nothing. Their choices are none of my business and I genuinely feel that way.
B  I notice privately but would never say anything unsolicited.
C  I would say something once if I genuinely cared. Just once.
D  I find it very hard to stay quiet when I see someone I live with making what I consider a wrong choice.
Algorithm Note: CROSS-CATEGORY DEALBREAKER: Q28 D + Q26 C = two imposers competing for moral authority in one room. Both believe they are the most reasonable person present. Both believe the other is the problem. Incompatible at maximum weight. Also cross-reference with Q4 D and Q11 D for triple ego flag.

Category 8: Romantic Life (Q29–Q32)  |  Weight x3
The 12AM "baby I miss you" call. The partner who visits three times a week and becomes an unofficial, rent-free, consent-free third roommate. This category captures how much of your romantic life enters the shared physical and emotional space.

Q29.  You are in a relationship. How often would your partner realistically visit your room?
A  Rarely or never. I keep my romantic life completely separate from my living space.
B  Occasionally. Maybe once or twice a month for a few hours maximum.
C  Regularly. My partner is part of my life and my room is part of my life.
D  I am not in a relationship currently and I am not looking for one.
Algorithm Note: C+A is dangerous. D is a full romantic life signal — no late-night calls, no partner visits, no emotional third party. Q29 D cross-referenced with Q30 and Q31 gives the algorithm a clear picture of romantic lifestyle intensity.

Q30.  It is 11PM. You are trying to sleep. Your roommate is on a phone call with their partner, speaking softly but audibly. This has happened three times this week. What do you do?
A  Nothing. Relationships need communication. I put earphones on and sleep.
B  I mention it kindly once and ask if they can step outside for late night calls.
C  I say nothing but I am getting more frustrated with each occurrence.
D  Three times is already two too many. I would have addressed it after the first night.
Algorithm Note: CROSS-CATEGORY: D here + C in Q1 (never confronts) reveals a specific trigger. This person tolerates most things silently but their sleep being disrupted by someone else's relationship crosses a very specific line. The algorithm flags this context-specific confrontation threshold.

Q31.  Your roommate's partner has visited three times this week. They are respectful and quiet but they are simply always there. How does that make you feel in your own room?
A  Completely fine. As long as they are respectful I have no problem with anyone being in the room.
B  Mildly uncomfortable. I do not mind visits but I need my room to feel like my space sometimes.
C  Very uncomfortable. I did not agree to live with two people. I need my room to feel like mine.
D  It depends entirely on the person. Some energies I can tolerate, others I cannot.
Algorithm Note: The phantom roommate problem. A partner who visits three times a week is not officially living there. They pay nothing. They signed nothing. But they consume the room's energy and privacy. C+A here — flagged but not automatically a dealbreaker. Cross-referenced with Q29 C for compounding concern.

Q32.  It is midnight. You are asleep. Your roommate receives a call from their partner and has an emotional argument — crying, raised voices — for 45 minutes. How do you handle it the next morning?
A  I check on them genuinely. Forget the sleep disruption. They were clearly going through something.
B  I say nothing about the disruption but quietly check if they are okay.
C  I address the disruption kindly but directly. I empathise, but it cannot happen regularly.
D  I address it directly and firmly. Emotional situations do not exempt anyone from basic consideration.
Algorithm Note: Two completely valid human needs in direct conflict. A+D creates permanent misreading of intent. The A person leads with pure empathy and will consistently deprioritise their own needs. The D person will always be perceived as cold. They are not cold — they simply believe consideration is non-negotiable even in crisis.

Category 9: Food & Cooking (Q33–Q36)  |  Weight x1
In a Ghanaian student hostel context, food is deeply cultural. The expectation of sharing. The pride of cooking. The violation of eating someone's food. The complex social calculus of who contributes ingredients. These conflicts do not exist in Western roommate app databases. They were built into this questionnaire specifically from UCC hostel accounts.

Q33.  You cooked a meal and left it in the room while you went to lectures. You come back and your roommate has eaten a significant portion without asking. What is your reaction?
A  Genuinely unbothered. Food is food. We can sort it out.
B  Annoyed but I mention it calmly once and establish a clear boundary going forward.
C  Very upset. That is my food that I bought and cooked myself. That is unacceptable.
D  I say nothing but I make a mental note. Trust broken quietly and permanently.
Algorithm Note: D is the silent ledger builder. They do not confront. They do not discuss. They quietly record violations. Q33 D cross-referenced with Q36 D (sees asking for food as begging) creates a person who is both deeply protective of their food and silently contemptuous of food-sharing culture. Very narrow compatible profile.

Q34.  How do you honestly handle food in a shared living situation?
A  I cook for myself only and expect everyone to do the same. My food is mine always.
B  I do not mind occasional sharing but I need to be asked first. Always.
C  I love cooking for others. If I cook I naturally make enough for my roommate too.
D  I do not cook at all. I buy food outside and want zero food-related tension.
Algorithm Note: Four distinct food personalities. C+A is the most misread: the natural feeder keeps offering, keeps including. The separatist keeps declining, keeps feeling obligated, starts feeling like their boundaries are being tested by someone who genuinely just loves feeding people. Neither person is wrong. They speak different food languages.

Q35.  Your roommate finished your drinking water, used your cooking gas, or ate the last of something you bought for yourself. They did not replace it or mention it. How do you handle it?
A  I let it go. Small things are not worth tension.
B  I mention it calmly once and ask them to replace it or tell me next time.
C  I am genuinely upset. It is not about the item. It is about the disrespect of taking without asking.
D  I start quietly hiding or locking my things. I protect my resources rather than confronting it.
Algorithm Note: D is the wall builder. They do not confront. They do not discuss. They quietly construct invisible fences around all their possessions. Over time a shared room becomes two cold, entirely separate territories where nothing is shared and nobody talks about why. D+B cross-category — wall builder meets communicator — is painful and one-sided.

Q36.  Be completely honest. How do you feel about a roommate who asks you for food regularly — not stealing, just asking?
A  Completely fine. If I have it and they need it I will share without hesitation.
B  Fine occasionally, but if it becomes a pattern it starts feeling uncomfortable.
C  Honestly uncomfortable. I feel obligated to say yes even when I do not want to.
D  I find it difficult to respect someone who regularly depends on others for food.
Algorithm Note: D is the dignity erosion question. The D person will never say the word 'beggar' out loud. But their energy communicates it every time — the slight hesitation, the tight smile, the 'again?' that stays behind their teeth but escapes through their eyes. The person asking for food will feel small in their own room without ever being able to name why.

Category 10: Shared Resources & Borrowing (Q37–Q40)  |  Weight x1
In a Ghanaian university hostel where students have limited resources, borrowing is constant. Chargers, fans, extension cords, irons, laptops. But one person's 'we share everything' is another person's 'you are using my things without permission.' These questions capture three fundamentally different philosophies of ownership in a shared space.

Q37.  Your roommate picks up your phone charger without asking while you are asleep. They return it before you wake up in perfect condition. How do you feel when you find out?
A  Completely fine. They needed it, returned it perfectly, no issue.
B  Mildly uncomfortable. I prefer to be asked even for small things.
C  Annoyed. The condition it was returned in is irrelevant. They should have asked.
D  That is a violation of my personal space regardless of how small the item.
Algorithm Note: The three borrowing personalities are revealed across Q37-Q39. A = communalised belongings, maximum flexibility. D = strict personal space philosophy. These are not negotiable personality traits. They are deeply held. D+A is a dealbreaker in borrowed-resource heavy environments like student hostels.

Q38.  Your roommate needs to iron their clothes urgently. You have an iron. You are out of the room. They use it and return it perfectly. You find out later. What do you do?
A  Nothing. That is exactly what shared living means to me.
B  I mention it casually and ask them to text me next time even if I am not around.
C  I am genuinely upset. The fact that they knew I was absent makes it worse, not better.
D  I would have a serious conversation. My belongings always require explicit permission.
Algorithm Note: Builds on Q37 with a critical distinction — you were physically absent. The psychological weight increases significantly. Someone who answered B on Q37 might answer D here. The escalation between Q37 and Q38 tells the algorithm exactly where someone's ownership boundary sits. Q38 D + Q40 C = consistently particular person who needs a consistently particular match.

Q39.  Your roommate borrowed your extension cord three weeks ago. It is still on their side of the room. They have not mentioned returning it. Neither have you. How do you handle this?
A  I genuinely forgot about it. If I need it I will ask for it back casually.
B  It has been bothering me quietly but I keep waiting for them to return it without me asking.
C  I would have asked for it back after a few days. I track my belongings.
D  I would never have lent it without setting a clear return expectation from the start.
Algorithm Note: B is the silent ledger builder. They are tracking every unreturned item. Building a quiet mental inventory of small grievances. Never saying anything. Always waiting. That ledger gets heavier every week until one completely unrelated argument releases everything stored in it simultaneously. B+D is actually a beautiful pairing — the D person's upfront expectations naturally prevent the B person's resentment from ever accumulating.

Q40.  Forget everything you wish you were. Based on how you have actually lived and behaved in shared spaces before — with family, friends, anyone — what kind of roommate are you honestly?
A  Considerate and easygoing. I naturally think about how my actions affect those around me.
B  Well-meaning but imperfect. I try hard but I have habits I know could irritate people.
C  Quite particular. I have specific ways I like things and I struggle when those are disrupted.
D  I am still figuring that out. I have never reflected on myself this way until right now.
Algorithm Note: THE CONSISTENCY VALIDATOR. After 39 situation-based questions, this removes every scenario and asks for direct honest self-assessment. Someone who answered A consistently throughout but answers C here just told the algorithm the truth for the first time. Q40 D is not confusion — it is extraordinary self-awareness from someone in genuine transition. The algorithm matches them with patient, adaptable profiles and flags them for gentler compatibility requirements.

 
6. The Matching Algorithm

The matching algorithm is the engine that justifies the GHS 25 payment. If it produces bad matches, the app dies by word of mouth on a university campus within one semester. Every component of this algorithm was designed to produce matches that translate into peaceful, productive shared living — not just statistically similar survey responses.

6.1 Answer Encoding
Every answer is encoded as a numerical value stored in the database:
Answer	Encoded Value
A	1
B	2
C	3
D	4

All responses are stored in the questionnaire_responses table as a single JSONB object per user:
{ "q1": 2, "q2": 1, "q3": 3, "q4": 4, ... "q40": 2 }
This single-object storage approach allows the entire user answer vector to be retrieved in one database query, which is essential for the edge function's performance at scale.
6.2 Category Weight Assignment
Category	Weight Multiplier
Conflict Style (Q1-Q4)	x5 — DEALBREAKER
Lifestyle Imposition (Q25-Q28)	x5 — DEALBREAKER
Roommate Relationship Expectation (Q17-Q20)	x5 — DEALBREAKER
Sleep & Study Schedule (Q5-Q8)	x3 — CORE HABIT
Cleanliness & Organisation (Q9-Q12)	x3 — CORE HABIT
Social Habits (Q13-Q16)	x3 — CORE HABIT
Romantic Life (Q29-Q32)	x3 — CORE HABIT
Lifestyle & Maturity (Q21-Q24)	x1 — PREFERENCE
Food & Cooking (Q33-Q36)	x1 — PREFERENCE
Shared Resources & Borrowing (Q37-Q40)	x1 — PREFERENCE

6.3 Base Compatibility Score Calculation
For each question pair between User A and User B, the algorithm calculates:

question_score = (4 - |answer_A - answer_B|) / 4

This produces a score between 0 and 1 for each question, where:
•	Same answer (difference = 0): score = 1.0 — perfect match
•	One step apart (difference = 1): score = 0.75 — strong match
•	Two steps apart (difference = 2): score = 0.50 — moderate tension
•	Three steps apart (difference = 3): score = 0.25 — significant incompatibility

The weighted category score for a given category is:
category_score = mean(question_scores_in_category) x category_weight

The raw compatibility score is the sum of all weighted category scores divided by the maximum possible weighted score, expressed as a percentage.
6.4 Cross-Category Pattern Detection
The raw score is then modified by cross-category pattern detection. The following combinations are flagged and apply significant penalties to the final match percentage:

Cross-Category Pattern	Penalty & Reason
Q11 D + Q4 D	Maximum penalty — Messy AND never apologises. Two self-reinforcing character traits that create a completely unliveable environment for ordered, emotionally direct roommates.
Q28 D + Q26 C	Maximum penalty — Two imposers competing for moral authority. Both believe they are the most reasonable person present. Neither will yield.
Q40 D + Q22 A	High penalty — Still figuring themselves out AND fully embracing chaos with no structure. Two unknowns with zero anchor create academic and personal instability.
Q33 D + Q36 D	High penalty — Silent food grudge holder who also resents food-asking culture. Deeply protective of personal resources and contemptuous of sharing norms simultaneously.
Q38 D + Q40 C	High penalty — Consistently particular about belongings AND consistently particular about environment. Very narrow compatible profile. Must be matched together.
Q29 C + Q31 C	Moderate penalty — Partner visits frequently AND roommate already feels invaded. Compounding romantic intrusion pattern.
Q14 B + Q1 C	Flagged nuance — Protects rest but avoids daily irritations. Not dangerous but complex. Monitor other category scores.

6.5 Consistency Detection
The algorithm runs a consistency analysis pass across all 40 answers to detect the following patterns:

Flag 1: Sudden Pattern Break
If a user answers consistently within a narrow range (e.g., A and B answers throughout) and then answers D on a final question in any category, the algorithm weights that D answer more heavily. Late-stage pattern breaks represent moments where the user dropped their guard and answered more honestly. These are the most reliable data points in the dataset.

Flag 2: Cross-Category Contradiction
If a user answers "I never confront anyone" consistently in Conflict Style (all C answers) but answers "I would address it immediately and firmly" in Romantic Life (D answer on Q30), this is not inconsistency — this is a specific trigger. The algorithm reads this as a nuanced profile: conflict-avoidant in general, but protective of sleep specifically. That specificity is valuable and informs matching recommendations.

Flag 3: Statistically Perfect Profile
If a user answers A on every single question across all 40 questions, this profile is flagged as potentially dishonest. Nobody is perfectly easygoing about everything. The algorithm applies a moderate reduction to the match confidence score for this profile. The profile is not removed or banned — it simply carries a lower confidence weight in match calculations. A note is surfaced in the admin dashboard for monitoring.

Flag 4: Q40 Recalibration
Q40 is the explicit self-assessment question. If a user's Q40 answer conflicts with their dominant pattern across other questions, the algorithm weights Q40 more heavily as the user's deliberate, reflective honest statement. Example: 35 questions pattern consistent with C (quite particular) but Q40 answer is A (easygoing) — the algorithm flags the discrepancy and reduces match confidence while weighting Q40 recalibration.
6.6 Compatibility Threshold & Display Logic
The minimum compatibility threshold for a profile to appear in a user's match feed is set at 60% for the V1 launch. This threshold will be reviewed and adjusted after the first 500 active users based on real match distribution data.

Match cards stack in descending order from highest to lowest compatibility percentage. There is no cap on the number of matches shown above the threshold, but the UI prioritises the top 20 for the initial view with infinite scroll for additional matches below.

If a user has zero matches above the threshold after 7 days, a push notification fires: "No highly compatible roommates have joined yet. Want to see your closest available matches while you wait?" The user can choose to lower their visible threshold or remain in the notification queue for when compatible users join.
6.7 — Algorithm Trigger (REWRITTEN)
The matching algorithm fires via a Supabase Edge Function triggered by the frontend after questionnaire completion. There is no cron job.

Trigger Flow:
1. User answers Q40 → frontend shows celebration animation
2. Frontend calls supabase.functions.invoke('match-calculate', { body: { userId: user.id } })
3. Edge Function executes calculateMatchesForUser() against all active profiles
4. Results inserted into matches table
5. Frontend receives response and animates match cards appearing

Subsequent recalculations occur:
• When a new user completes their questionnaire — existing compatible users receive a push notification if the new user scores above their threshold
• When a user reactivates their profile after expiry

CRITICAL CODE CHANGE: The matching algorithm file (algorithm.ts) originally contained import 'server-only' at the top. This is a Next.js-specific import that MUST be removed for the Supabase Edge Function. The algorithm is pure TypeScript math with zero framework dependencies. It works identically in Deno.
 
7. Database Schema (Supabase PostgreSQL)

7.1 Entity: users
Column	Type & Notes
id	uuid, PRIMARY KEY
auth_id	uuid, FK to Supabase Auth — links database profile to auth user
full_name	text, NOT NULL
email	text, NOT NULL, UNIQUE
is_student_verified	boolean, default false — flips to true on student email verification
phone_number	text — collected but unverified, used for FCM
avatar_url	text — uploaded photo URL OR preset avatar ID string
bio	text, nullable — optional 2-3 sentence self-description
gender_preference	enum: SAME_GENDER, ANY_GENDER
gender	enum: MALE, FEMALE, OTHER — used for gender preference filtering
course	text
level	integer — 100, 200, 300, 400, 500, 600
has_paid	boolean, default false
payment_date	timestamp — set on successful Paystack transaction
promo_code_used	text, nullable — tracks if a hall/club code was used
status	enum: ACTIVE, COMPLETED, EXPIRED, HIDDEN, SUSPENDED
created_at	timestamp, default now()
last_active	timestamp — updated on every app open, used for expiry tracking
fcm_token	text — Firebase Cloud Messaging device token for push notifications


7.2 Entity: questionnaire_responses
Column	Type & Notes
id	uuid, PRIMARY KEY
user_id	uuid, FK to users — one response record per user
answers	JSONB — stores all 40 answers as {"q1": 2, "q2": 1, ..."q40": 3}
completed_at	timestamp — triggers matching edge function on insert
consistency_score	float — calculated by algorithm, 0.0 to 1.0
profile_flags	JSONB — stores detected cross-category flags for admin review

7.3 Entity: matches
Column	Type & Notes
id	uuid, PRIMARY KEY
user_a_id	uuid, FK to users
user_b_id	uuid, FK to users
match_percentage	integer — final computed score 0-100
raw_score	float — pre-penalty weighted score for debugging
cross_category_flags	JSONB — list of triggered cross-category penalties
consistency_modifier	float — applied consistency adjustment
calculated_at	timestamp
user_a_viewed	boolean, default false — has user A seen this match
user_b_viewed	boolean, default false

7.4 Entity: messages
Column	Type & Notes
id	uuid, PRIMARY KEY
sender_id	uuid, FK to users
receiver_id	uuid, FK to users
content	text, NOT NULL
created_at	timestamp, default now()
is_read	boolean, default false
is_delivered	boolean, default false — true when FCM notification confirmed

7.5 Entity: reports
Column	Type & Notes
id	uuid, PRIMARY KEY
reporter_id	uuid, FK to users
reported_id	uuid, FK to users
reason	text — reporter's description of the issue
status	enum: PENDING, REVIEWED, ACTIONED, DISMISSED
created_at	timestamp
reviewed_at	timestamp, nullable
admin_notes	text, nullable
 
8 — Technology Stack (COMPLETE REWRITE)
Layer	Technology & Rationale
Frontend	React 18+ with Vite — Pure SPA, zero server dependency, instant Cloudflare Pages deployment
Routing	React Router v6 — Client-side routing with <Route path="..." element={...} /> in App.tsx
PWA	vite-plugin-pwa — Service worker, offline caching, home screen installation
Database	Supabase PostgreSQL — Relational queries essential for compatibility algorithm
Authentication	Supabase Auth — Built-in email verification, Google OAuth, JWT session management
Real-time Chat	Supabase Realtime WebSockets — Native database integration
Matching Algorithm	Pure TypeScript, executed inside Supabase Edge Function (Deno) — triggered on questionnaire completion
Payment Init (Client)	Paystack JS popup with PUBLIC key only — runs in the browser
Payment Webhook (Server)	Supabase Edge Function — Verifies signature via Web Crypto API, updates DB with SECRET key
Push Notifications	Firebase Cloud Messaging (FCM) — Free, works when app is closed
Styling	Tailwind CSS — Utility-first, consistent with Indigo/Violet design system
Hosting (Frontend)	Cloudflare Pages — Static site hosting, deploys React/Vite build in seconds
Hosting (Backend)	Supabase Edge Functions — Serverless Deno, triggered by frontend calls and DB webhooks
Avatar Assets	SVG vector illustrations — stored in Supabase Storage, served via CDN

What Was REMOVED:
❌ Next.js — Replaced by React (Vite)
❌ @cloudflare/next-on-pages — Deprecated adapter, no longer needed
❌ middleware.ts — Next.js convention, deprecated in v16. Replaced by React route guards
❌ All /api/ routes — Backend logic moved to Supabase Edge Functions
❌ next-pwa — Replaced by vite-plugin-pwa
❌ process.env.NEXT_PUBLIC_* — Replaced by import.meta.env.VITE_*
❌ import 'server-only' — Removed from algorithm file

COST AT LAUNCH	Supabase free tier: up to 50,000 monthly active users, 500MB database, 1GB storage. Vercel free tier: sufficient for initial load. FCM: completely free at any scale. Total infrastructure cost at launch: GHS 0. First paid upgrade trigger: Supabase Pro at $25/month when database exceeds 500MB or users exceed 50,000. At 5,000 UCC users this threshold will not be reached in Year 1.
 
9. Business Model

9.1 Pricing Structure
Tier	Details
Free — Seed Users	The first 100 users receive permanent free access to ensure sufficient initial matching volume across both genders.
Free — All Users	Complete questionnaire, view match percentages, view compatibility breakdown (chemistry visible but identity hidden)
Paid — Standard	GHS 25 / Academic Year. Unblur all profiles, see names and photos, message matches.
Paid — Partner Code	GHS 15 / Academic Year. Exclusive pricing for users with JCR/Club promo codes.
Access Duration	Covers one full academic year from payment date. Profile expires at 60 days of inactivity regardless of payment date.
Reactivation	Free within the paid academic year. No additional payment to reactivate an expired profile within the same year.

9.2 Revenue Projections — Year 1 (Conservative)
Metric	Estimate
Total UCC Freshmen per year	Approximately 4,000-6,000
Reach via campus guide + JCR	Approximately 30-40% aware of platform = 1,500-2,400 students
Questionnaire completion rate	Estimated 50-60% of sign-ups complete all 40 questions = 750-1,440 users
Payment conversion rate	Estimated 60-70% of completions pay = 450-1,000 paying users
Revenue at GHS 25	GHS 11,250 to GHS 25,000 in Year 1
Break-even point	Supabase Pro at $25/month = approximately GHS 375/month. Covered by first 15 paying users at base price.

WHY GHS 25 NOT GHS 15	The pricing decision was deliberately conservative-high rather than volume-maximising low. A committed user who pays GHS 25 is a better quality user than a curious user who pays GHS 15. Committed users complete their profiles honestly, engage with matches meaningfully, and generate positive word-of-mouth. Volume users inflate metrics without producing genuine matches. Quality over volume is the right call at launch stage.

9.3 Future Revenue Streams & Features — V2
•	In-App Referral System: Every paying user gets a personal referral code. Referees get GHS 3 off, referrers earn GHS 2, paid out via MoMo edge functions. (Excluded from V1 to accelerate launch).
•	Bulk SMS Retention Strategy: Integrating Hubtel/Arkesel to run phone-number based targeting campaigns for re-engagement.
•	Semester-based pricing: GHS 10 per semester for students who change accommodation every semester
•	Premium tier: GHS 25 for full academic year plus priority match placement and advanced filtering
•	Institutional partnerships: Hostel managers pay for verified roommate-ready student lists
•	Adjacent expansion: Extend platform to other Ghanaian universities using the same UCC-validated architecture
 
10. Security, Verification & Moderation

10.1 Student Verification
Every account requires a verified @stu.ucc.edu.gh email address. The verification flow:
6.	User enters email during registration. System checks domain suffix. Non-@stu.ucc.edu.gh addresses are rejected immediately with a clear message.
7.	Verification link sent to the submitted email address. Account is created in PENDING state.
8.	User clicks verification link. Account moves to ACTIVE state. Questionnaire becomes available.
9.	Email that bounces or is never clicked: account remains in PENDING state and is automatically purged after 48 hours.

SECURITY NOTE	No access to the UCC student database is required or requested. The platform uses UCC's email infrastructure as a passive verification layer. A person outside UCC cannot receive email at a @stu.ucc.edu.gh address, making the domain verification effectively equivalent to student ID verification at zero cost and zero institutional dependency.
10.2 Account Security
Threat	Mitigation
Fake accounts	@stu.ucc.edu.gh email verification blocks all non-students at registration
Account sharing	Phone OTP on login combined with single-session enforcement. Shared account presents the original owner's profile and questionnaire data to matches, making sharing self-defeating.
Predatory profiles	Three reports trigger automatic profile suspension. Manual review required before permanent ban. This prevents both predatory access and coordinated bullying bans.
Contact extraction bypass	No free message capability. No visible phone numbers. No email addresses displayed. All communication through in-app messaging only.
Algorithm gaming	Question randomisation and consistency detection prevent strategic answer patterns. Perfect profiles are flagged and carry reduced match confidence.

10.3 Moderation System
The moderation system is designed to protect users instantly while preventing abuse of the moderation mechanism itself:

•	3 reports from different users = automatic suspension. Profile is immediately hidden from all match feeds. The user is notified their account is under review.
•	Suspension is not a ban. The profile is hidden, not deleted. The user retains their data.
•	Manual review by platform administrator is required before a suspension becomes a permanent ban.
•	Coordinated false reporting protection: if multiple reports arrive from users who are closely connected (have exchanged messages or viewed each other's profiles recently), the system flags this for priority review rather than auto-suspending.
•	Reporter confirmation: Users who submit a report receive a push notification confirming receipt and a follow-up when the report has been reviewed.
•	Admin dashboard surfaces: all pending reports, flagged profiles, statistically perfect questionnaire responses, and accounts with unusual message volume patterns.
10.4 Gender Matching
Gender preference filtering is applied as a hard database exclusion before the matching algorithm runs. This is not a post-algorithm filter. It is a pre-query constraint.

If User A selects SAME_GENDER, the matching query returns only users whose gender field matches User A's gender field. A 100% compatible user of a different gender does not appear in match results under any circumstances. There is no override, no exception, and no "you might also like" suggestion that crosses this boundary.

Users who select ANY_GENDER see all compatible profiles regardless of gender. This selection is made during profile creation and can be updated at any time, triggering an immediate algorithm recalculation.
 
11. Ghost User Prevention System

Ghost profiles — accounts of students who have already found roommates but remain visible in other users' match feeds — are one of the most damaging quality problems a matchmaking platform can have. A user who matches with multiple ghosts in their first week loses trust in the platform's accuracy and abandons it.

The original architecture relied entirely on voluntary self-reporting to clean the database. This is broken by design. Voluntary self-reporting produces a ghost rate exceeding 60% within three months on any matchmaking platform. Roommate Link uses a multi-layer automatic system instead:

Mechanism	Details
Day 7 Prompt	First found-roommate prompt appears on app open. Non-intrusive. One tap to confirm found or dismiss.
Day 30 Prompt	Second prompt. Framed as quality maintenance: "Help keep Roommate Link accurate for other students."
Day 50 Prompt	Final prompt. Includes expiry warning. "Your profile expires in 10 days. Still searching? Confirm to stay active."
Day 60 Auto-Expiry	Profile status changes automatically to EXPIRED. Removed from all match feeds. No manual action required.
Instant Completion	Tapping "Found My Roommate" at any point immediately sets status to COMPLETED and removes profile from all feeds. Zero delay.
Reactivation	One tap from the homepage to reactivate an expired profile. Profile re-enters active feeds immediately. Free within same academic year.

OUTCOME	A database that cleans itself through automated prompts and expiry rather than trusting voluntary user action produces match feed accuracy above 85% even at the 90-day mark. This directly improves the perceived quality of matches and reduces the most common complaint in matchmaking platforms.
 
12. Edge Cases & Failure Modes

Edge Case	Handling
User has zero matches above threshold after 7 days	Push notification fires. User offered choice to see closest available matches or remain in notification queue. Framed as anticipation not failure: "Not enough compatible students have joined yet. We will notify you the moment someone compatible signs up."
User finds roommate in week 1	Day 7 prompt accelerates their off-boarding. Tapping confirmed immediately hides profile. No need to wait for Day 60.
Payment succeeds but database update fails	Paystack webhook retry logic re-attempts the has_paid update. Supabase transaction ensures atomicity. User receives email confirmation of payment regardless.
User completes questionnaire but closes app during calculation	Edge function runs server-side regardless of client connection. Results are cached in database. User sees completed matches on next app open with no recalculation required.
Two users mutually block each other	Both profiles are hidden from each other's match feeds permanently. Block is bidirectional and immediate.
User changes programme or level after registration	Profile update triggers partial algorithm recalculation for the affected user's matches only.
Academic year ends with active paid accounts	Paid access is tied to the academic year, not a calendar year. System prompts at year end: "New academic year starting. Renew your access for GHS 25 to find your next-year roommate."
New student cohort arrives (freshers week)	Existing users with COMPLETED or EXPIRED status receive a push notification: "New students just joined Roommate Link. Looking for a new roommate this year? Reactivate your profile."
 
13. Optional Question Bank — V2 Roadmap

The following question slots are reserved for Version 2 of the platform. These questions were identified during the V1 design process as real and specific conflicts, but were deliberately excluded from the core 40 to keep V1 complexity manageable and to allow real user data to inform which optional questions produce the most meaningful match improvements.

The 20 optional question slots will be filled based on the following V2 development process:
10.	Launch V1 with 40 core questions and observe match feedback for one full semester.
11.	Collect in-app feedback from users who did not find satisfactory roommates asking what conflict areas the questionnaire did not capture.
12.	Review admin dashboard flags for common conflict patterns not predicted by V1 algorithm.
13.	Write optional questions directly from documented real conflicts that V1 missed.
14.	A/B test optional question sets on returning users in Semester 2.

Known candidates for V2 optional questions include:
•	Dressing and personal presentation standards — specifically relevant to female student conflicts around dress code judgment
•	Financial contribution patterns — shared electricity, shared supplies, financial expectation differences
•	Academic programme intensity differences — engineering student exam schedules versus humanities student exam schedules
•	Weekend vs weekday personality differences — people who are entirely different people on weekends
•	Physical space personalisation — how much you decorate, rearrange, and claim shared space
•	Temperature and ventilation preferences — fan on vs fan off, windows open vs closed
•	Morning routine length and noise — a 45-minute morning routine that starts at 5AM is an untested edge case
 
Appendix A: Compatibility Matrix — High Risk Pairings

The following matrix documents all identified high-risk answer pairings across the 40 core questions. This is the human-readable form of the algorithm's cross-category penalty logic and serves as a reference for debugging unexpected match results.

Pairing	Risk Level & Reason
Q1: A + Q1: C	HIGH — Direct confronter + silent avoider. One escalates, one stores resentment. Explosive.
Q3: A + Q3: C	HIGH — Moves on after conflict + needs formal resolution. One person thinks peace is restored. The other is still waiting.
Q4: A + Q4: D	DEALBREAKER — Owns mistakes immediately + cannot apologise. Parent and child dynamic. Permanent resentment.
Q5: A + Q5: B	HIGH — Early sleeper + night owl. Peak productivity hours are incompatible.
Q9: A + Q9: D	HIGH — Washes everything + does not notice mess. Fundamentally different sensory relationships with disorder.
Q10: C + Q10: A	HIGH — Cannot relax in other's mess + completely unbothered. One person's peace is held hostage by another's natural state.
Q11: D + Q4: D	MAXIMUM — Messy AND defensive AND unable to apologise. Triple ego flag. Cross-category maximum penalty.
Q13: A + Q13: C	HIGH — Room is sanctuary + room is social hub. Fundamental space philosophy conflict.
Q13: A + Q13: D	HIGH — Needs predictability + completely unpredictable. Peace built on predictability is destroyed randomly.
Q15: A + Q15: C	DEALBREAKER — Room is private + room is always open. Constant uninvited presence in personal space.
Q17: C + Q17: A	HIGH — Wants genuine friendship + wants warm coexistence. Emotional investment mismatch feels like rejection.
Q18: A + Q18: B	HIGH — Wants to be noticed + gives space as care. Both well-intentioned. Neither feels understood.
Q19: A + Q19: D	HIGH — Wants warm daily greeting + finds greetings draining. Constant micro-rejection every time someone enters the room.
Q20: A + Q20: C	DEALBREAKER — Wants deep friendship + wants co-tenant. Maximum relationship expectation mismatch.
Q20: C + Q18: A	DEALBREAKER CROSS-CATEGORY — Wants only co-tenant + wants to be emotionally noticed. Incompatible at maximum weight.
Q22: A + Q22: D	DEALBREAKER — Freedom-first + academics non-negotiable. Core life philosophy incompatibility.
Q25: C + Q25: A	HIGH — Surveillance disguised as concern + complete autonomy preference. The C person thinks they are caring. The A person feels watched.
Q26: A + Q26: C	DEALBREAKER — Completely minds own business + cannot stop intervening. The A person will say 'you are not my mother.' The room becomes a battlefield.
Q28: D + Q28: A	DEALBREAKER — Cannot stay quiet about others' choices + choices are genuinely none of my business. Constant unsolicited judgment vs. complete autonomy.
Q28: D + Q26: C	MAXIMUM CROSS-CATEGORY — Two imposers competing for moral authority. Both believe they are most reasonable. Neither yields.
Q36: D + Q36: A	HIGH — Sees asking for food as weakness + shares without hesitation. Dignity erosion. Silent contempt expressed through energy not words.
Q38: D + Q38: A	DEALBREAKER — Strict permission required + communalised belongings. Constant violation of explicit personal space rules.
Q40: D + Q22: A	HIGH CROSS-CATEGORY — Still figuring out identity + zero structure. Two unknowns with no anchor. Academic and personal instability.

 
## APPENDIX B — Architecture Decision Log (UPDATED ENTRIES)

| Decision | Rejected Alternative & Reason for Choice |
|----------|----------------------------------------|
| React (Vite) instead of Next.js | **Rejected: Next.js on Cloudflare Pages.** Reason: `@cloudflare/next-on-pages` adapter deprecated with no migration path. Next.js 16 deprecated `middleware.ts` convention. All API routes required Edge Runtime which conflicted with Node.js crypto (Paystack), `server-only` imports (algorithm), and CPU time limits (matching). Vite produces static files that deploy to Cloudflare Pages in seconds with zero runtime conflicts. |
| Supabase Edge Functions instead of Cloudflare Workers | **Rejected: Cloudflare Workers with Hono.** Reason: Roommate Link's backend needs are minimal (1 webhook, 1 algorithm trigger). A standalone Cloudflare Worker API adds unnecessary infrastructure, a separate repository, and CORS configuration complexity. Supabase Edge Functions live next to the database, share TypeScript types, and require zero infrastructure management. If future projects need a massive standalone API, Cloudflare Workers + Hono becomes the right choice. |
| Web Crypto API instead of Node crypto | **Rejected: Node.js `crypto.createHmac`.** Reason: Cloudflare Edge and Deno do not support Node's `crypto` module. `crypto.subtle.sign()` with HMAC-SHA-512 is the browser-standard equivalent and works identically in both Supabase Edge Functions and Cloudflare Workers. |
| Matching Algorithm in Edge Function instead of Postgres RPC | **Rejected: plv8 PostgreSQL function.** Reason: The algorithm is 200 lines of pure TypeScript with typed interfaces (`MatchResult`, `CategoryBreakdown`, `PatternFlag`). Rewriting it in plv8 (JavaScript inside Postgres) would lose all type safety and make debugging extremely difficult. The algorithm runs in under 100ms for 5,000 users on Deno, well within Edge Function limits. Postgres RPC becomes the right choice if the user base exceeds 50,000. |
| React Router instead of Next.js file-based routing | **Rejected: Next.js App Router `page.tsx` convention.** Reason: File-based routing only works inside Next.js. Pure React requires explicit route configuration via `react-router-dom`. This is a one-time setup cost in `App.tsx` that eliminates all framework lock-in. |
| Route Guards instead of middleware.ts | **Rejected: Next.js `middleware.ts`.** Reason: Deprecated in Next.js 16 ("use proxy instead"). In React, a simple `<ProtectedRoute>` component wraps protected routes and checks `supabase.auth.getSession()`. Identical functionality, zero server dependency. |
| `import.meta.env.VITE_*` instead of `process.env.NEXT_PUBLIC_*` | **Rejected: `process.env`.** Reason: Vite does not use Webpack's `DefinePlugin`. Environment variables exposed to the browser MUST start with `VITE_` in Vite. Using `process.env` in a Vite project will return `undefined` and crash the app. |

 
## APPENDIX C — Architecture Review & Improvements (April 2026)

This appendix documents all improvements made during the comprehensive architecture review conducted in April 2026.

### C.1 Completed Improvements

#### C.1.1 Page Transitions ✅
**Issue**: No page-level animations existed, making the app feel static.
**Solution**: Implemented iOS-style slide transitions in [`DashboardLayout.tsx`](src/components/DashboardLayout.tsx:37) using Framer Motion.
**Details**:
- Direction-aware animations (slide from right for forward, slide from left for backward)
- Smooth 350ms transitions with spring physics
- Applied to all dashboard routes
**Files Modified**: [`src/components/DashboardLayout.tsx`](src/components/DashboardLayout.tsx:37)

#### C.1.2 PWA Theme Colors ✅
**Issue**: Theme color inconsistency across PWA configuration files.
**Solution**: Standardized to `#4f46e5` (Indigo 600) across all PWA files.
**Files Modified**:
- [`vite.config.ts`](vite.config.ts:19) - Set `theme_color` and `background_color`
- [`public/manifest.json`](public/manifest.json:1) - Updated manifest
- [`index.html`](index.html:1) - Updated meta tags

#### C.1.3 Dark Mode Colors ✅
**Issue**: Hardcoded colors breaking theme system in dark mode.
**Solution**: Replaced all hardcoded colors with semantic tokens.
**Files Modified**:
- [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx:1) - `bg-slate-50` → `bg-background`
- [`src/components/ui/InstallPrompt.tsx`](src/components/ui/InstallPrompt.tsx:1) - `bg-white` → `bg-card`
- [`src/components/ui/Sidebar.tsx`](src/components/ui/Sidebar.tsx:1) - `bg-white` → `bg-card`
- [`src/components/dashboard/Sidebar.tsx`](src/components/dashboard/Sidebar.tsx:1) - `bg-white` → `bg-card`
- [`src/pages/LandingPage.tsx`](src/pages/LandingPage.tsx:1) - `bg-white` → `bg-card`
- [`src/pages/ProfilePage.tsx`](src/pages/ProfilePage.tsx:1) - `bg-white` → `bg-card`

#### C.1.4 Database Migrations ✅
**Issue**: No version control for database schema changes.
**Solution**: Initialized Supabase migrations tracking.
**Commands Executed**: `npx supabase init --force`
**Files Created**:
- [`supabase/config.toml`](supabase/config.toml:1) - Supabase CLI configuration
- [`supabase/migrations/`](supabase/migrations/1) - Migrations directory
- [`supabase/migrations/20260405140000_initial_schema.sql`](supabase/migrations/20260405140000_initial_schema.sql:1) - Complete initial schema
- [`supabase/migrations/20260405142300_create_verification_codes.sql`](supabase/migrations/20260405142300_create_verification_codes.sql:1) - Verification codes table

#### C.1.5 Student Email Verification ✅
**Issue**: Broken verification (just flipped flag without proper validation).
**Solution**: Created proper verification library using Supabase Auth and university domain validation.
**Files Created**:
- [`src/lib/verification.ts`](src/lib/verification.ts:1) - Verification helper functions
- [`docs/STUDENT_EMAIL_VERIFICATION.md`](docs/STUDENT_EMAIL_VERIFICATION.md:1) - Implementation guide

#### C.1.6 Payment Verification Retry Logic ✅
**Issue**: Users could get stuck if database update failed after payment.
**Solution**: Added retry mechanism with exponential backoff (2 retries = 3 total attempts).
**Files Modified**: [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx:368)
**Details**:
- Retry delays: 2s, 4s (exponential backoff)
- User feedback during retries
- Graceful error handling after all retries fail

#### C.1.7 Pioneer Users Empty State ✅
**Issue**: Pioneer users with no matches received generic message.
**Solution**: Added contextual messaging explaining 60-day window.
**Files Modified**: [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx:612)
**Details**:
- Separate message for pioneer users
- Explains 60-day matching window
- Encourages sharing app with friends

### C.2 Documentation Created

#### C.2.1 Backup Strategy ✅
**File**: [`docs/BACKUP_STRATEGY_RECOMMENDATIONS.md`](docs/BACKUP_STRATEGY_RECOMMENDATIONS.md:1)
**Contents**:
- Supabase automatic backups (daily, 7-day retention)
- Manual backup procedures
- Storage backup strategies
- Disaster recovery plans
- Automated backup scripts
- Cost considerations

#### C.2.2 Monitoring Recommendations ✅
**File**: [`docs/MONITORING_RECOMMENDATIONS.md`](docs/MONITORING_RECOMMENDATIONS.md:1)
**Contents**:
- Cloudflare Pages monitoring
- Supabase dashboard monitoring (Database, Auth, Storage, Edge Functions)
- Error tracking strategies
- Performance monitoring (Web Vitals)
- Alerting setup
- Uptime monitoring
- Cost monitoring

#### C.2.3 Database Migrations Guide ✅
**File**: [`docs/DATABASE_MIGRATIONS_EXPLAINED.md`](docs/DATABASE_MIGRATIONS_EXPLAINED.md:1)
**Contents**:
- Why migrations are critical
- Local vs production workflow
- Generating safe diffs
- Pushing safely
- Best practices

### C.3 Initial Schema Migration ✅

**File**: [`supabase/migrations/20260405140000_initial_schema.sql`](supabase/migrations/20260405140000_initial_schema.sql:1)
**Schema Includes**:
- `users` table (extends auth.users)
- `university_domains` table (for student verification)
- `verification_codes` table (OTP storage)
- `questionnaire_answers` table
- `matches` table (compatibility scores)
- `messages` table (chat functionality)
- `roommate_found` table (notifications)
- Complete RLS policies for all tables
- Indexes for performance
- Triggers for updated_at timestamps
- Helper functions for matching
- Initial university domain data (15 Ghana universities)

### C.4 Verification Library ✅

**File**: [`src/lib/verification.ts`](src/lib/verification.ts:1)
**Functions**:
- `verifyUniversityEmail()` - Validates email domain against whitelist and updates user profile

### C.5 Existing Implementation Notes

**SettingsPage.tsx Verification**: The existing implementation in [`SettingsPage.tsx`](src/pages/SettingsPage.tsx:119) uses the `verify-student` edge function with a comprehensive two-step flow (email → code). This implementation is secure and well-designed, so the verification library was created as an alternative approach for simpler use cases.

### C.6 Key Technical Decisions

1. **Page Transitions**: iOS-style slide (350ms) with direction awareness
2. **Theme System**: Standardized to Indigo 600 (#4f46e5) across all PWA files
3. **Database**: Migrations tracking initialized for version control
4. **Verification**: Supabase Auth email verification system (secure, proper)
5. **Matching**: Kept 60-day window as requested (no algorithm changes)
6. **Payment Retry**: Exponential backoff (2s, 4s) with user feedback

### C.7 Status Summary

| Category | Tasks | Completed |
|----------|---------|-----------|
| Page Transitions | 1 | ✅ |
| PWA Theme Colors | 1 | ✅ |
| Dark Mode Fixes | 6 | ✅ |
| Database Migrations | 1 | ✅ |
| Student Verification | 1 | ✅ |
| Payment Retry Logic | 1 | ✅ |
| Pioneer User UX | 1 | ✅ |
| Documentation | 3 | ✅ |
| **TOTAL** | **15** | **✅** |

### C.8 Remaining Recommendations

The following items are documented but not yet implemented:

1. **Error Tracking Integration**: Consider integrating Sentry or LogRocket for production error tracking
2. **Health Check Endpoint**: Create `/api/health` endpoint for uptime monitoring
3. **Automated Backups**: Set up GitHub Actions workflow for automated backups
4. **Performance Budgets**: Define and enforce Core Web Vitals budgets
5. **A/B Testing**: Implement A/B testing framework for optional questions (V2)

---

Status: Architecture Approved & Locked


This document represents the complete, validated, conflict-tested architecture for Roommate Link Version 1.0.
Every hole has been identified. Every hole has been fixed. Every decision has been logged.



"We are building a system, not just software."
— Product Founder, during architecture review session



Roommate Link  —  University of Cape Coast  —  Version 1.0  —  CONFIDENTIAL
