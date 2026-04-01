AI AGENT REFACTORING PROMPT — Roommate Link v2.0
Instructions for Roo (or any AI coding agent)
Paste this entire document into the AI agent as your starting prompt.

CONTEXT
I am refactoring a Next.js application called Roommate Link into a pure React (Vite) application. The original Next.js codebase has been moved to /archive-version-one/ and must NOT be modified — it serves only as a reference for what the UI and logic should look like.

Why I Am Doing This
My original Next.js app failed 30+ Cloudflare Pages builds because:
1. The @cloudflare/next-on-pages adapter is officially deprecated
2. Next.js 16 deprecated the middleware.ts convention I was using
3. Cloudflare Edge Runtime cannot run Node.js APIs (crypto, server-only, etc.)
I am centralizing all future projects on Cloudflare Pages

My New Stack
Frontend: React 18+ with Vite, TypeScript, Tailwind CSS
Routing: React Router v6 (NOT file-based routing)
Backend: Supabase Edge Functions (Deno) — NOT Cloudflare Workers, NOT Next.js API routes
Database: Supabase PostgreSQL (schema unchanged)
Auth: Supabase Auth (browser client, NOT server-side cookies)
Realtime: Supabase WebSockets
Payments: Paystack (client-side popup with PUBLIC key, webhook with SECRET key in Supabase Edge Function)
PWA: vite-plugin-pwa
Hosting: Cloudflare Pages

