# Backup Strategy Recommendations

## Overview

This document provides comprehensive backup strategy recommendations for the Roommate Link application, covering both Supabase (PostgreSQL) and Cloudflare Pages (frontend) components.

---

## 1. Supabase Database Backups

### 1.1 Built-in Supabase Backups

Supabase provides **automatic daily backups** for all projects:

- **Frequency**: Daily at 00:00 UTC
- **Retention**: 7 days for Free tier, 30 days for Pro tier
- **Point-in-Time Recovery (PITR)**: Available on Pro tier (up to 7 days)

**How to Access:**
1. Go to Supabase Dashboard → Your Project → Database → Backups
2. View available backups and restore points

### 1.2 Manual Database Exports

For additional safety, perform regular manual exports:

**Steps:**
1. Go to Supabase Dashboard → Your Project → Database → Backups
2. Click "Export" to download a `.sql` file
3. Store securely (encrypted) in multiple locations

**Recommended Schedule:**
- **Weekly**: Before any major schema changes
- **Monthly**: As part of routine maintenance
- **Before deployment**: Always export before pushing migrations

### 1.3 Local Backup Script

Create a script to automate backups:

```bash
#!/bin/bash
# backup.sh - Run this weekly via cron or GitHub Actions

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/roommatelink_backup_${DATE}.sql"
SUPABASE_URL="your-project.supabase.co"
SUPABASE_DB_PASSWORD="your-db-password"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Export database
pg_dump -h db.${SUPABASE_URL} -U postgres -d postgres \
  -F c -f ${BACKUP_FILE}

# Encrypt backup (optional but recommended)
gpg --symmetric --cipher-algo AES256 ${BACKUP_FILE}

# Clean up old backups (keep last 30 days)
find ${BACKUP_DIR} -name "*.sql*" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

### 1.4 Backup Best Practices

✅ **DO:**
- Store backups in multiple geographic locations
- Encrypt all backup files
- Test restore procedures regularly
- Document backup and restore procedures
- Use version control for schema changes (migrations)

❌ **DON'T:**
- Store unencrypted backups in cloud storage
- Forget to rotate encryption keys
- Assume backups work without testing
- Keep all backups in a single location
- Rely solely on automatic backups

---

## 2. Supabase Storage Backups

### 2.1 Avatar Images

User avatars are stored in Supabase Storage. Backup strategy:

**Option 1: Periodic Sync**
```bash
# Sync storage bucket to local directory
supabase storage sync --local-path ./storage-backup --bucket-id avatars
```

**Option 2: Use Supabase CLI**
```bash
# Export all storage
supabase storage export --local-path ./storage-backup
```

**Recommended Schedule:**
- **Weekly**: Sync avatars to local storage
- **Monthly**: Archive to cold storage (S3 Glacier, etc.)

### 2.2 Backup Storage Locations

| Type | Location | Retention | Notes |
|------|----------|-----------|-------|
| Daily | Local development machine | 7 days | Fast restore |
| Weekly | Google Drive / Dropbox | 30 days | Easy access |
| Monthly | AWS S3 / Backblaze B2 | 1 year | Cost-effective |
| Quarterly | Physical hard drive (offline) | Permanent | Disaster recovery |

---

## 3. Cloudflare Pages Backups

### 3.1 Git-Based Version Control

Your frontend is already backed up via Git! This is your primary backup strategy.

**Best Practices:**
- Push to remote repository (GitHub, GitLab) after every feature
- Use meaningful commit messages
- Tag releases: `git tag -a v1.0.0 -m "Launch release"`
- Never commit sensitive data (use `.env` files)

### 3.2 Cloudflare Pages Deployment History

Cloudflare Pages maintains deployment history:

- **Free tier**: Last 20 deployments
- **Pro tier**: Unlimited deployments

**How to Access:**
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Deployments" tab
3. View and rollback to any previous deployment

### 3.3 Pre-Deployment Checklist

Before deploying to production:

```bash
# 1. Create a backup branch
git checkout -b backup-before-deploy-$(date +%Y%m%d)

# 2. Tag current production
git tag -a pre-deploy-$(date +%Y%m%d) -m "Pre-deployment backup"

