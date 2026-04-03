# Volume 06: Payments and Security

Roommate Link uses **Paystack** for the GHS 25 unlocking gateway. Because payments involve real student money, the security architecture here is draconian.

## 1. The Paystack Handshake
We do not trust the frontend to say "I paid!". If the frontend says "The payment succeeded here is the reference!", we immediately pass that reference to a secure Supabase Edge Function (`paystack-webhook`).
The Edge function uses our secret `PAYSTACK_SECRET_KEY` (stored securely in Supabase environment variables, entirely hidden from the frontend) to physically ask Paystack APIs: "Did this transaction really happen?"

## 2. HMAC SHA-512 Verification
Webhooks are just HTTP POST requests. A malicious student could forge an HTTP POST request to our Edge Function looking exactly like a Paystack webhook to trick the system into unlocking their account.

To prevent this, Paystack signs every webhook request using **HMAC SHA-512** hashed against our secret key. 
In the Edge Function, we intercept the incoming raw body, re-hash it using our secret key, and compare our hash to the `x-paystack-signature` sent in the header. If they don't match, we reject the request immediately as an imposter.

## 3. Webhook RLS Bypass
When a webhook legitimately passes the HMAC verification, we need to locate the user in the database and flip `has_paid = true`.
Usually, Paystack sends a `metadata` packet containing the user's `id`.
Since the Webhook is automated, it doesn't have the User's JWT token! It cannot bypass the "Bouncer" (Row Level Security).
Therefore, `paystack-webhook` initializes Supabase using the `SUPABASE_SERVICE_ROLE_KEY`. This elevates the script to God-mode, allowing it to forcefully locate the user in `public.users` and update their row even though the user isn't actively logged in.
