# 07 - Payment Flow & Verification

The payment system integrates Paystack with a **Double-Handshake** architecture to ensure that access is never granted without structural verification.

## 🔑 Split-Key Security
We operate on a zero-trust model for the frontend:
- **Public Key:** Exposed to the browser. Only used to open the Paystack payment popup.
- **Secret Key:** Lives exclusively in **Supabase Edge Function Secrets**. It is never included in the client bundle.

## 🌊 Complete Payment Lifecycle

### 1. Initialization (Client)
The `usePaymentFlow` hook manages the Paystack Inline popup. When a student pays, Paystack returns a `reference`.

### 2. The Direct Update (Optimistic)
Upon success, the frontend attempts to update the user's `has_paid` flag directly. This is gated by **RLS** to ensure users can only update their own records.

### 3. The Webhook (Asynchronous Source of Truth)
Paystack sends a POST request to our `paystack-webhook` Edge Function.
- **Verification:** The function uses the **Web Crypto API** (not Node `crypto`) to verify the Paystack signature using our Secret Key.
- **Persistence:** Even if the student closes their browser mid-payment, the Webhook ensures the database is updated.

### 4. The Fallback Sync (Manual Check)
If a user is verified on Paystack but the database hasn't updated (e.g., due to background network failure), we provide a **"Check Vault"** button.
- **Logic:** This button makes a `GET` request to the same Edge Function. 
- **The Why:** This request forces a real-time server-to-server check with Paystack, bypassing local state issues and restoring access immediately.

## 🎟️ Promo Codes & Discounts
Promo codes (GHS 15 vs GHS 25) are stored in the `promo_codes` table.
- **Sync:** When a code is entered, we query the DB in real-time.
- **Derived Price:** The `finalPrice` is a derived state based on whether a valid `discount_amount` was fetched. We do not store the price on the user object; we only store the reference and the `has_paid` flag.

## 🔄 Pioneer Logic
Identified via `is_pioneer`. Pioneer users trigger the `handlePioneerClaim` logic, which ignores the payment gateway and flips the `has_paid` flag directly, rewarding early adopters without a financial barrier.
