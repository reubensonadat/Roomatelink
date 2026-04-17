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

## 📦 Deployment Process

### 1. Prepare Environment
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with production values
```

### 2. Build Application
```bash
# Build for production
npm run build

# Test build locally
npm run preview
```

### 3. Deploy to Cloudflare Pages
```bash
# Using Cloudflare CLI
npx wrangler pages deploy dist

# Or via Git integration
# Push to main branch for automatic deployment
```

### 4. Deploy Supabase Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy match-calculate
npx supabase functions deploy paystack-webhook
npx supabase functions deploy verify-student
npx supabase functions deploy pioneer-check
npx supabase functions deploy delete-account
```

### 5. Set Supabase Secrets
```bash
# Set Paystack secret
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...

# Set Resend API key
npx supabase secrets set RESEND_API_KEY=re_...
```

### 6. Run Database Migrations
```bash
# Push migrations to production
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

## 🔐 Security Checklist

### Environment Variables
- [ ] All secrets are set in Supabase, not in `.env`
- [ ] `VITE_` prefix used for all client-side variables
- [ ] No hardcoded secrets in code
- [ ] `.env` file in `.gitignore`

### Authentication
- [ ] OAuth redirect URLs configured correctly
- [ ] Session timeout settings appropriate
- [ ] RLS policies enabled on all tables
- [ ] Service role key not exposed to client

### Payment Security
- [ ] Paystack live key in production
- [ ] Paystack secret key in Edge Functions only
- [ ] Webhook signature verification enabled
- [ ] Idempotency handling implemented

### Database Security
- [ ] RLS policies tested with unauthenticated user
- [ ] No public tables with sensitive data
- [ ] Database backups enabled
- [ ] Connection pooling configured

## 📊 Monitoring & Logging

### Application Monitoring
- **Cloudflare Analytics:** Monitor traffic, errors, performance
- **Supabase Dashboard:** Monitor database queries, edge functions
- **Error Tracking:** Implement error tracking (Sentry, LogRocket)

### Key Metrics to Track
- **Performance:** Cold start time, page load time, API response time
- **Errors:** Error rate, error types, error frequency
- **User Behavior:** Active users, session duration, feature usage
- **Business:** Payment conversion, match rate, retention rate

### Logging Strategy
- **Client-Side:** Log user actions, errors, performance metrics
- **Server-Side:** Log API requests, database queries, edge function executions
- **Structured Logs:** Use JSON format for easy parsing
- **Log Levels:** DEBUG, INFO, WARN, ERROR, FATAL

## 🔄 Continuous Deployment

### Git Workflow
- **Main Branch:** Production deployments
- **Develop Branch:** Staging deployments
- **Feature Branches:** Development and testing

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy to Cloudflare Pages
        run: npx wrangler pages deploy dist
```

### Automated Testing
- **Unit Tests:** Test individual components and functions
- **Integration Tests:** Test API endpoints and database operations
- **E2E Tests:** Test user flows end-to-end
- **Performance Tests:** Test application performance under load

## 🚨 Troubleshooting

### Build Failures
- **Issue:** Build fails on Cloudflare Pages
  **Solution:** Check build logs, verify Node.js version, check dependencies

### Deployment Failures
- **Issue:** Edge function deployment fails
  **Solution:** Check function logs, verify secrets, test locally first

### Runtime Errors
- **Issue:** Application errors in production
  **Solution:** Check Cloudflare logs, check Supabase logs, review error tracking

### Performance Issues
- **Issue:** Slow page load times
  **Solution:** Optimize images, minify code, enable caching, use CDN

### Authentication Issues
- **Issue:** Users cannot log in
  **Solution:** Check OAuth configuration, verify redirect URLs, check RLS policies

### Payment Issues
- **Issue:** Payments not processing
  **Solution:** Check Paystack keys, verify webhook URL, check webhook logs

## 📱 PWA Deployment

### PWA Configuration
- **Manifest:** `public/manifest.json` configured correctly
- **Service Worker:** Service worker registered and working
- **Install Prompt:** Install prompt showing correctly
- **Offline Support:** Offline functionality working

