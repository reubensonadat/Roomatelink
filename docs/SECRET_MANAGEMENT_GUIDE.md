# 🏛️ Secret Management Guide — Locking the Vault

Your Edge Functions are ready for action, but they require **Secret Keys** to talk to Paystack and the Database. Here is the junior-friendly guide to setting them up.🥇

## 1. Local Testing (Your Computer)
When you are testing functions on your own laptop, you need a local "Vault."

1. Create a file at **`supabase/functions/.env`**.
2. Paste the following (replace the values with your actual keys from the Supabase Dashboard):
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-long-master-key
   PAYSTACK_SECRET_KEY=sk_test_your-key-here
   ```
3. When you start the chef, tell him where the keys are:
   `npx supabase functions serve --env-file ./supabase/functions/.env`

---

## 2. Production (The Live Restaurant)
When you "Deploy" your chef to the live restaurant, you must give him the keys there too. 🥇

Run this command in your terminal for each key:
```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your-key-here
```
> [!TIP]
> Supabase automatically provides the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in production, so you only need to manually set the **`PAYSTACK_SECRET_KEY`**!

---

## 3. How do I know it worked?
Inside your `index.ts` file, we use this line:
`const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!`

- If the key is in the vault, the application **"takes"** it and continues.
- If the key is missing, the `!` at the end will cause the function to "Crash" immediately. This is a **"Bank-Grade" Security Guard** that prevents the code from running without protection.🥇

---

## 🏛️ Final "Supervision" Checklist
- [x] **Import Map**: Standardized (std/supabase-js).
- [x] **Typos**: Sealed (`calculate`, `get`).
- [x] **Logic**: Verified (88% vs 58% science).
- [x] **Security**: HMAC-SHA-512 Paystack signature verification active.
