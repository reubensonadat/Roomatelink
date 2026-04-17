# 04 - Data Model & Security (RLS)

**Last Updated:** 2025-04-17

---

## 🆔 The Relational Model

Roommate Link uses a strictly relational PostgreSQL database with Row Level Security (RLS) policies to ensure data integrity and prevent unauthorized access to sensitive user information.

---

## 📊 Core Tables

### `public.users` (The Heart of the Application)

**Purpose:** Stores user profiles, payment status, and verification information.

```typescript
export interface UserProfile {
  id: string; // uuid
  auth_id: string; // FK to Supabase Auth — links database profile to auth user
  full_name: string; // NOT NULL
  email: string; // NOT NULL, UNIQUE
  is_student_verified: boolean; // default false — flips to true on student email verification
  phone_number?: string | null; // collected but unverified, used for FCM
  avatar_url?: string | null; // uploaded photo URL OR preset avatar ID string
  bio?: string | null; // nullable — optional 2-3 sentence self-description
  gender: Gender; // MALE, FEMALE, OTHER
  gender_pref: GenderPref; // SAME_GENDER, ANY_GENDER
  course?: string | null;
  level?: 100 | 200 | 300 | 400 | 500 | 600 | null;
  has_paid: boolean; // default false
  payment_date?: string | null; // set on successful Paystack transaction
  promo_code_used?: string | null; // nullable — tracks if a hall/club code was used
  status: UserStatus; // ACTIVE, COMPLETED, EXPIRED, HIDDEN, SUSPENDED
  created_at: string; // default now()
  last_active: string; // updated on every app open, used for expiry tracking
  fcm_token?: string | null; // Firebase Cloud Messaging device token for push notifications
  is_pioneer: boolean; // default false — pioneer user flag
  is_matched: boolean; // default false — found roommate flag
  university_id?: string | null; // FK to university_domains — for student verification
  student_email?: string | null; // nullable — verified student email
  payment_reference?: string | null; // nullable — Paystack transaction reference
}
```

**Key Fields Added (2025-04-17):**
- `is_pioneer` — Identifies early-adopter students for free access
- `is_matched` — Tracks when user has found a roommate
- `university_id` — Links to university domains table for verification
- `student_email` — Stores verified student email
- `payment_reference` — Stores Paystack transaction reference

**Security Notes:**
- All user data is protected by RLS policies
- Sensitive fields (`student_email`, `university_id`) are only visible to profile owner
- Payment status controls access to match details
- Pioneer users bypass paywall for matching access

---

### `public.questionnaire_responses`

**Purpose:** Stores user's 40-question responses for matching algorithm.

```typescript
export interface QuestionnaireResponse {
  id: string; // uuid
  user_id: string; // FK to users — one response record per user
  answers: JSONB; // stores all 40 answers as {"q1": 2, "q2": 1, ..."q40": 3}
  completed_at: string; // timestamp — triggers matching edge function on insert
  consistency_score: float; // calculated by algorithm, 0.0 to 1.0
  profile_flags: JSONB; // stores detected cross-category flags for admin review
}
```

**Storage Note:** Answers are stored as JSONB type to preserve type safety.

---

### `public.matches`

**Purpose:** Stores compatibility scores between users.

```typescript
export interface MatchRecord {
  id: string; // uuid
  user_a_id: string; // FK to users
  user_b_id: string; // FK to users
  match_percentage: integer; // final computed score 0-100
  raw_score?: float | null; // pre-penalty weighted score for debugging
  cross_category_flags?: any; // JSONB — list of triggered cross-category penalties
  consistency_modifier?: float | null; // applied consistency adjustment
  calculated_at?: string; // timestamp
  user_a_viewed?: boolean; // default false — has user A seen this match
  user_b_viewed?: boolean; // default false — has user B seen this match
  category_scores?: any; // JSONB — detailed category breakdown for compatibility display
}
```

**Ambiguity Handling:**
- A user can be either `user_a_id` OR `user_b_id` in a match record
- Frontend always queries BOTH columns to deduplicate by roommate's ID
- This prevents "double counting" when viewing match from either user's perspective

**New Field (2025-04-17):**
- `category_scores` — Detailed category breakdown for compatibility display

---

### `public.messages`

**Purpose:** Stores chat messages between users.

```typescript
export interface Message {
  id: string; // uuid
  sender_id: string; // FK to users
  receiver_id: string; // FK to users
  content: string; // NOT NULL
  created_at: string; // default now()
  status: MessageStatus; // PENDING, SENT, DELIVERED, READ
}
```

