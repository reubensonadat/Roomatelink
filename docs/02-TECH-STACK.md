# 02 - Technical Stack & Constraints

## 🧱 The Ironclad Stack

Roommate Link is built on a specific, non-negotiable tech stack designed for speed, security, and zero-maintenance hosting.

---

## ⛔ Forbidden Technologies

To maintain architectural integrity, the following technologies are **STRICTLY BANNED**:

- **Next.js / Server Components:** Next.js was abandoned due to Cloudflare Edge compatibility issues.
- **Global State Libraries:** No Redux, Zustand, or MobX.
- **Data Fetching Libraries:** No React Query / TanStack Query.
- **Node.js Servers:** The application must run as a static set of files. Any server-side logic must reside in **Supabase Edge Functions**.

---

## 📦 Frontend Stack

### Framework & Build
- **React 18+ (Vite)** - Latest stable React with TypeScript support
- **Vite** - Lightning-fast HMR, optimized production builds
- **TypeScript** - Full type safety across the codebase

### Routing
- **React Router v6** - Client-side routing with `<Route path="..." element={...} />` in App.tsx

### Styling & UI
- **Tailwind CSS** - Utility-first, consistent with Indigo/Violet design system
- **Framer Motion** - Production-grade animations with weighted springs
- **Lucide React** - Consistent icon set
- **Sonner** - Toast notifications

### PWA Configuration
- **vite-plugin-pwa** - Service worker, offline caching, home screen installation
- **InstallPrompt Component** - High-fidelity native install experience

---

## ⚙️ Backend as a Service

### Database
- **Supabase PostgreSQL** - Relational queries essential for compatibility algorithm
- **RLS (Row Level Security)** - Database-level access control via Row Level Security Policies

### Authentication
- **Supabase Auth** - Built-in email verification, Google OAuth, JWT session management
- **Synchronous Bootloader** - Reads localStorage before React mounts for instant UI (<100ms cold start)
- **Optimistic Hydration** - Pre-fills React state with cached session and profile data
- **Background Validation** - Non-blocking session verification after UI renders
- **Token Expiration Check** - 60-second buffer prevents FOUC (flash of unauthenticated content)
- **Mobile TCP Half-Open Mitigation** - 8-second timeout with AbortController
- **Second Chance Auto-Retry** - Automatic retry on fresh TCP connection
- **Phantom Login Prevention** - URL hash stripping after Supabase processes OAuth callback
- **20-Second Safety Timeout** - Forces loading states to complete if network hangs
- **Optimistic Wallet Updates** - `updateProfile()` bypasses 10-minute throttle for instant UI feedback

### Real-time Chat
- **Supabase Realtime WebSockets** - Native database integration
- **Lazy WebSocket Architecture** - HTTP first, then WebSocket in background
- **Cold Start Handoff** - Messages appear immediately via HTTP, WebSocket connects in background
- **Walkie-Talkie Reconnect** - "Tap to Reconnect" button when WebSocket dies
- **HTTP Fallback** - Use HTTP insert when disconnected
- **Typing Indicators** - Real-time typing status for both users
- **Message Pagination** - "Load more" functionality for large chat histories
- **App Visibility Tracking** - Foreground delta sync on PWA wake-up

### Matching Algorithm
- **Supabase Edge Function (Deno)** - Triggered on questionnaire completion
- **Bouncer & Judge Architecture** - PostgreSQL query filters users BEFORE math runs
- **Judge** - Pure TypeScript logic calculates compatibility
- **Scalability** - Database-level filtering eliminates incompatible candidates
- **Consistency Detection** - Cross-category pattern analysis with 4 flags
- **Category Scores** - Detailed breakdown for compatibility display
- **60-Day Fresh User Filter** - Only matches with active users created in last 60 days
- **Gender Preference Filter** - Applied at database level before algorithm runs

### Payment Webhook
- **Supabase Edge Function** - Verifies Paystack signature via Web Crypto API
- **Updates Database** - Sets `has_paid` and `payment_date` on success
- **Promo Code Support** - Validates JCR/Club codes via metadata
- **Manual Verification** - GET endpoint for admin verification
- **Payment Fallback** - 8-second countdown with manual retry option

### Student Verification
- **Supabase Edge Function** - Secure 2-step verification using Resend OTP
- **Beast Mode Security** - Manual JWT verification bypasses strict NTP gateway
- **Domain Whitelisting** - Only supports `@stu.ucc.edu.gh` domains
- **OTP System** - 6-digit codes with 10-minute expiry
- **University Domains Table** - Stores whitelisted domains and university names

---

## 📨 Communication Services

### Email
- **Resend** - Transactional email service for student verification
- **Purpose:** Send OTP codes for secure student email verification

### Push Notifications
- **Firebase Cloud Messaging (FCM)** - Free, works when app is closed
- **Purpose:** Match notifications and engagement updates

---

## 🎨 State Management Philosophy

