# Document 2: Big Brother Advice - Edge Functions & JWT Gotchas

Alright, if there is one section of the codebase to be incredibly careful with, it is the `supabase/functions/` directory.

Edge Functions run on Deno deploy, globally distributed across the world. They are blazing fast, but they deal heavily with networking and security layers that will inevitably cause weird, silent bugs. Here is everything you need to know.

---

## The Phantom 401 Unauthorized Error

Near the end of development, we encountered a bug where the `delete-account` Edge Function instantly responded with a Status `401 Unauthorized`. 

**The Confusion:**
Our Edge Function literally started with this logic:
```typescript
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
```
If that threw an error, it was supposed to return incredibly clear JSON: `{ error: 'Missing Authorization header' }` with a `400` status. But the browser got a blank `401` status. The code inside `delete-account` *was never executing*.

**The Lesson:**
Supabase places a Cloud Gateway (API gateway, specifically Kong or Deno edge-proxy) *in front* of your Edge Functions. 
By default, this gateway strictly validates the `Authorization` JWT header *before* traffic reaches your code. 
If your user's mobile phone clock is out of sync with the internet's standard clock by even a few seconds (which is very common), the timestamp inside the JWT (the `iat` or "issued at" claim) will technically be in the *future* relative to the Supabase server. The Gateway panics and blocks it as a malformed token.

**The Solution:**
Always deploy critical user-facing auth/utility functions with this manual bypass:
```bash
npx supabase functions deploy delete-account --no-verify-jwt
```
When you use `--no-verify-jwt`, you are bypassing the gateway restriction and feeding the raw request into your Deno script. 
You *must* then manually verify the user's token securely inside your code by using the `@supabase/supabase-js` client's `auth.getUser()` method, which calls the actual Supabase Authentication server that ignores tiny clock skews!

---

## Timeout Chaos

When an Edge Function does complex work (like wiping dozens of rows in the `delete-account` function, or calling the match calculation engine thousands of times), it can occasionally stall because of database cold starts.

If the edge function stalls for 15 seconds, the frontend React application will just spin endlessly. The user thinks the app broke.

**The Solution:**
Never await an Edge Function plainly. Always wrap it in `Promise.race`:
```typescript
function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ])
}
```
If the function hangs, `withTimeout` throws a controllable error, and the UI can show a clean Toast message ("Network timeout, try again") instead of deadlocking.

---

**Next up:** Check out `03-Payments-And-Security.md`.
