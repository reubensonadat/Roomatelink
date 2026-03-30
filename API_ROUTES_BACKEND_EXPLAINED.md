# API Routes - Backend vs Frontend Explained

## The Short Answer

**API Routes run on the BACKEND.** Your logic stays on the server, not on the client.

---

## What This Means

### API Routes Run on the Server (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  - React components                                       │
│  - User interface                                         │
│  - Only sends requests, receives responses                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Request (POST /api/profile/update)
                       │ Body: { fullName, phone, course, ... }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVER (Cloudflare Pages)                       │
│  - API Route runs here                                     │
│  - Your logic runs here                                    │
│  - Database queries happen here                              │
│  - Environment variables accessible here                      │
│  - Secrets are safe here                                    │
│                                                           │
│  app/api/profile/update/route.ts:                          │
│    const supabase = await createClient()                    │
│    const { data } = await supabase.from('users')...       │
│    // YOUR BUSINESS LOGIC HERE                             │
│                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Response
                       │ Body: { success: true }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  - Receives response                                      │
│  - Shows success message                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Comparison: API Routes vs Server Actions

### Server Actions (What You Had Before)

```typescript
// lib/auth-actions.ts
'use server'  // ← This means "run on server"

export async function updateProfile(data: ProfileData) {
  const supabase = await createClient()
  // YOUR LOGIC RUNS HERE (SERVER)
  const { data } = await supabase.from('users').update({...})
  return { success: true }
}
```

**Where it runs:** SERVER (Node.js)
**Where it's called from:** CLIENT (React component)
**Can access:** Database, secrets, environment variables
**Client sees:** Only the return value, NOT the logic

---

### API Routes (What We're Converting To)

```typescript
// app/api/profile/update/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  // YOUR LOGIC RUNS HERE (SERVER)
  const { data } = await supabase.from('users').update({...})
  return NextResponse.json({ success: true })
}
```

**Where it runs:** SERVER (Cloudflare Pages Edge)
**Where it's called from:** CLIENT (React component via fetch)
**Can access:** Database, secrets, environment variables
**Client sees:** Only the response, NOT the logic

---

## The Key Point

### Both Server Actions and API Routes:

| Aspect | Server Actions | API Routes |
|---------|---------------|------------|
| **Run on** | Server | Server |
| **Access database?** | ✅ Yes | ✅ Yes |
| **Access secrets?** | ✅ Yes | ✅ Yes |
| **Access env vars?** | ✅ Yes | ✅ Yes |
| **Client sees logic?** | ❌ No | ❌ No |
| **Secure?** | ✅ Yes | ✅ Yes |
| **Works on Cloudflare?** | ❌ No | ✅ Yes |

### The ONLY Difference:

| Aspect | Server Actions | API Routes |
|---------|---------------|------------|
| **How it's called** | Direct function call | HTTP request (fetch) |
| **Works on Vercel?** | ✅ Yes | ✅ Yes |
| **Works on Cloudflare?** | ❌ No | ✅ Yes |

---

## Your Logic Stays on the Backend

### Example: Matching Algorithm

Your matching algorithm (`lib/matching-algorithm.ts`) is **business logic** that should run on the backend.

**With Server Actions (Before):**
```typescript
// lib/auth-actions.ts
'use server'
import { calculateMatch } from './matching-algorithm'

export async function generateMatches() {
  const supabase = await createClient()
  // ... get users ...
  
  // YOUR MATCHING LOGIC RUNS ON SERVER
  const matches = calculateMatch(currentUser, otherUsers)
  
  // ... save matches ...
  return { success: true }
}
```

**With API Routes (After):**
```typescript
// app/api/matches/generate/route.ts
import { calculateMatch } from '@/lib/matching-algorithm'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  // ... get users ...
  
  // YOUR MATCHING LOGIC STILL RUNS ON SERVER
  const matches = calculateMatch(currentUser, otherUsers)
  
  // ... save matches ...
  return NextResponse.json({ success: true })
}
```

**The matching algorithm file (`lib/matching-algorithm.ts`) doesn't change at all!**

---

## What the Client Sees

### Client Component (Frontend)

