# 02 - Technical Stack & Constraints

## 🧱 The Ironclad Stack
Roommate Link is built on a specific, non-negotiable tech stack designed for speed, security, and zero-maintenance hosting.

- **Frontend:** React 18 (Vite) — TypeScript.
- **Hosting:** Cloudflare Pages (Strict Single Page Application).
- **Backend-as-a-Service:** Supabase (Postgres, Auth, RLS, Realtime, Edge Functions).
- **Communication:** Firebase Cloud Messaging (FCM) & Resend (Email).

## ⛔ Forbidden Technologies
To maintain architectural integrity, the following technologies are **STRICTLY BANNED**:
- **Next.js / Server Components:** Next.js was abandoned due to Cloudflare Edge compatibility issues.
- **Global State Libraries:** No Redux, Zustand, or MobX.
- **Data Fetching Libraries:** No React Query / TanStack Query.
- **Node.js Servers:** The application must run as a static set of files. Any server-side logic must reside in **Supabase Edge Functions**.

## 🧠 State Management Philosophy
We rely on the **Holy Trinity of React Hooks** to manage complexity without external dependencies:

1.  **Context + useState:** For global data domains (e.g., Auth, Dashboard data).
2.  **Derived State:** We never mirror state. If `isPaid` can be calculated from `profile.has_paid`, it remains a derived variable.
3.  **useRef (The Performance Savior):** 
    - Used for values that update frequently but don't need to trigger re-renders.
    - **Why?** Using `useState` for things like "Last Activity" or "Typing Indicator" would cause the entire AuthProvider to re-render, tearing down background timers (like session heartbeats). `useRef` allows these to update silently.

## ⚙️ Backend Logic: Supabase Edge Functions
All sensitive operations (Payments, Signature Verification) are handled by **Deno-based** Edge Functions.

### Deno Constraints
Developers must remember that Edge Functions run in the Deno environment, not Node.js.
- **No Node `crypto`:** Use the standardized `Web Crypto API` (e.g., `crypto.subtle.sign`).
- **No Local Filesystem:** All data must be fetched via HTTP or the Supabase client.
- **Strict Typing:** All function inputs/outputs must use the shared interfaces in `src/types/database.ts`.

## 📦 PWA Architecture
The app is configured via `vite-plugin-pwa`.
- **Strategy:** `generateSW` (Automatic Service Worker generation).
- **Prompting:** The `InstallPrompt.tsx` component handles the high-fidelity native install experience.
