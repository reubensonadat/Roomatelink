# 03 - Authentication Lifecycle

Authentication is the most fragile part of the SPA experience. We use a **Explicit Session Verification & Resurrection** model to ensure users never see unnecessary loading spinners or get stuck in infinite refresh loops.

## 🤝 The "Zero-Flicker" Handshake (Updated 2026-04-11)

To prevent a "Loading Session" flash every time a user refreshes the page, we use **Explicit Session Verification**:

1.  **Boot Phase:** On mount, `AuthContext` calls `supabase.auth.getSession()` explicitly to verify the session.
2.  **Initialization State:** We use `isInitializing` to track whether the initial auth check is complete.
3.  **The Handshake:** We wait for the explicit `getSession()` call to complete before setting any state.
4.  **Verification:** If a valid session is returned, we set `user`, `session`, and load the profile. If invalid, we set `null` and redirect to login.
5.  **Event Listener:** We also set up `onAuthStateChange` listener to handle ongoing auth events (sign in, sign out, token refresh).

**Key Changes (2026-04-11):**
- ❌ **Removed:** Synchronous `getLocalSession()` call (was causing race conditions)
- ✅ **Added:** Explicit `getSession()` call on mount
- ✅ **Added:** `isInitializing` state to prevent premature rendering
- ✅ **Added:** Token refresh failure handling
- ✅ **Added:** Periodic session validation (every 5 minutes)
- ✅ **Added:** Comprehensive auth event logging for debugging

## 🐕 The Watchdog Systems
We maintain three independent heartbeat loops within `AuthContext` to ensure session integrity:

### 1. Activity Heartbeat (2 mins)
- **Goal:** Update the `last_active` timestamp in the database.
- **Why:** This ensures the "Online Now" status remains accurate for matches.
- **Mechanism:** A `setInterval` that fires every 2 minutes while the user has the tab open.

### 2. Inactivity Watchdog (15 mins)
- **Goal:** Automatically log out inactive users.
- **Why:** Security and session cleanup.
- **Logic:** We listen to global UI events (click, scroll, keydown). These events update a `lastActivityRef.current` timestamp.
- **Why useRef?** If we used `useState` for activity, every scroll would trigger a re-render of the entire app, destroying the performance. `useRef` updates silently.

### 3. Session Heartbeat (5 mins)
- **Goal:** Proactively verify token validity.
- **Mechanism:** Periodically calls `supabase.auth.getSession()` to ensure the JWT hasn't been revoked server-side.

## 🌅 The Resurrection (PWA Resume)
When a user re-opens the PWA after it was backgrounded (or wakes their phone), the app doesn't always perform a full reload. We handle this via:

- **Visibility Listener:** When `document.visibilityState` flips to `visible`, we immediately call `getSession()` to "resurrect" the session.
- **Focus Handshake:** When the window regains focus, we call `refreshProfile()` to ensure the UI shows the latest data (e.g., if a payment was confirmed in the background).

## 🧪 Error Handling: The 12-Second Hard Cap
If `isInitializing`, `isSessionLoading`, or `isProfileLoading` remains true for more than 12 seconds, a failsafe timer in `AuthContext` forces them to `false`. This prevents the "Infinite Loading Spiral" caused by unexpected network timeouts or silent Supabase failures.

**Changes (2026-04-11):**
- Increased timeout from 6 seconds to 12 seconds for slow networks
- Added `isInitializing` to the timeout check
- Added comprehensive logging for timeout events

## 🔐 Session Validation & Refresh

### Periodic Session Validation
Every 5 minutes, the app automatically validates the current session by calling `getSession()`. If the session is invalid or expired:
- The user is signed out gracefully
- A toast notification explains why they were logged out
- They are redirected to the login page

### Token Refresh Handling
When Supabase refreshes the access token:
- The `TOKEN_REFRESHED` event is logged
- The profile is refreshed to ensure latest data
- If token refresh fails, the user is signed out with a notification

### Visibility Change Handling
When the user switches back to the tab:
- The session is refreshed via `getSession()`
- If the session has expired, the user is notified and signed out
- The profile is refreshed to show latest data

## 📊 Auth Event Logging

All authentication events are logged to the console with timestamps for production debugging:
- `INITIAL_SESSION_CHECK` - Starting session verification
- `SESSION_FOUND` - Session was found
- `NO_SESSION` - No active session
- `AUTH_STATE_CHANGE` - Auth state changed
- `TOKEN_REFRESHED` - Token was refreshed
- `SESSION_REFRESH_ERROR` - Session refresh failed
- `SESSION_LOST` - Session was lost
- `PERIODIC_SESSION_VALIDATION` - Periodic validation check
- `INITIALIZATION_TIMEOUT` - Initialization took too long

## 🚨 Common Issues & Solutions

### Issue: User gets logged out on page refresh
**Cause:** Session not being restored properly
**Solution:** Explicit `getSession()` call on mount (implemented 2026-04-11)

### Issue: User sees loading spinner forever
**Cause:** Network timeout or Supabase failure
**Solution:** 12-second hard cap forces loading to complete

### Issue: User gets logged out unexpectedly
**Cause:** Session expired or token refresh failed
**Solution:** Periodic validation catches expired sessions and notifies user

### Issue: API calls fail with 401 errors
**Cause:** Token expired but not refreshed
**Solution:** Token refresh handling and periodic validation (implemented 2026-04-11)
