# Migration File Guide for Roommate Link

This document tells any future agent (or yourself) how to properly create migration files that match your **actual live database**.

## Current Database Schema (As of April 2026)

Your Supabase database has the following tables. This is the **source of truth** — not any migration file.

### `public.users`
```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text,
  avatar_url text,
  bio text,
  gender text NOT NULL CHECK (gender = ANY (ARRAY['MALE','FEMALE','OTHER'])),
  gender_pref text NOT NULL CHECK (gender_pref = ANY (ARRAY['SAME_GENDER','ANY_GENDER'])),
  course text,
  level integer CHECK (level = ANY (ARRAY[100, 200, 300, 400, 500, 600])),
  has_paid boolean DEFAULT false,
  payment_date timestamptz,
  status text DEFAULT 'ACTIVE' CHECK (status = ANY (ARRAY['ACTIVE','COMPLETED','EXPIRED','HIDDEN','SUSPENDED'])),
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  fcm_token text,
  is_student_verified boolean DEFAULT false,
  payment_reference text,
  is_pioneer boolean DEFAULT false,
  university_id uuid REFERENCES public.university_domains(id),
  student_email text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

### `public.matches`
```sql
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_a_id uuid REFERENCES public.users(id),
  user_b_id uuid REFERENCES public.users(id),
  match_percentage integer NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
  raw_score double precision,
  cross_category_flags jsonb DEFAULT '[]'::jsonb,
  consistency_modifier double precision DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  user_a_viewed boolean DEFAULT false,
  user_b_viewed boolean DEFAULT false,
  category_scores jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT matches_pkey PRIMARY KEY (id)
);
```

### `public.messages`
```sql
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id),
  receiver_id uuid REFERENCES public.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'PENDING' CHECK (status = ANY (ARRAY['PENDING','SENT','DELIVERED','READ'])),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);
```

### `public.questionnaire_responses`
```sql
CREATE TABLE public.questionnaire_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id),
  answers jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  consistency_score double precision,
  profile_flags jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT questionnaire_responses_pkey PRIMARY KEY (id)
);
```

### `public.reports`
```sql
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.users(id),
  reported_id uuid REFERENCES public.users(id),
  reason text NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status = ANY (ARRAY['PENDING','REVIEWED','ACTIONED','DISMISSED'])),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  admin_notes text,
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);
```

### `public.university_domains`
```sql
CREATE TABLE public.university_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  short_name text NOT NULL UNIQUE,
  email_domain text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT university_domains_pkey PRIMARY KEY (id)
);
```

### `public.verification_codes`
```sql
CREATE TABLE public.verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + '00:10:00'::interval),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT verification_codes_pkey PRIMARY KEY (id)
);
```

---

## Existing RLS Policies (Confirmed Working)

### `messages` table
| Policy Name | Command |
|-------------|---------|
| Receivers can update read status | UPDATE |
| Users can read own messages | SELECT |
| Users can send messages | INSERT |

### Other tables
- Check Supabase Dashboard → Authentication → Policies for the latest state of RLS on `users`, `matches`, `questionnaire_responses`, and `reports`.

---

## Rules for Creating New Migrations

> [!CAUTION]
> **NEVER use `DROP TABLE` in a migration for tables that already have user data.**

1. **Always use `ALTER TABLE` for changes** — never `DROP TABLE ... CASCADE` and recreate.
2. **Use `IF NOT EXISTS` / `IF EXISTS`** for safety.
3. **Always reference the correct columns:**
   - `questionnaire_responses` has `user_id` (NOT `auth_id`)
   - `messages` has `sender_id` and `receiver_id` (NOT `match_id`)
   - `users.id` is a separate UUID from `auth.users.id` — the link is via `users.auth_id`
4. **RLS policies must use subqueries** when the table doesn't have `auth_id` directly:
   ```sql
   -- CORRECT: for tables with user_id referencing public.users(id)
   USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
   
   -- CORRECT: for public.users table directly
   USING (auth_id = auth.uid())
   
   -- WRONG: referencing auth_id on a table that doesn't have it
   USING (auth.uid() = auth_id)  -- FAILS on questionnaire_responses, messages, etc.
   ```
5. **Test migrations in SQL Editor first** before saving as files.

---

## Key Architecture Notes

- **`users.id`** = profile UUID (auto-generated, separate from auth)
- **`users.auth_id`** = Supabase Auth UUID (references `auth.users.id`)
- All match queries use `users.id` (profile UUID), not `auth_id`
- The match-calculate Edge Function inserts matches in BOTH directions (A→B and B→A)
- The 60-day candidate window in `match-calculate` is intentional — keeps the pool fresh
