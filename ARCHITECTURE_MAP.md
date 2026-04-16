# Architecture Map: React/Vite PWA Application

## 1. The Loading State Chain

### 1.1 Loading State Ownership and Flow

#### AuthContext.tsx (Primary Loading States)
- **`isInitializing`** (state) - Tracks initial auth check completion
  - Set to `true` on mount
  - Set to `false` after `initializeAuth()` completes or times out (20s)
  - Blocks ProtectedRoute from rendering content

- **`isSessionLoading`** (state) - Tracks Supabase session retrieval
  - Set to `true` on mount
  - Set to `false` after `getSession()` returns or times out (20s)
  - Blocks ProtectedRoute from rendering content

- **`isProfileLoading`** (state) - Tracks custom database profile fetch
  - Set to `true` when fetching profile from `users` table
  - Set to `false` after profile fetch completes or times out (20s)
  - Blocks ProtectedRoute if no profile exists yet

- **`isHydrated`** (state) - Tracks React hydration completion
  - Set to `true` after initial auth check completes
  - Used to prevent premature rendering

- **`isNetworkTimeout`** (state) - Tracks network failure state
  - Set to `true` when requests timeout or fail
  - Triggers offline banner in ProtectedRoute
  - Cleared by `clearNetworkTimeout()` or successful requests

#### useDashboardData.ts (Dashboard Loading States)
- **`isLoading`** (state) - Tracks dashboard data fetch
  - Initialized to `true`
  - Set to `false` after `initializeDashboard()` completes
  - Controls splash screen visibility in DashboardPage

- **`isInitializingRef`** (ref) - Prevents concurrent fetches
  - Set to `true` at start of `initializeDashboard()`
  - Set to `false` in finally block
  - Used to block duplicate fetch attempts

- **`mounted`** (state) - Tracks component mount
  - Set to `true` after useEffect runs
  - Used to prevent state updates on unmounted components

- **`isRecalculating`** (state) - Tracks manual recalculation
  - Set to `true` during `forceRecalculate()`
  - Shows loading state in EmptyState

- **`fetchError`** (state) - Tracks network errors
  - Set to `true` when network requests fail
  - Triggers error state in DashboardPage

#### DashboardPage.tsx (Derived Loading States)
- **`showSplash`** (derived) - Controls splash screen visibility
  - Formula: `isLoading && matches.length === 0 && isProfileComplete`
  - Shows "Finding your roommates..." spinner
  - Hides when data loads or profile incomplete

#### ProtectedRoute.tsx (Fallback Loading States)
- **`showFallback`** (state) - Shows sign-out button after delay
  - Set to `true` after 8 seconds of loading
  - Allows user to sign out and restart if stuck

### 1.2 Splash Screen Appearance/Disappearance Conditions

#### Splash Screen Appears When:
```typescript
showSplash = isLoading && matches.length === 0 && isProfileComplete
```

**Conditions:**
1. `isLoading === true` (dashboard fetch in progress)
2. `matches.length === 0` (no cached matches available)
3. `isProfileComplete === true` (profile has course and level)

**Critical Path to Splash:**
1. App mounts → `AuthContext` initializes
2. `isInitializing` = true, `isSessionLoading` = true, `isProfileLoading` = true
3. ProtectedRoute shows "Checking Account" loader
4. Session loads → `isSessionLoading` = false
5. Profile loads → `isProfileLoading` = false
6. ProtectedRoute renders Outlet → DashboardPage mounts
7. DashboardPage calls `useDashboardData()` hook
8. `isLoading` = true (initial state)
9. `matches` = [] (no cached data on cold boot)
10. `isProfileComplete` = true (profile has course/level)
11. **SPLASH SCREEN APPEARS**

#### Splash Screen Disappears When:
- **Success:** `isLoading` becomes `false` (dashboard fetch completes)
- **Profile Incomplete:** `isProfileComplete` becomes `false` (shows identity sync prompt)
- **Cached Data:** `matches.length > 0` (shows cached matches immediately)

### 1.3 Permanent Loading Hang Conditions

**Root Cause Analysis - Why App Gets Stuck:**

1. **Zombie Request Pattern (FIXED in latest code):**
   - Old request from initial mount still running
   - New recovery request triggered by network timeout
   - Both fight over `isLoading` state
   - Old request overwrites new request's state
   - **Solution:** Generation counter pattern (`fetchGenerationRef`) invalidates old requests

