# Volume 03: Edge Functions and JWT Bypass

If you look at the deployment logs for any edge function (e.g., `match-calculate`, `delete-account`, `pioneer-check`), you will see the `--no-verify-jwt` flag forcefully injected into the `supabase functions deploy` command. This is critical to understand.

## 1. The Clock Skew Nightmare
By default, when the frontend sends an HTTP POST request to a Supabase Edge Function:
```typescript
supabase.functions.invoke('delete-account')
```
Supabase adds the user's `Authorization: Bearer <jwt-token>` to the HTTP headers.
The API Gateway (Kong) sitting in front of the Edge Function inspects the token.

**The Bug:** Supabase Edge instances globally sync tightly via NTP. However, users' local device clocks (laptops, phones) are frequently incorrect by 1-5 minutes. 
If a student's clock is 2 minutes fast, their browser will mint and attach a JWT that appears to be from the **future**. The API Gateway strictly rejects these "future tokens", causing a massive `401 Unauthorized` brick wall before the Edge Function even executes.

## 2. The Solution: `--no-verify-jwt`
By adding `--no-verify-jwt` to the deployment command, we instruct the API Gateway to step out of the way. It allows the HTTP request through to our Deno code **raw**.

However, we CANNOT trust the raw request blindly. That would allow anyone to execute the function without logging in!

## 3. Manual Internal Verification (The Fix)
Inside every Edge Function, we manually perform a secure verification sequence inside the Try/Catch block using the user's provided JWT:

```typescript
// 1. Grab the raw auth header
const authHeader = req.headers.get('Authorization')
if (!authHeader) throw new Error('Missing head')

// 2. Hydrate a local authentication client using the user's token
const authClient = createClient(supabaseUrl, ANON_KEY, { 
    global: { headers: { Authorization: authHeader } } 
})

// 3. Ask the internal Supabase engine to physically verify the token against the active session!
// This ignores strict minor clock skews but proves cryptographic identity.
const { data: { user }, error: authError } = await authClient.auth.getUser()

if (authError || !user) throw new Error('Bad token')

// Now `user.id` is fully secure to trust!
```

This ensures we maintain absolute cryptographic verification of the user's identity without being at the mercy of the API Gateway's strict NTP timestamp bounds.
