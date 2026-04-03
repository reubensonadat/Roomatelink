# Volume 02: Database RLS and Policies

Row Level Security (RLS) is the absolute foundation of the Roommate Link backend. If RLS fails, the entire application's security posture collapses.

## 1. What is RLS?
In a traditional app, you have a Node.js server. The server holds a master database password, connects to the database, queries everything, and filters out the stuff the user shouldn't see before sending it via an API to the frontend.

We **don't have a Node.js server**. Our frontend talks *directly* to PostgreSQL using Supabase keys.
To prevent a malicious user from running `supabase.from('users').delete().neq('id', '0')` in their browser console and wiping our entire database, we enable Row Level Security.

RLS acts as a filter built directly into every PostgreSQL table.

## 2. `auth_id` vs `id`
Every student has two identities in the system:
- `auth.users.id`: This is managed natively by Supabase Auth (the system that handles passwords, JWT tokens, and OAuth). We refer to this as the `auth_id`.
- `public.users.id`: This is our custom row in the database where we store their `course`, `bio`, `gender`, etc. We refer to this as their `profile.id` or just `id`.

**The Golden Security Rule:** The `public.users` table contains a column called `auth_id` linking the two.

## 3. The Live Policies
If you look at our Supabase dashboard, our RLS policies for the `users` table look like this:

### SELECT Policy (Who can read?)
`true`
*Wait, what?* Yes. For Roommate Link, any logged-in student needs to be able to read anyone's profile to act as a "Match." Therefore, SELECT is relatively open.

### UPDATE Policy (Who can edit?)
`auth_id = auth.uid()`
This tiny SQL snippet handles our entire security model. When the frontend attempts an UPDATE, Supabase reads the JWT token sent from the browser to extract `auth.uid()`. It compares it strictly to the row's `auth_id`. If it's a match, the row inherently updates. If it doesn't, PostgreSQL automatically aborts the transaction with 0 changes.

## 4. Bypassing RLS (The Service Role)
There are times you need to bypass these policies on purpose. For example, deleting an account. If a user deletes an account, we need to cascade-delete their matches in the `matches` table where they might be `user_b_id`. 
Normally, RLS prevents user A from modifying user B's match array.
To bypass this, we trigger an **Edge Function** (like `delete-account`).
Inside the function, we initialize Supabase using the `SUPABASE_SERVICE_ROLE_KEY`.

```typescript
// The Bouncer is active (Subject to RLS)
const safeClient = createClient(URL, ANON_KEY, { global: { headers: { Authorization: token }}})

// The Judge bypasses all rules! (RLS is IGNORED)
const adminClient = createClient(URL, SERVICE_ROLE_KEY)
```
**CRITICAL:** Never leak the Service Role Key to the frontend `vite.env` variables. It gives total, god-mode access to the entire database.
