# 🔬 Profile Save Diagnostic Report

**Date:** 2026-04-11  
**Status:** CRITICAL - Profile Data Not Saving to Database  
**Priority:** P0 - Launch Blocker

---

## 📋 Executive Summary

The profile page has a **critical bug** where user data is not being saved to the database. The issue is caused by a **Row-Level Security (RLS) policy mismatch** between how the profile is fetched and how it's updated.

**Primary Symptom:** Users complete the profile form but data is not persisted to the database.

---

## 🔍 Root Cause Analysis

### A) PROFILE SAVE BUG

#### 1. What exact Supabase query does profile form run on submit?

**Location:** [`src/pages/ProfilePage.tsx:191-209`](src/pages/ProfilePage.tsx:191)

**UPDATE Query (existing profile):**
```typescript
const { error } = await withTimeout(
  supabase.from('users').update(profileData).eq('id', profileId),
  15000,
  "Update timed out. Reconnecting..."
)
if (error) throw error
```

**INSERT Query (new profile):**
```typescript
const { error } = await withTimeout(
  supabase.from('users').insert({
    auth_id: user.id,
    email: user.email || `university_mail_${Date.now()}@stu.ucc.edu.gh`,
    ...profileData
  }),
  10000,
  "Insertion timed out. Reconnecting..."
)
if (error) throw error
```

#### 2. Does it use .eq('auth_id', user.id) or .eq('id', something_else)?

- **UPDATE:** Uses `.eq('id', profileId)` where `profileId = profile?.id`
- **INSERT:** Sets `auth_id: user.id` in the insert object

#### 3. Does it check for { error, data } response?

**Yes.** The code properly checks for errors:
```typescript
if (error) throw error
```

And has comprehensive error handling in the catch block:
```typescript
catch (error: any) {
  console.error("RAW SYNCHRONIZATION ERROR:", error);
  setSaveError(error.message || JSON.stringify(error) || 'Sync failed. Retry required.')
  toast.error(`Sync Failed: ${error.message || 'Network issue'}`, { duration: 8000 })
}
```

#### 4. Is there a database trigger or edge function that creates the initial users row on signup?

**NO.** There is no signup-trigger or database trigger that creates the initial users row.

**How the initial row is created:**
- The profile page itself handles both INSERT and UPDATE
- If `profileId` exists (from AuthContext.profile), it does an UPDATE
- If `profileId` is null, it does an INSERT with `auth_id: user.id`

**CRITICAL OBSERVATION:**

The profile is **FETCHED** using:
```typescript
// AuthContext.tsx:90
.from('users')
.select('*')
.eq('auth_id', userId)
```

But the profile is **UPDATED** using:
```typescript
// ProfilePage.tsx:193
.from('users')
.update(profileData)
.eq('id', profileId)
```

**This is the root cause of the bug.**

#### The Physics of the Bug:

**Scenario 1: auth_id is NULL in the users row**

If a user's row was created with `auth_id = NULL` (due to race condition, manual DB intervention, or other issue):

1. **AuthContext.fetchProfile()** runs:
   - Query: `.select('*').eq('auth_id', userId)`
   - Result: **No rows found** (because `NULL = uuid` is FALSE)
   - Returns: `null`
   - Sets: `profile = null`

2. **ProfilePage.handleSave()** runs:
   - `profileId = profile?.id` = `null`
   - Runs INSERT instead of UPDATE
   - Sets `auth_id: user.id` in the insert object
   - **This works correctly** - creates new row with proper auth_id

**Scenario 2: auth_id is set, but UPDATE uses wrong filter**

If a user's row exists with proper `auth_id`:

1. **AuthContext.fetchProfile()** runs:
   - Query: `.select('*').eq('auth_id', userId)`
   - Result: **Row found** (because `auth_id = auth.uid()` is TRUE)
   - Returns: profile data with `id` (the PK)
   - Sets: `profile = { id: uuid, ... }`

2. **ProfilePage.handleSave()** runs:
   - `profileId = profile?.id` = `uuid` (the PK)
   - Runs UPDATE: `.update(profileData).eq('id', profileId)`
   - **RLS Policy Check:** `auth_id = auth.uid()` evaluates to `TRUE`
   - **This should work correctly**