We rely on the **Holy Trinity of React Hooks** to manage complexity without external dependencies:

### 1. Context + useState
- **AuthContext** - Global authentication state (user, session, profile, loading states)
- **Derived State** - `isPaid` calculated from `profile.has_paid || profile.is_pioneer`
- **Optimistic Updates** - `updateProfile()` bypasses 10-minute throttle for instant UI feedback

### 2. Derived State
- **useMemo** - Computed values that never need manual mutation
- **Examples:** `isProfileComplete`, `hasPaid`, `getLandingRoute()`

### 3. useRef (The Performance Savior)
- **Purpose:** Store values that update frequently but don't need to trigger re-renders
- **Use Cases:** Last Activity timestamps, background timers, typing indicators
- **Why:** Using `useState` for these would cause entire AuthProvider to re-render, tearing down background timers (like session heartbeats). `useRef` allows these to update silently.

---

## ⚙️ Backend Logic: Supabase Edge Functions

All sensitive operations (Payments, Signature Verification) are handled by **Deno-based** Edge Functions.

### Deno Constraints
Developers must remember that Edge Functions run in the Deno environment, not Node.js:
- **No Node `crypto`** - Use standardized `Web Crypto API` (e.g., `crypto.subtle.sign`).
- **No Local Filesystem** - All data must be fetched via HTTP or Supabase client.
- **Strict Typing:** All function inputs/outputs must use shared interfaces in `src/types/database.ts`.

---

## 📦 PWA Architecture

The app is configured via `vite-plugin-pwa`:

### Strategy
- **`generateSW`** - Automatic Service Worker generation
- **Prompting:** The `InstallPrompt.tsx` component handles high-fidelity native install experience

### Features
- **Zero download friction** - A student clicks a link from SRC campus guide and lands directly inside the application
- **Cross-device access** - Works identically on mobile phones, tablets, and laptops
- **Installable to home screen** - After first visit, browser prompts installation
- **Full-screen mode** - App icon, offline capability for cached screens

---

## 🎨 Design System

### Color Palette
- **Primary Brand:** Indigo 600 — `#4f46e5` (Primary actions, CTA buttons, headings)
- **Secondary Accent:** Violet 500 — `#8b5cf6` (Match percentage badges, premium UI elements)
- **Background:** Slate 50 — `#f8fafc` (Clean, distraction-free reading surface)
- **Surface:** White — `#ffffff` (Questionnaire cards, chat bubbles, profile cards)
- **Paywall / Lock:** Amber 500 — `#f59e0b` (Premium locked content indicators)
- **Danger / Alert:** Red 600 — `#dc2626` (Dealbreaker flags, suspension notices)
- **Success:** Emerald 600 — `#059669` (High compatibility scores, confirmed matches)

### Typography
- **Font Family:** Inter - Clean, legible for long questionnaires and reading-heavy screens
- **Display:** Bold Inter at 32-40px for match percentage badges and key metrics
- **Body:** Regular Inter at 14-16px for questionnaire options and profile bios
- **Captions:** Medium Inter at 12px for timestamps, metadata, category labels

### Avatar System
- **10 Preset Avatars** - 5 male, 5 female options
- **Purpose:** Privacy-first personality expression
- **Design:** Personality-expressive vector illustrations (not generic)
- **Storage:** Served from public/avatars/ directory

---

## 🧱 Hosting & Deployment

### Frontend
- **Cloudflare Pages** - Static site hosting, deploys React/Vite build in seconds
- **Build Process:** `npm run build` generates optimized static assets
- **Zero Configuration:** No build configuration needed

### Backend
- **Supabase Edge Functions** - Serverless Deno, triggered by frontend calls and DB webhooks
- **Deployment:** Automatic via Supabase CLI or dashboard

---

## 🚀 Performance Patterns

To maintain "Boutique" high-fidelity feel without the overhead of massive state libraries:

### The useRef Rule
Frequent updates that do not impact layout (e.g., Last Activity timestamps, background timers) **MUST** be stored in `useRef` rather than `useState`. This prevents unnecessary component re-renders that would otherwise tear down and rebuild global providers.

### maybeSingle() over single()
When fetching profiles during onboarding, we always use `.maybeSingle()` to prevent 406 "Not Acceptable" errors from breaking the initialization flow when a profile record does not yet exist.

### Proactive Error Hard-Cap
All global loading states (Auth, Dashboard) have a 6-second hard-coded failsafe. If network hangs, the app forces a transition to error state or becomes interactive with cached data rather than hanging indefinitely.

### Debouncing
Used for localStorage writes and typing indicators to prevent excessive operations.

### Exponential Backoff
Used for retries (2x multiplier) in profile uploads and match calculation.

---

## 📊 Data Flow Architecture