2. **Network Timeout Without Recovery:**
   - `timeoutFetch` aborts after 8 seconds
   - `isNetworkTimeout` = true
   - No cached data exists (cold boot)
   - No retry mechanism kicks in
   - **Result:** Permanent splash screen

3. **SessionStorage Cleared on Cold Boot:**
   - Android clears `sessionStorage` when app is swiped away
   - `matchesCache` key is empty
   - `hasQuestionnaireCache` key is empty
   - No fallback data to show
   - **Result:** Must wait for fresh network requests

4. **Service Worker Freeze (Android Power Saving):**
   - Android freezes Service Worker thread in power saving mode
   - Cannot abort pending requests via SW
   - Requests hang indefinitely
   - **Solution:** Removed runtime caching, rely on main thread `timeoutFetch`

## 2. The Cache Strategy Map

### 2.1 localStorage Usage

| Key | Data Type | Read Location | Write Location | Wipe Condition |
|-----|-----------|---------------|----------------|-----------------|
| `theme` | string ('dark'/'light') | `App.tsx` useEffect | User preference toggle | Manual clear |
| `roommate_profile_${userId}` | UserProfile JSON | `AuthContext.tsx` getLocalProfile() | `AuthContext.tsx` fetchProfile() | Sign out, profile deleted |
| `pioneerChecked` | string ('true') | `useDashboardData.ts` | `useDashboardData.ts` pioneer-check success | Never (session-based) |

**localStorage Persistence:**
- ✅ Survives app close/reopen
- ✅ Survives cold boot (swipe away)
- ✅ Survives browser refresh
- ❌ Cleared on sign out (profile keys only)

### 2.2 sessionStorage Usage

| Key | Data Type | Read Location | Write Location | Wipe Condition |
|-----|-----------|---------------|----------------|-----------------|
| `matchesCache` | MatchProfile[] array | `useDashboardData.ts` useState initializer | `useDashboardData.ts` setMatches() | Manual remove on empty |
| `hasQuestionnaireCache` | string ('true'/'false') | `useDashboardData.ts` query failure | `useDashboardData.ts` query success | Never (session-based) |

**sessionStorage Persistence:**
- ✅ Survives browser refresh
- ✅ Survives tab close/reopen
- ❌ **CLEARED on cold boot (Android swipe away)**
- ❌ **CLEARED on app close/reopen (iOS)**

### 2.3 Cache Strategy Analysis

**Profile Cache (localStorage):**
- **Read:** Immediately on session load in `AuthContext.tsx`
- **Write:** After successful profile fetch
- **Purpose:** Fast UI render, offline support
- **Survival:** Cold boot safe ✅

**Matches Cache (sessionStorage):**
- **Read:** On `useDashboardData` mount (useState initializer)
- **Write:** After successful matches fetch
- **Purpose:** Instant dashboard render, avoid loading spinner
- **Survival:** Cold boot unsafe ❌

**Questionnaire Cache (sessionStorage):**
- **Read:** On query failure (fallback)
- **Write:** After successful query
- **Purpose:** Avoid blocking UI on network errors
- **Survival:** Cold boot unsafe ❌

### 2.4 Critical Finding: sessionStorage on Android Cold Boot

**Behavior:**
When a user swipes the app away from recent apps on Android:
1. Android kills the app process
2. `sessionStorage` is completely cleared
3. `matchesCache` becomes empty
4. `hasQuestionnaireCache` becomes empty
5. App must fetch fresh data on next launch

**Impact on Loading State:**
- No cached matches to render
- Splash screen appears immediately
- Must wait for network requests to complete
- If network is slow/down, app hangs on splash

**Why localStorage Was Not Used for Matches:**
- Matches change frequently (new matches, updated scores)
- Stale matches could mislead users
- sessionStorage provides automatic cache invalidation on session end

**Trade-off:**
- **Pros:** Always fresh data, automatic cache invalidation
- **Cons:** No cold boot cache, slower initial load

## 3. The Network Request Lifecycle

### 3.1 Cold Boot Request Sequence (Dashboard Path)

**Phase 1: App Initialization (main.tsx)**
1. Service Worker registers (`registerSW({ immediate: true })`)
2. React root renders with `AuthProvider`

**Phase 2: Auth Context Initialization (AuthContext.tsx)**
3. `initializeAuth()` runs
4. **Request 1:** `supabase.auth.getSession()` - Verify session
   - Timeout: 8s (via `timeoutFetch`)
   - Retry: 1 additional attempt on timeout
   - Success: Sets `user`, `session`, `isSessionLoading = false`
   - Failure: Sets `isNetworkTimeout = true`, preserves cached profile

