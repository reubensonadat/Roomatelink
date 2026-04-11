### 1. Tech Stack Reality
The application is built on **React 19** and **Vite**, using **Supabase** for backend services. However, it lacks a dedicated server-state management library (e.g., **React Query** or **SWR**). Instead, it relies on a fragile architecture of raw `useState`, `useEffect`, and manual `localStorage` synchronization. This "hand-rolled" approach to async state management is the primary cause of sync inconsistencies and race conditions.

### 2. Authentication & Session Physics
The `AuthContext.tsx` implementation is fragile due to its aggressive **manual hydration** logic. It attempts to synchronize states from `localStorage` (`sb-*-auth-token`) independently of the Supabase client's native persistence. This leads to:
- **Race Conditions**: Synchronous local storage reads can conflict with asynchronous Supabase session resolution.
- **Fail-Hard Logic**: A 6-second "hard timeout" failsafe exists to force-unlock the UI, which is a clear indicator of unstable session guarding.
- **Throttled Resync**: Profile refreshing is hard-throttled to 10 minutes, meaning metadata changes (like profile updates) won't be reflected in the context immediately after a mutation if the throttle is active.

### 3. Data Mutation & Premature State Physics
The silent failure and premature loading states stem from a lack of **Mutation Lifecycle** management:
- **Silent Save Failure**: `ProfilePage.tsx` uses a custom `withRetry` wrapper that doesn't explicitly verify the server state post-update. Because the page optimistically dehydrates form state into `localStorage`, the UI may look "saved" to the user while the actual Supabase mutation either failed (e.g., RLS violation) or is still in a retry loop.
- **Premature Loading UI**: The "Calculating matches" state is triggered by a fire-and-forget `fetch` call to a Supabase Edge Function that does not block navigation. The user is redirected to the dashboard immediately after the database write, regardless of whether the calculation function succeeded.
- **Duplicate Overlays**: `ProfilePage.tsx` contains two identical `isSaving` logic blocks (lines 298 and 741) that render overlapping overlays with conflicting z-indexes (`z-[100]` vs `z-[9999]`), causing the "chaotic" UI snap.

### 4. UI/Layout Physics
The layout distortions and input limitations are caused by rigid component definitions:
- **Text Input Trap**: The `Bio` field in `ProfilePage.tsx` uses the `FormInput` component, which is hardcoded to use a standard `<input type="text">`. This prevents vertical expansion and traps multi-line content into a single horizontal line.
- **Broken Overlay Positioning**: The submission overlays use `fixed inset-0` but are missing a standardized layout container. Combined with the double-rendering of `AnimatePresence` blocks, the browser's paint order causes the element to snap to top/left coordinates when the Framer Motion animation is interrupted by React state updates.
- **Scrolling Obstruction**: The main content area in `ProfilePage` lacks a defined `min-height` relative to its parents, and the presence of multiple fixed-position overlays can interfere with the browser's scroll target detection.

### 5. Architectural Fix Strategy
- **Issue 1 (State)**: Implement React Query for all Supabase mutations and queries to replace manual `withRetry` logic and ensure UI-Server synchronization.
- **Issue 2 (Auth)**: Remove manual `localStorage` auth-token parsing and rely purely on Supabase `onAuthStateChange` with a robust Error Boundary.
- **Issue 3 (Sync)**: Await Edge Function resolution before navigating away from the profile sync screen, ensuring the "Calculating" state reflects actual progress.
- **Issue 4 (UI)**: Refactor `FormInput` to support `textarea` for multi-line fields and consolidate the submission overlay into a single, high-elevation global portal.