### Authentication Flow
1. **Cold Start:** Synchronous bootloader reads localStorage (<100ms)
2. **Optimistic Hydration:** UI renders with cached data
3. **Background Validation:** `getSession()` validates token non-blocking
4. **Session Management:** `onAuthStateChange` listener is single source of truth
5. **Token Refresh:** Automatic via Supabase Auth (handled internally)
6. **Expiry Handling:** 60-second buffer prevents FOUC

### Matching Flow
1. **Questionnaire:** 40 questions across 10 categories
2. **Submission:** Auto-resubmit interrupted submissions (PWA scenario)
3. **Calculation:** Edge Function triggered on completion
4. **Results:** Matches inserted into database
5. **Notification:** Push notification for new compatible users

### Payment Flow
1. **Initiation:** Paystack popup with PUBLIC key only
2. **Verification:** Webhook verifies signature via Web Crypto API
3. **Confirmation:** Updates `has_paid` and `payment_date` in database
4. **Discount Codes:** JCR/Club codes validated via metadata
5. **Fallback:** 8-second countdown with manual retry option

### Chat Flow
1. **Cold Start:** HTTP fetch shows messages immediately
2. **WebSocket:** Opens in background for live updates
3. **Reconnection:** "Tap to Reconnect" button for dead connections
4. **HTTP Fallback:** Messages save via HTTP when disconnected

---

## 🔒 Security Architecture

### Authentication Security
- **JWT Session Management:** Supabase Auth handles token refresh automatically
- **Token Expiration Check:** 60-second buffer for cold start (prevents FOUC)
- **Web Crypto API:** Paystack webhook signature verification
- **Domain Whitelisting:** Student email verification only supports UCC domains
- **OTP System:** 6-digit codes with 10-minute expiry via Resend
- **Data Security:** RLS policies on all tables
- **Service Role Key:** Admin access for sensitive operations
- **Edge Function Security:** Deno runtime with no filesystem access

---

## 📋 Cost Analysis

### Infrastructure Costs at Launch
- **Supabase Free Tier:** Up to 50,000 monthly active users, 500MB database, 1GB storage
- **Cloudflare Pages:** Free tier sufficient for initial load
- **Resend:** Pay-as-you-go for transactional emails
- **Firebase FCM:** Completely free at any scale
- **Total Infrastructure Cost:** GHS 0 at launch

### Upgrade Triggers
- **Supabase Pro:** $25/month when database exceeds 500MB or users exceed 50,000
- **At 5,000 UCC users:** This threshold will not be reached in Year 1

---

## 🎯 Technology Rationale

### Why React + Vite over Next.js
- **Cloudflare Compatibility:** Next.js App Router doesn't work with Cloudflare Edge
- **Build Speed:** Vite builds are significantly faster than Next.js
- **Simplicity:** No server-side rendering complexity
- **Deployment Speed:** Static files deploy in seconds vs. minutes

### Why Supabase over Custom Backend
- **Built-in Auth:** Email verification, OAuth, JWT management included
- **Real-time:** Native WebSocket support included
- **Edge Functions:** Serverless, auto-scaling, no server management
- **RLS:** Row-level security policies included
- **Cost:** Generous free tier for launch

---

## 📚 Documentation Status

### Core Documentation
✅ [`01-VISION.md`](01-VISION.md) - Product vision and core principles
✅ [`02-TECH-STACK.md`](02-TECH-STACK.md) - This document (updated)
✅ [`03-AUTH-LIFECYCLE.md`](03-AUTH-LIFECYCLE.md) - Authentication lifecycle (updated with cold start fix)
✅ [`04-DATA-MODEL-RLS.md`](04-DATA-MODEL-RLS.md) - Database schema and RLS
✅ [`05-MATCHING-ENGINE.md`](05-MATCHING-ENGINE.md) - Matching algorithm
✅ [`06-REALTIME-CHAT.md`](06-REALTIME-CHAT.md) - Real-time chat architecture
✅ [`07-PAYMENT-FLOW.md`](07-PAYMENT-FLOW.md) - Payment integration
✅ [`08-BOUTIQUE-UI.md`](08-BOUTIQUE-UI.md) - Design system and patterns
✅ [`09-DEPLOYMENT.md`](09-DEPLOYMENT.md) - Deployment guide

### Diagnostic Reports
✅ [`AUTH_DIAGNOSTIC_REPORT.md`](AUTH_DIAGNOSTIC_REPORT.md) - Authentication issues (marked resolved)
✅ [`COLD_START_DIAGNOSTIC_REPORT.md`](COLD_START_DIAGNOSTIC_REPORT.md) - Cold start performance analysis
✅ [`CODEBASE_ANALYSIS_REPORT.md`](CODEBASE_ANALYSIS_REPORT.md) - Comprehensive codebase analysis (this document)

### Archived Documentation
- Historical documentation in [`docs/archive/`](docs/archive/) - Previous architecture iterations and decisions

---

**Last Updated:** 2025-04-17  
**Status:** Production-ready with comprehensive cold start optimization and complete documentation audit