5. **Request 2:** `supabase.from('users').select('*')` - Fetch profile
   - Timeout: 8s (via `timeoutFetch`)
   - Retry: 1 additional attempt on timeout
   - Success: Writes to `localStorage`, sets `isProfileLoading = false`
   - Failure: Preserves cached profile, sets `isNetworkTimeout = true`

**Phase 3: Dashboard Data Fetch (useDashboardData.ts)**
6. `initializeDashboard()` runs (triggered by useEffect)
7. **Request 3:** `supabase.from('questionnaire_responses').select('id')` - Check questionnaire
   - Timeout: 8s (via `timeoutFetch`)
   - Retry: 2 attempts with instant retry (no delay)
   - Success: Sets `hasQuestionnaire`, writes to `sessionStorage`
   - Failure: Uses cached value from `sessionStorage`

8. **Request 4:** `supabase.from('matches').select(...)` - Query A-side (user_a_id)
   - Timeout: 8s (via `timeoutFetch`)
   - Retry: 1 additional attempt on timeout
   - Success: Returns matches where user is user_a_id
   - Failure: Sets `fetchError = true`

9. **Request 5:** `supabase.from('matches').select(...)` - Query B-side (user_b_id)
   - Timeout: 8s (via `timeoutFetch`)
   - Retry: 1 additional attempt on timeout
   - Success: Returns matches where user is user_b_id
   - Failure: Sets `fetchError = true`
   - **Note:** Requests 4 & 5 run in parallel via `Promise.all()`

10. **Request 6:** `supabase.functions.invoke('pioneer-check')` - Verify pioneer status
    - Timeout: 8s (via `timeoutFetch`)
    - Retry: None (single attempt)
    - Success: Sets `isPioneerUser`, writes `pioneerChecked` to `sessionStorage`
    - Failure: Allows retry on next session

**Phase 4: Activity Update (AuthContext.tsx)**
11. **Request 7:** `supabase.from('users').update({ last_active })` - Heartbeat
    - Timeout: 8s (via `timeoutFetch`)
    - Retry: None (fire-and-forget)
    - Success: Updates last_active timestamp
    - Failure: Silently ignored

**Total Requests on Cold Boot:** 7 network requests
**Total Timeout Window:** Up to 56 seconds (7 requests × 8s timeout)
**Actual Typical Duration:** 2-5 seconds on good network

### 3.2 Request Files and Functions

| # | File | Function | Endpoint | Purpose |
|---|------|----------|-----------|---------|
| 1 | `AuthContext.tsx` | `initializeAuth()` | `supabase.auth.getSession()` | Verify session |
| 2 | `AuthContext.tsx` | `fetchProfile()` | `supabase.from('users').select('*')` | Fetch user profile |
| 3 | `useDashboardData.ts` | `queryQuestionnaire()` | `supabase.from('questionnaire_responses').select('id')` | Check questionnaire status |
| 4 | `useDashboardData.ts` | `initializeDashboard()` | `supabase.from('matches').select(...)` | Query A-side matches |
| 5 | `useDashboardData.ts` | `initializeDashboard()` | `supabase.from('matches').select(...)` | Query B-side matches |
| 6 | `useDashboardData.ts` | `initializeDashboard()` | `supabase.functions.invoke('pioneer-check')` | Verify pioneer status |
| 7 | `AuthContext.tsx` | `updateActivity()` | `supabase.from('users').update({ last_active })` | Activity heartbeat |

### 3.3 Request Dependencies

**Sequential Dependencies:**
- Request 2 (profile) depends on Request 1 (session) - needs user.id
- Request 3 (questionnaire) depends on Request 2 (profile) - needs profile.id
- Requests 4 & 5 (matches) depend on Request 2 (profile) - needs profile.id
- Request 6 (pioneer) runs independently (uses auth token)
- Request 7 (activity) depends on Request 1 (session) - needs user.id

**Parallel Execution:**
- Requests 4 & 5 run in parallel via `Promise.all()`
- Request 6 runs independently after matches fetch

## 4. The Abort & Timeout Physics

### 4.1 timeoutFetch Implementation (supabase.ts)

**Core Mechanism:**
```typescript
const REQUEST_TIMEOUT_MS = 8000 // 8 seconds
```

**How It Works:**

1. **Controller Creation:**
   - Creates `AbortController` for each request
   - Links to React's abort signal (if provided)
   - Ensures page navigation cancels requests

