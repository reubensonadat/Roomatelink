# 06 - Realtime Chat & Foreground Sync

The chat system is designed to provide a low-latency, "Boutique" messaging experience while minimizing database load and battery drain on mobile devices.

## 📡 The Sync Architecture
We do not fetch the entire message history on every load. We use a **Delta & Cache** model.

1.  **Immediate Cache:** The `useChatMessages` hook immediately renders the last 50 messages from `localStorage`.
2.  **Delta Fetch:** On mount, we query Supabase only for messages where `created_at > last_cached_timestamp`. 
3.  **Deduplication:** The frontend merges the cached and fresh messages, ensuring zero duplicates.

## 🧪 Lazy WebSocket Architecture (NEW)
To ensure reliable chat experience, we implement a lazy WebSocket pattern:

### Cold Start Handoff
- **HTTP First:** On initial load, we fetch messages via HTTP (REST API)
- **WebSocket Later:** After HTTP fetch completes, we establish WebSocket connection in background
- **Why This Matters:** Ensures messages load even if WebSocket fails on mobile networks

### Walkie-Talkie Reconnect
- **Auto-Reconnect:** WebSocket automatically reconnects on connection loss
- **Exponential Backoff:** Retry intervals increase (1s, 2s, 4s, 8s) to prevent spam
- **Fresh TCP Connection:** Each retry creates a new TCP connection to recover from half-open states
- **Max Retries:** Up to 5 attempts before giving up

### Clean Exit on Unmount
- **Unsubscribe:** Properly unsubscribe from Supabase channels on component unmount
- **Cleanup:** Clear all timers and timeouts
- **Prevent Leaks:** Ensure no memory leaks from dangling subscriptions

## 🔄 Foreground Delta Sync (App Resume)
Mobile PWA users frequently background the app. Traditional WebSockets can drop during this time.
- **The Mechanism:** We listen to the `visibilitychange` and `focus` events.
- **The Logic:** When the app returns to the foreground, it performs a **Foreground Delta Sync**—a quick fetch of any messages that arrived while the WebSocket was disconnected.
- **The Benefit:** Users never miss messages, even if the WebSocket died while the app was backgrounded.

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

## 🔒 Chat Access Control

### Thread Ownership
- Users can only access chat threads where they are either `sender_id` or `recipient_id`
- RLS policies enforce this at the database level
- No cross-thread snooping possible

### Payment Gate
- Chat is only available after payment verification
- `has_paid` flag must be true
- Pioneer users bypass this gate

### Match Requirement
- Users can only chat with their selected match
- Both users must be marked as `is_matched = true`
- Prevents messaging random users

## 📱 Mobile Optimization

### Battery Saving
- **Lazy WebSocket:** Not always connected, only when needed
- **Delta Sync:** Minimizes data transfer
- **Background Throttling:** Reduced activity when app is backgrounded

### Network Resilience
- **HTTP Fallback:** Always works even if WebSocket fails
- **Offline Caching:** Messages cached in localStorage
- **Retry Logic:** Automatic retry on network recovery

### Memory Management
- **Message Pagination:** Only load 50 messages at a time
- **Cleanup on Unmount:** Properly dispose of subscriptions
- **Debounced Writes:** localStorage writes debounced to prevent thrashing

## 🎯 Chat Features

### 1. Typing Indicators
- **Broadcast Channel:** Lightweight ephemeral messages
- **Debounced:** Only send typing status every 500ms
- **Auto-Stop:** Stop typing indicator after 3 seconds of inactivity

### 2. Message Status
- **Sent Checkmark:** Single checkmark when message is sent
- **Delivered Checkmark:** Double checkmark when delivered
- **Read Receipts:** Blue double checkmark when read
- **Failed State:** Red exclamation mark if send fails

### 3. Message Loading
- **Initial Load:** Last 50 messages from localStorage
- **Load More:** Pagination to load older messages
- **Real-time Updates:** New messages appear instantly via WebSocket

### 4. Error Handling
- **Network Errors:** Show retry option
- **Timeout Errors:** Fallback to HTTP polling
- **Validation Errors:** Show user-friendly error message

## 🔐 Security Considerations

### RLS Policies
```sql
-- Users can only see messages where they are sender or recipient
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can only insert messages where they are the sender
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);
```

### Message Encryption
- Messages stored in plain text (Supabase handles encryption at rest)
- TLS 1.3 for all network communication
- No sensitive data in message content

### Rate Limiting
- Client-side throttling for typing indicators
- Server-side rate limiting for message sending
- Prevent spam and abuse

## 📊 Chat Analytics

### Tracked Metrics
- Messages sent per user
- Response time between messages
- Chat thread duration
- Message delivery success rate

### Quality Metrics
- WebSocket connection success rate
- Message delivery latency
- User satisfaction with chat experience
- Feature usage (typing indicators, read receipts)

## 🚨 Troubleshooting

### Issue: Messages not appearing
**Solution:** Check WebSocket connection status, trigger manual refresh

### Issue: Typing indicators not working
**Solution:** Check if High Traffic Mode is active, verify Broadcast channel subscription

### Issue: Messages not sending
**Solution:** Check network connectivity, verify payment status, check match status

### Issue: Old messages not loading
**Solution:** Check pagination logic, verify localStorage cache integrity

### Issue: Duplicate messages
**Solution:** Check deduplication logic, verify message IDs are unique

## 🔄 Future Enhancements

### Planned Features
- **File Sharing:** Allow users to share images and documents
- **Voice Messages:** Record and send voice notes
- **Video Calls:** Integrate video calling functionality
- **Message Reactions:** Add emoji reactions to messages
- **Message Search:** Search through chat history

### Performance Improvements
- **Message Compression:** Compress large message payloads
- **Batch Operations:** Batch multiple message operations
- **Optimized Caching:** Improve cache hit rate
- **Predictive Loading:** Preload likely conversations
