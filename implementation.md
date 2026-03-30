Full Architecture Audit & Backend Readiness Plan
Status: What's Built vs What's Needed
✅ UI — Built & Working
Feature	Route	Architecture Section	Status
Landing Page (pricing, value prop, trust)	/	§4.1 Step 1	✅ Done
Auth (email login)	/auth	§4.1 Step 2	✅ Done (UI only — Supabase Auth not wired)
Onboarding	/onboarding	§4.1 Step 1	✅ Done (theme preview, animated toggle)
Profile Creation	/dashboard/profile	§4.1 Step 3	✅ Done (name, course, level, gender, avatar, bio)
Questionnaire (40 Q's, progress bar, randomised)	/questionnaire	§4.1 Step 4	✅ Done
Calculation Animation	/questionnaire/calculation	§4.2	✅ Done (6-step animation)
Dashboard (match cards, swipe)	/dashboard	§4.2 / §4.3	✅ Done (mock data)
Messaging	/dashboard/messages	§4.3	✅ Done (mock data)
Message Thread	/dashboard/messages/[id]	§4.3	✅ Done (mock data)
Settings	/dashboard/settings	—	✅ Done
Privacy Policy	/privacy	—	✅ Done
Terms of Service	/terms	—	✅ Done
Answer Review (read-only)	/dashboard/review	—	✅ Done
Algorithm (matching engine)	
lib/matching-algorithm.ts
§6	✅ Done & tested
Algorithm Spec	
algorithm.md
§6	✅ Done
⚠️ UI — Gaps to Address Before Backend
Missing Feature	Architecture Reference	Priority	Notes
Locked Dashboard State (paywall blur)	§4.2	🔴 HIGH	Architecture says: match % visible free, identity blurred until GHS 15 payment. Dashboard currently shows everything.
Payment Screen (Paystack + MoMo)	§4.2	🔴 HIGH	"Unlock all profiles for GHS 15" prompt. Paystack MoMo integration.
Match Card — Compatibility Breakdown	§4.3	🟡 MEDIUM	Clicking a match should show category-by-category breakdown with green/amber/red indicators. Currently just shows basic card.
"Found My Roommate" flow	§4.4	🟡 MEDIUM	Button to mark search complete, removing profile from feeds.
Profile photo upload	§4.1 Step 3	🟡 MEDIUM	Users should be able to upload a real photo as alternative to avatars.
Report User flow	§10.3	🟢 LOW	3-reports-to-suspend system. Can build after core flow works.
Ghost Prevention Prompts (Day 7/30/50)	§11	🟢 LOW	Push notification driven — needs FCM first.
UCC email Verification Badge (@stu.ucc.edu.gh)	§10.1	🔴 HIGH	Auth page accepts any email, but awards a 'Verified Student' checkmark for UCC student domains.
Supabase Database Schema
5 tables needed, matching architecture §7:

Table 1: users
sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone_number  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  gender        TEXT CHECK (gender IN ('MALE','FEMALE','OTHER')) NOT NULL,
  gender_pref   TEXT CHECK (gender_pref IN ('SAME_GENDER','ANY_GENDER')) NOT NULL,
  course        TEXT,
  level         INT CHECK (level IN (100,200,300,400,500,600)),
  has_paid      BOOLEAN DEFAULT FALSE,
  payment_date  TIMESTAMPTZ,
  status        TEXT DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','COMPLETED','EXPIRED','HIDDEN','SUSPENDED')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_active   TIMESTAMPTZ DEFAULT now(),
  fcm_token     TEXT
);
Table 2: questionnaire_responses
sql
CREATE TABLE questionnaire_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  answers          JSONB NOT NULL,  -- {"q1":2,"q2":1,...,"q40":3}
  completed_at     TIMESTAMPTZ DEFAULT now(),
  consistency_score FLOAT,
  profile_flags    JSONB DEFAULT '[]'
);
Table 3: matches
sql
CREATE TABLE matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  match_percentage     INT NOT NULL CHECK (match_percentage BETWEEN 0 AND 100),
  raw_score            FLOAT,
  cross_category_flags JSONB DEFAULT '[]',
  consistency_modifier FLOAT DEFAULT 0,
  calculated_at        TIMESTAMPTZ DEFAULT now(),
  user_a_viewed        BOOLEAN DEFAULT FALSE,
  user_b_viewed        BOOLEAN DEFAULT FALSE,
  UNIQUE(user_a_id, user_b_id)
);
Table 4: messages
sql
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  status       TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','DELIVERED','READ'))
);
Table 5: reports
sql
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  reported_id UUID REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'PENDING'
              CHECK (status IN ('PENDING','REVIEWED','ACTIONED','DISMISSED')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
);
Next.js API Webhook Flow: /api/webhooks/matches
Trigger
Database webhook on INSERT into questionnaire_responses.