2. **Timeout Timer:**
   - Sets 8-second timeout via `setTimeout()`
   - Aborts controller on timeout
   - Clears timer on successful response

3. **Retry Logic:**
   - On timeout, creates new `AbortController`
   - Links React's signal to retry controller
   - Sets another 8-second timeout
   - Makes second attempt with fresh controller

4. **Abort Signal Propagation:**
   - If React aborts (user navigates away), throws `AbortError`
   - No retry on React-initiated aborts
   - Prevents unnecessary network traffic

5. **Error Handling:**
   - Distinguishes between timeout and React abort
   - Throws specific error messages
   - Allows caller to handle appropriately

### 4.2 AbortController Signal Flow

**Signal Chain:**
```
React Component (useEffect)
    ↓ (init.signal)
timeoutFetch Wrapper
    ↓ (controller.signal)
Actual fetch()
```

**Abort Scenarios:**

1. **User Navigates Away:**
   - React unmounts component
   - React's `AbortSignal` fires
   - `timeoutFetch` detects `init.signal.aborted`
   - Controller aborts immediately
   - No retry (user intentionally left)

2. **Network Timeout:**
   - 8-second timer fires
   - Controller aborts
   - `timeoutFetch` catches `AbortError`
   - Checks `init.signal.aborted` (false)
   - Initiates retry with new controller

3. **Retry Timeout:**
   - Second 8-second timer fires
   - Retry controller aborts
   - `timeoutFetch` catches `AbortError`
   - Checks `init.signal.aborted` (false)
   - Throws timeout error

4. **React Abort During Retry:**
   - User navigates during retry
   - React's `AbortSignal` fires
   - Retry controller aborts
   - `timeoutFetch` detects `init.signal.aborted`
   - Throws `AbortError` (no further retry)

### 4.3 Places Using timeoutFetch

**All Supabase Calls Use timeoutFetch:**
- `supabase.auth.getSession()` ✅
- `supabase.auth.refreshSession()` ✅
- `supabase.auth.signInWithPassword()` ✅
- `supabase.auth.signUp()` ✅
- `supabase.auth.signOut()` ✅
- `supabase.auth.signInWithOAuth()` ✅
- `supabase.from('users').select()` ✅
- `supabase.from('users').update()` ✅
- `supabase.from('questionnaire_responses').select()` ✅
- `supabase.from('matches').select()` ✅
- `supabase.functions.invoke()` ✅

**Global Configuration:**
```typescript
export const supabase = createClient(url, key, {
  global: {
    fetch: timeoutFetch as any
  }
})
```

**All requests automatically wrapped by timeoutFetch** - no manual wrapping needed.

### 4.4 Potential Abort Signal Loss Points

**Safe Zones (No Signal Loss):**
- All Supabase client calls use global `timeoutFetch`
- React's abort signals properly propagated
- No direct `fetch()` calls bypassing wrapper

**Verified Safe:**
- ✅ `AuthContext.tsx` - All auth calls use Supabase client
- ✅ `useDashboardData.ts` - All database calls use Supabase client
- ✅ `useChatMessages.ts` - All chat calls use Supabase client
- ✅ `useChatThreads.ts` - All thread calls use Supabase client

**No Manual Fetch Calls Found:**
- No direct `fetch()` calls in codebase
- No `XMLHttpRequest` usage
- All network traffic goes through Supabase client

## 5. The Service Worker State

### 5.1 Service Worker Registration (main.tsx)

```typescript
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
```

**Registration Behavior:**
- Registers immediately on app load
- Uses Vite PWA plugin's virtual module
- `immediate: true` ensures early registration

### 5.2 Service Worker Configuration (vite.config.ts)

**VitePWA Plugin Configuration:**
```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['logo.png'],
  workbox: {
    maximumFileSizeToCacheInBytes: 4000000,
    // NOTE: Runtime caching for Supabase API calls was removed.
    // Android Power Saving Mode freezes Service Worker thread, which paralyzes API requests
    // and prevents React's AbortController from cancelling them, causing infinite spinners.
    // The app relies on custom `timeoutFetch` wrapper in `src/lib/supabase.ts`
    // to handle fast-failing on unfrozen main browser thread instead.
  },
  manifest: { ... }
})
```

**Critical Finding - No Runtime Caching:**
- ❌ No `runtimeCaching` configuration present
- ❌ No API calls cached by Service Worker
- ❌ No offline fallback for network requests
- ✅ Only static assets cached (images, JS, CSS)

### 5.3 Manifest Configuration

