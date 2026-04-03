# Volume 10: Deployment and CI/CD

Roommate Link is composed of two deploying pieces: the Frontend (Cloudflare Pages) and the Backend (Supabase Edge node).

## 1. Cloudflare Pages (Frontend)
Everything inside `src/` and `index.html` builds into the `dist/` folder via Vite.
Cloudflare connects directly to your GitHub repository and runs:
```bash
npm run build
```
**CRITICAL ERROR:** If an AI agent refactors a component and forgets to delete an unused variable like `import { Settings } from 'lucide-react'`, local development will simply show a warning. However, the Cloudflare CI/CD pipeline runs `tsc` (TypeScript Compiler) strictly. Unused variables crash `npm run build` completely and halt the deployment! 
**Always verify the build locally before pushing:**
```bash
npm run build
```

The environment variables strictly necessary on Cloudflare Pages:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
*(These are injected dynamically into the bundle. Never place Service Role keys here).*

## 2. Supabase Functions (Backend)
Edge functions live inside `supabase/functions/`. They are Deno scripts. They do not auto-deploy on GitHub pushes. You must manually deploy them via your local command line:
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```
Environment variables for Edge Functions operate differently. They are heavily secured and managed in the Supabase Dashboard directly.
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
These keys exist in Deno as `Deno.env.get('PAYSTACK_SECRET_KEY')`. If you add a new API key, you MUST add it to your project via `npx supabase secrets set KEY_NAME=value`.
