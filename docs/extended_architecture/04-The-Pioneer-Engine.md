# Volume 04: The Pioneer Engine

The Pioneer Engine is a dedicated Supabase Edge Function that selectively bypasses the Paystack firewall for the first 100 students on Roommate Link, granting them the `has_paid: true` flag permanently.

## 1. Why an Edge Function?
We cannot run `supabase.from('users').select('*', { count: 'exact' })` on the frontend.
Because of Row Level Security (RLS), a standard user can only `UPDATE` their own row. They can `SELECT` other rows, but we restrict aggregate mass-scanning queries to prevent scraping. If the frontend checked its own rank, a bad actor could spoof the local `isPioneer` JSON payload and forge their entrance.

## 2. The Logic Structure
The `pioneer-check` logic runs entirely securely on the server:

1. **Verify Identity:** The function verifies the user's JWT.
2. **Fetch User Timestamp:** It uses the `adminClient` (Service Role Key) to fetch the user's explicit `created_at` timestamp from the `public.users` table. This prevents users from forging a `created_at` payload.
3. **Count the Predecessors:** It queries the database using `.lte('created_at', user.created_at)`. This counts exactly how many students signed up *before or at the exact same millisecond* as the active user.
4. **Is it <= 100?:** If the returned count is `100` or less, it responds with `isPioneer: true`.

## 3. Account Deletion Implications
If someone deletes their account, their row is physically wiped from `auth.users` and `public.users`. 
When they do this, the total user count drops. 
This means if there were 100 users, and User #42 deletes their account, the user who was previously standing in position #101 will instantly be promoted to position #100 and become a Pioneer! 
This dynamic shuffling ensures that exactly 100 *active* pioneers hold the slot at any time.

## 4. Frontend Implementation
Inside `DashboardPage.tsx`, the hook quietly triggers:
```typescript
const { data: pcData } = await supabase.functions.invoke('pioneer-check', { body: {} })
if (pcData?.isPioneer) setIsPioneerUser(true)
```
If `isPioneerUser` is true, the dashboard displays a golden "Claim Pioneer Status" banner. Clicking the banner updates `has_paid: true` instantly without popping the Paystack modal.
