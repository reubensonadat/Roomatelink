# Document 1: Big Brother Advice - System Architecture

Hey man. This document is written as a practical, "bigger brother" breakdown of how the Roommate Link platform works under the hood. When you inevitably hand this code off to someone else, or when you come back to it in 6 months and wonder "why the hell did we build it like this?", this is exactly what you need to read first.

---

## The Monolith vs. The Engine

This app is primarily a **Vite + React** single-page application (SPA) hosted on Cloudflare Pages. 
But the true magic doesn't live in the UI—it lives in the Supabase backend.

We built this using a strict **"Bouncer and Judge"** architecture:

1. **The Bouncer (PostgreSQL + RLS):**
   - The Supabase database rules supreme. No user can read another user's private data. We achieved this through Row-Level Security (RLS) policies.
   - Example: A user can't manually query the `users` table to see everyone's phone numbers. They only see what the system permits them to see via Edge Functions.

2. **The Judge (Matching Algorithm):**
   - The matching engine (`supabase/functions/match-calculate/judge.ts`) is practically a mathematically pure logic core. It doesn't fetch data from the database—it only processes raw Answer Vectors.
   - Why did we do this? **Testability**. Because `judge.ts` has zero dependencies on Supabase or the network, we were able to write `test_suite.ts`, which runs 55 synthetic persona tests instantly. If you ever want to tweak the algorithm (for example, making the "Messy vs Clean" penalty harsher), you change a single value in `judge.ts`, run the tests, and deploy. 

---

## State Synchronization: The "Amnesia" Bug

During development, we encountered a severe bug where a user's profile would instantly "forget" their chosen options (like Level or Gender Preference) when they refreshed or navigated away from the Profile page.

**Why did this happen?** 
Because of a classic React `useEffect` race condition. 
We had local state (React `useState`) hooked into `localStorage` as a fallback, but we also had asynchronous database calls. When the page loaded, the "save" effect would aggressively trigger and overwrite `localStorage` with blank data *before* the "load" effect had a chance to populate the form. 

**The Fix:**
State must be initialized *synchronously* on the first mount. By loading the initial `useState` value directly from `localStorage`, React handles the state cleanly without misfiring effects. Always use the lazy initializer pattern (`useState(() => getInitialState())`) when dealing with sensitive form drafts!

---

## Why No Tailwind config changes?

We strictly stuck to utility classes inline or relied on `index.css`. This was intentional. When maintaining a platform that aims for a "Boutique" aesthetic, abstracting styles too early causes you to lose control of the visual rhythm. By keeping it explicit in the TSX files, anyone tweaking a component knows *exactly* what CSS is directly affecting the visuals.

---

**Next up:** Check out `02-Edge-Functions-Gotchas.md` for the nightmare that is API Gateway Security.
