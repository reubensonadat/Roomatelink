# 👤 PROFILE PAGE REFACTORING PLAN
**File:** [`src/pages/ProfilePage.tsx`](../src/pages/ProfilePage.tsx)
**Current Lines:** 390 (MUST be split — exceeds 300-line limit)
**Date:** April 1, 2026

---

## 🔍 CURRENT STATE ANALYSIS

### File Structure:
```typescript
// Imports (lines 1-8)
// Avatar Constants (lines 9-30)
// Main Component (lines 32-390)
```

### State Variables (12 total):
1. `gender` — Selected gender (M/F)
2. `level` — Selected level (100-600)
3. `matchPref` — Gender preference (same/any)
4. `selectedAvatar` — Selected avatar URL
5. `displayName` — Display name input
6. `course` — Course input
7. `bio` — Short bio textarea
8. `phone` — Phone number input
9. `matchingStatus` — ACTIVE/HIDDEN/COMPLETED
10. `isSaving` — Save loading state
11. `mounted` — Component mount state

### Helper Functions (1):
- None (all logic inline)

### Handler Functions (2):
1. `handleGenderChange()` — Updates gender and resets avatar
2. `handleSave()` — Saves profile to Supabase

### Key Features:
1. **Avatar Selection** — Choose from 16 preset avatars (8 male, 8 female)
2. **Gender Selection** — Male/Female toggle
3. **Profile Form** — Display name, phone, course, bio
4. **Matching Status** — ACTIVE/HIDDEN/COMPLETED toggle
5. **Save Button** — Validates and saves to database
6. **Loading Overlay** — "Securing Identity" animation

---

## 📋 COMPONENT SPLIT PLAN

### Priority 1: Create Profile Components Folder
```
src/components/profile/
├── ProfileHeader.tsx
├── AvatarSelector.tsx
├── ProfileForm.tsx
├── MatchingStatusToggle.tsx
└── LoadingOverlay.tsx
```

### Component 1: ProfileHeader.tsx
**Purpose:** Top navigation and back button
**Lines:** ~60-80

**Features:**
- Back button (navigate to dashboard)
- Page title ("Profile Setup")
- Progress indicator (optional)

**Props to Extract:**
```typescript
interface ProfileHeaderProps {
  onSave: () => void
  isSaving: boolean
}
```

**State to Manage:**
- None (pure presentational component)

---

### Component 2: AvatarSelector.tsx
**Purpose:** Avatar selection with gender filtering
**Lines:** ~100-150

**Features:**
- Gender toggle (Male/Female)
- Avatar grid (8 avatars per gender)
- Selected avatar highlight
- Upload button (for custom photos)
- Preview of selected avatar

**Props to Extract:**
```typescript
interface AvatarSelectorProps {
  gender: 'M' | 'F' | null
  selectedAvatar: string | null
  onGenderChange: (gender: 'M' | 'F') => void
  onAvatarSelect: (avatar: string) => void
}
```

**State to Manage:**
- None (controlled by parent)

---

### Component 3: ProfileForm.tsx
**Purpose:** Core profile information inputs
**Lines:** ~100-150

**Features:**
- Display name input
- Phone number input
- Course selection (100-600)
- Short bio textarea
- Validation indicators
- Privacy note for phone number

**Props to Extract:**
```typescript
interface ProfileFormProps {
  displayName: string
  phone: string
  course: string
  bio: string
  onDisplayNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onCourseChange: (value: string) => void
  onBioChange: (value: string) => void
}
```

**State to Manage:**
- None (controlled by parent)

---

### Component 4: MatchingStatusToggle.tsx
**Purpose:** Toggle between ACTIVE/HIDDEN/COMPLETED
**Lines:** ~80-120

**Features:**
- Three status options (Active, Hidden, Completed)
- Visual indicators for each state
- Explanatory text for each state
- Active/Hidden: Animated icons
- Completed: Success state

**Props to Extract:**
```typescript
interface MatchingStatusToggleProps {
  status: 'ACTIVE' | 'HIDDEN' | 'COMPLETED'
  onStatusChange: (status: 'ACTIVE' | 'HIDDEN' | 'COMPLETED') => void
}
```

