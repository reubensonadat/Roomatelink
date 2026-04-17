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
- **Signature Verification:** Uses `crypto.subtle.verify()` to verify the HMAC-SHA512 signature from Paystack

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

## 💳 Payment Integration Details

### Paystack Inline Integration
- **Library:** `react-paystack` for seamless integration
- **Callback:** `onSuccess` receives transaction reference
- **Error Handling:** `onCancel` and `onClose` for user actions
- **Metadata:** Transaction metadata includes user ID for tracking

### Payment States
```typescript
interface PaymentState {
  isProcessing: boolean      // Payment in progress
  isSuccess: boolean         // Payment successful
  isFailed: boolean          // Payment failed
  reference: string | null   // Transaction reference
  error: string | null       // Error message
}
```

### Payment Verification Flow
1. **User Initiates Payment:** Click "Pay GHS 25" button
2. **Paystack Popup Opens:** User completes payment on Paystack
3. **Success Callback:** Frontend receives `reference`
4. **Optimistic Update:** Frontend sets `has_paid = true` (RLS protected)
5. **Webhook Triggered:** Paystack sends webhook to Edge Function
6. **Signature Verification:** Edge Function verifies signature
7. **Database Update:** Edge Function confirms `has_paid = true`
8. **Access Granted:** User can now view matches and chat

## 🔐 Webhook Security

### Signature Verification
The `paystack-webhook` Edge Function implements robust security:

```typescript
// Verify Paystack signature
const signature = headers.get('x-paystack-signature');
const isValid = await crypto.subtle.verify(
  'HMAC',
  secretKey,
  signature,
  payload
);
```

**Why This Matters:**
- Prevents fake payment notifications
- Ensures only legitimate Paystack webhooks are processed
- Protects against payment fraud

### Replay Attack Prevention
- **Timestamp Check:** Verify webhook timestamp is recent (within 5 minutes)
- **Idempotency:** Use `reference` to prevent duplicate processing
- **One-Time Processing:** Each reference processed only once

## 📊 Payment Analytics

### Tracked Metrics
- Payment conversion rate
- Average time to complete payment
- Promo code usage
- Payment failure reasons
- Revenue per user

### Quality Metrics
- Payment success rate
- Webhook delivery rate
- User satisfaction with payment flow
- Refund rate

## 🚨 Error Handling

### Payment Failures
- **Network Errors:** Retry payment with user confirmation
- **Paystack Errors:** Display user-friendly error message
- **Timeout Errors:** Provide "Check Vault" option

### Webhook Failures
- **Signature Verification Failed:** Log error, reject webhook
- **Database Error:** Retry webhook processing
- **User Not Found:** Log error, notify admin

### Fallback Scenarios
- **Webhook Not Received:** User can manually trigger verification
- **Payment Not Reflected:** "Check Vault" button forces server-side check
- **Duplicate Payment:** Idempotency prevents double charging

## 🎯 Payment UI Components

### Payment Modal
- **Premium Design:** Boutique-grade UI with glassmorphism
- **Clear Pricing:** Display GHS 25 prominently
- **Promo Code Input:** Allow discount codes
- **Payment Button:** Triggers Paystack popup

### Payment Verification Overlay
- **Loading State:** Show while verifying payment
- **Success State:** Congratulate user on successful payment
- **Error State:** Show error with retry option

### Pioneer Modal
- **Special Offer:** Highlight pioneer benefits
- **Free Access:** Explain pioneer program
- **Claim Button:** Trigger pioneer claim logic

## 💰 Pricing Strategy

### Standard Pricing
- **Base Price:** GHS 25
- **Value Proposition:** Access to verified, compatible roommates
- **One-Time Payment:** No subscription required

### Discount Pricing
- **Promo Code:** GHS 15 (40% discount)
- **Limited Time:** Create urgency
- **Early Adopter:** Reward first users

### Pioneer Program
- **Free Access:** First 100 users get free access
- **Beta Testing:** Pioneers provide feedback
- **Marketing:** Pioneers become brand ambassadors

## 🔍 Payment Verification Edge Function

### Endpoints
- **POST /webhook:** Receive Paystack webhook
- **GET /verify/:reference:** Verify payment status manually

### Security Headers
```typescript
const headers = {
  'Content-Type': 'application/json',
  'x-paystack-signature': 'HMAC-SHA512 signature'
};
```

### Response Codes
- **200 OK:** Payment verified successfully
- **400 Bad Request:** Invalid request or signature
- **404 Not Found:** Payment reference not found
- **500 Internal Server Error:** Server error

## 📱 Mobile Optimization

### Payment Flow
- **One-Tap Payment:** Quick and easy on mobile
- **Responsive Design:** Works on all screen sizes
- **Touch-Friendly:** Large buttons for easy tapping

### Error Handling
- **Clear Error Messages:** Easy to understand on mobile
- **Retry Options:** Simple retry mechanism
- **Network Resilience:** Works on slow connections

## 🚨 Troubleshooting

### Issue: Payment successful but access not granted
**Solution:** Click "Check Vault" button to force verification

### Issue: Payment fails repeatedly
**Solution:** Check Paystack status, verify public key, check network connection

### Issue: Promo code not working
**Solution:** Verify promo code exists in database, check expiration date

### Issue: Webhook not received
**Solution:** Check Paystack webhook URL, verify secret key, check server logs

### Issue: Pioneer claim not working
**Solution:** Verify `is_pioneer` flag, check user ID, check server logs

## 🔄 Future Enhancements

### Planned Features
- **Multiple Payment Methods:** Add Momo, bank transfer options
- **Payment Plans:** Installment options for larger amounts
- **Refund System:** Automated refund process
- **Payment History:** View past payments
- **Invoice Generation:** Generate payment receipts

### Security Improvements
- **Fraud Detection:** AI-powered fraud detection
- **Risk Scoring:** Assess payment risk
- **Two-Factor Authentication:** Add 2FA for payments
- **Biometric Verification:** Fingerprint/Face ID for payments

### Analytics Improvements
- **Real-time Dashboard:** Live payment metrics
- **Conversion Funnel:** Track payment conversion
- **A/B Testing:** Test different pricing strategies
- **Predictive Analytics:** Forecast revenue

## 📋 Compliance

### Data Protection
- **PCI DSS:** Payment card industry compliance
- **GDPR:** General data protection regulation
- **Data Privacy:** User data protection

### Financial Regulations
- **Bank of Ghana:** Compliance with local regulations
- **Tax Compliance:** Proper tax handling
- **Audit Trail:** Complete payment history

## 🎯 Success Metrics

### Payment Metrics
- **Conversion Rate:** Percentage of users who complete payment
- **Success Rate:** Percentage of successful payments
- **Average Time:** Time to complete payment
- **Revenue:** Total revenue generated

### User Metrics
- **Satisfaction:** User satisfaction with payment flow
- **Retention:** User retention after payment
- **Referral:** Users who refer others
- **Support:** Payment-related support tickets
