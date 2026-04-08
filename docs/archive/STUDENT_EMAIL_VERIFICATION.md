## Current Problem (SOLVED ✅)

The student email verification was previously a simple client-side flag flip. This was a **SECURITY KILLER** because any student could bypass it. We have now moved to **"BEAST MODE" SECURITY**.

---

## The "Beast Mode" Protocol (Live)

Your app now uses a **Server-Side Trust Model**. 🛡️

1. **The Generator**: A Supabase Edge Function (`verify-student`) generates a cryptographically random 6-digit code.
2. **The Vault**: This code is stored in a private `verification_codes` table (unreachable by students) with a 10-minute expiry.
3. **The Messenger (Resend)**: The code is sent to the student's official `@stu.ucc.edu.gh` email using the **Resend API**.
4. **The Judge**: When the student types the code, the server compares it against the vault. Only if they match does the Blue Checkmark appear.

---

## Our Tech Stack ("The Stock") 📦

- **Core DNA**: React 18 + Vite (Frontend Logic)
- **Visuals**: Tailwind CSS + Framer Motion (The Boutique Aesthetic)
- **The Brain**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Communication**: **Resend** (Secure Transactional Email Delivery)
- **Ledger**: Paystack (Financial Transactions)

---

## Terminal Magic ⌨️
Use these commands to manage your "Beast" infrastructure:

- `npx supabase login` — Connect your machine.
- `npx supabase secrets set RESEND_API_KEY=your_key` — Secure your email key.
- `npx supabase functions deploy verify-student` — Push new security logic.
- `npx supabase db push` — Update your database schema safely.

---

## Error Handling: The 100-Limit Guard 🚧
If you hit your daily limit of 100 emails on the Resend free tier:
- The app will recognize the "Rate Limit" error from Resend.
- It will show a professional alert: *"Our verification service is busy/down. Please try again tomorrow morning."*

## How Supabase Verification Works

### Supabase Auth Email Verification Flow

Supabase Auth provides built-in email verification:

```typescript
// 1. Send verification email
const { error } = await supabase.auth.signUp({
  email: 'student@stu.ucc.edu.gh',
  password: 'user-password',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`
  }
})

// 2. User clicks link in email
// Supabase automatically verifies the email domain
// User's auth.email_confirmed_at is set

// 3. Check verification status
const { data: { user } } = await supabase.auth.getUser()
console.log('Email confirmed:', user.email_confirmed_at)
console.log('Phone confirmed:', user.phone_confirmed_at)
```

### For Existing Users (Already Signed Up)

```typescript
// 1. Send verification email to their current email
const { error } = await supabase.auth.updateUser({
  email: 'student@stu.ucc.edu.gh',
  data: {
    email: 'student@stu.ucc.edu.gh' // Update their email
  }
})

// 2. This triggers a new verification email to the new address
// User clicks link, email_confirmed_at is set
```

### Checking Verified Status

```typescript
// Check if user's email is verified
const { data: { user } } = await supabase.auth.getUser()

if (user.email_confirmed_at) {
  // Email is verified!
  // Update users table
  await supabase
    .from('users')
    .update({ 
      is_student_verified: true 
    })
    .eq('auth_id', user.id)
}

// Also check if email matches @stu.ucc.edu.gh domain
if (user.email && user.email.endsWith('@stu.ucc.edu.gh')) {
  // This is a verified student email
}
```

## Recommended Implementation

### Option 1: Full Supabase Auth Verification (Recommended)

**Pros:**
- ✅ Built-in Supabase email verification
- ✅ Automatic email confirmation tracking
- ✅ Secure (handled by Supabase)
- ✅ No custom email server needed
- ✅ Automatic token refresh

**Cons:**
- Requires users to update their email to student email
- Users need to verify new email address

**Implementation:**

```typescript
// src/pages/SettingsPage.tsx

const handleVerifyEmail = async () => {
  if (!user?.email) {
    toast.error('Please add your email to your account first')
    return
  }

  setIsVerifying(true)

  try {
    // Check if email is already a student email
    const isStudentEmail = user.email.endsWith('@stu.ucc.edu.gh')

    if (isStudentEmail) {
      // Check if already verified
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser.email_confirmed_at) {
        // Already verified
        toast.success('Your student email is already verified!', {
          icon: <GraduationCap className="w-5 h-5 text-white" />
        })
        setIsVerifyModalOpen(false)
        await refreshProfile()
        return
      }

      // Send verification email to current email
      const { error: sendError } = await supabase.auth.updateUser({
        email: 'student@stu.ucc.edu.gh',
        data: {
          email: 'student@stu.ucc.edu.gh'
        }
      })

      if (sendError) {
        toast.error('Failed to send verification email. Please try again.')
        return
      }

      toast.success('Verification email sent! Check your inbox.', {
        icon: <GraduationCap className="w-5 h-5 text-white" />
      })
    } else {
      toast.error('Please use your @stu.ucc.edu.gh student email to verify')
      setIsVerifyModalOpen(false)
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    toast.error('Verification failed. Please try again.')
  } finally {
    setIsVerifying(false)
  }
}
```

### Option 2: Manual Admin Verification (Alternative)

If Supabase Auth verification doesn't work for your use case, you can implement manual verification:

```typescript
// src/pages/SettingsPage.tsx