### PWA Testing
- **Installability:** Test install on different devices
- **Offline Mode:** Test offline functionality
- **Update Mechanism:** Test app updates
- **Push Notifications:** Test push notifications

## 🔄 Rollback Strategy

### Database Rollback
```bash
# Rollback to previous migration
npx supabase migration down

# Or restore from backup
npx supabase db restore <backup-file>
```

### Application Rollback
- **Cloudflare Pages:** Rollback to previous deployment
- **Edge Functions:** Revert to previous version
- **Environment Variables:** Restore previous values

### Rollback Triggers
- Critical bugs affecting users
- Security vulnerabilities
- Performance degradation
- Data corruption

## 📋 Post-Deployment Checklist

### Immediate Actions
- [ ] Verify application is accessible
- [ ] Test critical user flows
- [ ] Check error rates
- [ ] Monitor performance metrics

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify payment processing
- [ ] Test authentication flow

### First Week
- [ ] Analyze performance metrics
- [ ] Review user behavior
- [ ] Check conversion rates
- [ ] Gather user feedback

## 🎯 Success Metrics

### Technical Metrics
- **Uptime:** 99.9%+ uptime
- **Response Time:** <200ms average response time
- **Error Rate:** <1% error rate
- **Build Time:** <5 minutes build time

### Business Metrics
- **User Acquisition:** New user signups
- **Conversion Rate:** Payment conversion rate
- **Retention Rate:** User retention over time
- **Satisfaction:** User satisfaction score

## 📚 Documentation

### Developer Documentation
- **Code Comments:** Inline code comments
- **API Documentation:** API endpoint documentation
- **Architecture Docs:** System architecture documentation
- **Deployment Docs:** Deployment procedures

### User Documentation
- **User Guide:** How to use the application
- **FAQ:** Frequently asked questions
- **Troubleshooting:** Common issues and solutions
- **Support:** How to get support

## 🔧 Maintenance

### Regular Tasks
- **Weekly:** Review logs and metrics
- **Monthly:** Update dependencies
- **Quarterly:** Security audit
- **Annually:** Architecture review

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

### Security Updates
- **Dependencies:** Keep dependencies up to date
- **Vulnerabilities:** Fix security vulnerabilities promptly
- **Policies:** Review and update security policies
- **Access:** Review and update access controls

## 🚀 Scaling

### Vertical Scaling
- **Database:** Upgrade Supabase plan for more resources
- **Edge Functions:** Increase function timeout and memory
- **CDN:** Upgrade Cloudflare plan for better performance

### Horizontal Scaling
- **Load Balancing:** Use Cloudflare's load balancing
- **Caching:** Implement aggressive caching strategies
- **Database:** Use connection pooling

### Cost Optimization
- **Monitoring:** Monitor resource usage
- **Optimization:** Optimize queries and code
- **Caching:** Reduce database queries with caching
- **CDN:** Use CDN for static assets

## 📞 Support

### Emergency Contacts
- **Technical Lead:** [Contact information]
- **Database Admin:** [Contact information]
- **Cloudflare Support:** [Contact information]
- **Supabase Support:** [Contact information]

### Escalation Procedures
1. **Level 1:** Developer on call
2. **Level 2:** Technical lead
3. **Level 3:** CTO/Engineering manager
4. **Level 4:** Vendor support (Cloudflare, Supabase)

### Incident Response
1. **Detection:** Monitor alerts and logs
2. **Assessment:** Determine impact and severity
3. **Response:** Implement fix or workaround
4. **Recovery:** Restore normal operations
5. **Post-Mortem:** Document and learn from incident

## 🎓 Handover

### Knowledge Transfer
- **Code Walkthrough:** Walk through codebase with new developers
- **Architecture Review:** Review system architecture
- **Documentation:** Provide comprehensive documentation
- **Training:** Train team on deployment procedures

### Access Handover
- **Cloudflare:** Transfer Cloudflare account access
- **Supabase:** Transfer Supabase project access
- **GitHub:** Transfer repository access
- **Domain:** Transfer domain ownership

### Responsibilities
- **Deployment:** Who handles deployments
- **Monitoring:** Who monitors the application
- **Support:** Who provides user support
- **Maintenance:** Who handles maintenance tasks
