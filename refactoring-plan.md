# Roommate Link — Staff-Level Refactoring Plan

---

## 1. Executive Summary

The Roommate Link codebase is a **functional but architecturally strained** React + Vite + Supabase application. It ships real value — authentication, matching, real-time messaging, payments — but the code has accumulated significant technical debt across several critical dimensions:

| Dimension | Severity | Summary |
|---|---|---|
| **Auth Stability** | 🔴 Critical | The `AuthContext` is a 328-line monolith that conflates session management, profile fetching, activity heartbeats, inactivity watchdogs, and session heartbeats into a single `useEffect` with `lastActivity` in its dependency array — causing the **entire watchdog/heartbeat cleanup cycle to re-run on every user interaction**. This is the single biggest source of instability. |
| **Component Architecture** | 🟠 High | `DashboardPage.tsx` (814 lines) is the most severe "monster component" — it manages 25+ pieces of state, payment logic, discount codes, verification overlays, pioneer claims, unlock animations, "found roommate" modals, and match fetching all in one file. `ProfilePage.tsx` (570 lines) and `SettingsPage.tsx` (533 lines) follow the same pattern. |
| **TypeScript Discipline** | 🟠 High | The `profile` type is `any` throughout the entire application. `MatchCard` accepts `match: any`. Chat messages are `any[]`. There are zero shared type definitions for database entities. |
| **Code Duplication** | 🟡 Medium | "Profile completeness" checks (`profile?.course && profile?.level`) are duplicated in 6+ files. Payment status derivation (`profile?.has_paid \|\| profile?.is_pioneer`) is duplicated in 5+ files. Two nearly identical `Sidebar` components exist simultaneously. |
| **State Management** | 🟡 Medium | Dashboard state is cached in `sessionStorage`, chat threads in `localStorage`, profile data in `localStorage` — three different caching strategies with no unified abstraction. Each page re-derives its own "user flow state" (profile complete → questionnaire done → paid) independently. |

**Bottom line:** The app works, but any change to auth, payment, or matching logic requires touching 3-5 files because the same state derivation is scattered everywhere. The auth instability is the most urgent fix because it directly impacts user retention.

---

## 2. Authentication Stability Analysis

### 2.1 Root Cause: The `lastActivity` Dependency Catastrophe

**File:** `src/context/AuthContext.tsx`, Lines 170–246

The second `useEffect` (the "Real-Time Activity Heartbeat") has the following dependency array:

```tsx
}, [user, profile, lastActivity])  // Line 246
```

`lastActivity` is updated by `handleUpdateActivity` (line 61) which is bound to `mousedown`, `keydown`, `touchstart`, `scroll`, and `click` events (line 217). This means:

1. **Every single user interaction** (click, scroll, keypress) calls `setLastActivity(Date.now())`.
2. This triggers a re-render of `AuthProvider`, which changes `lastActivity`.
3. The effect on line 170 **tears down and re-creates**:
   - The 2-minute activity heartbeat interval
   - The 1-minute inactivity watchdog interval
   - The 5-minute session heartbeat interval
   - The `visibilitychange` listener
   - The `focus` listener
   - All 5 activity event listeners (`mousedown`, `keydown`, etc.)
4. This cycle repeats **on every single interaction**.

