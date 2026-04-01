# DEPLOYMENT & DOMAIN GUIDE — Cloudflare Pages
## Where to Buy, How to Connect, How to Get Analytics

---

## PART 1: WHERE TO BUY YOUR DOMAIN
### Recommendation: Buy from Cloudflare Registrar
**Why Cloudflare Registrar:**
- **Zero markup:** Cloudflare sells domains at wholesale cost.
- **Free WHOIS privacy forever.**
- **DNS is already there.**
- **One dashboard.**

### When to Buy Elsewhere
- **`.gh` domains:** Ghana's country-code TLD.
- **Client projects.**

---

## PART 2: CONNECTING YOUR DOMAIN TO CLOUDFLARE PAGES
### Step 1: Add Custom Domain to Pages Project
- Cloudflare Dashboard → Workers & Pages → Your Project → Custom domains
- Click "Set up a custom domain" → Type your domain.

### Step 2: Add the "www" Version (Recommended)
- Add `www.yourdomain.com` with redirect.

### Step 3: Cloudflare Handles Everything Automatically
- DNS records added automatically.
- SSL certificate provisioned automatically.

---

## PART 3: GETTING ANALYTICS
### Option A: Cloudflare Web Analytics (FREE, Privacy-Focused)
**What it gives you:** Page views, unique visitors, referrers, device type.
**How to set up:**
- Cloudflare Dashboard → Web Analytics → Add site.
- Copy JavaScript snippet → Add to React `@index.html` inside `<head>`.

### Option B: Plausible Analytics (Better Reports, Small Cost)
**What it gives you:** Custom goals, individual page analytics, campaign tracking.
**How to set up:** Sign up at plausible.io → Add site domain → Add script to index.html.

---

## PART 4: STEP-BY-STEP DEPLOYMENT CHECKLIST
### First-Time Setup
1. Create GitHub repository.
2. Push initial React (Vite) project.
3. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
4. Select GitHub repo.
5. Build command: `npm run build`, Build output directory: `dist`.
6. Save and Deploy.

### Every Subsequent Deployment
- Push to GitHub's main branch → Cloudflare automatically rebuilds.

### Adding Custom Domain
- Buy domain from Cloudflare Registrar.
- Pages project → Custom domains → Add yourdomain.com.
- Verify: Site loads at yourdomain.com.

---

## PART 5: THE VERCEL DEPLOYMENT (FOR THE CURRENT NEXT.JS VERSION)
Since you are deploying the current Next.js version to Vercel for testing:
1. Go to vercel.com → Sign up with GitHub.
2. Import your GitHub repo → Framework Preset: Next.js (auto-detected).
3. Click "Deploy".

### Adding Custom Domain on Vercel + Cloudflare DNS
- Vercel: Project → Settings → Domains → Add yourdomain.com.
- Cloudflare DNS: Add records.
- **CRITICAL: Set the Proxy Status to GREY CLOUD (DNS Only).**

---

**Welcome to the Cloudflare ecosystem.**
