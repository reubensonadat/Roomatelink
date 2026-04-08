# 03 - Authentication Lifecycle

Authentication is the most fragile part of the SPA experience. We use a **Handshake & Resurrection** model to ensure users never see unnecessary loading spinners or get stuck in infinite refresh loops.

## 🤝 The "Zero-Flicker" Handshake
To prevent a "Loading Session" flash every time a user refreshes the page, we use **Synchronous Hydration**:

1.  **Boot Phase:** On mount, `AuthContext` synchronously checks `localStorage` for the Supabase auth token.
2.  **Optimistic State:** If a token exists, the `user` and `profile` states are initialized immediately *before* the first render.
3.  **The Handshake:** We listen to `supabase.auth.onAuthStateChange`. We ignore `getSession()` on mount to avoid race conditions. 
4.  **Verification:** The first event fired by the listener is `INITIAL_SESSION`. At this point, we verify the optimistic token. If valid, we set `isHydrated = true`. If invalid, we wipe the state.

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

## 🧪 Error Handling: The 6-Second Hard Cap
If `isSessionLoading` or `isProfileLoading` remains true for more than 6 seconds, a failsafe timer in `AuthContext` forces them to `false`. This prevents the "Infinite Loading Spiral" caused by unexpected network timeouts or silent Supabase failures.