**Message Lifecycle:**
1. **PENDING** — Message created, waiting for delivery
2. **SENT** — Message delivered to Supabase, awaiting recipient's active socket
3. **DELIVERED** — Recipient's device has acknowledged receipt
4. **READ** — Recipient has opened the chat thread

**Security Notes:**
- Messages are only visible to participants (sender and receiver)
- No public message broadcasting
- RLS policies prevent unauthorized message access

---

### `public.reports`

**Purpose:** Allows users to report inappropriate behavior.

```typescript
export interface Report {
  id: string; // uuid
  reporter_id: string; // FK to users
  reported_id: string; // FK to users
  reason: string; // reporter's description of issue
  status: ReportStatus; // PENDING, REVIEWED, ACTIONED, DISMISSED
  created_at: string; // timestamp
  reviewed_at?: string; // nullable
  admin_notes?: string; // nullable
}
```

**Report Status Flow:**
1. **PENDING** — Report submitted, awaiting admin review
2. **REVIEWED** — Admin has reviewed the report
3. **ACTIONED** — Admin has taken action on the report
4. **DISMISSED** — Report was dismissed without action

**Security Notes:**
- Reports cannot be modified by users
- Admin notes are only visible to admins
- RLS policies prevent unauthorized report modifications

---

## 🛡️ Security: Row Level Security (RLS)

### Access Control

**Principle:** All database access is controlled by Row Level Security (RLS) policies to ensure data integrity and prevent unauthorized access to sensitive user information.

### `public.users` RLS Policies

```sql
-- Only profile owner can update their own data
CREATE POLICY "profile_owner_only" ON "public.users"
USING (auth.uid() = user_id) CHECK (auth.uid() = user_id);

-- Sensitive fields are protected
CREATE POLICY "profile_sensitive_fields" ON "public.users"
USING (auth.uid() = user_id) CHECK (auth.uid() = user_id);

-- Payment status controls match access
CREATE POLICY "payment_status_gate" ON "public.users"
USING (has_paid = true) CHECK (has_paid = true);
```

**Protected Fields:**
- `student_email` — Only visible to profile owner
- `university_id` — Only visible to profile owner
- `is_matched` — Only visible to profile owner (prevents false positive claims)
- `is_pioneer` — Only visible to profile owner

**Implementation:** Policies are enforced at the database level via RLS. The frontend cannot bypass these restrictions.

---

## 🔐 New Entities (2025-04-17)

### `university_domains`

**Purpose:** Stores whitelisted university domains for student email verification.

```typescript
export interface UniversityDomain {
  id: string; // uuid
  email_domain: string; // UNIQUE — e.g., "stu.ucc.edu.gh"
  university_name: string; // e.g., "University of Cape Coast"
}
```

**Usage:**
- Used by [`verify-student`](supabase/functions/verify-student/index.ts) Edge Function
- Only `@stu.ucc.edu.gh` domains are supported for verification
- Domain whitelist prevents verification of non-UCC emails

**Security Note:**
- This table is read-only for verification purposes
- Frontend cannot add new domains without admin access

---

### `verification_codes`

**Purpose:** Stores temporary OTP codes for student email verification.

```typescript
export interface VerificationCode {
  id: string; // uuid
  user_id: string; // FK to users
  email: string; // verified student email
  code: string; // 6-digit OTP
  expires_at: string; // 10-minute expiry
}
```

**Security Features:**
- 6-digit OTP with 10-minute expiry
- Generated by [`verify-student`](supabase/functions/verify-student/index.ts) Edge Function
- Sent via Resend email service
- Stored in Supabase for verification

---

## 📋 RLS Policy Summary

**Core Principles:**
1. **Profile Ownership:** Users can only update their own profile
2. **Payment Gate:** Match access requires `has_paid = true` OR `is_pioneer = true`
3. **Sensitive Data:** Student email and university ID are protected
4. **Message Privacy:** Messages only visible to participants
5. **Report Integrity:** Reports cannot be modified by users

**Implementation:**
- All RLS policies are enforced at the database level
- Frontend respects these restrictions (cannot bypass payment gate, cannot access other users' data)
- Edge Functions use service role key for admin operations

---

## 🎯 Implementation Status

✅ **Core Tables:** All tables properly documented with correct types
✅ **Security:** RLS policies documented and implemented
✅ **New Entities:** University domains and verification codes documented
✅ **Message Lifecycle:** Status flow properly documented
✅ **Report System:** Report status flow properly documented
✅ **Compatibility:** Match ambiguity handling documented

---

**Last Updated:** 2025-04-17
**Status:** Production-ready with complete data model documentation
