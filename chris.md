UI/UX Designer Handoff — CRITICAL CONSTRAINTS
Date: 2026-04-11
Status: LOCKED — Do not modify without consulting the Principal Architect

SECTION 1: FILES YOUR AGENT MUST NEVER TOUCH
These files contain critical state physics, authentication logic, database queries,and data flow architecture. Changing ANY line in these files — even a className,even a comment, even "just reformatting" — risks introducing race conditions,stale closures, or silent data loss. Your agent has demonstrated it cannot safelymodify these files. DO NOT LET IT TRY.

🔴 ABSOLUTELY FORBIDDEN — ZERO CHANGES
File	Why It's Poisoned
src/context/AuthContext.tsx	Contains 13 atomic fixes for session initialization, token refresh, watchdog systems, and failsafe timeouts. Every line is load-bearing. A single misplaced useEffect dependency or wrong useState initial value breaks authentication for every user.
src/components/ProtectedRoute.tsx	Contains the isInitializing gate that prevents the app from rendering before auth is verified. Changing the timeout, the loading condition, or the render logic will cause either permanent loading screens or unauthenticated access to protected routes.
src/pages/ProfilePage.tsx	Contains the profile save pipeline with refreshProfile(true), the questionnaire guard on match recalculation, localStorage hydration logic for gender/level/matchPref, and the single overlay with progress bar. The save flow has specific step sequencing (Handshake → Verification → Finalizing) that must not be disturbed.
src/hooks/useDashboardData.ts	Contains dual-side match queries with explicit constraint names, sessionStorage caching, 8s timeout failsafe, 30s throttle logic, and the questionnaire cache initialization. Changing any query, any state initialization, or any timing value will cause either silent data loss or infinite loading.
src/hooks/useUserFlowStatus.ts	Derives isProfileComplete and hasPaid from AuthContext.profile. These are the single source of truth for the entire app's gating logic. Changing the derivation conditions will cause gates to fire at wrong times.
🟠 DO NOT TOUCH WITHOUT ARCHITECT APPROVAL
File	Why It Needs Care
src/components/ui/ModalShell.tsx	Has desktop drag persistence with localStorage. The drag/animation props are tightly coupled. Changing animation parameters or removing drag logic will break modal positioning.
src/components/dashboard/UserFlowGate.tsx	Gates match display behind profile completion, questionnaire, and payment. Changing the gate conditions will show matches to users who shouldn't see them.
src/components/dashboard/MatchFeed.tsx	Contains the locked/unlocked card logic (`isRevealed = hasPaid
src/components/dashboard/EmptyState.tsx	Differentiates pioneer users from regular users. The conditional rendering must stay accurate.
src/hooks/usePaymentFlow.ts	Contains Paystack integration, verification retry logic with exponential backoff, and discount code handling. Any change to the payment flow risks either failed payments or free access bypass.
src/lib/supabase.ts	Supabase client configuration. Changing options affects ALL database queries and auth flows app-wide.
SECTION 2: WHAT YOU CAN SAFELY MODIFY
✅ Safe Changes (Styling Only)
You MAY change these things in files NOT listed in Section 1:

Change Type	Example	Safe Because
Tailwind utility classes	rounded-xl → rounded-2xl	Pure CSS, no logic impact
Text content	"Synchronize Identity" → "Save Profile"	No state dependency
Font sizes and weights	text-[16px] → text-[18px]	Pure CSS
Spacing and padding	p-6 → p-8, gap-4 → gap-6	Pure CSS
Colors within design tokens	bg-primary → bg-indigo-600	Follows design system
Icon choices	<User size={20} /> → <UserCheck size={20} />	Import change only
Dark mode tokens	bg-background stays, bg-card stays	Semantic tokens are safe
⚠️ Changes That Need Architect Review
Change Type	Risk	Example
Framer Motion parameters	Can break page transitions	Changing duration: 0.35 to duration: 2
z-index values	Can cause overlay layering bugs	Changing z-[9999] to z-[50]
Component structure	Can break AnimatePresence exit animations	Wrapping a div differently
Overflow/scroll behavior	Can hide content on small screens	Adding overflow-hidden to a scrollable container
Responsive breakpoints	Can break mobile layout	Changing md: breakpoints
❌ Changes That Are NEVER Safe (Even In "Safe" Files)
Change	Why It Breaks Things
Adding useState or useEffect	Introduces state physics you don't understand
Adding onClick handlers with logic	State mutations belong to the architect
Changing key props on mapped elements	Breaks React reconciliation and AnimatePresence
Adding/removing AnimatePresence wrappers	Breaks exit animations
Changing condition ? A : B rendering order	Can cause gates to render in wrong sequence
Adding className with conditional logic like isOpen && '...'	State-dependent styling belongs to architect
SECTION 3: FILES YOU CAN FREELY MODIFY
These files are pure presentation with minimal or no state logic:

File	What It Contains
src/pages/LandingPage.tsx	Marketing page, no auth dependency
src/components/layout/TopHeader.tsx	Static header with back button
src/components/ui/ActionButton.tsx	Reusable button component
src/components/ui/FormInput.tsx	Reusable input component
src/components/ui/PillToggle.tsx	Reusable toggle component
src/components/ui/OrbitalLoader.tsx	Animation component
src/components/ui/DrawingHouseLoader.tsx	Animation component
src/components/ui/PremiumAuthLoader.tsx	Loading screen component
tailwind.config.ts	Design system tokens
index.html	Meta tags
public/manifest.json	PWA manifest
Any CSS files	Global styles

| `src/hooks/useChatThreads.ts` | WebSocket subscription for thread list. 
  Channel cleanup in effect return is load-bearing. Do not restructure the 
  useEffect or move the subscription outside it. |
| `src/hooks/useChatMessages.ts` | WebSocket subscription for active chat. 
  Contains foreground delta sync on visibility change, debounced localStorage 
  writes, and typing indicator broadcast. The cleanup function removes the 
  channel AND event listeners AND three timeouts. Do not touch any of these. |

SECTION 4: THE RULE
If your agent wants to modify a file listed in Section 1, STOP.If your agent wants to add state logic to a file listed in Section 3, STOP.If your agent says "I just need to tweak one line" in a poisoned file, STOP.

Bring the request to the Principal Architect. They will either:

Make the change themselves (correctly)
Tell you it's safe for you to make
Tell you it's not worth the risk
There are no exceptions to this rule.

