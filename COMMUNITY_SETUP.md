# Navaria Community Setup Guide

**📘 Documentation Navigation:**
[← Back to README](./README.md) | [Admin Guide →](./ADMIN_GUIDE.md) | [Deployment Guide](./DEPLOYMENT_GUIDE.md) | [Development Guide](./DEVELOPMENT.md)

---

Welcome! This guide will help you deploy your own instance of Navaria for your school, organisation, or community. Navaria is a free, open-source language learning platform designed for teaching endangered and minority languages.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [Database Configuration](#database-configuration)
5. [Storage Configuration](#storage-configuration)
6. [Local Development Setup](#local-development-setup)
7. [Creating Your First Admin User](#creating-your-first-admin-user)
8. [Next Steps](#next-steps)

---

## Overview

By following this guide, you will:

- Create a free Supabase account (backend database and storage)
- Set up the database schema with all required tables
- Configure authentication and storage
- Run the app locally for testing
- Be ready to add your own course content

**Estimated setup time**: 30-45 minutes

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Computer**: Mac, Windows, or Linux
- [ ] **Node.js**: Download from [nodejs.org](https://nodejs.org/) (LTS version)
- [ ] **Git**: Download from [git-scm.com](https://git-scm.com/)
- [ ] **Code Editor**: VS Code recommended ([code.visualstudio.com](https://code.visualstudio.com/))
- [ ] **Email Account**: For Supabase registration
- [ ] **Basic Command Line Knowledge**: Ability to run terminal commands

### Check Your Installation

Open a terminal/command prompt and verify:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show 2.x.x or higher
```

---

## Supabase Setup

Supabase provides your app's backend (database, authentication, file storage). The free tier is generous and works well for small-to-medium deployments (up to 500MB database, 1GB storage, 5GB bandwidth/month, 50,000 MAU).

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with GitHub, GitLab, or email
4. Verify your email if required

### Step 2: Create a New Project

1. Click **New Project**
2. Choose your organisation (or create one)
3. Fill in project details:
   - **Name**: `navaria-[yourschool]` (e.g., `navaria-irish-college`)
   - **Database Password**: Generate a strong password and **save it securely**
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (to start)
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

### Step 3: Get Your API Credentials

Once your project is ready:

1. Go to **Settings** (gear icon in sidebar)
2. Click **API**
3. Copy and save these values (you'll need them later):
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - click "Reveal" to see it)

⚠️ **Important**: Keep the `service_role` key secret! Never commit it to public repositories.

---

## Database Configuration

Now we'll set up all the tables, views, and functions your app needs using a single unified script.

### Step 1: Access the SQL Editor

1. In your Supabase dashboard, click **SQL Editor** (in the left sidebar)
2. Click **New query**

### Step 2: Run the Complete Setup Script

1. On your computer, navigate to where you cloned/downloaded Navaria
2. Open the file: `database/init_schema.sql`
3. Copy the **entire contents** (this is a large file with ~2,500 lines)
4. Paste it into the Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for completion (may take 10-30 seconds)
7. You should see: "Success. No rows returned"

**This single script sets up everything:**

- ✅ All database tables and schemas
- ✅ Row Level Security (RLS) policies
- ✅ Functions and triggers
- ✅ Indexes for performance
- ✅ Storage buckets (`course_media`, `profile-images`, `content_drafts`)
- ✅ Storage bucket policies
- ✅ Default languages (Irish, Navajo, Māori)

**You can skip the Storage Configuration section below** - it's all done automatically!

### Step 3: Verify Database Setup

1. In Supabase, click **Table Editor** (in the left sidebar)
2. You should see many tables including:
   - `profiles`
   - `languages`
   - `courses`
   - `lessons`
   - `exercises`
   - `exercise_units`
   - `sentence_audio`
   - `word_audio`
   - And many more...

3. Click on the **languages** table
4. You should see 6 default languages:
   - Irish (Gaeilge) - Standard, Munster, Connacht, Ulster
   - Navajo (Diné bizaad)
   - Māori (Te Reo Māori)

If you see these tables and languages, your database is set up correctly! ✅

---

## Storage Configuration (Optional - Already Done!)

**Note**: If you ran the `init_schema.sql` script above, storage buckets are already created and configured. This section is for reference only.

Navaria uses Supabase Storage to host audio files for pronunciation exercises.

### Buckets Created Automatically

The following buckets were created by the init_schema.sql script:

#### Bucket 1: `course_media`

- Name: `course_media`
- Public bucket: **Yes** (enable)
- File size limit: 10 MB
- Allowed MIME types: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `image/jpeg`, `image/png`
- **Purpose**: Course audio files and media content

#### Bucket 2: `profile-images`

- Name: `profile-images`
- Public bucket: **Yes** (enable)
- File size limit: 2 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Purpose**: User and speaker profile pictures/avatars

#### Bucket 3: `content_drafts`

- Name: `content_drafts`
- Public bucket: **No** (keep private)
- File size limit: 5 MB
- Allowed MIME types: `application/json`
- **Purpose**: Admin draft storage (requires admin permissions)

### Step 2: Configure Bucket Policies

For each bucket, you need to set up policies to allow access:

**Option A: Make Buckets Public (Easiest)**

1. Click on a bucket (e.g., **audio**)
2. Click the **Settings** or **Configuration** tab
3. Toggle **Public bucket** to ON
4. This automatically allows public read access

**Option B: Create Custom Policies (Advanced)**

1. Click on a bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Create policies for:
   - **SELECT**: Allow public to view files
   - **INSERT**: Allow authenticated users to upload
   - **UPDATE**: Allow authenticated users to update their files
   - **DELETE**: Allow authenticated users to delete their files

**Recommended**:

- Use Option A (public) for `course_media` and `profile-images`
- Keep `content_drafts` **private** (only admins should access drafts)

---

## Local Development Setup

Now let's get the app running on your computer.

### Step 1: Clone the Repository

```bash
# If you have Git access to the repository
git clone <repository-url>
cd navaria_languages

# Or download and extract the ZIP file, then navigate to the folder
```

### Step 2: Install Dependencies

```bash
npm install
```

This will take 2-5 minutes to download all required packages.

### Step 3: Configure Environment Variables

1. In the project root, create a file named `.env`
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace the values with the credentials you saved earlier.

⚠️ **Security Note**:

- The `.env` file is already in `.gitignore` to prevent accidental commits
- Never share your `service_role` key publicly
- For production deployments, use environment variables in your hosting platform

### Step 4: Start the Development Server

```bash
npm start
```

You should see:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web browser
```

### Step 5: Open the App

Choose one of these options:

#### Option A: Web Browser (Easiest)

```bash
Press 'w' or run: npm run web
```

The app will open in your default browser at `http://localhost:8081`

#### Option B: Mobile Device with Expo Go

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in your terminal
3. The app will load on your device

#### Option C: iOS Simulator (Mac only)

```bash
Press 'i' or run: npm run ios
```

#### Option D: Android Emulator

```bash
Press 'a' or run: npm run android
```

(Requires Android Studio with an emulator set up)

---

## Creating Your First Admin User

To access the admin panel and create courses, you need an admin account.

### Step 1: Create a User Account in the App

1. Open the app (web, mobile, or simulator)
2. Click **Sign Up** or **Create Account**
3. Enter your email and password
4. Complete the registration

### Step 2: Grant Admin Access via Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. Click **Profiles** table
4. Find your newly created user
5. Edit the column value for `role` from `user` to `admin`
6. Go back to the app and you will see access to the admin dashboard in your sidebar

### Step 3: Verify Admin Access

1. Restart the app or refresh the browser
2. Log in with your account
3. Open the navigation drawer (hamburger menu)
4. You should now see **Admin Panel** in the menu
5. Click it to access the admin dashboard

🎉 **Congratulations!** You now have full admin access.

---

## Next Steps

Now that your Navaria instance is running:

1. **Create Course Content**: See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for detailed instructions on:
   - Creating languages
   - Building lessons first, then courses
   - Adding exercises and recording audio in-app
   - Managing speakers for dialogues

2. **Deploy Your App**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
   - Web hosting options (Cloudflare Pages, Netlify, Vercel)
   - Building mobile apps (Expo EAS Build)
   - Creating standalone APK/IPA files
   - Custom domain setup

3. **Understand Costs & Limits**: See [SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md) for:
   - Free tier limitations
   - When you need to upgrade
   - Cost estimates for different user counts
   - Optimisation tips

---

## Troubleshooting

### "Cannot connect to Supabase"

- Verify your `.env` file has the correct URL and keys
- Check that your Supabase project is active (not paused)
- Ensure you have internet connection

### "No tables found" in Supabase

- Go back to [Database Configuration](#database-configuration)
- Re-run all SQL migrations in order
- Check for error messages in the SQL Editor

### App won't start / Metro bundler errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --clear
```

### "Permission denied" on storage uploads

- Verify storage buckets are created in Supabase Storage tab
- Re-run the complete `database/init_schema.sql` script if buckets are missing
- Check bucket policies in Supabase Storage settings

### Still having issues?

- Check the main [README.md](./README.md) for development environment setup
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Open an issue on the project repository (if available)

---

## Community Support

We encourage you to:

- Share your deployment experiences
- Contribute improvements to these docs
- Help other educators setting up their instances
- Share course content (if appropriate for your language)

**Welcome to the Navaria community!** 🌍📚

---

## License

Navaria is open-source software licensed under the MIT License. You are free to use, modify, and distribute it for educational purposes.
