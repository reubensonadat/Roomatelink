# Volume 11: Common Disasters and Fixes

If this project hits the fan in production, it's usually one of these 4 things.

## 1. "Failed to fetch" on Edge Functions
**The Symptom:** Dashboard buttons simply don't work, network tab screams `CORS error` or `Failed to load resource: net::ERR_CONNECTION_REFUSED`.
**The Cause:** Edge Function was improperly deployed or is erroring out before returning the CORS headers.
**The Fix:** Deploy your function explicitly adding the JWT override to prevent API HTTP 401 hijacking.
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

## 2. Deno Deploy Import Error
**The Symptom:** `Failed to bundle the function (reason: Relative import path "@supabase/supabase-js" not prefixed...)`
**The Cause:** You used standard node imports like `import { createClient } from '@supabase/supabase-js'`. Supabase Deno runtime hates Node modules natively unless configured via import maps.
**The Fix:** Always use fully qualified strings globally at the absolute top of the Edge Function.
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
```

## 3. "Profile Amnesia" / "Network timed out" in Profile
**The Symptom:** Rapid database failure during profile creation. White screens on save.
**The Cause:** The `updateField` debounce bug. Do NOT spam the `public.users` table with auto-saves on rapid key-presses.
**The Fix**: Implement `withTimeout()` helpers for all Supabase calls and always provide a `LoadingOverlay` that includes a "Retry" and "Abort" button to let the user break the loop manually.

## 4. The Infinite Syncing Deadlock (Chat)
If a user has a massive amount of unread messages and a poor connection, the `ChatPage` might hang indefinitely while trying to merge the delta.
- **The Disaster**: The PURE client-side loading spinner never ends.
- **The Fix**: 
  1. Use **Cache-First** rendering (show `localStorage` immediately).
  2. Implement a **10s Fail-Safe Timeout**. If the sync isn't finished in 10 seconds, hide the spinner and show the current state anyway.
  3. Use a subtle "Syncing" pill in the header instead of a full-page blocker.

## 5. The Reciprocal Gender Filter (Matching)
A male student might match with a female student even if she only wants "Same Gender" roommates.
- **The Disaster**: Awkward, irrelevant matches that ignore user safety preferences.
- **The Fix**: All matching filters MUST be reciprocal. The algorithm checks:
  1. Does User A like User B's Gender?
  2. Does User B's preference allow User A's Gender?
  *This is enforced at the database level in the "Bouncer" (match-calculate edge function).*

## 6. The Clock Skew (401 Unauthorized)
Users with fast or slow device clocks get blocked from calling Edge Functions by the Supabase API Gateway.
- **The Disaster**: Function fails before it even starts.
- **The Fix**: Deploy all Edge Functions with `--no-verify-jwt` and perform manual verification inside the Deno code using the `auth.getUser()` internal engine.

## 7. "White Flash" / Missing Dark Mode Colors
**The Symptom:** A random modal or background acts like a flashlight on the eyes when toggling to dark mode.
**The Cause:** You or the AI hallucinated and wrote `<div className="bg-white">` out of habit. 
**The Fix:** Run a global project search for `bg-white` and `bg-slate-50`. Change them to `bg-card` and `bg-background` respectively.