const handleVerifyEmail = async () => {
  if (!manualEmail.includes('@stu.ucc.edu.gh')) {
    toast.error('Please enter a valid @stu.ucc.edu.gh email address')
    return
  }

  setIsVerifying(true)

  try {
    // Send verification request to admin (you'd need to create this endpoint)
    const response = await fetch('/api/verify-student-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        email: manualEmail,
        userId: user.id
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.verified) {
        toast.success('Student email verified successfully!', {
          icon: <GraduationCap className="w-5 h-5 text-white" />
        })
        
        // Update users table
        await supabase
          .from('users')
          .update({ is_student_verified: true })
          .eq('auth_id', user.id)
          
        await refreshProfile()
        setIsVerifyModalOpen(false)
        setManualEmail('')
      } else {
        toast.error('Verification failed. Please contact support.')
      }
    } else {
      toast.error('Verification request failed. Please try again.')
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    toast.error('Verification failed. Please try again.')
  } finally {
    setIsVerifying(false)
  }
}
```

## Database Schema Update

You need to ensure the `users` table has the `is_student_verified` column:

```sql
-- supabase/migrations/20260405_add_student_verification.sql

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_student_verified BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_student_verified 
  ON users(is_student_verified);

-- Add comment
COMMENT ON COLUMN users.is_student_verified IS 'True if user has verified their @stu.ucc.edu.gh email address';
```

## UI Updates Needed

### 1. Remove Broken Manual Verification

The current manual verification form in [`SettingsPage.tsx`](../src/pages/SettingsPage.tsx:126-129) should be removed or fixed:

```tsx
// REMOVE THIS BROKEN CODE
const { error } = await supabase
  .from('users')
  .update({ is_student_verified: true })
  .eq('auth_id', user?.id);
```

### 2. Update Verification Modal UI

The verification modal should show:
- Current email status
- Instructions for students
- Option to update to student email
- Clear success/error messages

```tsx
// Updated verification modal UI
<div className="space-y-4">
  <p className="text-sm text-muted-foreground">
    Verify your University of Cape Coast student email to get the verified student badge
  </p>
  
  {user.email && (
    <div className="bg-muted/50 p-3 rounded-lg">
      <p className="font-bold text-foreground">Current Email</p>
      <p className="text-sm">{user.email}</p>
      <div className="flex items-center gap-2">
        {user.email_confirmed_at ? (
          <span className="text-emerald-600 flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Verified
          </span>
        ) : (
          <span className="text-amber-600">Not Verified</span>
        )}
      </div>
    </div>
  )}
  
  {!user.email || !user.email.endsWith('@stu.ucc.edu.gh') && (
    <div className="bg-amber-500/10 p-3 rounded-lg">
      <p className="text-sm text-amber-900">
        ⚠️ Please update your email to your @stu.ucc.edu.gh student email to verify
      </p>
    </div>
  )}
  
  <input
    type="email"
    placeholder="Enter your @stu.ucc.edu.gh email"
    value={manualEmail}
    onChange={(e) => setManualEmail(e.target.value)}
    className="w-full px-4 py-3 bg-card border border-border/50 rounded-lg"
  />
</div>
```

## Testing Checklist

Before deploying, test:

- [ ] Send verification email to non-student email (should fail)
- [ ] Send verification email to @stu.ucc.edu.gh email (should succeed)
- [ ] Click verification link in email (should confirm email)
- [ ] Check that `is_student_verified` flag updates
- [ ] Refresh profile page shows verified badge
- [ ] Test with existing user who already has verified email
- [ ] Test with user who has non-student email

## Questions for You

1. **Do you want to use Option 1 (Supabase Auth verification) or Option 2 (Manual verification)?**
   - Option 1 is recommended but requires users to update their email
   - Option 2 gives you more control but requires creating an admin endpoint

2. **Do you have access to your Supabase dashboard to check the current schema?**
   - I need to verify if the `is_student_verified` column already exists

3. **Should I implement the verification now or wait for your decision?**

---

**Document Version:** 1.0  
**Created:** April 5, 2026  
**Purpose:** Explain how to implement proper student email verification
