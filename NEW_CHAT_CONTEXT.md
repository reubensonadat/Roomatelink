# New Chat Context - Project Overview

> **Read this file first when starting a new chat about this project.**
> 
> This document provides immediate context so you don't have to explain the project setup, architecture decisions, or current state again.

---

## Project Overview

**Project Name:** Roommate Link
**Description:** A roommate matching platform for university students
**Current Status:** In production on Cloudflare Pages, buttons not working

**Deployment Platform:** Cloudflare Pages
**Backend:** Supabase (PostgreSQL + Auth)
**Frontend:** Next.js 16.2.1 (App Router)
**Styling:** Tailwind CSS 4

---

## Critical Architecture Decision

### ✅ ALWAYS USE: API Routes
- Location: `app/api/*/route.ts`
- Example: `app/api/profile/update/route.ts`
- Works on: Cloudflare Pages, Vercel, Netlify, AWS Amplify

### ❌ NEVER USE: Server Actions
- Location: `lib/auth-actions.ts` (being deprecated)
- Example: `'use server'` directive
- Works on: Vercel only
- **BROKEN on Cloudflare Pages**

---

## Why This Decision Exists

### The Problem
When deploying to Cloudflare Pages, Server Actions return:
```
POST https://roomatelink.pages.dev/dashboard/profile 405 (Method Not Allowed)
```

### The Root Cause
- Server Actions require Node.js Runtime
- Cloudflare Pages uses Edge Runtime
- Edge Runtime doesn't support Server Actions

### The Solution
Convert all Server Actions to API Routes. This works everywhere.

---

## Current Project State

### Files That Need Conversion

| Server Action | Status | API Route Created? | Client Updated? |
|---------------|--------|-------------------|-----------------|
| `updateProfile()` | ✅ Done | ✅ Yes | ❌ No |
| `signOut()` | ❌ Pending | ❌ No | ❌ No |
| `deleteAccount()` | ❌ Pending | ❌ No | ❌ No |
| `signInWithEmail()` | ❌ Pending | ❌ No | ❌ No |
| `signUpWithEmail()` | ❌ Pending | ❌ No | ❌ No |
| `generateMatches()` | ❌ Pending | ❌ No | ❌ No |
| `saveAnswers()` | ❌ Pending | ❌ No | ❌ No |
| `submitQuestionnaire()` | ❌ Pending | ❌ No | ❌ No |
| `sendPasswordReset()` | ❌ Pending | ❌ No | ❌ No |
| `verifyUniversityEmail()` | ❌ Pending | ❌ No | ❌ No |

### Progress
- **API Routes Created:** 1/10
- **Client Components Updated:** 0/5
- **Overall Progress:** ~10%

---

## File Structure

```
Roomate link/
├── app/
│   ├── api/                           # ✅ API Routes (use these)
│   │   ├── profile/
│   │   │   └── update/
│   │   │       └── route.ts           # ✅ Created
│   │   └── paystack/
│   │       └── verify/
│   │           └── route.ts
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   ├── dashboard/
│   │   ├── profile/
│   │   │   └── page.tsx              # ❌ Needs update
│   │   ├── settings/
│   │   │   └── page.tsx              # ❌ Needs update
│   │   ├── review/
│   │   │   └── page.tsx              # ❌ Needs update
│   │   └── page.tsx
│   ├── questionnaire/
│   │   └── page.tsx                  # ❌ Needs update
│   └── layout.tsx
├── lib/
│   └── auth-actions.ts               # ❌ Server Actions (being deprecated)
├── utils/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── middleware.ts                     # ✅ Edge Runtime
├── wrangler.toml                     # ✅ Cloudflare config
├── next.config.mjs
└── package.json
```

---

## Configuration Files

### wrangler.toml (Cloudflare Pages Config)
```toml
name = "roomatelink"
compatibility_flags = ["nodejs_compat"]
pages_build_config = {
  build_command = "npm run pages:build",
  destination_dir = ".next"
}
```

### middleware.ts (Edge Runtime)
```typescript
export const runtime = 'experimental-edge'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/server|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
```

---

## API Route Template

**Use this template for all new API routes:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Get user from Supabase Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 2. Parse request body
    const body = await request.json()
    
    // 3. Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      )
    }
    
    // 4. Your business logic here
    const { data, error } = await supabase
      .from('table_name')
      .insert({ /* your data */ })
      .select()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // 5. Return success response
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Client Component Template

