# 06 - Realtime Chat & Foreground Sync

The chat system is designed to provide a low-latency, "Boutique" messaging experience while minimizing database load and battery drain on mobile devices.

## 📡 The Sync Architecture
We do not fetch the entire message history on every load. We use a **Delta & Cache** model.

1.  **Immediate Cache:** The `useChatMessages` hook immediately renders the last 50 messages from `localStorage`.
2.  **Delta Fetch:** On mount, we query Supabase only for messages where `created_at > last_cached_timestamp`. 
3.  **Deduplication:** The frontend merges the cached and fresh messages, ensuring zero duplicates.

## 🔄 Foreground Delta Sync (App Resume)
Mobile PWA users frequently background the app. Traditional WebSockets can drop during this time.
- **The Mechanism:** We listen to the `visibilitychange` and `focus` events.
- **The Logic:** When the app returns to the foreground, it performs a **Foreground Delta Sync**—a quick fetch of any messages that arrived while the WebSocket was disconnected.

## 💬 Message Lifecycle (Enums)
We do not use simple booleans for read/delivered status. We use a single `status` column:

- **`PENDING`:** Optimistic state in the UI before the DB insert completes.
- **`SENT`:** Recorded in DB, but not yet delivered to the recipient's active socket.
- **`DELIVERED`:** Recipient's device acknowledged receipt.
- **`READ`:** Recipient has the chat thread open and in the foreground.

## ⚡ Realtime Subscriptions
The app uses two types of Supabase Realtime communication:

1.  **Postgres Changes:** Listens for `INSERT` (new messages) and `UPDATE` (status changes like `SENT` → `READ`).
2.  **Broadcast (Typing):** Uses lightweight ephemeral broadcasting for typing indicators. These are never saved to the database.

## 🚦 High Traffic Mode
The `AuthContext` tracks systemic performance. If the WebSocket connection times out or enters a `CHANNEL_ERROR` state, the chat hook automatically switches to **High Traffic Mode**:
- Realtime typing indicators are disabled.
- The app falls back to more frequent polling or manual refresh prompts to preserve the core experience under heavy load.