Sequence Diagram
User finishes Q40
    │
    ▼
Client saves answers to `questionnaire_responses` table
    │
    ▼
Supabase Webhook fires HTTP POST → Next.js Route `/api/webhooks/matches`
    │
    ▼
Next.js API Route (Server Side):
  1. Fetch new user's JSONB answer vector
  2. Fetch ALL active users' answer vectors WHERE status = 'ACTIVE'
  3. Apply gender_pref filter (hard exclusion BEFORE algorithm)
  4. For each active user:
     a. Run calculateMatch(newUser, activeUser)
     b. If result ≥ 60% → INSERT into matches table
  5. Return count of matches inserted
    │
    ▼
Client redirects to /dashboard → queries matches table → shows cards
Edge Case: New Users Join After You Matched
Scenario: You finish questionnaire on Day 1 and get 5 matches. By Day 4, 50 new users have joined.

How it works: When each of those 50 new users completes THEIR questionnaire, THEIR edge function fires and compares them against ALL active users — including you. If they score ≥60% with you, a new row is inserted into the matches table for the pair.

What you see: Next time you open /dashboard, your match feed queries the matches table and returns ALL matches — including the new ones from Day 2–4. Your feed grows automatically as new compatible people join.

You do NOT need to retake the questionnaire. You do NOT need to refresh anything. The match table accumulates records from both directions.

Edge Case: Someone You Matched With Finds a Roommate
Their status changes to COMPLETED. The dashboard query filters by WHERE status = 'ACTIVE'. Their card disappears from your feed instantly.

Edge Case: 50+ People Are 90%+ Matches
The UI shows top 20 with infinite scroll. No artificial cap on the algorithm side. The sort is by match_percentage DESC with a secondary sort by calculated_at DESC (newest matches surface higher among ties).

Edge Case: All-A Suspicious Profile Matches Everyone
The consistency flag reduces ALL of that user's matches by 15%. So their "100% match" with someone becomes 85%. Their "80% match" becomes 65%. Suspicious profiles are mathematically pushed down the feed without being removed.

Recommended Order of Next Steps
Phase A: Finish UI Before Backend (Your Request)
IMPORTANT

These UI items must work with mock data BEFORE wiring Supabase.

Locked Dashboard State — Match cards show % + compatibility traits but blur name/photo/bio behind a "Unlock for GHS 15" button
Compatibility Breakdown Page — Click a match → full category-by-category view
UCC Email Verification Badge — Auth page accepts any email but rewards @stu.ucc.edu.gh
Profile Photo Upload — Option alongside avatar selection
Phase B: Supabase Setup
Create Supabase project
Run the 5 CREATE TABLE scripts
Configure Supabase Auth (email signup without domain restriction)
Wire auth page → Supabase Auth
Wire profile page → users table INSERT
Wire questionnaire → questionnaire_responses INSERT
Phase C: Edge Function + Matching
Deploy calculate-matches Edge Function
Configure database webhook trigger
Wire dashboard → matches table query
Wire messages → messages table + Supabase Realtime
Phase D: Payment + Polish
Integrate Paystack (MoMo) for GHS 15 payment
Wire has_paid boolean to unlock dashboard state
Set up FCM for push notifications
Implement ghost prevention prompts (Day 7/30/50)