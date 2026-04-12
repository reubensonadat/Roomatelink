# Supabase Auth Masterclass

**Read this before touching auth code. These rules were learned through weeks of debugging mobile network issues, app freezes, and phantom login events. Violate them at your own risk.**

---

## 🚫 RULE #1: Never use `window.addEventListener('focus')` or `visibilitychange` to refresh auth

**The Crime:**
```typescript
// ❌ DON'T DO THIS
window.addEventListener('focus', () => {
  supabase.auth.getSession()
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession()
  }
})
```

**The Physics of the Problem:**
1. User switches tabs back to your app
2. `focus` or `visibilitychange` event fires
3. You call `supabase.auth.getSession()`
4. Meanwhile, Supabase's internal `onAuthStateChange` listener is also firing
5. **Lock Contention:** Both are trying to read/write to the same session state
6. **Cascade Re-renders:** Each event triggers a re-render of the entire app
7. **Race Conditions:** One finishes before the other, overwriting the other's state

**The Lesson:**
Trust Supabase's internal `onAuthStateChange` listener. It's the **single source of truth**. It will fire when the session actually changes, not when the user switches tabs.

**The Right Way:**
```typescript
// ✅ DO THIS
// AuthContext with empty dependency array - runs once on mount
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // Handle auth state changes here
      // This is the ONLY place we update auth state
    }
  )
  
  return () => subscription.unsubscribe()
}, []) // Empty dependency array - never re-runs
```

---

## 🚫 RULE #2: Never put `supabase.auth.getSession()` inside a component

**The Crime:**
```typescript
// ❌ DON'T DO THIS
function MyComponent() {
  const [session, setSession] = useState(null)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])
  
  // ...
}
```

**The Physics of the Problem:**
1. Multiple components call `getSession()` independently
2. Each component has its own loading state
3. **State Desync:** Component A gets session, Component B is still loading
4. **Race Conditions:** Component A re-renders before Component B finishes
5. **Memory Leaks:** Each component creates its own subscription to auth events
6. **Infinite Loops:** One component's update triggers another's re-render

**The Lesson:**
Auth state must live in **React Context**, not in individual components. Only one place in the entire app should manage auth state.

**The Right Way:**
```typescript
// ✅ DO THIS
// In AuthContext.tsx
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  
  useEffect(() => {
    // Single source of truth for all auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  )
}

// In any component
function MyComponent() {
  const { session } = useAuth() // Single source of truth
  // ...
}
```

---

## 🚫 RULE #3: Never use `setInterval` for session validation

**The Crime:**
```typescript
// ❌ DON'T DO THIS
useEffect(() => {
  const interval = setInterval(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Log out user
      }
    })
  }, 5 * 60 * 1000) // Every 5 minutes
  
  return () => clearInterval(interval)
}, [])
```

**The Physics of the Problem:**
1. You're polling the server every 5 minutes
2. **Mobile Data Waste:** Each poll consumes user's mobile data
3. **Battery Drain:** Wakes up the phone every 5 minutes
4. **Unnecessary:** Supabase automatically refreshes JWT tokens
5. **False Positives:** Network glitches cause unnecessary logouts
6. **Race Conditions:** Interval fires while user is in the middle of an action

**The Lesson:**
Trust the JWT. Supabase handles token refresh automatically. The server will reject invalid tokens. You don't need to poll.

**The Right Way:**
```typescript
// ✅ DO THIS
// Trust Supabase's automatic token refresh
// The server will reject invalid JWTs, and Supabase will handle the refresh
// No polling needed
```

---

## 🚫 RULE #4: Never put retry logic inside custom data-fetching functions if you have a global fetch wrapper

**The Crime:**
```typescript
// ❌ DON'T DO THIS
const fetchProfile = async (userId: string, retries = 1): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .maybeSingle()

    if (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchProfile(userId, retries - 1) // Nested retry!
      }
      return null
    }

    return data
  } catch (err) {
    return null
  }
}
```

