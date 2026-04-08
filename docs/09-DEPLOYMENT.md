# 09 - Deployment & Handover Guide

Roommate Link is designed for **Zero-Downtime Deployment** on Cloudflare Pages. This guide provides the final checklist for promoting code from development to production students.

## 🚀 Cloudflare Pages Configuration
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- **Node.js Version:** 18+
- **Environment:** Production (Main branch deployments)

## 🔑 Required Environment Variables
All browser-side variables must be prefixed with `VITE_`.

### Frontend (.env)
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: The public anonymous key.
- `VITE_PAYSTACK_PUBLIC_KEY`: Used for initializing payments.
- `VITE_FCM_VAPID_KEY`: Firebase Push Notification public key.

### Supabase Edge Secrets
These must be set via the CLI (`npx supabase secrets set ...`) and are NOT in the `.env` file:
- `PAYSTACK_SECRET_KEY`: Private key for verifying webhooks.
- `RESEND_API_KEY`: For sending verification emails.

## 🛠️ The Management CLI
- **Deploy Edge Functions:** `npx supabase functions deploy <function-name>`
- **Database Migrations:** `npx supabase db push`
- **Local Dev Simulation:** `npx supabase start`

## 🚨 Pre-Launch "Kill-Switch" Checklist
Before opening the platform to the student body (Handover Audit):

1.  **RLS Audit:** Run `SELECT * FROM messages` as an unauthenticated user in the SQL Editor. It must return **0 rows**.
2.  **Redirect Integrity:** Ensure `auth/callback` points to the production domain, not `localhost`.
3.  **Paystack Toggle:** Verify `VITE_PAYSTACK_PUBLIC_KEY` is the **LIVE** key (`pk_live_...`), not the test key.
4.  **Database Capacity:** Monitor the "Questionnaire Responses" count. If expected sign-ups exceed 50,000, ensure Supabase is upgraded to the "Pro" plan to avoid CPU time throttling on the matching engine.

## 🧹 Housekeeping
- **Deprecated Files:** Root-level documentation (like `apparchitecture.md`) should be archived after this suite is adopted.
- **Archive-v1:** This folder contains legacy Next.js code and has been removed to prevent architectural drift.
