# Supabase Backend & Edge Functions

This directory contains the core database configuration and serverless logic for Roommate Link.

## 🚀 Deployment Command

If the `supabase` CLI is not installed globally on your machine, use `npx` to run it:

```bash
npx supabase functions deploy match-calculate --no-verify-jwt
```

## 🔐 Why `--no-verify-jwt`?

We use the `--no-verify-jwt` flag for all our edge functions (`match-calculate`, `pioneer-check`, etc.) because of a common issue called **Clock Skew**.

1. **The Problem**: If a student's phone or laptop clock is even 1 minute faster than the Supabase server, the default security check will reject their login token as being "from the future" before the function even runs.
2. **The Solution**: By using `--no-verify-jwt`, we allow the request to reach our code.
3. **Manual Security**: We don't just let anyone in! Inside the function code, we manually verify the user's identity using a more flexible check that handles these small clock differences.

## 🛠️ Environment Secrets

If you need to update API keys (like Paystack), use the following command:

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=your_key_here
```
