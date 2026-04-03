# Volume 01: High-Level Architecture

Roommate Link is built as an aggressively decoupled "Bouncer and Judge" system. We intentionally split the frontend view layer from the heavy backend processing because of the target audience: college students on unpredictable university Wi-Fi networks using lower-tier devices.

## 1. The Cloudflare Pages Fronthaul ("The View")
The frontend is a vanilla **Vite + React** app.
- **Why Cloudflare Pages?** It aggressively caches static assets (images, CSS, bundled JS) globally at the edge. A student opening the app in Ghana pulls the UI directly from a Cloudflare node in Accra, rather than bouncing requests across the Atlantic.
- **Why no Server-Side Rendering (Next.js)?** The app is highly interactive heavily relying on `localStorage` to save partially completed profiles. Server-side rendering would introduce massive hydration mismatches because the server doesn't know what's in the student's `localStorage` until after the page loads. SPA (Single Page Application) is the only way to perfectly decouple raw UI logic from the server.

## 2. The Supabase Backhaul ("The State")
Supabase acts as our entire backend. 
- We do not run our own Node.js or Python server. Instead, we map our Database directly to HTTP endpoints using Supabase PostgREST.
- **Why PostgREST?** React calls `supabase.from('users').select('*')`. This feels like a database call, but it's actually an HTTP `GET` request. 
- Supabase automatically checks the `Authorization: Bearer <token>` in the header, evaluates our PostgreSQL Row Level Security (RLS) policies, and decides instantly if the request is legit.

## 3. The "Bouncer and Judge" Philosophy
- **The Bouncer:** This is PostgreSQL's Row Level Security (RLS). When a user tries to edit their profile, the Bouncer intercepts the HTTP request, checks if `auth.uid() === auth_id` on the affected row, and blocks them if it doesn't. 
- **The Judge:** Sometimes a user needs to do something they legally cannot do (or shouldn't do directly). Example: Counting the total database to see if they are the 70th user (Pioneer Check) or updating their own payment status to `has_paid: true` via Webhook. The Bouncer would reject the user. Instead, we send the request to a Supabase Edge Function (The Judge). The Judge uses the `SUPABASE_SERVICE_ROLE_KEY` to completely bypass the Bouncer, do the highly secure calculation, and stamp the database.

## 4. Theme Protocol
To ensure rapid UI/UX switches without massive DOM repaints, the App uses strict Tailwind Color Tokens:
- `bg-background` matches to `bg-slate-50` loosely in light mode and `bg-slate-900` in dark mode.
- `bg-card` matches `white` / `dark slate`.
- Using hardcoded `bg-white` breaks the protocol and causes "blinding flashes" in Dark Mode. All UI must stick to the token ring.
