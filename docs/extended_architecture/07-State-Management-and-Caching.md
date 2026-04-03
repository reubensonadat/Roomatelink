# Volume 07: State Management and Caching

Roommate Link does not use Redux or Zustand. The state management is highly localized to prevent the bundle size from ballooning on slow mobile devices.

## 1. The "Profile Amnesia" Bug
During the final production push, we faced a catastrophic bug where if a user filled out their "Academic Course" and "Gender," then reloaded the page before hitting save, the UI forgot their selections (even though they supposedly hadn't cleared). 
Worse, if they rapidly typed and hit save, the database failed to synchronize due to connection pooling limits on the Supabase Free Tier.

## 2. Our Solution: LocalStorage Caching
Instead of aggressively firing `.update()` to Supabase on every keystroke (which triggers the rate limit and causes the API to hang on `Network timed out`), we use pure synchronous `localStorage`.

When `ProfilePage.tsx` mounts:
```typescript
const getInitial = () => {
    try {
      const saved = localStorage.getItem('roommate_profile_data')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
}
const [course, setCourse] = useState(getInitial().course || '')
```
Because this happens *synchronously* on the exact millisecond React begins evaluating the DOM, there is no "race condition." The inputs immediately populate.

As the user types, a `useEffect` caches the JSON back into `localStorage`. 

## 3. The Singular Synchronization Pipeline
Only when the user explicitly clicks the "Secure Profile" button do we execute:
```typescript
const { data: dbProfile } = await withTimeout(
    supabase.from('users').upsert(profileData),
    8000, 
    "Network unstable."
)
```
Once Supabase confirms the save, we execute `localStorage.removeItem('roommate_profile_data')`. This ensures they are starting with a fresh slate representing the exact truth stored in the database.

## 4. AuthProvider Boundary
Session state is managed entirely through `AuthProvider.tsx` at the absolute root of the App DOM tree. 
It listens to `supabase.auth.onAuthStateChange`. If a token expires or a user is detected as completely deleted, it instantly kicks them back to `/auth` natively without requiring checks on every individual page.
