# UI/UX State Guide

**This guide explains Roommate Link's state physics in plain English. It's for UI designers who need to understand how the app behaves without diving into code.**

---

## 🎯 The Core Principle: State is a Wallet, Not a Stream

Think of the app's state as a **wallet** that holds data, not a **stream** that constantly updates. When data changes, we update the wallet immediately (optimistic updates), then sync with the server in the background.

**Why this matters:**
- Users see changes **instantly** (no loading spinners)
- Network failures don't block the UI
- The app feels "fast" even on slow networks

---

## 🔄 Loading States

### Initial Boot Loading (The Only Time You Show a Spinner)

**When:** User opens the app for the first time or refreshes the page

**What happens:**
1. App shows a loading spinner ("Security: Checking Account")
2. App checks if user is signed in
3. If signed in, app loads user's profile
4. Loading spinner disappears, user sees dashboard

**What you should show:**
- A premium loading spinner (we use `PremiumAuthLoader`)
- Labels like "Security: Checking Account" or "One moment..."
- **Duration:** Typically 1-3 seconds on good networks, up to 20 seconds on slow networks

**What you should NOT show:**
- Loading spinners when user switches tabs
- Loading spinners when user navigates between pages
- Loading spinners when user returns to the app from background

### Background Sync Loading (Silent)

**When:** App is already loaded and fetching fresh data in the background

**What happens:**
1. User is already using the app
2. App fetches fresh data in the background
3. UI updates silently when data arrives
4. User never sees a loading spinner

**What you should show:**
- Nothing. The update happens silently.

**What you should NOT show:**
- Loading spinners
- "Syncing..." messages
- Any indication that data is being fetched

---

## 💬 The Chat Connection

The chat system has three connection states, each with its own visual indicator.

### Green Dot (WebSocket Connected)

**When:** WebSocket is connected and receiving live updates

**What happens:**
- User sees new messages instantly (no refresh needed)
- User sees "typing..." indicators when other person is typing
- Messages show "delivered" and "read" status

**What you should show:**
- A green dot next to the chat header
- Message status indicators (delivered, read)
- "typing..." indicator when other person is typing

### Orange Dot (Disconnected)

**When:** WebSocket has disconnected (Cloudflare killed idle connection)

**What happens:**
- User can still send messages (they save to database via HTTP)
- User can still read messages (they load via HTTP)
- Live updates are paused until reconnected

**What you should show:**
- An orange dot next to the chat header
- A "Tap to Reconnect" banner at the top of the chat
- Message status indicators show "sent" but not "delivered"

**What you should NOT show:**
- Loading spinners
- Error messages
- Any indication that the chat is "broken"

### "Tap to Reconnect" Banner

**When:** User taps the "Tap to Reconnect" banner

**What happens:**
1. App fetches missed messages via HTTP
2. App destroys the dead WebSocket
3. App creates a new WebSocket
4. Live updates resume

**What you should show:**
- A brief loading state (1-2 seconds)
- Then switch back to green dot

**What you should NOT show:**
- Long loading states
- Error messages
- Any indication that the reconnection failed

---

## ⚡ Optimistic UI Updates

When a user performs an action (like saving their profile), the UI updates **instantly** without a loading spinner. This is called "optimistic updates."

### How It Works

1. User changes their profile (e.g., changes their name)
2. UI updates **instantly** to show the new name
3. App saves the change to the database in the background
4. If save succeeds: nothing happens (UI already shows correct state)
5. If save fails: show an error toast

### What You Should Show

**Before user saves:**
- Edit form with current values

**After user saves:**
- **Instantly** show the new values (no loading spinner)
- If save fails: show an error toast ("Couldn't save. Please try again.")

**What You Should NOT Show**

- Loading spinners after user saves
- "Saving..." messages
- Any indication that the save is happening

### Why This Matters

**Without optimistic updates:**
1. User changes their name
2. User sees a loading spinner for 2-3 seconds
3. User thinks "Is this working?"
4. UI finally updates

**With optimistic updates:**
1. User changes their name
2. UI updates instantly
3. User thinks "Wow, that was fast!"
4. App saves in the background

---

## 🚨 Error States

The app has a "Second Chance" retry mechanism for network requests. This means that if a request fails, it automatically retries once before showing an error to the user.

### How It Works

1. User performs an action (e.g., sends a message)
2. First request times out after 8 seconds
3. App automatically retries on a fresh connection
4. Second request times out after another 8 seconds
5. **Total: 16 seconds** before showing an error

### What You Should Show

**During retry (0-16 seconds):**
- Show a loading state (e.g., "Sending...")
- Don't show any errors yet

**After retry fails (16+ seconds):**
- Show an error message ("Couldn't send. Please check your connection.")
- Show a "Retry" button