**PWA Manifest:**
```json
{
  "name": "RoommateLink | Avoid Roommate Gamble",
  "short_name": "RoommateLink",
  "description": "Connect with highly compatible university students...",
  "theme_color": "#4f46e5",
  "background_color": "#4f46e5",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/dashboard",
  "icons": [...]
}
```

**Display Mode:** `standalone` - Runs as native app
**Orientation:** `portrait` - Locks to portrait mode
**Start URL:** `/dashboard` - Opens directly to dashboard

### 5.4 Manual Service Worker Files

**Public Directory Scan:**
- ❌ No `sw.js` file found
- ❌ No `service-worker.js` file found
- ✅ Only Vite PWA plugin generates SW automatically

### 5.5 Service Worker Behavior on Android

**Power Saving Mode Impact:**
1. Android freezes Service Worker thread to save battery
2. Frozen SW cannot handle network requests
3. Frozen SW cannot abort pending requests
4. React's `AbortController` signals don't reach frozen SW
5. Requests hang indefinitely (no timeout)

**Why Runtime Caching Was Removed:**
- Runtime caching requires SW to intercept requests
- Frozen SW cannot intercept or abort requests
- Results in infinite loading spinners
- Solution: Remove runtime caching, rely on main thread `timeoutFetch`

**Current Strategy:**
- SW only caches static assets (images, JS, CSS)
- All API requests go directly to network
- Main thread `timeoutFetch` handles timeouts
- No SW involvement in API calls

### 5.6 Cache Strategy Summary

**What IS Cached by Service Worker:**
- ✅ Static assets (images, icons)
- ✅ JavaScript bundles
- ✅ CSS files
- ✅ HTML shell

**What IS NOT Cached by Service Worker:**
- ❌ Supabase API calls
- ❌ Auth requests
- ❌ Database queries
- ❌ Edge function calls

**Application-Level Caching:**
- ✅ Profile data in `localStorage`
- ✅ Matches data in `sessionStorage`
- ✅ Questionnaire status in `sessionStorage`

## 6. Network Recovery Mechanisms

### 6.1 Network Status Tracking (useNetworkStatus.ts)

**Implementation:**
```typescript
const [isOnline, setIsOnline] = useState(() => {
  return navigator.onLine
})

useEffect(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}, [])
```

**Limitations:**
- `navigator.onLine` can be unreliable on mobile
- May report "online" when TCP connection is dead
- Used as hint, not definitive source of truth

### 6.2 Recovery Triggers

**Trigger 1: Offline → Online Transition**
```typescript
// AuthContext.tsx - Network Recovery 1
useEffect(() => {
  if (prevNetworkStatusRef.current === 'offline' && status === 'online') {
    setIsNetworkTimeout(false)
    setForceSync(prev => prev + 1)
  }
  prevNetworkStatusRef.current = status
}, [status])
```

**Trigger 2: Cold Boot Delayed Ping**
```typescript
// AuthContext.tsx - Network Recovery 2
useEffect(() => {
  if (!isNetworkTimeout) return

  const retryTimer = setTimeout(async () => {
    const { error } = await supabase.auth.getSession()
    if (!error) {
      setIsNetworkTimeout(false)
      setForceSync(prev => prev + 1)
    }
  }, 3000) // Wait 3 seconds for radio to wake up

  return () => clearTimeout(retryTimer)
}, [isNetworkTimeout])
```

**Trigger 3: Visibility Change Wakeup**
```typescript
// AuthContext.tsx - Wakeup Handler
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && user) {
      if (isNetworkTimeoutRef.current) {
        const { error } = await supabase.auth.getSession()
        if (!error) {
          setIsNetworkTimeout(false)
          setForceSync(prev => prev + 1)
        }
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
}, [user])
```

### 6.3 Global Sync Mechanism

**Force Sync Counter:**
```typescript
const [forceSync, setForceSync] = useState(0)
```

**Trigger Function:**
```typescript
const triggerGlobalSync = () => {
  return new Promise<boolean>((resolve) => {
    syncResolverRef.current = resolve
    setForceSync(prev => prev + 1)
  })
}
```

**Dashboard Response:**
```typescript
// useDashboardData.ts - useEffect
const shouldOverrideThrottle = forceSync > 0

if (shouldOverrideThrottle) {
  fetchGenerationRef.current++
  isInitializingRef.current = false
}
```

**Resolution:**
```typescript
const resolveGlobalSync = (success: boolean) => {
  if (syncResolverRef.current) {
    syncResolverRef.current(success)
    syncResolverRef.current = null
  }
}
```

