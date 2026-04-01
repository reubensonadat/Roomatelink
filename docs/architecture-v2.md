# 📘 The RoommateLink Master Playbook
*Architecting for Sanity, Security, and Infinite Scale*
*Version 1.1 — The Post-Next.js Era*

## 🗄️ Database Schema (The Source of Truth)

All logic must align with the current Supabase/PostgreSQL schema:

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  gender text CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  course text,
  level integer CHECK (level IN (100, 200, 300, 400, 500, 600)),
  has_paid boolean DEFAULT false,
  is_student_verified boolean DEFAULT false,
  is_pioneer boolean DEFAULT false,
  university_id uuid REFERENCES public.university_domains(id)
);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid REFERENCES public.users(id),
  user_b_id uuid REFERENCES public.users(id),
  match_percentage integer NOT NULL,
  category_scores jsonb DEFAULT '[]'::jsonb,
  cross_category_flags jsonb DEFAULT '[]'::jsonb,
  calculated_at timestamptz DEFAULT now()
);
```

## 🏗️ PART 1: The Golden Stack Architecture
You are officially migrating away from monolithic, server-dependent frameworks (Next.js) to a decoupled, Edge-native architecture. 

1. **The Frontend (React + Vite)**: Lives on Cloudflare Pages. It is UI/State only.
2. **The Backend (Supabase Edge Functions + Deno)**: Handles intensive logic and secure APIs (Paystack).

## 🤖 PART 2: Controlling the AI (The "Anti-Laziness" Protocol)
AI agents suffer from "Context Window Fatigue." To prevent features from being deleted, the following rules are MANDATORY:

### The 300-Line Component Mandate
- **Never allow a file to exceed 300 lines.**
- **For React**: Break large dashboards into `DashboardHeader.tsx`, `MatchFeed.tsx`, etc.
- **For Edge Functions**: Split into `types.ts`, `judge.ts`, and `index.ts`.

### 🛡️ Golden Prompt Enforcements (FOR AI AGENTS)
- You are forbidden from using placeholders like `// ... rest of code`.
- You must output the entire, complete file from the first import to the last export.
- If a file requires more than 300 lines, stop and ask the user for permission to break it into two files.

## ⚖️ PART 3: The "Bouncer & Judge" Scaling Strategy
How to match thousands of users without crashing the Edge Function.

1. **Step 1: The Bouncer (PostgreSQL Database Query)**: The database eliminates anyone who fails strict dealbreakers (Active status, Payment, Gender, Age) before math happens.
2. **Step 2: The Judge (TypeScript Logic)**: The Bouncer hands a small, qualified list (approx. 50) to the Edge Function (`judge.ts`) to run the complex behavioral matrix.

---

ROOMMATE LINK — Updated Architecture Document v2.0
React (Vite) + Supabase Edge Functions + Cloudflare Pages
Status: Architecture Revised — Next.js Abandoned
Date: March 2026
Reason for Revision: 30+ failed Cloudflare Pages builds caused by fundamental incompatibility between Next.js Node.js runtime and Cloudflare Edge Workers. Deprecated adapter (@cloudflare/next-on-pages), deprecated middleware convention in Next.js 16, and Edge CPU time limits made the original stack unmaintainable on Cloudflare.

WHAT CHANGED FROM v1.0
Only the following sections changed. Everything else — questionnaire design, matching algorithm math, database schema, business model, security model, ghost prevention, edge cases — remains identical to the v1.0 document. The full unchanged v1.0 document lives in /archive-version-one/docs/.

Sections UNCHANGED (refer to v1.0 document):
Section 1: Introduction & Vision
Section 2: Launch Strategy
Section 3.1: Colour Palette
Section 3.2: Typography
Section 3.4: Avatar System
Section 4.1: Onboarding (user flow unchanged, only implementation differs)
Section 5: The Questionnaire (all 40 questions unchanged)
Section 6: The Matching Algorithm (math unchanged, only WHERE it runs changed)
Section 7: Database Schema (unchanged)
Section 9: Business Model
Section 10: Security, Verification & Moderation
Section 11: Ghost User Prevention System
Section 12: Edge Cases & Failure Modes
Section 13: Optional Question Bank — V2 Roadmap
Appendix A: Compatibility Matrix

SECTION 3.3 — PWA Configuration (REWRITTEN)
Roommate Link is a Progressive Web Application (PWA) built with React (Vite) using the vite-plugin-pwa package. This replaces the previous next-pwa package.

