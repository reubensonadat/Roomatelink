# Monitoring Recommendations

## Overview

This document provides comprehensive monitoring recommendations for the Roommate Link application, covering Cloudflare Pages (frontend) and Supabase (backend, database, auth, edge functions).

---

## 1. Cloudflare Pages Monitoring

### 1.1 Built-in Cloudflare Analytics

Cloudflare Pages provides built-in analytics accessible via the dashboard:

**Access:**
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Analytics" tab

**Available Metrics:**
- Page views
- Unique visitors
- Bandwidth usage
- Top pages
- Geographic distribution
- Device types
- Browser statistics

### 1.2 Web Analytics Setup

Enable detailed web analytics:

```bash
# Cloudflare Analytics is automatically enabled for Pages
# No additional setup required
```

**Key Metrics to Monitor:**
- **Page Views**: Track user engagement
- **Bounce Rate**: High bounce rate indicates UX issues
- **Load Time**: Slow load times affect user experience
- **Error Rate**: 4xx/5xx errors indicate problems

### 1.3 Real User Monitoring (RUM)

Cloudflare provides RUM data for performance insights:

**Metrics:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

**Target Performance:**
- FCP: < 1.8s
- LCP: < 2.5s
- CLS: < 0.1

### 1.4 Cloudflare Logs

Access deployment and build logs:

**Steps:**
1. Cloudflare Dashboard → Pages → Your Project
2. Click "Deployments" tab
3. Select a deployment to view logs

**What to Monitor:**
- Build failures
- Deployment errors
- Runtime errors
- Warning messages

### 1.5 Cloudflare Workers Analytics

For edge functions (if any):

```javascript
// Add logging to edge functions
export default {
  async fetch(request, env, ctx) {
    console.log('Request received:', request.url)
    // ... your code
    console.log('Response sent')
  }
}
```

---

## 2. Supabase Monitoring

### 2.1 Supabase Dashboard Monitoring

Access the Supabase Dashboard for comprehensive monitoring:

**URL:** `https://app.supabase.com/project/your-project-id`

**Key Sections:**

#### 2.1.1 Database Monitoring

**Access:** Dashboard → Database → Reports

**Metrics to Monitor:**
- **Active Connections**: Track concurrent connections
- **Query Performance**: Slow queries (>1s)
- **Cache Hit Ratio**: Should be > 95%
- **Database Size**: Monitor growth
- **Table Sizes**: Identify large tables
- **Index Usage**: Unused indexes waste resources

**Alert Thresholds:**
```
Active Connections: > 80% of max
Query Duration: > 1s (warning), > 5s (critical)
Cache Hit Ratio: < 90% (warning), < 80% (critical)
```

#### 2.1.2 Auth Monitoring

**Access:** Dashboard → Auth → Reports

**Metrics to Monitor:**
- **Sign-ups per day**: Track user acquisition
- **Sign-ins per day**: Track active users
- **Failed sign-ins**: Potential security issues
- **Email verification rate**: Track onboarding completion

**Alert Thresholds:**
```
Failed Sign-ins: > 10% of total attempts
Email Verification Rate: < 50% of new sign-ups
```

#### 2.1.3 Storage Monitoring

**Access:** Dashboard → Storage

**Metrics to Monitor:**
- **Storage usage**: Track avatar storage
- **Bandwidth usage**: Monitor CDN costs
- **File count**: Track total files
- **Bucket sizes**: Identify large buckets

**Alert Thresholds:**
```
Storage Usage: > 80% of limit
Bandwidth: > 10GB/month (warning), > 50GB/month (critical)
```

#### 2.1.4 Edge Functions Monitoring

**Access:** Dashboard → Edge Functions → Logs

**Metrics to Monitor:**
- **Invocation count**: Track function usage
- **Error rate**: Failed invocations
- **Execution time**: Slow functions
- **Cold starts**: Latency spikes

**Alert Thresholds:**
```
Error Rate: > 5% (warning), > 10% (critical)
Execution Time: > 5s (warning), > 10s (critical)
Cold Starts: > 20% of invocations
```

### 2.2 Supabase Logs

Access detailed logs for debugging:

**Types of Logs:**
- **Database Logs**: SQL queries, errors
- **Auth Logs**: Sign-ins, sign-ups, errors
- **API Logs**: REST API requests
- **Edge Function Logs**: Function execution logs

**How to Access:**
1. Dashboard → Edge Functions → Logs
2. Filter by function name, date, or status

**Log Query Examples:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Find failed auth attempts
SELECT *
FROM auth.audit_log_entries
WHERE action = 'user.signin_failed'
ORDER BY created_at DESC
LIMIT 100;
```

### 2.3 Supabase Realtime Monitoring

Monitor Realtime subscriptions:

**Access:** Dashboard → Realtime

**Metrics:**
- **Active connections**: WebSocket connections
- **Channel subscriptions**: Active channels
- **Messages per second**: Throughput
- **Errors**: Connection failures

**Alert Thresholds:**
```
Connection Errors: > 5% of connections
Messages/Second: > 1000 (warning), > 5000 (critical)
```

---

## 3. Error Tracking

### 3.1 Supabase Error Logging

Enable error logging in edge functions:

```typescript
// supabase/functions/match-calculate/index.ts
import { serve } from "std/http/server.ts"