**The Physics of the Problem:**
1. Global `createTimeoutFetch` in `supabase.ts` has 8s timeout + 8s retry = 16s max
2. Your custom function also has retry logic
3. **Nested Retry Loop:**
   - First `supabase.from()` call times out at 8s
   - Supabase retries, times out again at 16s
   - Your function catches error, waits 1s
   - Your function retries, causing another 16s
   - **Total: 33s**, which exceeds your 20s safety timeout
4. **User Experience:** User sees loading spinner for 33 seconds
5. **Race Conditions:** Timeout fires before retry completes

**The Lesson:**
If you have a global fetch wrapper that handles retries, **do not** implement retry logic in custom functions. Let the global wrapper be the single source of truth for network resilience.

**The Right Way:**
```typescript
// ✅ DO THIS
const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .maybeSingle()

    if (error) {
      return null // Let global wrapper handle retries
    }

    return data
  } catch (err) {
    return null
  }
}
```

---

## 🚫 RULE #5: Never strip OAuth URL hashes before Supabase has processed them

**The Crime:**
```typescript
// ❌ DON'T DO THIS
// In a useEffect that runs on mount
useEffect(() => {
  if (window.location.hash.includes('access_token')) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}, [])
```

**The Physics of the Problem:**
1. User completes OAuth flow (e.g., Google Sign In)
2. Supabase redirects back with `#access_token=...` in URL hash
3. Your code strips the hash **before** Supabase has read it
4. Supabase can't find the token, auth fails
5. **Phantom Login:** 48 seconds later, Supabase's internal timer fires and re-reads the hash (if you didn't strip it properly)
6. **Double SIGNED_IN Event:** User sees login happen twice

**The Lesson:**
Only strip the URL hash **after** Supabase has successfully processed it. The `onAuthStateChange` listener fires after Supabase has parsed the hash and created the session.

**The Right Way:**
```typescript
// ✅ DO THIS
// Inside onAuthStateChange callback
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // Strip URL hash AFTER Supabase has processed it
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    
    // Handle auth state changes
  }
)
```

---

## 🎯 The Golden Rule: Single Source of Truth

Every rule above violates the **Single Source of Truth** principle:

| Aspect | Single Source of Truth | What Violates It |
|--------|----------------------|------------------|
| **Auth State** | `onAuthStateChange` listener in `AuthContext` | `getSession()` in components |
| **Session Refresh** | Supabase's automatic JWT refresh | `setInterval` polling |
| **Network Resilience** | Global `createTimeoutFetch` wrapper | Custom retry logic in functions |
| **OAuth Processing** | `onAuthStateChange` callback | Stripping hash before processing |

---

## 📋 Checklist Before Touching Auth Code

- [ ] Am I calling `supabase.auth.getSession()` inside a component? → **Stop.** Use `useAuth()` hook instead.
- [ ] Am I using `window.addEventListener('focus')` or `visibilitychange`? → **Stop.** Trust `onAuthStateChange`.
- [ ] Am I using `setInterval` for session validation? → **Stop.** Trust Supabase's automatic token refresh.
- [ ] Am I implementing retry logic in a custom data-fetching function? → **Stop.** Let global wrapper handle it.
- [ ] Am I stripping OAuth URL hash before Supabase has processed it? → **Stop.** Strip it inside `onAuthStateChange`.

---

## 🚨 What Happens If You Violate These Rules?

1. **App freezes after 2 minutes of inactivity** (mobile data)
2. **Phantom login events** (OAuth redirects trigger twice)
3. **Infinite loading spinners** (race conditions between multiple auth sources)
4. **Lock contention errors** (multiple components trying to update auth state)
5. **Battery drain** (unnecessary polling)
6. **Mobile data waste** (unnecessary network calls)
7. **User frustration** (unnecessary logouts, loading states, errors)

---

## 📚 Further Reading

- [Auth Lifecycle Documentation](./03-AUTH-LIFECYCLE.md) - Detailed explanation of our auth architecture
- [Mobile TCP Half-Open Mitigation](./03-AUTH-LIFECYCLE.md#-mobile-tcp-half-open-mitigation-new) - How we handle mobile network issues
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) - Official Supabase auth docs

---

**Remember:** These rules were learned through weeks of debugging. Violate them at your own risk. The Single Source of Truth principle is sacred.