```typescript
// app/dashboard/profile/page.tsx
'use client'

const handleSave = async () => {
  // Client only sends data, doesn't see logic
  const response = await fetch('/api/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, phone, course })
  })
  
  const result = await response.json()
  // Client only receives: { success: true } or { error: "..." }
}
```

**What the client sees:**
- ✅ The data it sends
- ✅ The response it receives
- ❌ **NOT** the server-side logic
- ❌ **NOT** the database queries
- ❌ **NOT** the environment variables
- ❌ **NOT** the secrets

---

## Security: Your Logic is Protected

### What's Exposed to the Client

```javascript
// Client can see this (in browser DevTools)
fetch('/api/profile/update', {
  method: 'POST',
  body: JSON.stringify({ fullName: 'John', phone: '1234567890' })
})

// Client receives this
{ success: true }
```

### What's NOT Exposed to the Client

```typescript
// Server-side code - CLIENT CANNOT SEE THIS
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data } = await supabase
  .from('users')
  .update({
    full_name: body.fullName,
    phone_number: body.phone,
    // ... other fields
  })
  .eq('auth_id', user.id)

// Environment variables - CLIENT CANNOT SEE THIS
process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.NEXT_PUBLIC_SUPABASE_URL
```

---

## Real-World Example

### Your Matching Algorithm

**File: `lib/matching-algorithm.ts`**

```typescript
export function calculateMatch(user1: User, user2: User): number {
  // YOUR PROPRIETARY MATCHING LOGIC
  // This runs on the SERVER
  // Client CANNOT see this code
  
  let score = 0
  
  // Sleep preferences
  if (user1.sleep === user2.sleep) score += 20
  
  // Cleanliness
  if (Math.abs(user1.cleanliness - user2.cleanliness) <= 1) score += 15
  
  // Study habits
  if (user1.study === user2.study) score += 15
  
  // ... more complex logic ...
  
  return score
}
```

**API Route: `app/api/matches/generate/route.ts`**

```typescript
import { calculateMatch } from '@/lib/matching-algorithm'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get all users
  const { data: users } = await supabase.from('users').select('*')
  
  // YOUR MATCHING ALGORITHM RUNS ON SERVER
  const matches = users.map(user => ({
    userId: user.id,
    score: calculateMatch(currentUser, user)
  }))
  
  // Save matches
  await supabase.from('matches').insert(matches)
  
  return NextResponse.json({ success: true })
}
```

**Client Component: `app/dashboard/review/page.tsx`**

```typescript
const handleGenerate = async () => {
  // Client just triggers the process
  const response = await fetch('/api/matches/generate', {
    method: 'POST'
  })
  
  const result = await response.json()
  // Client only knows: success or failure
}
```

**What the client sees:**
- ✅ Button click
- ✅ Loading state
- ✅ Success message
- ❌ **NOT** the matching algorithm
- ❌ **NOT** how scores are calculated
- ❌ **NOT** the database queries

---

## Summary

### ✅ Your Logic Runs on the Backend

| What | Where |
|------|-------|
| Database queries | Server |
| Business logic | Server |
| Matching algorithm | Server |
| Authentication checks | Server |
| Environment variables | Server |
| Secrets | Server |

### ❌ Client Cannot See

| What | Why |
|------|-----|
| Server code | Runs on server, not sent to client |
| Database queries | Executed on server |
| Secrets | Never sent to client |
| Environment variables | Never sent to client |

### 🔄 The Conversion

**Before (Server Actions):**
```typescript
// lib/auth-actions.ts - SERVER
'use server'
export async function doSomething() {
  // Your logic on server
}
```

**After (API Routes):**
```typescript
// app/api/do-something/route.ts - SERVER
export async function POST(request: NextRequest) {
  // Your logic on server (SAME LOGIC!)
}
```

**The logic location doesn't change - only how it's called changes.**

---

## Bottom Line

✅ **Your logic stays on the backend**
✅ **Your secrets are safe**
✅ **Your database is secure**
✅ **Your matching algorithm is protected**
✅ **The only thing that changes is HOW the client calls the backend**

---

> **Remember:** Converting from Server Actions to API Routes does NOT move your logic to the frontend. It keeps it on the backend, just uses a different way to call it.
