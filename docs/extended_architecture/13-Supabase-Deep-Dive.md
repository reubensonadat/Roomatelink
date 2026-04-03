# Volume 13: Supabase Deep Dive (The Absolute Core)

Supabase is an open-source Firebase alternative. We use it aggressively. If you do not understand how it orchestrates the Roommate Link backend natively, you will try to build unnecessary infrastructure.

## 1. The PostgreSQL Foundation
Supabase isn't a magical no-SQL object store. It is literally just a massive standard relational `PostgreSQL` database wrapped in web APIs.

If you add a column to the `users` table via the UI, it's a real SQL column with real strictly-typed data (`text`, `integer`, `boolean`, `uuid`).
This means if you try to `upsert()` an object from the React frontend that sends an array `[]` to a `text` column, Supabase will hard-crash with an HTTP 400 because PostgreSQL enforces strict type adherence. 

## 2. The PostgREST API
Supabase uses a tool called `PostgREST` that automatically turns any PostgreSQL table into a RESTful API.
```typescript
// This React code:
const { data, error } = await supabase.from('users').select('*')
```
Doesn't actually open an active persistent socket. It literally compiles into a standard `HTTP GET` request targeting `https://<PROJECT_URL>.supabase.co/rest/v1/users?select=*`.
We do NOT write custom API endpoints to get basic information because PostgREST gives us CRUD directly into the database.

## 3. GoTrue (Authentication)
When a user logs in, we do not issue JWTs manually. The `supabase.auth` wrapper talks to an underlying system called `GoTrue`.
GoTrue mints the cryptographic tokens and manages password reset emails securely.
When a user successfully logs in, GoTrue issues a JWT and stores it dynamically in the browser. 

The `supabase` JS object detects this token and automatically attaches it internally:
`Authorization: Bearer <token>` to EVERY database call.

## 4. The Request Lifecycle (Putting it all together)
Let's look at what happens when a student updates their Bio:

1. User clicks "Secure Identity" on `ProfilePage.tsx`
2. React fires `supabase.from('users').upsert({ bio: "Hello" })`
3. The JS SDK automatically grabs the GoTrue token and attaches it.
4. An `HTTP POST` request fires targeting PostgREST.
5. PostgREST intercepts the request.
6. PostgREST uses the PostgreSQL `SET LOCAL role` command and injects the `auth.uid()` from the token.
7. PostgREST evaluates the table's "Row Level Security". (Does `auth.uid()` match `auth_id` on the row?).
8. If yes, the database updates. 

## 5. Summary of Roles
There are only two keys associated with the Roommate Link architecture:
- **`SUPABASE_ANON_KEY`**: Sits on the frontend. Totally safe to expose because of Row Level Security. All requests using this key run using the `anon` or `authenticated` PostgreSQL roles.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Sits ONLY on the Edge Functions. NEVER expose this. Requesting using this key uses the `service_role` PostgreSQL role, which forcefully bypasses all RLS filters.