serve(async (req: Request) => {
  try {
    // ... your code
  } catch (error) {
    console.error('Match calculation error:', error)
    // Send to external error tracking
    await sendToErrorTracking(error, req)
    throw error
  }
})

async function sendToErrorTracking(error: any, req: Request) {
  // Send to Sentry, LogRocket, or custom endpoint
  const payload = {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }
  
  await fetch('https://your-error-tracking.com/api/log', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

### 3.2 Client-Side Error Tracking

Add error tracking to React app:

```typescript
// src/lib/errorTracking.ts
interface ErrorEvent {
  message: string
  stack?: string
  url: string
  userId?: string
  timestamp: string
}

export function trackError(error: Error, context?: Record<string, any>) {
  const event: ErrorEvent = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }

  // Add user context if available
  const userId = localStorage.getItem('userId')
  if (userId) {
    event.userId = userId
  }

  // Send to error tracking service
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, context })
  })
}

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error || new Error(event.message))
})

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  trackError(event.reason || new Error('Unhandled promise rejection'))
})
```

### 3.3 Recommended Error Tracking Services

| Service | Free Tier | Features | Recommendation |
|---------|-----------|----------|----------------|
| Sentry | 5,000 errors/month | Real-time, source maps, release tracking | ⭐⭐⭐⭐⭐ Best for production |
| LogRocket | 1,000 sessions/month | Session replay, console logs | ⭐⭐⭐⭐ Good for debugging |
| Bugsnag | 250 errors/month | Error grouping, release tracking | ⭐⭐⭐ Good alternative |
| Custom | Free | Full control, requires setup | ⭐⭐ Good for MVP |

---

## 4. Performance Monitoring

### 4.1 Web Vitals Tracking

Track Core Web Vitals in your app:

```typescript
// src/lib/performance.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

export function trackWebVitals() {
  onCLS((metric) => sendMetric('CLS', metric))
  onFID((metric) => sendMetric('FID', metric))
  onFCP((metric) => sendMetric('FCP', metric))
  onLCP((metric) => sendMetric('LCP', metric))
  onTTFB((metric) => sendMetric('TTFB', metric))
}

function sendMetric(name: string, metric: any) {
  const payload = {
    name,
    value: metric.value,
    rating: metric.rating,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }

  // Send to analytics
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

// Initialize in main.tsx
import { trackWebVitals } from './lib/performance'

trackWebVitals()
```

### 4.2 Database Query Monitoring

Monitor slow queries:

```sql
-- Enable query logging (temporary, for debugging)
ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- View slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check for missing indexes
SELECT 
  schemaname,
  tablename,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000 AND idx_scan = 0
ORDER BY seq_scan DESC;
```

---

## 5. Alerting Setup

### 5.1 Supabase Alerts

Set up alerts in Supabase Dashboard:

**Steps:**
1. Dashboard → Settings → Alerts
2. Create new alert
3. Configure conditions and notifications

**Recommended Alerts:**

| Alert Type | Condition | Severity |
|------------|-----------|----------|
| Database CPU | > 80% for 5 minutes | Warning |
| Database Memory | > 85% for 5 minutes | Warning |
| Database Connections | > 80% of max | Critical |
| Failed Auth Attempts | > 10% of attempts | Warning |
| Edge Function Errors | > 5% error rate | Warning |
| Storage Usage | > 80% of limit | Warning |
| API Rate Limit | > 80% of limit | Warning |

### 5.2 Cloudflare Alerts

Set up Cloudflare alerts:

**Steps:**
1. Cloudflare Dashboard → Notifications
2. Create notification rule
3. Configure triggers (Webhooks, Email, Slack)

**Recommended Alerts:**

| Alert Type | Condition | Severity |
|------------|-----------|----------|
| Build Failure | Any deployment fails | Critical |
| High Error Rate | 5xx errors > 5% | Warning |
| High Bandwidth | > 10GB in 24 hours | Warning |
| WAF Block | > 100 blocks/minute | Warning |

### 5.3 Custom Alerting with GitHub Actions

Create `.github/workflows/monitoring.yml`:

```yaml
name: Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check API health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-api.com/health)
          if [ $response -ne 200 ]; then
            echo "API health check failed: $response"
            exit 1
          fi

      - name: Check database connectivity
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-project.supabase.co/rest/v1/)
          if [ $response -ne 200 ]; then
            echo "Database health check failed: $response"
            exit 1
          fi

      - name: Send alert on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"❌ Health check failed for Roommate Link"}'
```

---

## 6. Uptime Monitoring

### 6.1 External Uptime Monitoring

Use external services for uptime monitoring:

| Service | Free Tier | Check Interval | Features |
|---------|-----------|----------------|----------|
| UptimeRobot | 50 monitors | 5 minutes | Basic alerts |
| Pingdom | 1 monitor | 1 minute | Detailed reports |
| StatusCake | 10 monitors | 30 seconds | Multi-region |
| Better Uptime | 50 monitors | 30 seconds | Status page |

### 6.2 Recommended Endpoints to Monitor

```
GET /                    - Landing page
GET /dashboard           - Protected route (auth check)
GET /api/health          - Health check endpoint
GET /api/matches         - API functionality
POST /api/payment        - Payment webhook
```

### 6.3 Create Health Check Endpoint

Add to your app:

```typescript
// src/pages/HealthPage.tsx (or create API route)
import { supabase } from '../lib/supabase'

export async function loader() {
  try {
    // Check database
    const { error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      return Response.json({ 
        status: 'unhealthy', 
        database: 'down',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    return Response.json({ 
      status: 'healthy', 
      database: 'up',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
```

---

## 7. Monitoring Dashboard

### 7.1 Recommended Dashboard Layout

Create a custom monitoring dashboard:

| Section | Metrics | Refresh Rate |
|---------|----------|--------------|
| Overview | Active users, error rate, uptime | 1 minute |
| Database | Connections, query time, cache hit | 30 seconds |
| Auth | Sign-ups, sign-ins, failures | 1 minute |
| Edge Functions | Invocations, errors, latency | 30 seconds |
| Performance | Web Vitals, load times | 5 minutes |
| Costs | Bandwidth, storage, compute | 1 hour |

### 7.2 Tools for Custom Dashboards

| Tool | Free Tier | Features |
|------|-----------|----------|
| Grafana | Free | Powerful, flexible |
| Metabase | Free | Easy to use |
| Supabase Dashboard | Included | Built-in metrics |
| Cloudflare Analytics | Included | Frontend metrics |

---

## 8. Monitoring Best Practices

### 8.1 DO ✅

- Monitor from multiple geographic locations
- Set up alerts before issues occur
- Monitor both technical and business metrics
- Regularly review and adjust thresholds
- Document monitoring setup and procedures
- Test alerting systems regularly
- Monitor trends, not just absolute values

### 8.2 DON'T ❌

- Ignore warnings until they become critical
- Set alerts too sensitive (alert fatigue)
- Forget to monitor third-party dependencies
- Only monitor happy paths (test failures too)
- Forget to monitor costs
- Ignore logs until something breaks
- Monitor without context (baseline first)

---

## 9. Cost Monitoring

### 9.1 Cloudflare Costs

**Free Tier Limits:**
- Bandwidth: Unlimited
- Build minutes: 500/month
- Edge Functions: 100,000 requests/day

**What to Monitor:**
- Build minutes usage
- Edge function invocations
- Bandwidth by region

### 9.2 Supabase Costs

**Free Tier Limits:**
- Database: 500MB
- Auth: 50,000 MAU
- Storage: 1GB
- Bandwidth: 2GB
- Edge Functions: 500,000 invocations/month

**What to Monitor:**
- Database size growth
- Active users (MAU)
- Storage usage
- Edge function invocations
- API request count

### 9.3 Cost Alerting

Set up cost alerts:

```sql
-- Monitor database size
SELECT 
  pg_size_pretty(pg_database_size('postgres')) as size,
  (pg_database_size('postgres')::float / 524288000) * 100 as percent_used
FROM pg_database
WHERE datname = 'postgres';

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 10. Quick Reference

### 10.1 Critical Monitoring Commands

```bash
# Check Supabase logs
supabase functions logs match-calculate

# Check database size
supabase db size

# Check edge function status
supabase functions list

# Check Cloudflare build status
# (Via dashboard)
```

### 10.2 Alert Thresholds Summary

| Metric | Warning | Critical |
|--------|---------|----------|
| Database CPU | > 80% | > 90% |
| Database Memory | > 85% | > 95% |
| Connections | > 80% | > 90% |
| Query Time | > 1s | > 5s |
| Error Rate | > 5% | > 10% |
| Storage | > 80% | > 95% |
| Bandwidth | > 10GB | > 50GB |

---

## 11. Monitoring Checklist

### Pre-Launch Checklist

- [ ] Enable Cloudflare Analytics
- [ ] Set up Supabase dashboard alerts
- [ ] Configure error tracking (Sentry or custom)
- [ ] Set up external uptime monitoring
- [ ] Create health check endpoint
- [ ] Test all alerts
- [ ] Document monitoring procedures
- [ ] Set up cost monitoring
- [ ] Create monitoring dashboard
- [ ] Train team on monitoring tools

### Ongoing Checklist

- [ ] Review metrics daily (first week)
- [ ] Review metrics weekly (after launch)
- [ ] Adjust alert thresholds as needed
- [ ] Review logs for anomalies
- [ ] Update monitoring documentation
- [ ] Test backup/restore procedures
- [ ] Review costs monthly

---

## Summary

| Priority | Monitoring Area | Frequency |
|----------|-----------------|-----------|
| Critical | Uptime | Continuous |
| Critical | Error Rate | Continuous |
| Critical | Database Health | Every 5 minutes |
| High | Auth Metrics | Every minute |
| High | Edge Functions | Every 5 minutes |
| Medium | Performance | Every hour |
| Medium | Costs | Daily |
| Low | Analytics | Weekly |

---

**Last Updated**: 2026-04-05
**Next Review**: 2026-07-05
