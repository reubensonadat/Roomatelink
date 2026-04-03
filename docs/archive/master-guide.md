# THE MASTER GUIDE — Building for Cloudflare Pages
## A Senior Developer's Playbook for Choosing Stacks, Avoiding Traps, and Shipping Fast

**Version 1.0 — Written after 30+ failed builds and one existential crisis.**
**Rule: If this guide says don't do it, don't do it. I learned the hard way so you don't have to.**

---

## PART 1: THE STACK DECISION MATRIX

Before you write a single line of code for any project, answer this question:

### "Does this project need Google to find it?"

If **YES** (marketing site, blog, e-commerce store, public portfolio):
→ You need Server-Side Rendering (SSR) for SEO
→ **Use Next.js on Vercel** — Vercel created Next.js, they handle SSR perfectly, zero config
→ Do NOT put this on Cloudflare Pages unless you use Cloudflare's specific SSR solutions

If **NO** (dashboard, SaaS app, tool behind a login, matchmaking platform, internal tool):
→ SEO is irrelevant because Google can't index pages behind authentication anyway
→ **Use React (Vite) on Cloudflare Pages** — Bulletproof, instant deploys, zero runtime headaches
→ Backend goes in Supabase Edge Functions or Cloudflare Workers

### "Does this project need a backend?"

If **NO** (static site, simple form, content that goes to a Google Sheet or Supabase directly):
→ Pure React (Vite) on Cloudflare Pages
→ No backend at all
→ Supabase handles auth + database from the browser

If **YES** but the backend needs are small (1-3 endpoints, webhooks, simple calculations):
→ **Supabase Edge Functions** — They live inside your database, zero infrastructure management
→ See Part 3 of this guide for when to choose this

If **YES** and the backend is a massive standalone API (public API, multi-tenant SaaS, complex routing):
→ **Cloudflare Workers with Hono.js** — Separate repository, massive scale, full control
→ See Part 3 of this guide for when to choose this

---

## PART 2: THE FRONTEND VS BACKEND BOUNDARY

This is the most important concept in modern web development. Memorize it.

### The Golden Rule
**"Does this code require a secret API key or password that I would be fired for tweeting?"**

If **YES** → It goes on a SERVER (Supabase Edge Function or Cloudflare Worker)
If **NO** → It goes in the FRONTEND (React browser code)

### What Belongs in the FRONTEND (React / Browser)

| Feature | How | Why It's Safe |
|---------|-----|---------------|
| User signup/login/logout | Supabase Auth browser client | Supabase handles security, RLS protects data |
| Google OAuth | Supabase Auth browser client | Redirects through Supabase's secure flow |
| Fetching user's own profile | Supabase browser client with RLS | RLS ensures user can only read their own row |
| Updating user's own bio | Supabase browser client with RLS | RLS ensures user can only update their own row |
| Viewing public data | Supabase browser client | Public by definition |
| Opening a payment popup | Paystack JS with PUBLIC key | Public key can only open a popup, cannot process transactions |
| UI state, routing, animations | React state, React Router | Runs entirely in the browser |
| Reading matches | Supabase browser client with RLS | RLS ensures user only sees their own matches |

### What BELONGS on a SERVER (Edge Function / Worker)

| Feature | Why It MUST Be Server-Side |
|---------|--------------------------|
| Paystack webhook verification | Requires SECRET key to verify payment signature |
| Stripe webhook verification | Requires SECRET key |
| Sending emails (Resend, SendGrid) | Requires email API secret key |
| The matching algorithm (Roommate Link) | Heavy CPU computation freezes the user's browser if run client-side. Also, you need SERVICE_ROLE key to read all users' answers which bypasses RLS. |
| Generating PDF receipts | CPU-heavy, needs secret API keys for PDF services |
| Scheduled tasks (cron jobs) | Frontend can't run code when nobody is visiting the site |
| Admin operations (ban user, delete account) | Needs SERVICE_ROLE key to bypass RLS |
| Rate limiting | Needs server-side state tracking |

