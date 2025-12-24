# Navaria Documentation Map

This document provides an overview of all Navaria documentation and when to use each guide.

---

## 📚 Complete Documentation Structure

```
README.md (START HERE)
    │
    ├─► COMMUNITY_SETUP.md ⭐ First-time setup
    │   └─► ADMIN_GUIDE.md → Creating courses
    │       └─► DEPLOYMENT_GUIDE.md → Publishing your app
    │           └─► SUPABASE_LIMITS.md → Scaling considerations
    │
    └─► DEVELOPMENT.md → For developers/contributors
```

---

## 🎯 Which Guide Do I Need?

### I want to deploy Navaria for my school/community

→ **Start with [README.md](./README.md)** to understand the platform
→ **Then follow [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)** for step-by-step deployment

### I've deployed Navaria and want to create courses

→ **Use [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** to learn the admin panel

### I want to share my app with students

→ **Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for web and mobile deployment

### I'm worried about costs or scaling

→ **Read [SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md)** to understand capacity and pricing

### I want to contribute code or understand the architecture

→ **See [DEVELOPMENT.md](./DEVELOPMENT.md)** for technical details

---

## 📖 Documentation Overview

### 1. README.md

**Purpose:** Project overview, mission, and navigation hub
**Audience:** Everyone (educators, developers, community members)
**Key Content:**

- Language preservation mission
- Who can use Navaria
- Feature overview
- Quick links to all guides
- Example use cases

**Start here if:** You're new to Navaria and want to understand what it is

---

### 2. COMMUNITY_SETUP.md ⭐

**Purpose:** Step-by-step deployment guide
**Audience:** Non-technical educators, school administrators
**Estimated Time:** 30-45 minutes
**Key Content:**

- Supabase account creation
- Database setup (single SQL script)
- Environment configuration
- Creating admin users
- Running the app locally

**Start here if:** You want to deploy Navaria for your organisation

---

### 3. ADMIN_GUIDE.md

**Purpose:** Course creation and content management
**Audience:** Educators, content creators
**Key Content:**

- Accessing the admin panel
- Building lessons and exercises
- Creating languages and courses
- Adding audio files
- Managing speakers for dialogues
- Content structure best practices

**Start here if:** You've deployed Navaria and want to create courses

---

### 4. DEPLOYMENT_GUIDE.md

**Purpose:** Publishing your app for students
**Audience:** Anyone wanting to share their Navaria instance
**Key Content:**

- Web deployment (Netlify, Vercel, Cloudflare Pages)
- Mobile app builds (Expo EAS Build)
- App Store and Google Play submission
- Custom domain setup
- Environment variables for production

**Start here if:** You're ready to deploy your app to students

---

### 5. SUPABASE_LIMITS.md

**Purpose:** Understanding capacity, scaling, and costs
**Audience:** Decision makers, budget planners
**Key Content:**

- Free tier capabilities (~400 students)
- Database storage calculations
- When to upgrade to paid tiers
- Cost estimates for different user counts
- Optimisation strategies

**Start here if:** You need to plan capacity or justify costs

---

### 6. DEVELOPMENT.md

**Purpose:** Technical architecture and contribution guide
**Audience:** Developers, contributors
**Key Content:**

- Tech stack (React Native, TypeScript, Supabase)
- Project structure and file organisation
- Database schema details
- Development environment setup (Mac, Windows, Linux)
- Code style guidelines
- Contributing workflow

**Start here if:** You want to modify the code or contribute features

---

## 🔄 Recommended Reading Order

### For Educators Deploying Navaria

1. **[README.md](./README.md)** - Understand the platform (5 minutes)
2. **[COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)** - Deploy your instance (30-45 minutes)
3. **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Create your first course (ongoing)
4. **[SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md)** - Plan for growth (as needed)
5. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Share with students (when ready)

### For Developers Contributing

1. **[README.md](./README.md)** - Project overview (5 minutes)
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Technical setup (30 minutes)
3. **[COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)** - Database setup (for testing)
4. Other guides as reference

---

## 📁 Additional Documentation Files

### Database Setup Files

- **`database/init_schema.sql`** - Complete database initialisation script
  - Run this in Supabase SQL Editor
  - Creates all tables, policies, and storage buckets
  - ~2,500 lines, runs in 10-30 seconds

- **`database/INIT_SCHEMA_FIXES.md`** - Technical changelog for database setup
  - History of fixes and improvements
  - Troubleshooting reference

- **`database/TESTING_CHECKLIST.md`** - Database setup verification
  - Post-setup testing steps
  - Expected results
  - Common errors and solutions

### Other Files

- **`LICENSE`** - MIT License terms
- **`.env.example`** - Environment variable template (if exists)
- **`package.json`** - Project dependencies and scripts

---

## 🆘 Getting Help

### By Topic

| Topic              | Documentation                                              | Additional Help       |
| ------------------ | ---------------------------------------------------------- | --------------------- |
| First-time setup   | [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)                 | GitHub Issues         |
| Creating courses   | [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)                         | Community discussions |
| Deployment issues  | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)               | Expo forums           |
| Database errors    | [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md#troubleshooting) | Supabase docs         |
| Code contributions | [DEVELOPMENT.md](./DEVELOPMENT.md#contributing)            | GitHub Pull Requests  |
| Capacity planning  | [SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md)                 | Supabase pricing page |

### Common Questions

**Q: Where do I start?**
A: Read [README.md](./README.md), then follow [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)

**Q: Do I need to know coding?**
A: No! Content creation is done through the admin panel (see [ADMIN_GUIDE.md](./ADMIN_GUIDE.md))

**Q: How much does it cost?**
A: Free for ~400 students (see [SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md))

**Q: Can I customise the app?**
A: Yes! See [DEVELOPMENT.md](./DEVELOPMENT.md) for technical details

**Q: How do I get my app on app stores?**
A: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for mobile builds

---

## 🔗 Navigation Between Docs

Every documentation file includes a navigation header:

```markdown
📘 Documentation Navigation:
[← Back to README](./README.md) | [Other Guides...](./...)
```

Use these links to quickly jump between related guides!

---

## 📝 Documentation Principles

All Navaria documentation follows these principles:

1. **Clear audience**: Each guide specifies who it's for
2. **Step-by-step**: Instructions are sequential and actionable
3. **Time estimates**: Setup tasks include estimated duration
4. **Visual aids**: Screenshots and code blocks where helpful
5. **Cross-referenced**: Links between related documentation
6. **Beginner-friendly**: Assumes no technical background (except DEVELOPMENT.md)
7. **British English**: Consistent spelling throughout

---

## 🌟 Documentation Improvements

We welcome improvements to documentation! See [DEVELOPMENT.md](./DEVELOPMENT.md#contributing) for:

- How to suggest documentation changes
- Writing style guidelines
- Adding screenshots or examples

---

**Questions about the documentation?** Open an issue on GitHub with the label `documentation`.