# 3. Push tags to remote
git push --tags
```

---

## 4. Disaster Recovery Plan

### 4.1 Recovery Scenarios

#### Scenario 1: Database Corruption
1. Identify last good backup
2. Restore via Supabase Dashboard → Backups → Restore
3. Run any pending migrations
4. Verify data integrity
5. Monitor for issues

#### Scenario 2: Accidental Data Deletion
1. Use Point-in-Time Recovery (Pro tier) to restore to before deletion
2. Or restore from manual backup and replay transactions
3. Document the incident
4. Add safeguards to prevent recurrence

#### Scenario 3: Complete System Failure
1. Restore database from latest backup
2. Redeploy frontend from Git repository
3. Restore storage from backup
4. Test all functionality
5. Monitor logs for issues

### 4.2 Recovery Time Objectives (RTO)

| Component | Target RTO | Notes |
|------------|------------|-------|
| Database | 1-2 hours | Using Supabase backups |
| Frontend | 30 minutes | Git + Cloudflare Pages |
| Storage | 2-4 hours | Depends on backup size |
| Full System | 4-8 hours | All components |

### 4.3 Recovery Point Objectives (RPO)

| Component | Target RPO | Notes |
|------------|------------|-------|
| Database | 24 hours | Daily backups |
| Frontend | 1 commit | Git version control |
| Storage | 7 days | Weekly backups |

---

## 5. Automated Backup Schedule

### 5.1 GitHub Actions Workflow

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Supabase CLI
        run: |
          curl -fsSL https://supabase.com/install.sh | bash
          echo "$HOME/.supabase/bin" >> $GITHUB_PATH

      - name: Export database
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase db dump -f backup_$(date +%Y%m%d).sql

      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl private
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: 'us-east-1'
          SOURCE_DIR: './'
```

### 5.2 Required Secrets

Set these in GitHub repository settings:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## 6. Monitoring Backup Health

### 6.1 Backup Verification Checklist

- [ ] Daily backups are created successfully
- [ ] Backup files are not corrupted
- [ ] Restore procedure works
- [ ] Backup retention policy is followed
- [ ] Encryption keys are accessible
- [ ] Backup locations are accessible

### 6.2 Alerting

Set up alerts for:
- Failed backup jobs
- Backup file corruption
- Storage quota exceeded
- Unusual restore attempts

---

## 7. Cost Considerations

### 7.1 Backup Storage Costs

| Service | Cost (Monthly) | Notes |
|---------|----------------|-------|
| Supabase Pro Backups | $25 | Included in Pro tier |
| AWS S3 (Standard) | ~$0.023/GB | 1GB = $0.23/month |
| Google Drive | Free (15GB) | Good for small backups |
| Backblaze B2 | ~$0.005/GB | Most cost-effective |

### 7.2 Recommended Setup

**For Launch (Free Tier):**
- Rely on Supabase automatic backups (7-day retention)
- Weekly manual exports stored locally
- Git for frontend version control

**For Production (Pro Tier):**
- Enable Supabase Pro backups (30-day retention)
- Enable Point-in-Time Recovery
- Weekly automated backups to S3
- Monthly archives to cold storage

---

## 8. Quick Reference Commands

```bash
# Export database
supabase db dump -f backup.sql

# Import database
supabase db push

# Sync storage
supabase storage sync --local-path ./storage --bucket-id avatars

# List backups
supabase db list

# Restore from backup
supabase db restore --file backup.sql
```

---

## 9. Contact Information

For backup-related emergencies:
- **Supabase Support**: https://supabase.com/support
- **Cloudflare Support**: https://support.cloudflare.com

---

## Summary

| Priority | Action | Frequency |
|----------|--------|-----------|
| Critical | Supabase automatic backups | Daily (automatic) |
| High | Manual database export | Weekly |
| High | Git push to remote | After every feature |
| Medium | Storage sync | Weekly |
| Medium | Test restore procedure | Monthly |
| Low | Archive to cold storage | Quarterly |

---

**Last Updated**: 2026-04-05
**Next Review**: 2026-07-05
