# Supabase Free Tier & Scaling Guide

**📘 Documentation Navigation:**
[← Back to README](./README.md) | [Setup Guide](./COMMUNITY_SETUP.md) | [Admin Guide](./ADMIN_GUIDE.md) | [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

This guide explains Supabase's free tier limitations, when you'll need to upgrade, and how to estimate costs for your Navaria deployment.

## Table of Contents

1. [Free Tier Overview](#free-tier-overview)
2. [What's Included for Free](#whats-included-for-free)
3. [Understanding Your Usage](#understanding-your-usage)
4. [When to Upgrade](#when-to-upgrade)
5. [Pricing Plans](#pricing-plans)
6. [Cost Estimation Examples](#cost-estimation-examples)
7. [Optimisation Tips](#optimisation-tips)
8. [Monitoring Your Usage](#monitoring-your-usage)

---

## Free Tier Overview

Supabase's free tier is generous and perfect for:

- **Small to medium schools**: 150-250 active students (limited by database/storage, not user count)
- **Testing and development**: Building and testing your courses
- **Pilot programmes**: Launching with a small group first

**Important**: While Supabase allows 50,000 Monthly Active Users for authentication, the practical limit for Navaria is determined by **database storage (500 MB)** and **file storage (1 GB)**, not user count. Each student generates progress data that consumes database space.

The free tier includes full access to all features with usage limits. Projects pause after 1 week of inactivity.

---

## What's Included for Free

### Database

- **500 MB database space**
  - Stores user profiles, course content, progress data
  - ~5,000-10,000 students worth of data (depending on course size)

- **Unlimited API requests**
  - No limit on database queries
  - No limit on user authentication

### File Storage

- **1 GB storage space**
  - For audio files (pronunciation recordings)
  - ~200-500 audio files depending on quality

- **5 GB bandwidth per month**
  - Downloads of audio files and database transfers
  - Resets monthly

- **50 MB max file upload size**
  - More than enough for audio clips

### Authentication

- **50,000 Monthly Active Users (MAU)**
  - Students who log in at least once per month
  - This is **NOT the limiting factor** for Navaria
  - Database and storage limits will be reached long before you hit 50,000 users
  - Realistically, you'll support 150-250 students before database fills up

### Realtime

- **200 concurrent connections**
  - Students using the app simultaneously
  - Adequate for classroom-sized deployments

### Edge Functions (Optional)

- **500,000 invocations per month**
  - Only needed for advanced features
  - Not required for basic Navaria functionality

### Project Limits

- **2 free projects per organisation**
  - Each organisation can have up to 2 free-tier projects
  - Consider this when planning multi-school deployments

### Important Notes

- **Project pausing**: Projects pause after **1 week of inactivity** (see [Prevent Project Pausing](#prevent-project-pausing-free-tier) below)
- **Log retention**: Limited on free tier; upgrade for longer retention
- **Backups**: No automatic backups on free tier; Pro tier includes daily backups

---

## Understanding Your Usage

### Database Storage Estimates

| Content Type    | Approximate Size | Notes                                |
| --------------- | ---------------- | ------------------------------------ |
| User profile    | ~5 KB            | Basic user data                      |
| Course          | ~2 KB            | Course metadata                      |
| Lesson          | ~3 KB            | Lesson details                       |
| Exercise        | ~5 KB            | Exercise configuration               |
| Exercise unit   | ~1 KB            | Individual sentence/translation pair |
| Progress record | ~2 KB            | Per lesson per student               |
| User stats      | ~3 KB            | Per student aggregate stats          |
| Achievements    | ~1 KB            | Per achievement per student          |

**Example Calculation for 100 Students:**

- 100 students × 5 KB (profile) = 500 KB
- 10 courses × 50 lessons × 5 exercises = 2,500 exercises × 6 KB = 15 MB (course content)
- 100 students × 10 courses × 50 lessons = 50,000 progress records × 2 KB = 100 MB
- 100 students × 3 KB (stats) = 300 KB
- 100 students × 20 achievements × 1 KB = 2 MB
- **Total: ~118 MB** (24% of 500 MB limit)

**This means:**

- **100 students** = ~118 MB (~24% of limit) ✅
- **200 students** = ~236 MB (~47% of limit) ✅
- **400 students** = ~472 MB (~94% of limit) ⚠️
- **500 students** = ~590 MB (exceeds 500 MB limit) ❌

**Therefore, the practical limit is around 400-420 students** before hitting the 500 MB database limit, NOT the 50,000 MAU authentication limit.

### Storage Estimates

| Audio Quality | Duration   | File Size | Files per 1 GB |
| ------------- | ---------- | --------- | -------------- |
| 64 kbps MP3   | 5 seconds  | ~40 KB    | 25,000         |
| 128 kbps MP3  | 5 seconds  | ~80 KB    | 12,500         |
| 64 kbps MP3   | 10 seconds | ~80 KB    | 12,500         |

**Example Course:**

- 50 lessons × 5 exercises × 4 sentences = 1,000 audio clips
- At 64 kbps, 5-second clips: 1,000 × 40 KB = **40 MB**
- **10 courses = 400 MB** (under 1 GB limit)

### Bandwidth Estimates

Bandwidth is consumed when students download audio files and transfer database data.

**Calculation:**

- Average lesson: 20 audio clips × 40 KB = 800 KB
- 100 students × 5 lessons/month = 500 lesson completions
- 500 × 800 KB = **400 MB/month** (well under 5 GB limit)

---

## When to Upgrade

**Key Point**: Your limiting factors will be **database storage** and **file storage**, NOT user count. Supabase allows 50,000 users to authenticate, but each student's progress data consumes database space.

You should consider upgrading when you experience any of these:

### Database Storage

✅ **Free tier is fine** if:

- Under 300 active students
- Under 20 courses
- Database usage shows under 400 MB

⚠️ **Consider upgrading** if:

- 350+ active students
- 30+ courses with extensive content
- Database approaching 450 MB
- Consider archiving old progress data to extend capacity

### File Storage

✅ **Free tier is fine** if:

- Under 10 complete courses
- Using compressed audio (64 kbps)
- Storage shows under 800 MB

⚠️ **Consider upgrading** if:

- 15+ complete courses
- Using high-quality audio (128+ kbps)
- Storage approaching 900 MB
- Planning to add video content

### Bandwidth

✅ **Free tier is fine** if:

- Under 200 monthly active students
- Students complete 5-10 lessons/month average
- Monthly bandwidth under 4 GB

⚠️ **Consider upgrading** if:

- 400+ monthly active students
- Very high engagement (15+ lessons/student/month)
- Bandwidth consistently over 4.5 GB

### Performance

✅ **Free tier is fine** if:

- App feels responsive
- Queries complete quickly
- Few concurrent users (under 20 simultaneously)

⚠️ **Consider upgrading** if:

- Slow query times
- 50+ students online simultaneously
- Need dedicated resources

---

## Pricing Plans

### Free Tier

- **Price**: $0/month
- **Best for**: Testing, small schools (up to 100 students)
- **Limits**: See above
- **Project pausing**: After 7 days of inactivity (send a query to keep active)

### Pro Plan

- **Price**: $25/month per project
- **Database**: 8 GB included
- **Storage**: 100 GB included
- **Bandwidth**: 250 GB included
- **Best for**: 100-500 students
- **Extras**:
  - No project pausing
  - Daily backups (7-day retention)
  - Email support
  - Dedicated resources

### Team Plan

- **Price**: $599/month
- **Best for**: 500-5,000 students or multiple schools
- **Includes**:
  - Everything in Pro
  - Longer backup retention
  - Priority support
  - Team collaboration features

### Enterprise

- **Price**: Custom
- **Best for**: 5,000+ students or nationwide deployments
- **Includes**:
  - Custom limits
  - SLA guarantees
  - Dedicated support
  - On-premise options

---

## Cost Estimation Examples

### Scenario 1: Single Classroom

- **Students**: 30
- **Courses**: 3
- **Monthly active users**: 25
- **Recommended**: **Free tier**
- **Cost**: $0/month

### Scenario 2: Small School

- **Students**: 150
- **Courses**: 10
- **Monthly active users**: 100
- **Usage**: ~150 MB database, ~600 MB storage, ~1.2 GB bandwidth
- **Recommended**: **Free tier**
- **Cost**: $0/month
- **Note**: Well within bandwidth limits; can grow significantly before needing upgrade

### Scenario 3: Medium School

- **Students**: 500
- **Courses**: 20
- **Monthly active users**: 350
- **Usage**: ~500 MB database, ~1.5 GB storage, ~3.5 GB bandwidth
- **Recommended**: **Free tier** initially, then **Pro tier** as you approach database/storage limits
- **Cost**: $0/month initially, then $25/month when needed

### Scenario 4: School District

- **Students**: 2,000 across multiple schools
- **Courses**: 50
- **Monthly active users**: 1,200
- **Recommended**: **Team tier** or multiple Pro projects
- **Cost**: $599/month or $75/month (3 Pro projects)

### Scenario 5: Community/Public Instance

- **Students**: Unlimited sign-ups
- **Courses**: 30
- **Monthly active users**: Unknown (could be thousands)
- **Recommended**: Start with **Pro tier**, monitor usage
- **Cost**: $25/month minimum, possibly Team tier
- **Strategy**: Consider usage limits or require teacher approval

---

## Optimisation Tips

### Reduce Database Usage

1. **Archive old data**: Move completed student progress to cold storage
2. **Limit progress history**: Only keep recent lesson attempts
3. **Clean up test data**: Remove test users and courses
4. **Optimise queries**: Use indexed columns for faster, lighter queries

### Reduce Storage Usage

1. **Compress audio**: Use 64 kbps for voice (128 kbps for music)
2. **Trim silence**: Remove dead air from audio clips
3. **Reuse audio**: Share common word audio across exercises
4. **Use shorter clips**: Keep sentences under 10 seconds
5. **External hosting**: Host audio on YouTube/SoundCloud (link only)

### Reduce Bandwidth Usage

1. **Cache aggressively**: Audio files are cached locally in the app
2. **Preload lessons**: Download audio when on WiFi
3. **Progressive loading**: Load audio on-demand rather than upfront
4. **CDN integration**: Use Supabase's CDN (automatic on Pro tier)

### Prevent Project Pausing (Free Tier)

The free tier pauses after 1 week of inactivity. To prevent:

1. **Keep students active**: Even one login per week prevents pausing
2. **Set up a cron job**: Send a simple query daily
3. **Use a monitoring service**: UptimeRobot (free) can ping an endpoint

**Simple keep-alive:**

```bash
# Run this daily (e.g., via cron or GitHub Actions)
curl "https://your-project.supabase.co/rest/v1/profiles?limit=1" \
  -H "apikey: your-anon-key"
```

---

## Monitoring Your Usage

### Supabase Dashboard

1. Go to your Supabase project
2. Click **Settings** → **Usage**
3. Review current usage across all categories

### Key Metrics to Watch

| Metric        | Free Limit | Check Frequency | Alert Threshold |
| ------------- | ---------- | --------------- | --------------- |
| Database Size | 500 MB     | Weekly          | 400 MB (80%)    |
| Storage Size  | 1 GB       | Weekly          | 800 MB (80%)    |
| Bandwidth     | 5 GB/month | Weekly          | 4 GB (80%)      |
| Active Users  | 50,000 MAU | Monthly         | 40,000 (80%)    |

### Setting Up Alerts

Unfortunately, Supabase doesn't have built-in usage alerts on the free tier. To monitor:

1. **Manual checks**: Review usage dashboard weekly
2. **Export metrics**: Note usage in a spreadsheet
3. **Upgrade to Pro**: Get automatic usage notifications

---

## Gradual Scaling Strategy

### Phase 1: Launch (Free Tier)

- Start with 1-3 courses
- Invite 20-50 beta testers
- Monitor usage closely
- Gather feedback

### Phase 2: Growth (Free Tier)

- Add more courses
- Expand to 100-150 students
- Optimise based on usage patterns
- Plan for upgrade when reaching 80% of limits

### Phase 3: Scale (Pro Tier)

- Upgrade before hitting limits
- Expand to full school
- 500+ students
- Multiple courses per language

### Phase 4: Expansion (Team Tier or Multiple Projects)

- District-wide deployment
- Thousands of students
- Consider separating schools into different projects
- Evaluate cost vs. benefits of Team tier

---

## Alternative Architectures for Large Deployments

If costs become prohibitive:

### Option 1: Multiple Free Projects

- Create separate Supabase projects per school
- Each organisation can have up to 2 free projects
- Each school gets its own instance
- Manage centrally with unified content
- **Pros**: Distributed risk, stays free longer
- **Cons**: More complex management, limited to 2 per organisation

### Option 2: Hybrid Storage

- Keep database on Supabase
- Move audio to cheaper storage (AWS S3, Cloudflare R2)
- Update `audio_url` to point to external CDN
- **Pros**: Significant cost savings on storage/bandwidth
- **Cons**: More complex setup

### Option 3: Self-Hosted Supabase

- Run your own Supabase instance on a VPS
- Full control over resources
- **Pros**: No usage limits, potentially cheaper at scale
- **Cons**: Requires DevOps expertise, maintenance burden

---

## Questions to Ask Before Upgrading

1. **Can we optimise first?** Review optimisation tips above
2. **Is usage temporary?** (e.g., exam season spike)
3. **Can we split into multiple projects?** One per school/program
4. **Do we need all features?** Maybe remove underused courses
5. **Can we fundraise?** $25-30/month is often grantable for education

---

## Resources

- **Supabase Pricing**: [supabase.com/pricing](https://supabase.com/pricing)
- **Usage Dashboard**: Your project → Settings → Usage
- **Optimisation Guide**: [supabase.com/docs/guides/platform/performance](https://supabase.com/docs/guides/platform/performance)
- **Support**: [supabase.com/support](https://supabase.com/support)

---

## Summary

**For most educational deployments:**

- Start with the **free tier**
- Monitor usage monthly
- The free tier can comfortably support **200-400 active students** depending on:
  - How much progress data accumulates (archive old data to extend capacity)
  - Audio file sizes (use 64 kbps compression)
  - Number of courses (share audio across courses when possible)
- Upgrade to **Pro ($25/month)** when you approach database/storage limits
- Optimise before upgrading when possible

**Key Takeaway**: While Supabase allows 50,000 Monthly Active Users, your actual capacity is limited by:

1. **Database storage (500 MB)** ← Usually the first limit you'll hit
2. **File storage (1 GB)** ← Second limit for audio-heavy courses
3. **Bandwidth (5 GB/month)** ← Rarely a constraint with normal usage

The practical student limit is **~400 students** before database fills up, NOT 50,000. The free tier is perfect for getting started and can support most small-to-medium school deployments.

**Good luck scaling your language learning program!** 📈🎓