• Zero download friction: A student clicks a link from the SRC campus guide and lands directly inside the application. No Play Store. No App Store. No install prompt before value delivery.
• Cross-device access: Works identically on mobile phones, tablets, and laptops.
• Installable to home screen: After first visit, the browser prompts installation. App icon, full-screen mode, offline capability for cached screens.
• Faster shipping: No app store review process. New versions deploy to Cloudflare Pages in under 30 seconds.
• PWA manifest (public/manifest.json) includes: app name, short name, theme colour (#4f46e5), background colour (#f8fafc), display mode standalone, icons at 192px and 512px.
• Service worker configured via vite.config.ts using VitePWA() plugin with registerType: 'autoUpdate'.

SECTION 4.2 — Match Calculation & Paywall (REWRITTEN)
Match Calculation Sequence
Immediately on questionnaire completion, the frontend calls a Supabase Edge Function (match-calculate). This replaces the old Next.js API Route.

The Edge Function:
1. Receives the new user's ID from the frontend
2. Fetches the new user's answers from questionnaire_responses
3. Fetches ALL active users' answers from questionnaire_responses
4. Runs calculateMatchesForUser() (pure TypeScript math, zero external dependencies)
5. Inserts visible matches into the matches table
6. Returns the top matches to the frontend

While this runs (typically 2-5 seconds), the user sees the animated sequence:
• "Analysing your sleep and study habits..."
• "Comparing conflict styles..."
• "Checking social compatibility..."
• "Mapping lifestyle expectations..."
• "Finalising your matches..."

WHY SUPABASE EDGE FUNCTION: The matching algorithm is pure math (Math.abs, array operations, object comparisons). It has ZERO Node.js dependencies. It runs perfectly in Deno (Supabase Edge Functions) because Deno supports standard JavaScript APIs. Running it inside Supabase also means zero network latency to the database — the function lives next to the data.

The Payment System (SPLIT ARCHITECTURE)
The payment system is now deliberately split between client-side and server-side:

Client-Side (React Frontend) — Transaction Initialization:
• Uses the react-paystack library OR the Paystack inline JS popup
• Only requires the Paystack PUBLIC key (pk_test_... or pk_live_...)
• Stored in environment variable VITE_PAYSTACK_PUBLIC_KEY
• Opens the Paystack popup so the user enters their MoMo details and pays
• On successful payment, the frontend calls /api/paystack/verify (NOW a Supabase Edge Function) with the transaction reference for immediate UI unlock

Server-Side (Supabase Edge Function) — Webhook Verification:
• Endpoint: supabase/functions/paystack-webhook/index.ts
• Receives Paystack's server-to-server webhook notification
• Verifies the signature using the Web Crypto API (crypto.subtle.sign with HMAC-SHA-512) — NOT Node's crypto module
• Uses the Paystack SECRET key stored securely in Supabase Edge Function secrets (PAYSTACK_SECRET_KEY)
• On valid signature: updates has_paid = true and payment_date = now() in the users table
• Returns 200 to Paystack

WHY THIS SPLIT IS NON-NEGOTIABLE: The public key is safe in the frontend — it can only open a payment popup, it cannot process transactions. The secret key MUST live on a server. If you put the secret key in the frontend, anyone can open Chrome DevTools, steal it, and fake successful payments to unlock accounts for free. The Supabase Edge Function keeps the secret key invisible to the browser.

Dual-Layer Verification Still Applies:
1. Frontend calls the verify Edge Function with the transaction reference for instant UI feedback
2. Paystack's background webhook guarantees the database updates even if the user's Wi-Fi drops mid-payment

SECTION 4.3 — Interaction & Chat (MINOR UPDATES)
Real-time chat powered by Supabase WebSockets — unchanged from v1.0.

• Only paid users can initiate or receive messages
• Message delivery via Firebase Cloud Messaging push notifications
• Message lifecycle (PENDING → SENT → DELIVERED → READ) tracked in the messages table
• No phone number or external contact exchange facilitated in the app

Implementation Change: The message status updates now happen via Supabase Realtime subscriptions in the React frontend, not through Next.js server actions. When a message is inserted, the sender subscribes to real-time updates on that message row to watch for read/delivery status changes.

SECTION 6.7 — Algorithm Trigger (REWRITTEN)
The matching algorithm fires via a Supabase Edge Function triggered by the frontend after questionnaire completion. There is no cron job.

Trigger Flow:
1. User answers Q40 → frontend shows celebration animation
2. Frontend calls supabase.functions.invoke('match-calculate', { body: { userId: user.id } })
3. Edge Function executes calculateMatchesForUser() against all active profiles
4. Results inserted into matches table
5. Frontend receives response and animates match cards appearing

Subsequent recalculations occur:
• When a new user completes their questionnaire — existing compatible users receive a push notification if the new user scores above their threshold
• When a user reactivates their profile after expiry

CRITICAL CODE CHANGE: The matching algorithm file (algorithm.ts) originally contained import 'server-only' at the top. This is a Next.js-specific import that MUST be removed for the Supabase Edge Function. The algorithm is pure TypeScript math with zero framework dependencies. It works identically in Deno.

SECTION 8 — Technology Stack (COMPLETE REWRITE)
Layer	Technology & Rationale
Frontend	React 18+ with Vite — Pure SPA, zero server dependency, instant Cloudflare Pages deployment
Routing	React Router v6 — Client-side routing with <Route path="..." element={...} /> in App.tsx
PWA	vite-plugin-pwa — Service worker, offline caching, home screen installation
Database	Supabase PostgreSQL — Relational queries essential for compatibility algorithm
Authentication	Supabase Auth — Built-in email verification, Google OAuth, JWT session management
Real-time Chat	Supabase Realtime WebSockets — Native database integration
Matching Algorithm	Pure TypeScript, executed inside Supabase Edge Function (Deno) — triggered on questionnaire completion
Payment Init (Client)	Paystack JS popup with PUBLIC key only — runs in the browser
Payment Webhook (Server)	Supabase Edge Function — Verifies signature via Web Crypto API, updates DB with SECRET key
Push Notifications	Firebase Cloud Messaging (FCM) — Free, works when app is closed
Styling	Tailwind CSS — Utility-first, consistent with Indigo/Violet design system
Hosting (Frontend)	Cloudflare Pages — Static site hosting, deploys React/Vite build in seconds
Hosting (Backend)	Supabase Edge Functions — Serverless Deno, triggered by frontend calls and DB webhooks
Avatar Assets	SVG vector illustrations — stored in Supabase Storage, served via CDN

What Was REMOVED:
❌ Next.js — Replaced by React (Vite)
❌ @cloudflare/next-on-pages — Deprecated adapter, no longer needed
❌ middleware.ts — Next.js convention, deprecated in v16. Replaced by React route guards
❌ All /api/ routes — Backend logic moved to Supabase Edge Functions
❌ next-pwa — Replaced by vite-plugin-pwa
❌ process.env.NEXT_PUBLIC_* — Replaced by import.meta.env.VITE_*
❌ import 'server-only' — Removed from algorithm file

PROJECT STRUCTURE (COMPLETE REWRITE)
/ — Project root
├── /src — React source code
│ ├── /components — Reusable UI components
│ │ ├── /ui — Buttons, cards, inputs, badges
│ │ ├── /questionnaire — Question card, progress bar
│ │ ├── /matches — Match card, compatibility breakdown
│ │ ├── /chat — Message bubble, chat list
│ │ └── /layout — Header, footer, sidebar, nav
│ ├── /pages — Route components (React Router)
│ │ ├── Landing.tsx
│ │ ├── Auth.tsx
│ │ ├── Onboarding.tsx
│ │ ├── Questionnaire.tsx
│ │ ├── Dashboard.tsx
│ │ ├── Profile.tsx
│ │ ├── Messages.tsx
│ │ ├── Privacy.tsx
│ │ └── Terms.tsx
│ ├── /lib — Core utilities
│ │ ├── supabase.ts — Browser Supabase client
│ │ ├── algorithm.ts — Matching algorithm (pure math)
│ │ └── paystack.ts — Paystack popup initialization
│ ├── /hooks — Custom React hooks
│ │ ├── useAuth.ts — Auth state hook
│ │ ├── useMatches.ts — Fetch matches hook
│ │ └── useMessages.ts — Real-time messages hook
│ ├── /context — React context providers
│ │ └── AuthContext.tsx — Auth state provider
│ ├── /guards — Route protection
│ │ └── ProtectedRoute.tsx — Redirects to /auth if not logged in
│ ├── App.tsx — React Router configuration
│ ├── main.tsx — Entry point
│ └── index.css — Tailwind directives
├── /public — Static assets
│ ├── manifest.json — PWA manifest
│ ├── icons/ — PWA icons (192px, 512px)
│ └── avatars/ — Preset avatar SVGs
├── /supabase — Supabase configuration
│ ├── /functions — Edge Functions (Deno/TypeScript)
│ │ ├── match-calculate/
│ │ │ └── index.ts — Matching algorithm trigger
│ │ └── paystack-webhook/
│ │ └── index.ts — Payment webhook verification
│ ├── /migrations — Database migration SQL files
│ └── config.toml — Supabase local dev config
├── /docs — Product architecture (this document)
├── /archive-version-one — ORIGINAL NEXT.JS CODEBASE (DO NOT MODIFY)
│ ├── /app — Old Next.js App Router
│ ├── /components — Old components (reference for migration)
│ ├── /middleware.ts — Old auth middleware (reference only)
│ └── ...
├── vite.config.ts — Vite + PWA plugin configuration
├── tailwind.config.js — Tailwind configuration
├── tsconfig.json — TypeScript configuration
├── package.json
└── .env — Frontend env vars (VITE_* prefix ONLY)

---

## APPENDIX B — Architecture Decision Log (UPDATED ENTRIES)

| Decision | Rejected Alternative & Reason for Choice |
|----------|----------------------------------------|
| React (Vite) instead of Next.js | **Rejected: Next.js on Cloudflare Pages.** Reason: `@cloudflare/next-on-pages` adapter deprecated with no migration path. Next.js 16 deprecated `middleware.ts` convention. All API routes required Edge Runtime which conflicted with Node.js crypto (Paystack), `server-only` imports (algorithm), and CPU time limits (matching). Vite produces static files that deploy to Cloudflare Pages in seconds with zero runtime conflicts. |
| Supabase Edge Functions instead of Cloudflare Workers | **Rejected: Cloudflare Workers with Hono.** Reason: Roommate Link's backend needs are minimal (1 webhook, 1 algorithm trigger). A standalone Cloudflare Worker API adds unnecessary infrastructure, a separate repository, and CORS configuration complexity. Supabase Edge Functions live next to the database, share TypeScript types, and require zero infrastructure management. If future projects need a massive standalone API, Cloudflare Workers + Hono becomes the right choice. |
| Web Crypto API instead of Node crypto | **Rejected: Node.js `crypto.createHmac`.** Reason: Cloudflare Edge and Deno do not support Node's `crypto` module. `crypto.subtle.sign()` with HMAC-SHA-512 is the browser-standard equivalent and works identically in both Supabase Edge Functions and Cloudflare Workers. |
| Matching Algorithm in Edge Function instead of Postgres RPC | **Rejected: plv8 PostgreSQL function.** Reason: The algorithm is 200 lines of pure TypeScript with typed interfaces (`MatchResult`, `CategoryBreakdown`, `PatternFlag`). Rewriting it in plv8 (JavaScript inside Postgres) would lose all type safety and make debugging extremely difficult. The algorithm runs in under 100ms for 5,000 users on Deno, well within Edge Function limits. Postgres RPC becomes the right choice if the user base exceeds 50,000. |
| React Router instead of Next.js file-based routing | **Rejected: Next.js App Router `page.tsx` convention.** Reason: File-based routing only works inside Next.js. Pure React requires explicit route configuration via `react-router-dom`. This is a one-time setup cost in `App.tsx` that eliminates all framework lock-in. |
| Route Guards instead of middleware.ts | **Rejected: Next.js `middleware.ts`.** Reason: Deprecated in Next.js 16 ("use proxy instead"). In React, a simple `<ProtectedRoute>` component wraps protected routes and checks `supabase.auth.getSession()`. Identical functionality, zero server dependency. |
| `import.meta.env.VITE_*` instead of `process.env.NEXT_PUBLIC_*` | **Rejected: `process.env`.** Reason: Vite does not use Webpack's `DefinePlugin`. Environment variables exposed to the browser MUST start with `VITE_` in Vite. Using `process.env` in a Vite project will return `undefined` and crash the app. |

---

**Status: Architecture v2.0 Approved & Locked**

"This is the same product. Same algorithm. Same questionnaire. Same database. Only the plumbing changed."