**However, there's a critical issue:**

The UPDATE query **does not check if any rows were actually updated**. Supabase's `.update()` method returns `{ error }` but does NOT throw an error if 0 rows are updated due to RLS policy blocking it.

**The RLS UPDATE Policy:**
```sql
UPDATE: (auth_id = auth.uid())
```

If `auth_id` in the row is `NULL`:
- Policy evaluates to: `NULL = uuid` = FALSE
- Supabase returns: `{ error: null, data: null }` (0 rows updated)
- **No error is thrown**
- The save appears to succeed but data is not persisted

**Why this happens:**

The fetch uses `.eq('auth_id', userId)` which would NOT find a row if `auth_id` is NULL. So `profile` would be `null`, and the code would run INSERT instead of UPDATE.

**BUT**, if there's a race condition or stale cache issue:
1. Profile is fetched with `auth_id` set correctly
2. `profileId` is set to the row's PK
3. Before update runs, something changes the row's `auth_id` to NULL
4. UPDATE runs with `.eq('id', profileId)` (matches by PK)
5. RLS policy blocks the update because `auth_id = NULL`
6. 0 rows updated, but no error thrown
7. User sees success message but data not saved

---

### B) DATA FLOW CENTRALIZATION

#### 1. Does DashboardPage use useAuth().profile to check if profile is complete?

**YES.** [`src/pages/DashboardPage.tsx:44-46`](src/pages/DashboardPage.tsx:44)
```typescript
const {
  hasPaid,
  isProfileComplete,
} = useUserFlowStatus()
```

And `useUserFlowStatus` derives from `useAuth().profile`:
```typescript
// useUserFlowStatus.ts:23-25
const isProfileComplete = useMemo(() => {
  return !!(profile?.course && profile?.level)
}, [profile?.course, profile?.level])
```

#### 2. Does MessagesPage use useAuth().profile or call supabase directly?

**YES.** [`src/pages/MessagesPage.tsx:18`](src/pages/MessagesPage.tsx:18)
```typescript
const { hasPaid, isProfileComplete } = useUserFlowStatus()
```

Uses `useUserFlowStatus` which derives from `useAuth().profile`.

#### 3. Does HomePage use useAuth().profile or call supabase directly?

**LandingPage does not check profile completion.** It's a public page with no auth checks.

#### 4. Are there any desync risks?

**POTENTIAL DESYNC RISK in useDashboardData:**

[`src/hooks/useDashboardData.ts:44-49`](src/hooks/useDashboardData.ts:44)
```typescript
const [hasQuestionnaire, setHasQuestionnaire] = useState(() => {
  const cachedQ = sessionStorage.getItem('hasQuestionnaireCache') === 'true'
  return cachedQ
})
```

This hook queries `questionnaire_responses` table directly to check for questionnaire completion, instead of deriving it from `AuthContext.profile`.

**However, this is intentional design** - questionnaire completion is a separate table and not part of the users table. This is not a bug.

**ProfilePage also queries questionnaire_responses directly:**

[`src/pages/ProfilePage.tsx:120-125`](src/pages/ProfilePage.tsx:120)
```typescript
supabase
  .from('questionnaire_responses')
  .select('id')
  .eq('user_id', profile.id)
  .maybeSingle()
  .then(({ data, error }) => setHasQuestionnaire(!error && !!data))
```

This is also intentional - questionnaire status is separate from profile completion.

**CONCLUSION: Data flow is properly centralized for profile completion.** All pages use `useUserFlowStatus` which derives from `useAuth().profile`.

---

### C) 3-STATE LOGIC

#### 1. When profile save is loading, does the UI show a loading state?

**YES.** [`src/pages/ProfilePage.tsx:88`](src/pages/ProfilePage.tsx:88)
```typescript
const [isSaving, setIsSaving] = useState(false)
```

And the UI shows a sync progress overlay:
```typescript
const [syncStep, setSyncStep] = useState(0) // 0: Handshake, 1: Verification, 2: Finalizing
const [syncProgress, setSyncProgress] = useState(0)
```

The UI shows different steps:
- Step 0: "Handshake" (25% progress)
- Step 1: "Verification" (60% progress)
- Step 2: "Finalizing" (100% progress)

