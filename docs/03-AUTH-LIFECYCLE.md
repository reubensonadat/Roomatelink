# 03 - Authentication Lifecycle

Authentication is the most fragile part of SPA experience. We use a **Single Source of Truth** model to ensure users never see unnecessary loading spinners or get stuck in infinite refresh loops.

## 🤝 The "Zero-Flicker" Handshake (Updated 2026-04-17)

To prevent a "Loading Session" flash every time a user refreshes the page, we use **Synchronous Bootloader with Optimistic Hydration**:

1.  **Synchronous Bootloader:** Before React mounts, `getInitialAuthState()` reads localStorage directly (no Promises, no network) to extract cached session and profile
2.  **Optimistic Hydration:** If cached token is valid (not expired within 60-second buffer), we pre-fill React state with cached data
3.  **Instant UI:** Dashboard appears on frame one (<100ms) with cached data
4.  **Background Validation:** `initializeAuth()` runs in background to validate token and refresh data — no longer blocks UI
5.  **Event Listener:** `onAuthStateChange` listener handles ongoing auth events (sign in, sign out, token refresh)

**Key Changes (2026-04-17):**
- ✅ **Added:** Synchronous bootloader (`getInitialAuthState()`) - reads localStorage before React mounts
- ✅ **Added:** Optimistic hydration - UI renders instantly with cached data
- ✅ **Added:** Token expiration check with 60-second buffer - prevents FOUC (flash of unauthenticated content)
- ✅ **Added:** Background validation - non-blocking session verification
- ✅ **Changed:** Loading states start as `false` when valid cache exists
- ✅ **Changed:** Refs initialized with cached values

**Previous Changes (2026-04-12):**
- ❌ **Removed:** Activity Heartbeat (2-minute interval) - was causing mobile TCP connection poisoning
- ❌ **Removed:** Session Heartbeat (5-minute interval) - unnecessary, trust JWT until server rejects it
- ❌ **Removed:** Visibility/focus listeners for session resurrection - caused lock contention and cascade re-renders
- ✅ **Added:** "Auth is a Gate" principle - Single Source of Truth via `onAuthStateChange` with `[]` dependency
- ✅ **Added:** URL Hash stripping to prevent Phantom Logins
- ✅ **Added:** 20-second safety timeout (increased from 12s to accommodate global retry)

## 🚪 Auth is a Gate (Single Source of Truth)

The `onAuthStateChange` listener is the **single source of truth** for all auth state changes. It runs once on mount with an empty dependency array `[]`, ensuring it never re-runs.