**What You Should NOT Show**

- Errors before the 16-second retry is complete
- Multiple error messages (one for each retry attempt)
- Any indication that the app is "broken"

### Why This Matters

**Without "Second Chance" retry:**
1. User sends a message
2. Request fails after 8 seconds
3. User sees an error
4. User tries again
5. Request succeeds
6. User thinks "Why didn't it work the first time?"

**With "Second Chance" retry:**
1. User sends a message
2. Request fails after 8 seconds
3. App automatically retries
4. Request succeeds
5. User never knows anything went wrong

---

## 📊 State Physics Summary

| State | What Happens | What You Show | What You Don't Show |
|-------|--------------|----------------|---------------------|
| **Initial Boot** | App checks if user is signed in | Loading spinner | Nothing else |
| **Background Sync** | App fetches fresh data | Nothing | Loading spinners |
| **Chat Connected** | WebSocket is live | Green dot | Nothing else |
| **Chat Disconnected** | WebSocket is dead | Orange dot + "Tap to Reconnect" banner | Loading spinners, errors |
| **Optimistic Update** | User saves profile | Instant UI update | Loading spinners |
| **Network Retry** | Request failed, retrying | Loading state | Errors |
| **Network Failed** | Retry failed after 16s | Error message + Retry button | Multiple errors |

---

## 🎨 Design Principles

### 1. Instant Feedback

**Rule:** When a user performs an action, show the result **instantly** (optimistic updates).

**Why:** Users expect instant feedback. Loading spinners feel slow.

**Examples:**
- User saves profile: Update UI instantly
- User sends message: Show message instantly
- User likes a post: Show like instantly

### 2. Silent Background Sync

**Rule:** Never show loading spinners for background data fetching.

**Why:** Users don't care about background sync. Loading spinners feel like "something is wrong."

**Examples:**
- User switches tabs: No loading spinner
- User returns to app: No loading spinner
- App fetches fresh data: No loading spinner

### 3. Graceful Degradation

**Rule:** If something fails, show a helpful error message and a way to retry.

**Why:** Errors happen. Users should know what went wrong and how to fix it.

**Examples:**
- Chat disconnected: Show "Tap to Reconnect" banner
- Network failed: Show "Couldn't send. Please check your connection." + Retry button
- Save failed: Show "Couldn't save. Please try again." + Retry button

### 4. Premium Feel

**Rule:** Use premium UI elements (smooth animations, subtle shadows, nice colors) to make the app feel "expensive."

**Why:** Users judge apps by how they look and feel. Premium feel = trust.

**Examples:**
- Use `PremiumAuthLoader` for loading states
- Use smooth transitions (framer-motion)
- Use subtle shadows and depth
- Use nice colors (not harsh red/green)

---

## 📋 Design Checklist

Before designing a new feature, ask yourself:

- [ ] Will this show a loading spinner? If yes, is it **only** for initial boot?
- [ ] Will this update the UI instantly (optimistic update)?
- [ ] Will this handle network failures gracefully (error message + retry button)?
- [ ] Will this use premium UI elements (smooth animations, subtle shadows)?
- [ ] Will this respect the "Silent Background Sync" principle?

---

## 🚨 Common Mistakes

### Mistake #1: Showing Loading Spinners for Background Sync

**Wrong:**
- User switches tabs
- Show loading spinner
- User thinks "Why is this loading?"

**Right:**
- User switches tabs
- Show nothing
- App syncs in background

### Mistake #2: Not Using Optimistic Updates

**Wrong:**
- User saves profile
- Show loading spinner for 2-3 seconds
- User thinks "Is this working?"

**Right:**
- User saves profile
- Update UI instantly
- App saves in background

### Mistake #3: Showing Errors Too Early

**Wrong:**
- User sends message
- Request fails after 8 seconds
- Show error immediately
- User tries again
- Request succeeds

**Right:**
- User sends message
- Request fails after 8 seconds
- App automatically retries
- Request succeeds
- User never knows anything went wrong

### Mistake #4: Using Harsh Colors for Errors

**Wrong:**
- Show error in bright red
- User thinks "Something terrible happened!"

**Right:**
- Show error in a soft, calming color
- User thinks "Oh, I just need to retry"

---

## 📚 Further Reading

- [Auth Lifecycle Documentation](./03-AUTH-LIFECYCLE.md) - How auth works under the hood
- [Supabase Auth Masterclass](./SUPABASE_AUTH_MASTERCLASS.md) - Rules for developers
- [Boutique UI Guide](./08-BOUTIQUE-UI.md) - Design principles for the app

---

**Remember:** The goal is to make the app feel **fast, smooth, and premium**. Optimistic updates, silent background sync, and graceful error handling are key to achieving this.