**State to Manage:**
- None (controlled by parent)

---

### Component 5: LoadingOverlay.tsx
**Purpose:** Save loading animation
**Lines:** ~50-70

**Features:**
- Spinner animation
- "Securing Identity" text
- Pulse effect

**Props to Extract:**
```typescript
interface LoadingOverlayProps {
  show: boolean
}
```

**State to Manage:**
- None (controlled by parent)

---

## 🔄 REFACTORED PROFILE PAGE STRUCTURE

After splitting, [`ProfilePage.tsx`](../src/pages/ProfilePage.tsx) should be ~150-200 lines:

```typescript
// Imports (lines 1-15)
// Types (lines 16-25)
// Main Component (lines 26-200)

export function ProfilePage() {
  // State (lines 30-60)
  const { user } = useAuth()
  const [gender, setGender] = useState<'M' | 'F' | null>(null)
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500' | '600' | null>(null)
  const [matchPref, setMatchPref] = useState<'same' | 'any' | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [course, setCourse] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [matchingStatus, setMatchingStatus] = useState<'ACTIVE' | 'HIDDEN' | 'COMPLETED'>('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Effects (lines 61-90)
  // Load profile from database, save to localStorage

  // Handlers (lines 91-120)
  // handleGenderChange, handleSave

  // Render (lines 121-200)
  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader onSave={handleSave} isSaving={isSaving} />
      
      <AvatarSelector {...avatarSelectorProps} />
      
      <ProfileForm {...profileFormProps} />
      
      <MatchingStatusToggle {...matchingStatusProps} />
      
      {isSaving && (
        <LoadingOverlay show={true} />
      )}
    </div>
  )
}
```

---

## 🎯 EXECUTION ORDER

### Step 1: Create Component Folder
```bash
mkdir -p src/components/profile
```

### Step 2: Create Components (In Order)
1. `ProfileHeader.tsx` — Pure presentational, no state
2. `AvatarSelector.tsx` — Avatar grid with gender toggle
3. `ProfileForm.tsx` — All input fields
4. `MatchingStatusToggle.tsx` — Status toggle with animations
5. `LoadingOverlay.tsx` — Loading animation

### Step 3: Refactor ProfilePage
- Import all new components
- Extract all state
- Keep all effects
- Keep all handlers
- Replace inline JSX with component references
- Ensure max 300 lines

### Step 4: Test
- Verify all features work
- Test gender switching
- Test avatar selection
- Test form validation
- Test save to database
- Test loading states

---

## ⚠️ CRITICAL NOTES

### 1. Avatar Constants
**Current:** Defined inline in ProfilePage
**Action:** Move to `src/components/profile/avatars.ts` and import

### 2. Form Validation
**Current:** Basic validation (isComplete check)
**Action:** Consider adding:
- Phone number format validation (Ghana format: 054...)
- Minimum length requirements
- Maximum length limits

### 3. Matching Status Logic
**Current:** Simple toggle
**Action:** Ensure status changes trigger appropriate database updates

### 4. Save Flow
**Current:** Upsert or insert based on existence
**Action:** Keep as-is, works correctly

### 5. Loading Animation
**Current:** Simple overlay with spinner
**Action:** Keep as-is, works correctly

---

## 📊 ESTIMATED LINES AFTER REFACTORING

| Component | Est. Lines | Status |
|-----------|-------------|--------|
| ProfileHeader | 60-80 | New |
| AvatarSelector | 100-150 | New |
| ProfileForm | 100-150 | New |
| MatchingStatusToggle | 80-120 | New |
| LoadingOverlay | 50-70 | New |
| ProfilePage (refactored) | 150-200 | Refactored |
| **TOTAL** | **440-620** | **All < 300** |

**Original:** 390 lines → **Refactored:** ~200 lines (49% reduction)

---

## 🎯 NEXT ACTIONS

1. **Create `src/components/profile/` folder**
2. **Create all 5 components** (one at a time)
3. **Refactor ProfilePage** to use new components
4. **Test complete flow** from auth to profile save
5. **Verify database updates** work correctly

---

**This plan ensures ProfilePage is maintainable, testable, and follows the 300-line component limit.**
