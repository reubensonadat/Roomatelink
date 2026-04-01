# ⚙️ SETTINGS PAGE REFACTORING PLAN
**File:** [`src/pages/SettingsPage.tsx`](../src/pages/SettingsPage.tsx)
**Current Lines:** 456 (MUST be split — exceeds 300-line limit)
**Date:** April 1, 2026

---

## 🔍 CURRENT STATE ANALYSIS

### File Structure:
```typescript
// Imports (lines 1-8)
// Avatar Constants (lines 9-30)
// Main Component (lines 32-456)
```

### State Variables (12 total):
1. `theme` — Light/Dark mode toggle
2. `isLogoutOpen` — Logout modal visibility
3. `isLoggingOut` — Logout loading state
4. `isDeleteOpen` — Delete account modal visibility
5. `deleteInput` — "DELETE" confirmation input
6. `isDeleting` — Delete loading state
7. `isVerifyModalOpen` — Email verification modal visibility
8. `manualEmail` — Manual email input for verification
9. `isVerifying` — Verification loading state
10. `isResetting` — Password reset loading state

### Handler Functions (5):
1. `toggleTheme()` — Switches between light/dark mode
2. `handleLogout()` — Signs user out and redirects to auth
3. `handleDeleteAccount()` — Deletes account with confirmation
4. `handlePasswordReset()` — Resets password via email
5. `handleVerifyEmail()` — Verifies student email

### Key Features:
1. **Theme Toggle** — Light/Dark mode with localStorage persistence
2. **Account Settings** — Delete account with "DELETE" confirmation
3. **Password Reset** — Email reset with redirect to dashboard
4. **Email Verification** — Manual student email verification
5. **Support Links** — Links to Support, Privacy, Terms pages
6. **Logout** — Sign out with confirmation modal

---

## 📋 COMPONENT SPLIT PLAN

### Priority 1: Create Settings Components Folder
```
src/components/settings/
├── SettingsHeader.tsx
├── ThemeToggle.tsx
├── AccountSettings.tsx
├── PasswordReset.tsx
├── EmailVerification.tsx
├── DeleteAccount.tsx
└── SupportLinks.tsx
```

### Component 1: SettingsHeader.tsx
**Purpose:** Top navigation and page title
**Lines:** ~60-80

**Features:**
- Back button (navigate to dashboard)
- Page title ("Settings")
- Logout button

**Props to Extract:**
```typescript
interface SettingsHeaderProps {
  onLogout: () => void
}
```

**State to Manage:**
- None (pure presentational component)

---

### Component 2: ThemeToggle.tsx
**Purpose:** Light/Dark mode toggle
**Lines:** ~80-120

**Features:**
- Theme switch button
- Icon display (Sun for light, Moon for dark)
- Current mode indicator
- Visual feedback on hover

**Props to Extract:**
```typescript
interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggleTheme: (theme: 'light' | 'dark') => void
}
```

**State to Manage:**
- None (controlled by parent)

---

### Component 3: AccountSettings.tsx
**Purpose:** Account management section
**Lines:** ~60-80

**Features:**
- Account settings heading
- Delete account button (opens confirmation modal)
- Description text

**Props to Extract:**
```typescript
interface AccountSettingsProps {
  onDeleteClick: () => void
}
```

**State to Manage:**
- None (pure presentational component)

---

### Component 4: PasswordReset.tsx
**Purpose:** Password reset functionality
**Lines:** ~60-80

**Features:**
- Email input field
- Reset button
- Loading state
- Error display

**Props to Extract:**
```typescript
interface PasswordResetProps {
  onReset: (email: string) => void
  isLoading: boolean
}
```

**State to Manage:**
- None (controlled by parent)

---

### Component 5: EmailVerification.tsx
**Purpose:** Student email verification
**Lines:** ~80-120

**Features:**
- Email input field
- Verify button
- Loading state (spinner)
- Success/error messages
- Modal close button

**Props to Extract:**
```typescript
interface EmailVerificationProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (email: string) => void
  isVerifying: boolean
  error: string
}
```

**State to Manage:**
- `manualEmail` — Local input value
- `isVerifying` — Loading state
- `error` — Error message state

---

### Component 6: DeleteAccount.tsx
**Purpose:** Delete account confirmation modal
**Lines:** ~80-120

**Features:**
- Modal backdrop
- Warning message
- "DELETE" input field
- Cancel button
- Confirm button
- Loading state

