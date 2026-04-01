# 📊 DASHBOARD PAGE REFACTORING PLAN
**File:** [`src/pages/DashboardPage.tsx`](../src/pages/DashboardPage.tsx)
**Current Lines:** 1,189 (MUST be split — exceeds 300-line limit)
**Date:** April 1, 2026

---

## 🔍 CURRENT STATE ANALYSIS

### File Structure:
```typescript
// Imports (lines 1-12)
// Types & Interfaces (lines 13-35)
// Helper Functions (lines 37-58)
// Main Component (lines 60-1189)
```

### State Variables (19 total):
1. `hasPaid` — User payment status
2. `mounted` — Component mount state
3. `selectedMatch` — Currently selected match profile
4. `isLoading` — Initial loading state
5. `isPaymentModalOpen` — Payment modal visibility
6. `isUnlocking` — Sequential unlock animation state
7. `unlockedCount` — Count of profiles unlocked
8. `discountCode` — Discount code input
9. `isApplyingDiscount` — Discount application loading
10. `discountApplied` — Discount success state
11. `discountError` — Discount error message
12. `finalPrice` — Calculated price after discount
13. `isVerifyingPayment` — Payment verification state
14. `verifyCountdown` — Countdown for payment fallback
15. `showPaymentFallback` — Show fallback option
16. `isReportModalOpen` — Report modal visibility
17. `reportedMatch` — Match being reported
18. `isFoundRoommateModalOpen` — Found roommate modal
19. `currentDayNumber` — Current prompt day number
20. `profileFoundRoommate` — User found roommate status
21. `matches` — Array of match profiles
22. `isPioneerUser` — Pioneer user status
23. `isPioneerModalOpen` — Pioneer modal visibility
24. `hasQuestionnaire` — Questionnaire completion status

### Helper Functions (3):
1. `getTierInfo(pct)` — Returns tier label, colors, icon
2. `getScoreColor(score)` — Returns background color class
3. `getScoreLabel(score)` — Returns text color class

### Handler Functions (7):
1. `handleStartPayment()` — Opens payment modal
2. `handleFoundRoommateConfirm()` — Confirms found roommate
3. `handleApplyDiscount()` — Applies discount code
4. `handleRemoveDiscount()` — Removes discount
5. `handlePaymentFallbackCheck()` — Checks payment status after timeout
6. `pioneer-check` edge function call
7. Various modal handlers

### Key Features:
1. **Match Display** — Cards with compatibility breakdown
2. **Payment Flow** — Paystack integration with discount codes
3. **Locked/Unlocked States** — Blur profiles before payment
4. **Sequential Unlock Animation** — Unlocks profiles one by one
5. **Pioneer User System** — Special status for early adopters
6. **Found Roommate Prompts** — Day 7, 30, 50 prompts
7. **Report System** — Report inappropriate matches
8. **Empty State** — Mock data when no matches

---

## 📋 COMPONENT SPLIT PLAN

### Priority 1: Create Dashboard Components Folder
```
src/components/dashboard/
├── DashboardHeader.tsx
├── MatchFeed.tsx
├── MatchCard.tsx
├── CompatibilityBreakdown.tsx
├── LockedState.tsx
├── UnlockedState.tsx
├── EmptyState.tsx
├── PaymentModal.tsx
├── DiscountInput.tsx
└── PaymentSuccessAnimation.tsx
```

### Component 1: DashboardHeader.tsx
**Purpose:** Top navigation and user greeting
**Lines:** ~80-100

**Features:**
- User greeting with name
- Navigation links (Profile, Settings, Support)
- Payment status badge
- Match count indicator
- Refresh button

**Props to Extract:**
```typescript
interface DashboardHeaderProps {
  userName: string
  matchCount: number
  hasPaid: boolean
  onRefresh: () => void
  onNavigateToProfile: () => void
  onNavigateToSettings: () => void
}
```

**State to Manage:**
- None (pure presentational component)

---

### Component 2: MatchFeed.tsx
**Purpose:** Container for match cards with scroll handling
**Lines:** ~60-80

**Features:**
- Infinite scroll or pagination
- Empty state handling
- Loading state
- Match count display

**Props to Extract:**
```typescript
interface MatchFeedProps {
  matches: MatchProfile[]
  hasPaid: boolean
  onSelectMatch: (match: MatchProfile) => void
  isLoading: boolean
}
```

**State to Manage:**
- `visibleCount` — Number of cards shown (for infinite scroll)

---