**Use this template for updating client components:**

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* your data */ })
      })
      
      const result = await response.json()
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Success!')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  )
}
```

---

## Conversion Process

### Step 1: Create API Route
1. Create new file: `app/api/[endpoint]/route.ts`
2. Copy logic from Server Action in `lib/auth-actions.ts`
3. Adapt to API Route format (see template above)
4. Test the API route

### Step 2: Update Client Component
1. Find file that calls the Server Action
2. Replace function call with `fetch()` call
3. Handle response properly
4. Test the component

### Step 3: Verify
1. Test locally: `npm run dev`
2. Test Cloudflare build: `npm run pages:build && npm run preview`
3. Deploy to production if tests pass

---

## Next Steps

### Immediate Tasks (In Order)
1. ✅ Create `app/api/profile/update/route.ts` - DONE
2. ❌ Update `app/dashboard/profile/page.tsx` to use API route
3. ❌ Create `app/api/auth/signout/route.ts`
4. ❌ Update `app/dashboard/settings/page.tsx` for logout
5. ❌ Create `app/api/auth/delete-account/route.ts`
6. ❌ Update `app/dashboard/settings/page.tsx` for delete account
7. ❌ Create `app/api/auth/signin/route.ts`
8. ❌ Update `app/auth/page.tsx` for signin
9. ❌ Create `app/api/auth/signup/route.ts`
10. ❌ Update `app/auth/page.tsx` for signup
11. ❌ Create `app/api/matches/generate/route.ts`
12. ❌ Update `app/dashboard/review/page.tsx` for generate matches
13. ❌ Create `app/api/questionnaire/save/route.ts`
14. ❌ Update `app/questionnaire/page.tsx` for save answers
15. ❌ Create `app/api/questionnaire/submit/route.ts`
16. ❌ Update `app/questionnaire/page.tsx` for submit questionnaire
17. ❌ Create `app/api/auth/reset-password/route.ts`
18. ❌ Update `app/dashboard/settings/page.tsx` for password reset
19. ❌ Create `app/api/auth/verify-email/route.ts`
20. ❌ Update `app/dashboard/settings/page.tsx` for verify email

### After All Conversions
1. Test all functionality locally
2. Build for Cloudflare Pages: `npm run pages:build`
3. Test with preview: `npm run preview`
4. Deploy to production: `npm run deploy`
5. Verify all buttons work in production

---

## Important Notes

### Do's
- ✅ Always use API Routes for backend logic
- ✅ Always use Edge Runtime in middleware
- ✅ Always test locally before deploying
- ✅ Always handle errors properly
- ✅ Always validate input

### Don'ts
- ❌ Never use Server Actions (`'use server'`)
- ❌ Never use Node.js built-ins in Edge Runtime
- ❌ Never hardcode secrets
- ❌ Never skip testing
- ❌ Never deploy without testing

---

## Reference Documents

- **Cloudflare Pages Development Guide:** `docs/CLOUDFLARE_PAGES_DEVELOPMENT_GUIDE.md`
- **Production Fix Explained:** `PRODUCTION_FIX_EXPLAINED.md`
- **Project Architecture:** `apparchitecture.md`
- **Auth Explained:** `docs/AUTH_EXPLAINED.md`
- **Settings Explained:** `docs/SETTINGS_EXPLAINED.md`
- **Profile Explained:** `docs/PROFILE_EXPLAINED.md`
- **Questionnaire Explained:** `docs/QUESTIONNAIRE_EXPLAINED.md`
- **Messaging Explained:** `docs/MESSAGING_EXPLAINED.md`
- **Dashboard Explained:** `docs/DASHBOARD_EXPLAINED.md`

---

## Quick Commands

```bash
# Development
npm run dev

# Build for Cloudflare Pages
npm run pages:build

# Test Cloudflare build locally
npm run preview

# Deploy to Cloudflare Pages
npm run deploy

# Lint
npm run lint
```

---

## GitHub Repository

- **Repository:** (Add your GitHub URL here)
- **Current Branch:** (Add current branch here)
- **Last Commit:** (Add last commit message here)

---

## Contact & Support

If you encounter issues:
1. Check `docs/CLOUDFLARE_PAGES_DEVELOPMENT_GUIDE.md` for troubleshooting
2. Check Cloudflare Pages logs for errors
3. Check browser console for client-side errors
4. Review the API route implementation

---

## Version History

- **v1.0** - Initial context document created during Server Actions to API Routes conversion
- **Progress:** 1/10 API routes created, 0/5 client components updated

---

> **Remember:** This document is your "cheat sheet" for starting new chats. Reference it at the beginning of any new conversation about this project to save time and ensure consistency.