My Rules — DO NOT BREAK THESE
NEVER use process.env — Always use import.meta.env.VITE_*
NEVER use Next.js imports — No next/image, next/link, next/navigation, next/headers, "use client", "use server", import 'server-only'
NEVER put secret API keys in frontend code — Paystack SECRET key, Supabase SERVICE_ROLE key go ONLY in Supabase Edge Function secrets
NEVER create API routes in the frontend project — All backend logic goes in /supabase/functions/
NEVER install Next.js packages — No @next/*, no next-pwa, no @cloudflare/next-on-pages
ALWAYS use React Router — Replace <Link href="..."> with <Link to="...">, replace useRouter() from next/navigation with useNavigate() from react-router-dom
ALWAYS use standard HTML — Replace <Image> from next/image with <img>, replace <Script> from next/script with standard <script> tags

STEP-BY-STEP MIGRATION PLAN
We will migrate incrementally. We will NOT try to move everything at once. We will complete one section, verify it works, then move to the next. If anything breaks, we stop and fix it before proceeding.

Phase 0: Verify Base Setup
Before writing ANY application code, verify:
1. Run npm run dev — the Vite dev server starts at localhost:5173
2. The default React page renders in the browser
3. Tailwind CSS classes are working (test with className="text-indigo-600")
4. Push to GitHub → Cloudflare Pages builds successfully (green checkmark)
5. The deployed Cloudflare Pages URL shows the default React page
DO NOT proceed to Phase 1 until ALL 5 checks pass.

Phase 1: Supabase Client & Auth Context
- Create /src/lib/supabase.ts — browser Supabase client using import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY
- Create /src/context/AuthContext.tsx — React context that wraps the app, provides user, session, loading, signIn, signUp, signOut
- Create /src/guards/ProtectedRoute.tsx — component that checks auth and redirects to /auth if not logged in
- Set up React Router in App.tsx with basic routes: /, /auth, /dashboard (dashboard wrapped in ProtectedRoute)
Verify: I can see the landing page at /, clicking a login button goes to /auth, the auth page loads

Phase 2: Landing Page
- Go to /archive-version-one/app/page.tsx — this is the landing page
- Recreate it in /src/pages/Landing.tsx as a pure React component
- Replace all Next.js <Link> with React Router <Link>
- Replace all Next.js <Image> with <img>
Verify: Landing page looks identical to the original at localhost:5173/

Phase 3: Auth Page
- Go to /archive-version-one/app/auth/page.tsx
- Recreate in /src/pages/Auth.tsx
- Wire up email/password signup and Google OAuth using the Supabase browser client directly
- On successful auth, redirect to /onboarding
Verify: I can create an account, see my session, get redirected

Phase 4: Onboarding + Profile Creation
- Go to /archive-version-one/app/onboarding/
- Recreate profile creation form in /src/pages/Onboarding.tsx
- On submit, insert into Supabase users table directly from the frontend
- Redirect to /questionnaire
Verify: Profile data appears in Supabase dashboard

Phase 5: Questionnaire
- Go to /archive-version-one/app/questionnaire/
- Recreate the Typeform-style single-question display in /src/pages/Questionnaire.tsx
- Implement progress bar, randomised question order, no back button
- Save answers to questionnaire_responses in Supabase directly from frontend
- On completion, call the Supabase Edge Function to trigger matching
- Redirect to /dashboard
Verify: All 40 questions display correctly, answers save to database

Phase 6: Dashboard — Matches Display
- Go to /archive-version-one/app/dashboard/
- Recreate the dashboard layout in /src/pages/Dashboard.tsx
- Fetch matches from the matches table using Supabase browser client
- Implement the locked state (show percentage + compatibility breakdown, blur name/photo)
- Implement the unlocked state (full profile visible after payment)
Verify: Match cards display correctly, locked/unlocked states work

Phase 7: Paystack Integration
- Create /src/lib/paystack.ts — Paystack popup initialization using VITE_PAYSTACK_PUBLIC_KEY
- Add "Unlock Matches" button that opens Paystack popup
- On successful payment, call the verify Edge Function for immediate UI unlock
- Create the Paystack webhook Edge Function at /supabase/functions/paystack-webhook/index.ts
Verify: Payment popup opens, MoMo payment completes, profile unlocks, webhook updates database

Phase 8: Messaging
- Go to /archive-version-one/app/dashboard/messages/
- Recreate message list and chat view
- Implement real-time messaging using Supabase Realtime subscriptions
- Implement message status tracking (PENDING → SENT → DELIVERED → READ)
Verify: Two browser tabs can send and receive messages in real-time

Phase 9: PWA Configuration
- Configure vite-plugin-pwa in vite.config.ts
- Create public/manifest.json with app name, colours, icons
- Add 192px and 512px icons to public/icons/
Verify: Browser shows "Install App" prompt, app installs to home screen

Phase 10: Final Polish & Deployment
- Add all remaining pages (Privacy, Terms, Settings, Help)
- Test the complete user flow end-to-end on localhost:5173
- Push to GitHub, verify Cloudflare Pages build succeeds
- Test the complete flow on the live Cloudflare Pages URL
- Connect custom domain

CRITICAL NEXT.JS → REACT CONVERSION CHEATSHEET
When migrating ANY component from /archive-version-one/, apply these transformations:

Next.js Pattern	React (Vite) Equivalent
import Link from 'next/link'	import { Link } from 'react-router-dom'
<Link href="/dashboard">	<Link to="/dashboard">
import Image from 'next/image'	Use <img src="..." alt="..." />
import { useRouter } from 'next/navigation'	import { useNavigate } from 'react-router-dom'
router.push('/dashboard')	navigate('/dashboard')
process.env.NEXT_PUBLIC_SUPABASE_URL	import.meta.env.VITE_SUPABASE_URL
"use client"	Delete it entirely
"use server"	Delete it — move logic to Supabase Edge Function
import 'server-only'	Delete it entirely
import { cookies } from 'next/headers'	Delete it — use Supabase browser client
import { redirect } from 'next/navigation'	useNavigate() from react-router-dom
export const runtime = 'edge'	Delete it entirely
next.config.js	vite.config.ts
next-pwa	vite-plugin-pwa

ENVIRONMENT VARIABLES TEMPLATE
Create a .env file in the project root with EXACTLY these variable names:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your-public-key

These are the ONLY variables that go in .env. The Paystack secret key and Supabase service role key go in Supabase Edge Function secrets (set via Supabase CLI or dashboard), NEVER in this file.

WHAT TO READ FIRST
Before writing any code, read these files in this order:
1. /docs/architecture-v2.md — The updated architecture document (in this same repo)
2. /archive-version-one/app/page.tsx — The landing page (first component to migrate)
3. /archive-version-one/middleware.ts — Understand what the old middleware did so you can replicate it as a React route guard
4. /archive-version-one/app/dashboard/page.tsx — The dashboard (second component to migrate)

Start with Phase 0. Do not skip ahead. Confirm the base setup works before writing any application code.