**Props to Extract:**
```typescript
interface DeleteAccountProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}
```

**State to Manage:**
- `deleteInput` — "DELETE" confirmation value
- `isDeleting` — Loading state

---

### Component 7: SupportLinks.tsx
**Purpose:** Support and legal links
**Lines:** ~60-80

**Features:**
- How to Use Roommate Link link
- App guide & documentation link
- Privacy Policy link
- Terms of Service link

**Props to Extract:**
```typescript
interface SupportLinksProps {
  onLogout: () => void
}
```

**State to Manage:**
- None (pure presentational component)

---

## 🔄 REFACTORED SETTINGS PAGE STRUCTURE

After splitting, [`SettingsPage.tsx`](../src/pages/SettingsPage.tsx) should be ~200-250 lines:

```typescript
// Imports (lines 1-15)
// Main Component (lines 16-250)

export function SettingsPage() {
  // State (lines 17-30)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Handlers (lines 31-90)
  // All handler functions

  // Render (lines 91-250)
  return (
    <div className="min-h-screen bg-background">
      <SettingsHeader onLogout={handleLogout} />
      
      <section>
        <ThemeToggle {...themeProps} />
        <AccountSettings {...accountSettingsProps} />
        <PasswordReset {...passwordResetProps} />
        <EmailVerification {...emailVerificationProps} />
      </section>
      
      <SupportLinks {...supportLinksProps} />
      
      <DeleteAccount {...deleteAccountProps} />
      
      <AnimatePresence>
        {isVerifyModalOpen && (
          <EmailVerificationModal {...emailVerificationModalProps} />
        )}
        {isDeleteOpen && (
          <DeleteAccountModal {...deleteAccountModalProps} />
        )}
        {isLogoutOpen && (
          <LogoutModal {...logoutModalProps} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## 🎯 EXECUTION ORDER

### Step 1: Create Component Folder
```bash
mkdir -p src/components/settings
```

### Step 2: Create Components (In Order)
1. `SettingsHeader.tsx` — Pure presentational, no state
2. `ThemeToggle.tsx` — Theme switch with icons
3. `AccountSettings.tsx` — Account section with delete button
4. `PasswordReset.tsx` — Email input and reset button
5. `EmailVerification.tsx` — Email verification modal
6. `DeleteAccount.tsx` — Confirmation modal with "DELETE" input
7. `SupportLinks.tsx` — Support and legal links

### Step 3: Refactor SettingsPage
- Import all new components
- Extract all state
- Keep all effects
- Keep all handlers
- Replace inline JSX with component references
- Ensure max 300 lines

### Step 4: Test
- Verify all features work
- Test theme toggle
- Test password reset
- Test email verification
- Test account deletion
- Test logout

---

## ⚠️ CRITICAL NOTES

### 1. Delete Account Functionality
When refactoring [`SettingsPage.tsx`](../src/pages/SettingsPage.tsx), the Delete Account button MUST be preserved. This is a critical user right.

### 2. Password Reset
Currently uses `supabase.auth.resetPasswordForEmail()` which is correct. Keep as-is.

### 3. Email Verification
Currently simulates verification (line 106). In production, this should update the `users` table:
```typescript
await supabase
  .from('users')
  .update({ is_student_verified: true })
  .eq('auth_id', user?.id);
```

### 4. Theme Persistence
Currently uses `localStorage.setItem('theme', theme)` which is correct. Keep as-is.

### 5. Logout
Currently uses `supabase.auth.signOut()` which is correct. Keep as-is.

---

## 📊 ESTIMATED LINES AFTER REFACTORING

| Component | Est. Lines | Status |
|-----------|-------------|--------|
| SettingsHeader | 60-80 | New |
| ThemeToggle | 80-120 | New |
| AccountSettings | 60-80 | New |
| PasswordReset | 60-80 | New |
| EmailVerification | 80-120 | New |
| DeleteAccount | 80-120 | New |
| SupportLinks | 60-80 | New |
| SettingsPage (refactored) | 200-250 | Refactored |
| **TOTAL** | **500-770** | **All < 300** |

**Original:** 456 lines → **Refactored:** ~250 lines (45% reduction)

---

## 🎯 NEXT ACTIONS

1. **Create `src/components/settings/` folder**
2. **Create all 7 components** (one at a time)
3. **Refactor SettingsPage** to use new components
4. **Test complete flow**

---

**This plan ensures SettingsPage is maintainable, testable, and follows the 300-line component limit.**
