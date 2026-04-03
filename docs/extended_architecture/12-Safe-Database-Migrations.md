# Volume 12: Safe Database Migrations

You are the sole maintainer of Roommate Link. The easiest way to permanently ruin the platform is an accidental table drop in production. 

## 1. Local vs Production
Your local codebase (`supabase/migrations`) holds the SQL records of your schema. Every time you ask an AI to "add a column", the AI will try to write raw SQL.
If you execute raw SQL on your live Supabase database via the Studio UI, your local codebase falls strictly out of sync.

## 2. Generating Safe Diffs
If you modify your database beautifully in the local Supabase studio interface via `npx supabase start`, you MUST generate a diff to lock in the changes to source control before pushing it to production.

```bash
# Ask the system to compare your local changes to the main schema
npx supabase db diff -f add_user_columns
```
This generates a file like `supabase/migrations/2026xxxx_add_user_columns.sql`. This file acts as an absolute historical timeline of your database.

## 3. Pushing Safely
Before running a push to your live database, always do a dry-run or verify exactly what migration files exist. 

```bash
# Execute the strict differences directly to the live cloud database
npx supabase db push
```

## 4. The Nuke Warning
An AI agent might suggest doing:
```bash
npx supabase db reset
```
**NEVER RUN `SUPABASE DB RESET` IF YOUR CLI IS LINKED TO THE REMOTE NETWORK.**
This command truncates the entire database and reseeds it. It is meant to be used LOCALLY when developing `npm run dev`. If you run this in production, you will wipe the entire student database irrevocably.

## 5. RLS Policies via SQL
Because creating RLS policies via the Supabase UI is tedious, you can generate migration files specifically for RLS:

```sql
-- Inside 2026xxxxx_strict_policy.sql
CREATE POLICY "Users can only edit their own data" 
ON public.users
FOR UPDATE USING (
  auth.uid() = auth_id
);
```
Pushing this file via `db push` ensures that anyone touching this project can read exactly what security measures exist in raw text inside `supabase/migrations`.