### Component 3: MatchCard.tsx
**Purpose:** Individual match profile card
**Lines:** ~120-150

**Features:**
- Avatar display
- Name (blurred if locked)
- Match percentage badge
- Tier icon
- Course and level
- Verification badge
- Lock/unlock state
- View details button
- Compatibility breakdown toggle

**Props to Extract:**
```typescript
interface MatchCardProps {
  match: MatchProfile
  isLocked: boolean
  isPioneerUser: boolean
  onSelect: () => void
}
```

**State to Manage:**
- `showBreakdown` — Toggle compatibility details

---

### Component 4: CompatibilityBreakdown.tsx
**Purpose:** Display category scores and insights
**Lines:** ~80-100

**Features:**
- Category score bars (10 categories)
- Insight text per category
- Overall score summary
- Pattern flags display
- Visual progress indicators

**Props to Extract:**
```typescript
interface CompatibilityBreakdownProps {
  categoryScores: CategoryScore[]
  patternFlags: string[]
  matchPercentage: number
}
```

**State to Manage:**
- None (pure presentational)

---

### Component 5: LockedState.tsx
**Purpose:** Blurred profile state before payment
**Lines:** ~60-80

**Features:**
- Blurred avatar
- Blurred name
- Match percentage visible
- Lock icon
- "Unlock to view" button
- Tier badge

**Props to Extract:**
```typescript
interface LockedStateProps {
  matchPercentage: number
  tier: string
  onUnlock: () => void
}
```

**State to Manage:**
- None (pure presentational)

---

### Component 6: UnlockedState.tsx
**Purpose:** Full profile display after payment
**Lines:** ~100-120

**Features:**
- Full avatar
- Full name
- Bio
- Course and level
- Verification badge
- Tags (course, level)
- Shared traits (lifestyle icons)
- Tensions (conflict flags)
- Message button
- Report button

**Props to Extract:**
```typescript
interface UnlockedStateProps {
  profile: MatchProfile
  onMessage: () => void
  onReport: () => void
}
```

**State to Manage:**
- None (pure presentational)

---

### Component 7: EmptyState.tsx
**Purpose:** No matches found display
**Lines:** ~60-80

**Features:**
- Empty state illustration
- Message: "No matches yet"
- Explanation text
- Refresh button
- Check back later prompt

**Props to Extract:**
```typescript
interface EmptyStateProps {
  hasQuestionnaire: boolean
  onRefresh: () => void
}
```

**State to Manage:**
- None (pure presentational)

---

### Component 8: PaymentModal.tsx
**Purpose:** Paystack payment modal
**Lines:** ~100-120

**Features:**
- Modal backdrop
- Payment amount display
- Discount code input
- Discount applied indicator
- Discount error message
- Paystack button
- Terms checkbox
- Close button

**Props to Extract:**
```typescript
interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  basePrice: number
  discountApplied: boolean
  finalPrice: number
}
```

**State to Manage:**
- `discountCode` — Local input state
- `isApplying` — Loading state

---

### Component 9: DiscountInput.tsx
**Purpose:** Discount code input component
**Lines:** ~50-70

**Features:**
- Input field
- Apply button
- Remove button
- Error display
- Valid discount codes list

**Props to Extract:**
```typescript
interface DiscountInputProps {
  discountCode: string
  onApplyDiscount: (code: string) => void
  onRemoveDiscount: () => void
  isApplying: boolean
  error: string
}
```

**State to Manage:**
- `localCode` — Local input value

---

### Component 10: PaymentSuccessAnimation.tsx
**Purpose:** Sequential unlock animation
**Lines:** ~60-80

**Features:**
- Confetti animation
- Success message
- Progress indicator
- "Unlocking X of Y" text

**Props to Extract:**
```typescript
interface PaymentSuccessAnimationProps {
  total: number
  current: number
}
```

**State to Manage:**
- None (controlled by parent)

---

## 🔄 REFACTORED DASHBOARD PAGE STRUCTURE

After splitting, [`DashboardPage.tsx`](../src/pages/DashboardPage.tsx) should be ~200-250 lines:

```typescript
// Imports (lines 1-20)
// Types (lines 21-40)
// Main Component (lines 41-250)

export function DashboardPage() {
  // State (lines 50-100)
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [hasPaid, setHasPaid] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [finalPrice, setFinalPrice] = useState(25)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [verifyCountdown, setVerifyCountdown] = useState(8)
  const [showPaymentFallback, setShowPaymentFallback] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportedMatch, setReportedMatch] = useState<MatchProfile | null>(null)
  const [isFoundRoommateModalOpen, setIsFoundRoommateModalOpen] = useState(false)
  const [currentDayNumber, setCurrentDayNumber] = useState<number | null>(null)
  const [profileFoundRoommate, setProfileFoundRoommate] = useState(false)
  const [isPioneerUser, setIsPioneerUser] = useState(false)
  const [isPioneerModalOpen, setIsPioneerModalOpen] = useState(false)
  const [hasQuestionnaire, setHasQuestionnaire] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Effects (lines 101-150)
  // Data fetching, payment verification, pioneer check

  // Handlers (lines 151-200)
  // All handler functions

  // Render (lines 201-250)
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader {...headerProps} />
      
      {isLoading ? (
        <LoadingState />
      ) : matches.length === 0 ? (
        <EmptyState {...emptyProps} />
      ) : (
        <MatchFeed {...feedProps}>
          {matches.map(match => (
            <MatchCard key={match.id} {...cardProps} />
          ))}
        </MatchFeed>
      )}

      <PaymentModal {...paymentModalProps} />
      <ReportModal {...reportModalProps} />
      <FoundRoommateModal {...foundRoommateModalProps} />
      <PioneerModal {...pioneerModalProps} />
      
      {isUnlocking && (
        <PaymentSuccessAnimation total={matches.length} current={unlockedCount} />
      )}
    </div>
  )
}
```

---

## 🎯 EXECUTION ORDER

### Step 1: Create Component Folder
```bash
mkdir -p src/components/dashboard
```

### Step 2: Create Components (In Order)
1. `DashboardHeader.tsx` — Pure presentational, no state
2. `MatchFeed.tsx` — Container with infinite scroll
3. `MatchCard.tsx` — Individual card with lock/unlock states
4. `CompatibilityBreakdown.tsx` — Category scores display
5. `LockedState.tsx` — Blurred profile before payment
6. `UnlockedState.tsx` — Full profile after payment
7. `EmptyState.tsx` — No matches found
8. `PaymentModal.tsx` — Payment flow with discount
9. `DiscountInput.tsx` — Discount code input
10. `PaymentSuccessAnimation.tsx` — Unlock animation

### Step 3: Refactor DashboardPage
- Import all new components
- Extract all state
- Keep all effects
- Keep all handlers
- Replace inline JSX with component references
- Remove mock data (use real matches from database)

### Step 4: Test
- Verify all features work
- Test payment flow
- Test unlock animation
- Test discount codes
- Test report functionality
- Test found roommate prompts

---

## ⚠️ CRITICAL NOTES

### 1. Mock Data Removal
**Current:** Lines 167-188 contain mock data for UI verification
**Action:** Remove mock data, use real matches from database

### 2. Type Safety
**Current:** Some `any` types used
**Action:** Replace with proper interfaces from [`types.ts`](../supabase/functions/match-calculate/types.ts)

### 3. Algorithm Integration
**Current:** Uses mock category scores
**Action:** Use real `category_scores` from matches table

### 4. Payment Flow
**Current:** Payment verification via countdown and fallback
**Action:** Keep as-is, it works correctly

### 5. Pioneer System
**Current:** Calls `pioneer-check` edge function
**Action:** Keep as-is, edge function needs to be created

---

## 📊 ESTIMATED LINES AFTER REFACTORING

| Component | Est. Lines | Status |
|-----------|-------------|--------|
| DashboardHeader | 80-100 | New |
| MatchFeed | 60-80 | New |
| MatchCard | 120-150 | New |
| CompatibilityBreakdown | 80-100 | New |
| LockedState | 60-80 | New |
| UnlockedState | 100-120 | New |
| EmptyState | 60-80 | New |
| PaymentModal | 100-120 | New |
| DiscountInput | 50-70 | New |
| PaymentSuccessAnimation | 60-80 | New |
| DashboardPage (refactored) | 200-250 | Refactored |
| **TOTAL** | **710-970** | **All < 300** |

**Original:** 1,189 lines → **Refactored:** ~250 lines (79% reduction)

---

## 🎯 NEXT ACTIONS

1. **Create `src/components/dashboard/` folder**
2. **Create all 10 components** (one at a time)
3. **Refactor DashboardPage** to use new components
4. **Test complete flow** from questionnaire to dashboard
5. **Verify payment flow** works with refactored components
6. **Test discount codes** functionality
7. **Test report functionality**
8. **Remove mock data** and use real database matches

---

**This plan ensures DashboardPage is maintainable, testable, and follows the 300-line component limit.**