### The Supabase RLS Cheat Code
Row Level Security (RLS) is the reason you can do 80% of your app on the frontend. When you enable RLS on a table and write policies like `auth.uid() = user_id`, you guarantee that even if a hacker opens Chrome DevTools and manually calls `supabase.from('users').select('*')`, they will ONLY ever see their own row. The database enforces security, not the frontend.

**This means:** For any operation where the user is only reading or modifying THEIR OWN data, you do NOT need a backend. The frontend + RLS is enough.

---

## PART 3: SUPABASE EDGE FUNCTIONS vs CLOUDFLARE WORKERS vs CLOUDFLARE PAGES FUNCTIONS

These three things cause maximum confusion. Here is the definitive breakdown.

### Supabase Edge Functions
**What they are:** Tiny serverless functions written in Deno/TypeScript, hosted INSIDE your Supabase project, physically located next to your database.

**When to use them:**
- ✅ Paystack/Stripe webhook verification (needs secret key + immediate DB update)
- ✅ The matching algorithm (needs to read all users' answers with SERVICE_ROLE key)
- ✅ Sending emails after a database event
- ✅ Any backend logic that immediately reads/writes to Supabase
- ✅ Database triggers (functions that fire automatically when a row is inserted)

**When NOT to use them:**
- ❌ Building a public API with many routes and complex routing logic
- ❌ When you need to store large server-side state (sessions, caches)
- ❌ When your backend is completely separate from Supabase

**Limits:** 150-second execution time, 9MB memory. More than enough for webhooks and algorithms.
**How to deploy:** `supabase functions deploy match-calculate`
**Local testing:** `supabase functions serve match-calculate` (requires Supabase CLI installed)

---

### Cloudflare Workers
**What they are:** Standalone edge functions running on Cloudflare's global network. Completely separate from your frontend and your database. Built with Hono.js (a micro-framework that looks like Express).

**When to use them:**
- ✅ Building a large, standalone API with many routes
- ✅ When multiple frontends need to share one backend
- ✅ When you need advanced caching, custom routing, or request interception
- ✅ When you are NOT using Supabase (e.g., using PlanetScale, Neon, or a REST API)
- ✅ Image manipulation, PDF generation, or heavy data transformation at the edge

**When NOT to use them:**
- ❌ When your only backend needs are 1-2 webhooks (overkill)
- ❌ When you are using Supabase (Supabase Edge Functions are simpler)
- ❌ When you want everything in one project (Workers are a separate repo/deployment)

**Limits:** 10ms CPU time (free), 50ms CPU time (paid $5/month Bundled plan), 30 seconds (paid Unbound plan). This is REAL CPU time, not wall clock time.

**The CPU Trap:** If your code does heavy loops or complex math, 10ms CPU can be exhausted in what feels like milliseconds of real time. The matching algorithm from Roommate Link (200 lines of math comparing 5,000 users) takes roughly 50-100ms CPU time. This means it CANNOT run on Cloudflare Workers free tier. It CAN run on Supabase Edge Functions (150s limit) or on the Cloudflare Workers paid Unbound plan.

---

### Cloudflare Pages Functions
**What they are:** Cloudflare Workers that are AUTO-MAGICALLY created from files in your frontend project. If you create a `/functions` folder in your React/Vite project and add an `api.ts` file, Cloudflare turns it into a backend route when you deploy.

**When to use them:**
- ✅ When you want frontend and backend in ONE repository and ONE deployment
- ✅ When your backend is very small (2-3 simple endpoints)
- ✅ When you are NOT using Supabase (if you use Supabase, use Supabase Edge Functions instead)

**When NOT to use them:**
- ❌ When you are using Supabase (redundant — use Supabase Edge Functions)
- ❌ When you need complex routing (use Cloudflare Workers + Hono instead)
- ❌ When you want to keep frontend and backend as separate deployments

---

### THE DECISION FLOWCHART

Does this project use Supabase?
├── YES → Does it need backend logic (webhooks, algorithms, emails)?
│   ├── YES → Use Supabase Edge Functions
│   └── NO → Pure React frontend, no backend needed
│
└── NO → Is the backend a large standalone API?
    ├── YES → Use Cloudflare Workers + Hono.js (separate repo)
    └── NO → Use Cloudflare Pages Functions (in same repo as frontend)


**For Roommate Link specifically:** Supabase Edge Functions. Always. No debate.

---

## PART 4: CLOUDFLARE RESTRICTIONS — WHAT YOU CANNOT DO

When you commit to Cloudflare Pages as your deployment platform, you accept these restrictions. This is not a flaw — it is the trade-off for 0ms cold starts and infinite free scaling.

### ❌ CANNOT Use Node.js APIs
- `const crypto = require('crypto')` → Fails. Use `crypto.subtle` (Web Crypto API)
- `const fs = require('fs')` → Fails. No file system access.
- `const path = require('path')` → Fails. No path resolution.
- `const http = require('http')` → Fails. Use `fetch()` instead.
- `process.env` in production → Only works in Vite with `VITE_` prefix for frontend. For Edge Functions/Workers, use the platform's env binding system.

### ❌ CANNOT Run Heavy CPU Work on Free Tier
- Cloudflare Workers free tier: 10ms CPU time per request
- If your code loops through 10,000+ items doing math, it will be killed
- Solution: Move heavy computation to Supabase (Postgres functions or Edge Functions with 150s limit)

### ❌ CANNOT Use npm Packages That Depend on Node Internals
- Many popular npm packages assume they're running in Node.js
- If a package uses `require('crypto')`, `require('fs')`, or native C++ bindings under the hood, it will crash on Cloudflare
- Before installing any package, check its documentation for "Edge Runtime compatible" or "works in Cloudflare Workers"
- Packages that ARE safe: `@supabase/supabase-js`, `hono`, `zod`, `jsonwebtoken` (some versions)

### ✅ CAN Use Web Standard APIs
- `fetch()` — Standard HTTP requests
- `crypto.subtle` — Hashing, HMAC, signatures
- `Request`, `Response`, `Headers` — Standard web objects
- `WebSocket` — Real-time connections
- `URL`, `URLSearchParams` — URL manipulation
- `TextEncoder`, `TextDecoder` — Encoding
- `setTimeout`, `setInterval` — Timers (with limits)

---

## PART 5: THE ENVIRONMENT VARIABLE TRAP

This is the #1 mistake developers make when moving from Next.js to Vite.

### Next.js Pattern (DO NOT USE IN VITE)
```javascript
// .env
NEXT_PUBLIC_SUPABASE_URL=https://...

// code
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
```

### Vite Pattern (CORRECT)
```javascript
// .env
VITE_SUPABASE_URL=https://...

// code
const url = import.meta.env.VITE_SUPABASE_URL
```

### The Rules
1. Frontend variables MUST start with VITE_ — If you name it SUPABASE_URL without the prefix, Vite will NOT expose it to the browser and it will be undefined
2. Access with import.meta.env — NOT process.env
3. Secret keys NEVER get a VITE_ prefix — If you add VITE_PAYSTACK_SECRET_KEY to your .env file, it WILL be embedded in your JavaScript bundle and ANYONE can steal it
4. Secret keys go in the hosting platform's dashboard — Cloudflare Workers: Settings > Variables. Supabase Edge Functions: Supabase Dashboard > Edge Functions > Secrets, or supabase secrets set PAYSTACK_SECRET_KEY=sk_...

### The "Am I Doing This Right?" Test
Open your deployed site in Chrome. Right-click → Inspect → Sources tab → Find your assets/main-xxxx.js file. Search for sk_live or sk_test. If you find a Paystack secret key, your app is compromised. If you find nothing, you did it right.

---

## PART 6: THE ROUTING TRAP
Next.js gives you file-based routing for free:
app/dashboard/page.tsx → automatically becomes /dashboard

React (Vite) does NOT:
You must install react-router-dom and configure routes manually:

```javascript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './guards/ProtectedRoute'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

### Dynamic Routes
- Next.js: `app/dashboard/messages/[id]/page.tsx`
- React Router: `<Route path="/dashboard/messages/:id" element={<ChatView />} />`
- Access the ID: `const { id } = useParams()`

---

## PART 7: THE AUTHENTICATION TRAP (Decoupled Architecture)
In Next.js, you probably used middleware.ts to check if a user is logged in before rendering a page. In pure React, there is no middleware. Here is how you replicate it:

### The ProtectedRoute Component
```javascript
// /src/guards/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/auth" />

  return children
}
```

### When Your Edge Function Needs to Know WHO the User Is
The frontend must send the user's JWT token in the request header:
```javascript
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('https://your-project.supabase.co/functions/v1/some-function', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`  // THIS IS CRITICAL
  },
  body: JSON.stringify({ someData: 'value' })
})
```

Inside the Edge Function, you verify the token:
```javascript
// Inside the Edge Function
const authHeader = req.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
  global: { headers: { Authorization: `Bearer ${token}` } }
})

const { data } = await supabase.from('users').select('*').single()
```

---

## PART 8: THE PAYSTACK INTEGRATION PATTERN
Follow this exact pattern for Paystack on Cloudflare + Supabase.

### Step 1: Frontend — Open Payment Popup
```javascript
import PaystackPop from '@paystack/inline-js'

function PayButton({ email, amount, onSuccess }) {
  const pay = () => {
    PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,  // PUBLIC KEY ONLY
      email: email,
      amount: amount * 100,
      onSuccess: (reference) => {
        onSuccess(reference.reference)
      },
    }).openIframe()
  }

  return <button onClick={pay}>Pay GHS 25</button>
}
```

### Step 2: Supabase Edge Function — Verify Webhook
```javascript
// supabase/functions/paystack-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')!
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')!

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const computedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = Array.from(new Uint8Array(computedSig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expectedSig !== signature) return new Response('Invalid signature', { status: 401 })

  const event = JSON.parse(body)
  if (event.event === 'charge.success') {
    await supabase.from('users').update({ has_paid: true, payment_date: new Date().toISOString() }).eq('email', event.data.customer.email)
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

---

## PART 9: WHERE HEAVY ALGORITHMS BELONG
- Cloudflare Workers (free tier): 10ms CPU time
- Supabase Edge Functions: 150 seconds CPU time
- Your user's phone browser: Will freeze if you run a 5-second algorithm

**Roommate Link's Matching Algorithm:**
- Pure TypeScript math, zero external dependencies
- ~100ms CPU for 5,000 users
- **Placement:** Supabase Edge Function ✅

---

## PART 10: RATE LIMITING ON CLOUDFLARE
- **Frontend:** Cloudflare's CDN handles it.
- **Supabase Edge Functions:** Implement yourself (Upstash Redis or DB tracking).
- **Cloudflare Workers:** Built-in Rate Limiting API.

---

## PART 11: SEO — WHEN IT MATTERS AND WHEN IT DOESN'T
- **Use React/Vite:** Dashboards, SaaS, Matchmaking (Roommate Link), PWAs.
- **Use Next.js on Vercel:** Marketing landing pages, Blogs, E-commerce, Public portfolios.

---

## PART 12: THE MISTAKES SECTION — LESSONS LEARNED
1. Not Deploying on Day 1
2. Using Next.js on Cloudflare Pages
3. Using a Deprecated Adapter Without Knowing
4. Using Next.js 16 Without Reading the Changelog
5. Putting Secret Keys in Frontend Environment Variables
6. Building a Full Backend When Supabase Could Handle It
7. Not Separating the Matching Algorithm Early
8. Using AI to Fix Infrastructure Problems

---

## PART 13: QUICK REFERENCE — YOUR DEFAULT STACK
### Personal SaaS / Dashboard / Tool
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Routing:** React Router v6
- **Auth:** Supabase Auth
- **Database:** Supabase PostgreSQL with RLS
- **Backend:** Supabase Edge Functions
- **Hosting:** Cloudflare Pages

### Client Marketing Website
- **Frontend:** Next.js
- **Hosting:** Vercel

"Build for your deployment platform, not against it."
