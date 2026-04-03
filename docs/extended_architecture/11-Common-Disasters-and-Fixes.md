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
**The Fix:** Never query the backend repeatedly without `withTimeout()`. If you need to edit states rapidly natively, use synchronous `localStorage.setItem` overrides and deploy a mass `.upsert()` ONLY via an explicit save button.

## 4. "White Flash" / Missing Dark Mode Colors
**The Symptom:** A random modal or background acts like a flashlight on the eyes when toggling to dark mode.
**The Cause:** You or the AI hallucinated and wrote `<div className="bg-white">` out of habit. 
**The Fix:** Run a global project search for `bg-white` and `bg-slate-50`. Change them to `bg-card` and `bg-background` respectively.