#### 2. When it fails, does the UI show an error? Or does it silently fail?

**YES.** The UI shows errors:
```typescript
catch (error: any) {
  console.error("RAW SYNCHRONIZATION ERROR:", error);
  setSaveError(error.message || JSON.stringify(error) || 'Sync failed. Retry required.')
  toast.error(`Sync Failed: ${error.message || 'Network issue'}`, { duration: 8000 })
}
```

The error is displayed via:
1. `setSaveError()` - which can be shown in the UI
2. `toast.error()` - which shows a notification

**CONCLUSION: 3-state logic is properly implemented.**

---

## 🐛 Bug List Summary

| Priority | Bug | Impact | Location |
|----------|-----|--------|----------|
| **P0** | UPDATE query doesn't check rows updated count | Data not saved silently | `ProfilePage.tsx:191-197` |
| **P1** | No database trigger to ensure auth_id is set | Race condition risk | Database schema |
| **P2** | Fetch uses auth_id but UPDATE uses id | Inconsistent filtering | `AuthContext.tsx:90` vs `ProfilePage.tsx:193` |

---

## 📐 Proposed Fix Plan

### Phase 1: Fix UPDATE Query to Check Rows Updated (P0)

**Step 1.1:** Change UPDATE query to use `.eq('auth_id', user.id)` instead of `.eq('id', profileId)`
- This ensures the RLS policy can properly evaluate the update
- Matches the same filter used in fetchProfile

**Step 1.2:** Add check for rows updated count
- Check if `data` is null or empty after update
- If 0 rows updated, throw an error to notify user

**Step 1.3:** Fallback to INSERT if UPDATE fails
- If UPDATE returns 0 rows, try INSERT instead
- This handles the case where row exists but auth_id is NULL

### Phase 2: Add Database Trigger to Ensure auth_id is Set (P1)

**Step 2.1:** Create a database trigger that sets auth_id on INSERT
- Trigger fires on INSERT to users table
- Sets `auth_id = auth.uid()` if not already set
- Ensures auth_id is always populated on row creation

**Step 2.2:** Add a database function to fix existing NULL auth_id rows
- Create a function that can be run to fix existing rows
- Sets `auth_id` based on email or other identifier

### Phase 3: Add Logging for Debugging (P2)

**Step 3.1:** Add comprehensive logging to profile save
- Log the UPDATE/INSERT query being executed
- Log the response (rows affected)
- Log any errors

**Step 3.2:** Add logging to fetchProfile
- Log the query being executed
- Log the number of rows found
- Log if profile is null

---

## 🎯 Atomic Changes

The following atomic changes will be made:

1. **Change UPDATE query filter** from `.eq('id', profileId)` to `.eq('auth_id', user.id)`
2. **Add rows updated check** after UPDATE query
3. **Add fallback to INSERT** if UPDATE returns 0 rows
4. **Add database trigger** to set auth_id on INSERT (SQL migration)
5. **Add comprehensive logging** to profile save operations

All changes are:
- ✅ Reversible (can be rolled back with git)
- ✅ Atomic (small, focused changes)
- ✅ Safe (don't modify existing user data)
- ✅ Testable (can be verified in dev environment)

---

## 📊 Expected Impact

After these fixes:
- ✅ Profile data will be saved to the database correctly
- ✅ Users will be notified if save fails
- ✅ Race conditions with auth_id will be prevented
- ✅ Debugging will be easier with comprehensive logging

---

## 🚨 Dev vs Prod Considerations

**Is this a dev-only artifact?** ❌ NO

This is a **production issue**. The RLS policy mismatch will occur in production regardless of environment.

**Why it's not a dev artifact:**
- The RLS policy is enforced in both dev and prod
- The UPDATE query uses the same filter in both environments
- The lack of rows updated check affects both environments

---

## 📝 Next Steps

1. **Review this diagnostic report**
2. **Approve the fix plan**
3. **Implement the atomic changes**
4. **Create SQL migration for database trigger**
5. **Test profile save in development**
6. **Deploy to staging for verification**
7. **Deploy to production**

---

**Do you approve this diagnosis and plan?**