**Impact:**
- Intervals are constantly reset, so the inactivity watchdog and session heartbeat **never actually fire** in practice (they're torn down and re-created before they can trigger).
- Hundreds of `addEventListener`/`removeEventListener` calls per minute under normal use.
- The `supabase.auth.getSession()` call inside the heartbeat (line 231) can race against the `onAuthStateChange` listener (line 127), potentially causing **dual session state writes** that conflict.

### 2.2 The `onAuthStateChange` + `getSession()` Race Condition

**File:** `src/context/AuthContext.tsx`, Lines 89–167

The `initializeAuth()` function (line 92) calls `supabase.auth.getSession()` **and** simultaneously sets up `onAuthStateChange`. Both paths update `user`, `session`, and `profile` state. The Supabase docs explicitly warn against this pattern — `getSession()` can return a stale/cached session that `onAuthStateChange` will subsequently overwrite with a fresh one, causing a **double render with potentially different user/session objects**.

Additionally, the `INITIAL_SESSION` event from `onAuthStateChange` (line 131) fires a `fetchProfile()` call concurrently with the `fetchProfile()` inside `initializeAuth()` (line 104). This results in **two parallel profile fetches** for the same user on every cold boot.

### 2.3 Stale Closure in the Watchdog

**File:** `src/context/AuthContext.tsx`, Lines 219–225

```tsx
const inactivityInterval = setInterval(() => {
  const idleTime = Date.now() - lastActivity  // captures the closure value
  if (user && idleTime > INACTIVITY_LIMIT) {
    signOut()
  }
}, 60000)
```

Because `lastActivity` is in the dependency array and the effect re-runs on each change, the closure always captures the *latest* `lastActivity`. However, if the dependency were correctly **removed** (as it should be), this code would permanently capture the first `lastActivity` value and would need a `ref` instead. Either way, this is a latent bug waiting to surface after a fix.

### 2.4 The `refreshProfile()` Closure Bug

**File:** `src/context/AuthContext.tsx`, Lines 135–141

Inside the `onAuthStateChange` callback:
```tsx
const cached = getLocalProfile(currentSession.user.id)
if (cached && !profile) {  // `profile` is captured from the closure at mount time
  setProfile(cached)
}
```

The `profile` variable here is a stale closure — it captures the value of `profile` at the time the `useEffect` ran (i.e., `null` on mount). After the first profile fetch succeeds, `profile` in the closure remains `null` forever, so the `!profile` check always passes, causing the cached profile to overwrite the fresh one on every `SIGNED_IN` or `TOKEN_REFRESHED` event.

### 2.5 Synchronous LocalStorage Hydration Risks

**File:** `src/context/AuthContext.tsx`, Lines 21–36

The `getLocalSession()` function reaches into Supabase's internal localStorage key format (`sb-*-auth-token`) and parses the token directly. This is:
1. **Fragile** — Supabase can change their storage format between versions.
2. **Unsupported** — The official API is `getSession()`, which validates the token.
3. **Dangerous** — An expired/revoked token in localStorage will cause the app to render authenticated UI before `getSession()` corrects it, producing a visible flash of dashboard → redirect to auth.

### 2.6 How It Should Be Fixed (Theoretical)

1. **Split the `useEffect` into three independent effects:**
   - **Effect 1: Auth Initialization.** Call `getSession()` once. Trust `onAuthStateChange` for subsequent events. Remove the redundant `getSession()` call.
   - **Effect 2: Activity Heartbeat.** Depends only on `user`. Uses a `ref` for `lastActivity` instead of state. Event listeners for activity update the ref, not state.
   - **Effect 3: Session Heartbeat.** Depends only on `user`. Fires `getSession()` every 5 minutes. Independent of activity.

2. **Remove `lastActivity` from all dependency arrays.** Replace `const [lastActivity, setLastActivity] = useState(Date.now())` with `const lastActivityRef = useRef(Date.now())`. This eliminates the cascade of effect re-runs.

3. **Remove the duplicate `getSession()` call.** In the first effect, register `onAuthStateChange` and handle `INITIAL_SESSION` — do not also call `getSession()`.

4. **Fix the stale `profile` closure.** Use a ref or move the profile check outside the `onAuthStateChange` callback.

5. **Guard the synchronous hydration.** Keep it for flash prevention, but treat it as unverified — set a `isHydrated: false` flag that prevents destructive actions until the async `getSession()` confirms.

---

## 3. Component Extraction Plan

### 3.1 Shared UI Primitives (Currently Missing)

These are reusable atoms that should exist in `src/components/ui/` but are currently inlined everywhere:

| Component | Currently Inlined In | Description |
|---|---|---|
| `<FormInput />` | ProfilePage, AuthPage, SettingsPage, ChatPage | Text input with label, icon slot, error state. Repeated 15+ times with identical Tailwind classes. |
| `<PillToggle />` | ProfilePage (gender, match pref), AuthPage (sign in/sign up) | Binary/multi-option segmented control with sliding background indicator. |
| `<ActionButton />` | Every page | The large `h-[64px] rounded-[22px] font-black uppercase tracking-widest` call-to-action button pattern is repeated 20+ times. |
| `<SectionHeader />` | ProfilePage, SettingsPage, DashboardPage | The `text-[11px] font-black text-muted-foreground uppercase tracking-widest` section label repeated in every settings-style page. |
| `<StatusBadge />` | MatchCard, ProfilePreviewModal, MessagesPage | Verified/unverified checkmark badge with consistent styling. |
| `<EmptyState />` | DashboardPage, MessagesPage, ChatPage | The icon + heading + subtitle + CTA empty state pattern (already partially exists at `src/components/dashboard/EmptyState.tsx` but is not used). |
| `<ConfirmModal />` | SettingsPage (logout, delete) | The backdrop + spring-animated bottom sheet + title + message + confirm/cancel button pattern. Currently hand-rolled 3 times in SettingsPage. |
| `<SkeletonLoader />` | DashboardPage, MessagesPage, ChatPage | Pulse-animated placeholder cards. Currently unique implementations per page. |
| `<ProgressRing />` | MatchCard | The SVG circular progress indicator. Currently embedded inside MatchCard. |

### 3.2 Composite Component Extractions

| Extraction | Source File | Lines | Rationale |
|---|---|---|---|
| `<ProfileForm />` | ProfilePage.tsx | 278–481 | The entire form (name, phone, bio, gender, level, course, match pref, network status, save button) is a single monolithic block. Extract into a controlled form component that receives `profile` and `onSave` props. |
| `<PaymentFlow />` | DashboardPage.tsx | 72–89, 366–498 | All payment-related state (discount, verification, price, Paystack callbacks) and the 4 associated handlers should be extracted into a custom hook `usePaymentFlow()` and a `<PaymentFlow />` orchestrator component. |
| `<UserFlowGate />` | DashboardPage.tsx (680–775), MessagesPage.tsx (221–276) | The `!isProfileComplete → !hasQuestionnaire → !hasPaid` conditional rendering chain is **duplicated verbatim** between Dashboard and Messages. Extract into a shared gate component. |
| `<VerificationFlow />` | SettingsPage.tsx | 347–431 | The email verification modal (email step → code step) is 85 lines of JSX with its own state machine. Extract. |
| `<LogoutConfirm />` | SettingsPage.tsx | 433–473 | Standalone logout confirmation modal. |
| `<DeleteAccountConfirm />` | SettingsPage.tsx | 475–527 | Standalone delete confirmation modal with "type DELETE" safeguard. |
| `<ChatHeader />` | ChatPage.tsx | 328–352 | The chat header with avatar, name, online status, and report button. |
| `<ChatInput />` | ChatPage.tsx | 391–411 | The message input bar with send button. |

---

## 4. Feature-by-Feature Breakdown

### 4.1 Dashboard (`DashboardPage.tsx` — 814 lines)

**Critical Issues:**

1. **Monster Component.** 25+ `useState` calls. Manages matches, payment, discounts, verification, pioneer, dev mode, "found roommate", unlock animation — all in one file. This violates SRP catastrophically.

2. **Direct Supabase calls.** The `initializeDashboard()` function (lines 102–255) performs 5+ Supabase queries inline. No data layer abstraction. If the query shape changes, this function must be modified.

3. **Duplicated `getTierInfo()`.** This helper exists identically in both `DashboardPage.tsx` (line 43) and `MatchCard.tsx` (line 11). Should be a shared utility.

4. **State synchronization fragility.** `hasPaid` is derived from `profile?.has_paid` on mount (line 60), but then independently mutated via `setHasPaid(true)` in 5 different places (lines 137, 238, 347, 389, 479). If `refreshProfile()` runs between mutations, the local `hasPaid` state and the profile's `has_paid` field can desynchronize.

5. **Throttle logic uses a ref but triggers on profile changes.** The effect on line 286 depends on `[user, profile, authLoading, mounted, isDevMode]`. Since `profile` changes after `refreshProfile()`, every payment success → `refreshProfile()` → re-triggers `initializeDashboard()` even when matches haven't changed.

**Recommendations:**
- Extract a `useDashboardData()` hook for all match-fetching, questionnaire-checking, and pioneer-checking logic.
- Extract a `usePaymentFlow()` hook for payment, discount, and verification state.
- Create a `<MatchDashboard />` container that composes `<MatchFeed />`, `<PaymentVerificationOverlay />`, and the gating logic.
- Move `getTierInfo()` to `src/lib/utils.ts`.

### 4.2 Messages (`MessagesPage.tsx` — 353 lines)

**Issues:**

1. **Inline navigation guard.** Line 52: `if (!user) { navigate('/auth'); return }` — This navigation should be handled by `ProtectedRoute`, not duplicated in component logic.

2. **Profile status re-derivation.** Lines 14–18 derive `profileStatus` from `profile` — the same check done in DashboardPage. This is the duplicated `UserFlowGate` pattern.

3. **Real-time subscription filter uses `user?.id` instead of `profile?.id`.** Line 151: `filter: \`receiver_id=eq.${user?.id}\`` — but `user.id` is the Supabase `auth_id`, not the `users` table `id`. Messages use `users.id` as foreign keys. If these happen to differ (and they do — `auth_id` is a UUID from `auth.users`, `id` is a separate UUID from `public.users`), **the real-time subscription will never match incoming messages**. This is likely a latent bug that hasn't surfaced because the filter comparison fails silently.

4. **Stale closure on `fetchChats`.** The real-time callback (line 176) calls `fetchChats()` which closes over the initial `user` and `profile` values from the effect's first run. If the profile updates, the re-subscription happens but the callback still references old values.

**Recommendations:**
- Fix the real-time filter to use `profile?.id` instead of `user?.id`.
- Extract the `UserFlowGate` into a shared component.
- Extract chat fetching into a `useChatThreads()` hook.
- Remove the inline navigation guard.

### 4.3 Profile (`ProfilePage.tsx` — 570 lines)

**Issues:**

1. **Monster form component.** The entire file is one component with 15+ state variables, a 4-section form, an avatar modal, a full-screen saving overlay, and a match recalculation trigger.

2. **Dual storage pattern.** Profile data is saved to both `localStorage` (via `STORAGE_KEY`, line 45) and Supabase (via `handleSave`). The localStorage acts as a draft — but if the user navigates away without saving, the draft persists and can overwrite the DB-synced profile on the next visit (line 80–94 hydrates from `profile` prop, which comes from the DB, but the `getInitial()` on line 48 runs first and sets stale localStorage values as defaults).

3. **Questionnaire check inline.** Lines 97–102 perform a Supabase query for questionnaire status. This is the same check done in DashboardPage and MessagesPage.

4. **No form validation.** The `isComplete` check (line 121) only validates field presence, not format. Phone number validation is just `>= 10 chars` with no format check.

**Recommendations:**
- Extract `<ProfileForm />` as described in Section 3.
- Centralize the questionnaire check into a hook or context.
- Add proper form validation with error messages per field.
- Remove the localStorage draft pattern or make it explicit with a "Resume Draft?" prompt.

### 4.4 Settings (`SettingsPage.tsx` — 533 lines)

**Issues:**

1. **Three inline modals.** The verification modal (lines 347–431), logout modal (lines 433–473), and delete modal (lines 475–527) are all inlined with their own state and handlers. Each should be a separate component.

2. **Theme toggle is DOM-imperative.** Lines 31–41 directly manipulate `document.documentElement.classList` and `localStorage`. This should be a `useTheme()` hook that provides a `theme` value and `toggleTheme` function, co-located with the `useEffect` in `App.tsx` (lines 29–36) that reads the initial theme.

3. **No `ModalShell` usage for logout/delete.** The verification modal uses a hand-rolled bottom sheet, the logout modal uses another hand-rolled bottom sheet, and the delete modal uses a centered dialog. The app has a `<ModalShell />` component that handles all these patterns — it's not being used here.

4. **`window.location.reload()` after verification.** Line 177. This is the most aggressive possible state refresh. Should instead call `refreshProfile()` from AuthContext.

**Recommendations:**
- Extract each modal into its own file under `src/components/settings/`.
- Extract `useTheme()` hook.
- Replace `window.location.reload()` with `refreshProfile()`.
- Refactor all modals to use `<ModalShell />` or the proposed `<ConfirmModal />`.

### 4.5 Chat (`ChatPage.tsx` — 417 lines)

**Issues:**

1. **All types are `any`.** Messages: `any[]` (line 15). Other user: `any` (line 16). Payload: `any`.

2. **Optimistic update with client-side timestamps.** Line 232: `const now = new Date()` — used for the optimistic message's time. This is correct, but the server timestamp replacement on line 266 can cause message reordering in the UI if client/server clocks differ significantly.

3. **No message pagination.** All messages are fetched at once. The `.slice(-100)` on line 145 is a client-side limit, but the query on line 96 has no limit — it fetches all messages from the beginning of time on first load.

4. **LocalStorage caching for messages.** Every message update writes the full message array to `localStorage` (lines 147, 177, 268). On active chats, this can be dozens of `JSON.stringify` + `localStorage.setItem` calls per minute.

**Recommendations:**
- Define `Message`, `ChatUser`, and `ChatThread` TypeScript interfaces.
- Add server-side pagination with a `limit` clause.
- Debounce localStorage cache writes.
- Extract `useChatMessages()` hook.

---

## 5. Step-by-Step Refactoring Roadmap

> **IMPORTANT:** Each step is designed to be **small, atomic, and independently verifiable**. Each step should result in a working application with no regressions.

### Phase 1: Foundation (Type Safety & Shared Utilities)

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **1.1** | Create `src/types/database.ts` — Define `UserProfile`, `MatchRecord`, `Message`, `ChatThread`, `QuestionnaireResponse` interfaces extracted from actual Supabase table shapes. | NEW: `src/types/database.ts` | TypeScript compiles, no runtime changes. |
| **1.2** | Replace `profile: any` in `AuthContext.tsx` with `profile: UserProfile \| null`. Fix the `AuthContextType` interface. | `AuthContext.tsx` | TypeScript compiles, all consumers still work. |
| **1.3** | Move `getTierInfo()` from `DashboardPage.tsx` and `MatchCard.tsx` into `src/lib/utils.ts`. Import from shared location in both files. | `DashboardPage.tsx`, `MatchCard.tsx`, `src/lib/utils.ts` | Visual rendering unchanged. |
| **1.4** | Create `src/hooks/useTheme.ts` — Extract theme logic from `SettingsPage.tsx` and `App.tsx`. Provides `{ theme, toggleTheme }`. | NEW: `src/hooks/useTheme.ts`, `SettingsPage.tsx`, `App.tsx` | Theme toggle still works. |

### Phase 2: Auth Context Stabilization (The Critical Fix)

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **2.1** | Replace `const [lastActivity, setLastActivity] = useState(Date.now())` with `const lastActivityRef = useRef(Date.now())`. Update `handleUpdateActivity` to write to ref. Remove `lastActivity` from all dependency arrays. Remove `lastActivity` from context value (consumers don't need it). | `AuthContext.tsx` | Activity tracking works (test: wait 16 min → should auto-logout). No effect re-run cascade. |
| **2.2** | Split the monolith `useEffect` (lines 170–246) into three independent effects: (a) DB heartbeat (update `last_active`), (b) inactivity watchdog, (c) session heartbeat. Each depends only on `[user]` (not profile, not lastActivity). | `AuthContext.tsx` | All three features work independently. No console warnings. |
| **2.3** | Remove the `getSession()` call inside `initializeAuth()` (line 95). Instead, rely solely on the `INITIAL_SESSION` event from `onAuthStateChange`. Remove the `getLocalSession()` synchronous hydration or gate it behind a `isLocalHydration` flag that the `ProtectedRoute` can check. | `AuthContext.tsx` | Auth flow works: sign in → dashboard. Sign out → auth page. OAuth callback → dashboard. |
| **2.4** | Fix the stale `profile` closure in `onAuthStateChange` (line 137). Use a `profileRef` alongside the state to avoid capturing the stale `null`. | `AuthContext.tsx` | Profile loads correctly on sign-in. No double profile fetch. |
| **2.5** | Add `loading` sub-states: `isSessionLoading` and `isProfileLoading`. Allow `ProtectedRoute` to distinguish "no session yet" from "session exists but profile still loading". | `AuthContext.tsx`, `ProtectedRoute.tsx` | No flash of "Verifying Account" for returning users. |

### Phase 3: Shared UI Components

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **3.1** | Create `<FormInput />` component in `src/components/ui/FormInput.tsx`. Replace the first 3 instances in `ProfilePage.tsx`. | NEW: `src/components/ui/FormInput.tsx`, `ProfilePage.tsx` | Profile form renders identically. |
| **3.2** | Create `<ActionButton />` component (the large CTA pattern). Replace instances in `ProfilePage.tsx` and `AuthPage.tsx`. | NEW: `src/components/ui/ActionButton.tsx`, `ProfilePage.tsx`, `AuthPage.tsx` | Buttons render identically. |
| **3.3** | Create `<PillToggle />` component. Replace gender selector and match pref selector in `ProfilePage.tsx`. | NEW: `src/components/ui/PillToggle.tsx`, `ProfilePage.tsx` | Toggles work identically. |
| **3.4** | Create `<ConfirmModal />` using `<ModalShell />`. Replace the logout and delete modals in `SettingsPage.tsx`. | NEW: `src/components/ui/ConfirmModal.tsx`, `SettingsPage.tsx` | Modals animate and function identically. |
| **3.5** | Create `<SectionHeader />` component. Replace section labels across `ProfilePage.tsx` and `SettingsPage.tsx`. | NEW: `src/components/ui/SectionHeader.tsx`, `ProfilePage.tsx`, `SettingsPage.tsx` | Labels render identically. |

### Phase 4: Feature Decomposition — Dashboard

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **4.1** | Extract `usePaymentFlow()` hook — owns all of: `discountCode`, `isApplyingDiscount`, `discountApplied`, `discountError`, `finalPrice`, `isVerifyingPayment`, `verifyCountdown`, `showPaymentFallback`, `isCheckingPayment`, `isUnlocking`, `unlockedCount`, and their associated handlers. | NEW: `src/hooks/usePaymentFlow.ts`, `DashboardPage.tsx` | Payment flow works: apply discount → pay → verify → unlock animation. |
| **4.2** | Extract `useDashboardData()` hook — owns `matches`, `isLoading`, `hasQuestionnaire`, `hasPaid`, `isPioneerUser`, `initializeDashboard`, `forceRecalculate`. | NEW: `src/hooks/useDashboardData.ts`, `DashboardPage.tsx` | Dashboard loads matches. Pull-to-refresh works. |
| **4.3** | Create `<UserFlowGate />` component — The `!isProfileComplete → !hasQuestionnaire → !hasPaid` conditional chain. Used by both DashboardPage and MessagesPage. | NEW: `src/components/UserFlowGate.tsx`, `DashboardPage.tsx`, `MessagesPage.tsx` | Gating logic works identically on both pages. |
| **4.4** | Extract `<PioneerBanner />` component from DashboardPage lines 614–635. | NEW: `src/components/dashboard/PioneerBanner.tsx`, `DashboardPage.tsx` | Pioneer banner renders correctly. |

### Phase 5: Feature Decomposition — Settings & Profile

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **5.1** | Extract `<VerificationModal />` from SettingsPage (lines 347–431). | NEW: `src/components/settings/VerificationModal.tsx`, `SettingsPage.tsx` | Verification flow works end-to-end. |
| **5.2** | Extract `<ProfileForm />` from ProfilePage. The parent page becomes a thin shell that provides the data and handles navigation. | NEW: `src/components/profile/ProfileForm.tsx`, `ProfilePage.tsx` | Profile save works. Avatar modal works. |
| **5.3** | Remove the duplicate `src/components/ui/Sidebar.tsx`. Consolidate into the single `src/components/dashboard/Sidebar.tsx` which is the more complete version (includes avatar display). | DELETE: `src/components/ui/Sidebar.tsx`, UPDATE: `DashboardLayout.tsx` import path if needed. | Desktop sidebar renders with avatar for complete profiles. |

### Phase 6: Messages & Chat Hardening

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **6.1** | Fix the real-time subscription filter in MessagesPage — change `user?.id` to `profile?.id` on line 151. | `MessagesPage.tsx` | Real-time messages appear in thread list without requiring page refresh. |
| **6.2** | Extract `useChatMessages()` hook from ChatPage. Owns messages, real-time subscription, sending, caching. | NEW: `src/hooks/useChatMessages.ts`, `ChatPage.tsx` | Chat works: send, receive, real-time, read receipts. |
| **6.3** | Extract `<ChatHeader />` and `<ChatInput />` from ChatPage. | NEW: `src/components/chat/ChatHeader.tsx`, `src/components/chat/ChatInput.tsx`, `ChatPage.tsx` | Chat page renders identically. |
| **6.4** | Add server-side pagination to chat queries (e.g., `limit(50)` with "load more" scroll detection). | `useChatMessages.ts` | Performance improves for long conversations. |

### Phase 7: Final Polish

| Step | Action | Files Affected | Verification |
|---|---|---|---|
| **7.1** | Create `src/hooks/useUserFlowStatus.ts` — centralizes the "is profile complete?", "has questionnaire?", "has paid?" checks into one hook that reads from AuthContext. All pages consume this instead of re-deriving. | NEW: `src/hooks/useUserFlowStatus.ts`, `DashboardPage.tsx`, `MessagesPage.tsx`, `ProfilePage.tsx` | All pages display correct flow state. |
| **7.2** | Replace `window.location.reload()` in SettingsPage verification with `refreshProfile()`. | `SettingsPage.tsx` | Verification badge appears without full page reload. |
| **7.3** | Audit and type all remaining `any` usages. Target: zero `any` in component props and hook return types. | Multiple files | `tsc --noEmit` passes with strict mode. |
| **7.4** | Run production build. Verify no regressions. | — | `npm run build` succeeds with zero errors. |

---

## Appendix A: Duplicate Sidebar Components

There are **two** `Sidebar.tsx` files:

1. `src/components/ui/Sidebar.tsx` (70 lines) — Basic version, links to `/` for brand.
2. `src/components/dashboard/Sidebar.tsx` (90 lines) — Enhanced version, links to `/dashboard`, shows avatar, includes phone in completion check.

The `DashboardLayout.tsx` imports from `./dashboard/Sidebar`, making the `ui/Sidebar.tsx` an orphan that should be deleted.

## Appendix B: Hardcoded Payment Amount

The payment amount `25` (GHS) is hardcoded in:
- `DashboardPage.tsx` line 83: `const [finalPrice, setFinalPrice] = useState(25)`
- `MessagesPage.tsx` line 271: `"Unlock your matches for GHS 25"`
- `ChatPage.tsx` line 315: `"Unlock your matches for GHS 25"`

This should be a shared constant in `src/lib/constants.ts`.

## Appendix C: Auth Flow Diagram (Current State)

```
main.tsx
  └─ AuthProvider (wraps everything)
       ├─ getLocalSession() → optimistic session (may be stale/expired)
       ├─ useEffect #1: initializeAuth
       │    ├─ getSession() ← CAN RACE WITH onAuthStateChange
       │    └─ fetchProfile()
       ├─ onAuthStateChange
       │    ├─ INITIAL_SESSION → fetchProfile() ← DUPLICATE
       │    ├─ SIGNED_IN → fetchProfile()
       │    ├─ TOKEN_REFRESHED → updates session
       │    └─ SIGNED_OUT → clears all
       └─ useEffect #2: Activity/Watchdog/Heartbeat
            ├─ deps: [user, profile, lastActivity] ← PROBLEM
            ├─ Activity heartbeat (2min) ← RESET CONSTANTLY
            ├─ Inactivity watchdog (15min) ← NEVER FIRES
            └─ Session heartbeat (5min) ← RESET CONSTANTLY
```

## Appendix D: File Size Distribution (Pages with Lines > 300)

| File | Lines | Status |
|---|---|---|
| `DashboardPage.tsx` | 814 | 🔴 Needs decomposition |
| `ProfilePage.tsx` | 570 | 🟠 Needs decomposition |
| `SettingsPage.tsx` | 533 | 🟠 Needs decomposition |
| `ChatPage.tsx` | 417 | 🟡 Extract hooks |
| `AuthPage.tsx` | 361 | 🟢 Acceptable with `DirectionalHoverButton` extraction |
| `MessagesPage.tsx` | 353 | 🟡 Extract hook + fix bug |
| `LandingPage.tsx` | 1038* | Out of scope (standalone marketing) |

---

*End of Refactoring Plan*