### The Gate Principle
- **No polling:** We don't poll the server for session validity. We trust the JWT until the server rejects it.
- **No visibility listeners:** We don't refresh auth when the tab regains focus. This causes lock contention and cascade re-renders.
- **No intervals:** We don't use `setInterval` for session validation. Supabase handles token refresh automatically.
- **Event-driven:** All state changes flow through `onAuthStateChange` events: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`.

### Phantom Login Prevention
When Supabase processes OAuth redirects, it reads the `access_token` from the URL hash. However, if the hash isn't stripped, Supabase may re-read it 48 seconds later, triggering a phantom `SIGNED_IN` event.

**The Fix:** Inside `onAuthStateChange`, we immediately strip the URL hash after Supabase has processed it:

```typescript
if (window.location.hash.includes('access_token')) {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
```

This is safe because `onAuthStateChange` only fires after Supabase has successfully parsed the hash and created the session.

## 🛡️ Mobile TCP Half-Open Mitigation (NEW)

When a user sits idle on mobile data for ~90 seconds, the mobile carrier kills the idle TCP connection. The browser thinks the connection is still open (half-open) and waits 60+ seconds before realizing it's dead.

This causes the app to freeze after 2 minutes of inactivity.

### The Global Network Shield

We've implemented a global `createTimeoutFetch` wrapper in [`src/lib/supabase.ts`](../src/lib/supabase.ts) that:

1.  **8-Second Timeout:** All Supabase HTTP requests timeout after 8 seconds
2.  **AbortController:** Uses `AbortController` to physically tear down the TCP connection at the OS level
3.  **Linked React Signals:** Links React's cancel signals to our controller, preventing ghost requests when users switch pages
4.  **Second Chance Retry:** If a timeout occurs, automatically retries once on a fresh TCP connection

### The Physics of the Fix

**Before (The Problem):**
- Mobile carrier kills idle TCP connection after ~90 seconds
- 2-minute heartbeat wakes up the dead connection
- Request hangs for 60+ seconds before browser realizes it's dead
- App freezes

**After (The Solution):**
- 8-second timeout fires immediately
- `AbortController` tears down the dead connection
- "Second Chance" retry opens a brand new TCP connection
- User never experiences the freeze

### No Nested Retries

Custom data-fetching functions (like `fetchProfile`) **must not** implement their own retry logic. This creates nested retry loops that exceed our safety timeout:

- First `supabase.from()` call times out at 8 seconds
- Supabase retries, times out again at 16 seconds
- Custom function catches error, waits 1 second, tries again
- Another 16 seconds for the second attempt
- **Total: 33 seconds**, which exceeds our 20-second safety timeout

**The Rule:** Let `supabase.ts` be the single source of truth for network resilience. Custom functions should return `null` on error and let the global wrapper handle retries.

## 💼 Optimistic Wallet Updates (NEW)

When a user saves their profile, we want the UI to update instantly without a loading spinner. We achieve this through "Optimistic Wallet Updates".

### The Wallet Pattern

The `updateProfile()` function is exposed from `AuthContext` and can be called directly from components to update the UI instantly:

```typescript
const { updateProfile } = useAuth()

// Optimistic update - bypasses 10-minute throttle
updateProfile({
  ...profile,
  full_name: newName
})
```

This bypasses the 10-minute throttle on `refreshProfile()` and updates the UI immediately. The database is updated asynchronously, and if it fails, we show an error toast.

### The Throttle

The `refreshProfile()` function has a 10-minute throttle to prevent excessive database calls. However, this means that if a user saves their profile, the UI won't update until the next refresh.

**The Solution:** Use `updateProfile()` for optimistic updates when the user performs an action (like saving their profile). Use `refreshProfile()` for background syncs.

## 🧪 Realtime Chat: Lazy WebSocket Architecture

The chat system uses a "Lazy WebSocket" architecture to handle Cloudflare killing idle WebSocket connections.

### Cold Start Handoff

When a user opens a chat:
1.  **HTTP First:** Fetch messages via HTTP (always works)
2.  **Background WebSocket:** Open WebSocket in background for live updates
3.  **Seamless Handoff:** User sees messages immediately, WebSocket takes over for live updates

### Walkie-Talkie Reconnect

When the WebSocket dies:
1.  **Show Banner:** Display "Tap to Reconnect" banner with orange dot
2.  **HTTP Fallback:** User can still send messages via HTTP (saves to database)
3.  **On Tap:** Fetch missed messages via HTTP, destroy dead WebSocket, create new one
4.  **Green Dot:** WebSocket reconnected, live updates resume

### Clean Exit on Unmount

When the user navigates away from the chat:
1.  **Unsubscribe:** Unsubscribe from the WebSocket channel
2.  **Destroy:** Destroy the WebSocket connection
3.  **No Ghosts:** Prevents ghost connections that consume resources

## 🧪 Error Handling: The 20-Second Safety Timeout

If `isInitializing`, `isSessionLoading`, or `isProfileLoading` remains true for more than 20 seconds, a failsafe timer in `AuthContext` forces them to `false`. This prevents "Infinite Loading Spiral" caused by unexpected network timeouts or silent Supabase failures.

**Changes (2026-04-12):**
- Increased timeout from 12 seconds to 20 seconds to accommodate the 16-second maximum for global retry
- Removed local timeouts in `useDashboardData` and `ProtectedRoute` (they were interfering with global retry)

**Note (2026-04-17):** With optimistic hydration, this timeout is rarely triggered since cached data unblocks the UI immediately. The timeout now serves as a safety net for edge cases where cache is unavailable or corrupted.

## 📊 Auth Event Logging

All authentication events are logged to the console with timestamps for production debugging:
- `INITIAL_SESSION_CHECK` - Starting session verification
- `SESSION_FOUND` - Session was found
- `NO_SESSION` - No active session
- `AUTH_STATE_CHANGE` - Auth state changed
- `TOKEN_REFRESHED` - Token was successfully refreshed
- `TOKEN_REFRESH_FAILED` - Token refresh returned null session
- `SIGNED_OUT` - User signed out
- `INITIALIZATION_TIMEOUT` - Initialization took too long
- `PROFILE_LOADING_TIMEOUT` - Profile loading took too long
- `SESSION_LOADING_TIMEOUT` - Session loading took too long

## 🚨 Common Issues & Solutions

### Issue: User gets logged out on page refresh
**Cause:** Session not being restored properly
**Solution:** Explicit `getSession()` call on mount (implemented 2026-04-11)

### Issue: User sees loading spinner forever
**Cause:** Network timeout or Supabase failure
**Solution:** 20-second safety timeout forces loading to complete

### Issue: App freezes after 2 minutes of inactivity on mobile data
**Cause:** Mobile carrier kills idle TCP connection, 2-minute heartbeat wakes up dead connection
**Solution:** 8-second global timeout + "Second Chance" retry on fresh TCP connection

### Issue: Phantom login after OAuth redirect
**Cause:** Supabase re-reads `access_token` from URL hash 48 seconds later
**Solution:** Strip URL hash inside `onAuthStateChange` after Supabase has processed it

### Issue: Nested retry loops exceed timeout
**Cause:** Custom data-fetching functions implement their own retry logic
**Solution:** Remove retry logic from custom functions, let `supabase.ts` handle all network retries

### Issue: UI doesn't update immediately after saving profile
**Cause:** 10-minute throttle on `refreshProfile()`
**Solution:** Use `updateProfile()` for optimistic updates, bypasses throttle

### Issue: Chat WebSocket dies and can't recover
**Cause:** Cloudflare kills idle WebSocket connections
**Solution:** Lazy WebSocket architecture with Cold Start Handoff and Walkie-Talkie Reconnect

### Issue: 10-second delay on cold start despite valid session
**Cause:** Blocking sequential authentication pattern - waited for network before reading cache
**Solution:** Synchronous bootloader reads localStorage before React mounts, enabling optimistic hydration

---

## 🛡️ The Gatekeeper's Polish: One Thing to Watch

Your code is ready to ship, but there is one minor environmental quirk to be aware of as your application grows:

### The Custom Domain Regex Trap

Your extraction logic is highly efficient:

```typescript
url.match(/https:\/\/([^.]+)\.supabase\.co/)
```

This flawlessly grabs the `<ref>` ID to build `sb-<ref>-auth-token`. However, if you ever upgrade your Supabase project to use a Custom Domain (e.g., `api.yourdomain.com` instead of `xxx.supabase.co`), this regex will fail.

Because you built this defensively, a regex failure will simply return `null` and fall back to the normal 8-second loader (no crashes). If you ever move to a custom domain, you will just need to manually hardcode your project string into the `storageKey` variable instead of extracting it from the URL.

**Example for Custom Domains:**

```typescript
// Instead of extracting from URL:
const storageKey = `sb-${projectRef}-auth-token`

// Hardcode for custom domain:
const storageKey = 'sb-your-project-ref-auth-token'
```

You are cleared to merge this code. You have successfully turned a blocking, sequential loading waterfall into a seamless, optimistic, non-blocking architecture.
