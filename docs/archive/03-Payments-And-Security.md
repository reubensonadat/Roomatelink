# Document 3: Big Brother Advice - Payments and Security

Security is critical. Roommate Link deals with an institutional student body and real money. Do not take shortcuts here.

---

## Bypassing RLS with `adminClient`

Row-Level Security (RLS) is great. It stops User A from editing User B's profile.
But what happens when you need to run a cron job? Or when Paystack sends a webhook telling you User A has paid?

When an Edge Function receives a callback from Paystack, the request isn't coming from User A. It's coming from an automated Paystack server. Therefore, the request has NO authorization header.

If the edge function tries to use the normal Supabase client to update User A's `has_paid` column to `true`, PostgreSQL will block the update because the anonymous client doesn't meet the RLS requirement of `auth.uid() = id`.

**The Solution:**
```typescript
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)
```
The Service Role Key gives you literal God-mode bypass of all RLS policies.
**Rule of thumb:** Only use `adminClient` inside Edge Functions that are strictly validating their input. Never expose the Service Role key to the frontend.

---

## Paystack Spoofing

If your Paystack Webhook endpoint URL leaks, anyone can send a POST request saying `{ "data": { "reference": "XYZ", "status": "success", "metadata": { "profile_id": "123" } } }`, tricking your system into upgrading their account for free.

**How we stop it:**
Paystack signs every webhook request using a very specific cryptological standard called **HMAC SHA-512**. 
It uses your secret `PAYSTACK_SECRET_KEY` to hash the JSON body it sends you, and places that hash in the `x-paystack-signature` header.
Because the attacker doesn't know your Secret Key, they cannot generate the matching hash for their fake payload. 
Our edge function mathematically checks if the hash of their payload equals the hash in the header. If it's a mismatch, the engine immediately rejects the request.

---

## The "has_paid" Master Flag

Why is the platform built around a single `has_paid` boolean?
Because complex subscription tiers (Bronze, Gold, Platinum) fail locally for college students. They just want a flat entry fee to unlock the platform.

Once `has_paid` is flipped to `true` (either by the Paystack Webhook OR the Pioneer bypass script), the frontend stops gating messages, profiles, and contact checks. This single source of truth makes the app incredibly easy to maintain.

---

Good luck running the platform. Keep it clean. Keep it boutique.