### 6.4 Timeout Failsafe

**Hard Timeout (20 seconds):**
```typescript
// AuthContext.tsx
useEffect(() => {
  const timer = window.setTimeout(() => {
    if (isInitializing) setIsInitializing(false)
    if (isSessionLoading) setIsSessionLoading(false)
    if (isProfileLoading) setIsProfileLoading(false)
    setIsNetworkTimeout(true)
    setIsHydrated(true)
  }, 20000)

  return () => clearTimeout(timer)
}, [isInitializing, isSessionLoading, isProfileLoading])
```

**Purpose:**
- Prevents permanent loading states
- Forces UI to render even if requests hang
- Allows user to interact with cached data

## 7. Critical Path Analysis

### 7.1 Happy Path (All Requests Succeed)

```
App Mount
  ↓
AuthContext initializes
  ↓
getSession() succeeds (200ms)
  ↓
fetchProfile() succeeds (300ms)
  ↓
ProtectedRoute renders Outlet
  ↓
DashboardPage mounts
  ↓
useDashboardData initializes
  ↓
queryQuestionnaire() succeeds (200ms)
  ↓
matches A & B queries succeed (500ms)
  ↓
pioneer-check succeeds (300ms)
  ↓
isLoading = false
  ↓
Splash screen disappears
  ↓
Dashboard renders with matches
```

**Total Time:** ~1.5 seconds

### 7.2 Cold Boot Hang Path (Network Issues)

```
App Mount
  ↓
AuthContext initializes
  ↓
getSession() times out (8s) → retries (8s) → fails
  ↓
isNetworkTimeout = true
  ↓
fetchProfile() uses cached data (100ms)
  ↓
ProtectedRoute renders Outlet
  ↓
DashboardPage mounts
  ↓
useDashboardData initializes
  ↓
queryQuestionnaire() fails → uses cached (100ms)
  ↓
matches queries timeout (8s) → retry (8s) → fail
  ↓
fetchError = true
  ↓
isLoading = false
  ↓
Splash screen disappears
  ↓
Dashboard renders error state
```

**Total Time:** ~25 seconds

### 7.3 Zombie Request Path (Bug Scenario - FIXED)

```
App Mount
  ↓
initializeDashboard() starts (Generation 0)
  ↓
isLoading = true
  ↓
Splash screen appears
  ↓
Network slow/hung (no response)
  ↓
20s timeout failsafe fires
  ↓
isNetworkTimeout = true
  ↓
triggerGlobalSync() called
  ↓
forceSync increments (1)
  ↓
fetchGenerationRef increments (1)
  ↓
initializeDashboard() starts (Generation 1)
  ↓
isLoading = true (still true)
  ↓
Splash screen still showing
  ↓
Old request (Generation 0) finally completes
  ↓
Checks: currentGeneration (1) !== fetchGenerationRef.current (1)
  ↓
SILENT EVAPORATION - Does nothing
  ↓
New request (Generation 1) completes
  ↓
Checks: currentGeneration (1) === fetchGenerationRef.current (1)
  ↓
Updates state
  ↓
isLoading = false
  ↓
Splash screen disappears
```

**Solution:** Generation counter prevents old requests from overwriting new state

## 8. Recommendations

### 8.1 Immediate Fixes (Already Implemented)
- ✅ Generation counter pattern for zombie request prevention
- ✅ Instant retry for questionnaire queries (no artificial delays)
- ✅ Silent evaporation for outdated requests
- ✅ Guard clauses for state updates

### 8.2 Potential Improvements

1. **Hybrid Cache Strategy:**
   - Move `matchesCache` to `localStorage` with timestamp
   - Check timestamp on load (e.g., < 1 hour old)
   - Allows cold boot cache with freshness guarantee

2. **Progressive Loading:**
   - Show cached matches immediately
   - Update in background with fresh data
   - Eliminates splash screen entirely

3. **Optimistic UI Updates:**
   - Assume cached data is valid
   - Render immediately, validate in background
   - Rollback on validation failure

4. **Request Prioritization:**
   - Fetch questionnaire status first (fastest)
   - Fetch matches second (parallel A/B queries)
   - Defer pioneer check (non-critical)

5. **Enhanced Network Detection:**
   - Implement actual ping to Supabase
   - Don't rely solely on `navigator.onLine`
   - Use ping result to determine true network status

6. **Service Worker Alternative:**
   - Consider using Cache API directly from main thread
   - Bypass SW thread freezing issue
   - Maintain offline capability
