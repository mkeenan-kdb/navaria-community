# Navaria Deployment Guide

**📘 Documentation Navigation:**
[← Back to README](./README.md) | [← Admin Guide](./ADMIN_GUIDE.md) | [Setup Guide](./COMMUNITY_SETUP.md) | [Development Guide](./DEVELOPMENT.md)

---

This guide covers all deployment options for Navaria, from quick web hosting to building full mobile apps for app stores.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Web Deployment](#web-deployment)
3. [Mobile App Deployment](#mobile-app-deployment)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Environment Variables for Production](#environment-variables-for-production)
6. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

Navaria can be deployed in multiple ways:

| Deployment Type             | Best For                      | Difficulty | Cost      |
| --------------------------- | ----------------------------- | ---------- | --------- |
| **Web (Cloudflare Pages)**  | Quick sharing, testing        | Easy       | Free      |
| **Web (Netlify/Vercel)**    | Alternative web hosting       | Easy       | Free      |
| **Expo Go**                 | Testing on phones             | Very Easy  | Free      |
| **EAS Build (Development)** | Testing with full features    | Medium     | Free      |
| **EAS Build (Production)**  | App Store submission          | Hard       | $29/month |
| **Local Build**             | Full control, no Expo account | Hard       | Free      |

---

## Web Deployment

Web deployment makes Navaria accessible through any browser. This is the fastest way to share your instance.

### Option 1: Cloudflare Pages (Recommended)

Cloudflare Pages offers free, fast global hosting with unlimited bandwidth.

#### Prerequisites

- Cloudflare account (free at [cloudflare.com](https://cloudflare.com))
- Wrangler CLI: `npm install -g wrangler`

#### Step 1: Build the Web App

```bash
# Use the provided build script
chmod +x buildWeb.sh
./buildWeb.sh
```

This script:

1. Exports the Expo web app
2. Restructures files for `/app` subpath
3. Adds SPA routing redirects

#### Step 2: Deploy to Cloudflare

```bash
# Login to Cloudflare (first time only)
npx wrangler login

# Deploy
npx wrangler pages deploy dist --project-name navaria-yourschool --branch main
```

#### Step 3: Access Your App

Your app will be available at:

- `https://navaria-yourschool.pages.dev/app`

See [Custom Domain Setup](#custom-domain-setup) to use your own domain.

---

### Option 2: Netlify

#### Step 1: Build the App

```bash
# Export for web
npx expo export -p web
```

#### Step 2: Create Netlify Configuration

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npx expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 3: Deploy

**Option A: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Option B: Netlify Web UI**

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop your `dist` folder
3. Your site is live instantly!

---

### Option 3: Vercel

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Create Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Step 3: Deploy

```bash
# Login
vercel login

# Deploy
vercel --prod
```

---

### Option 4: Static File Hosting

You can host the `dist` folder on any static host:

- **GitHub Pages**: Free, integrates with GitHub repos
- **Firebase Hosting**: Free tier available
- **AWS S3 + CloudFront**: Pay-as-you-go
- **Your own server**: Copy `dist` to your web root

---

## Mobile App Deployment

Mobile deployment puts Navaria on students' phones as a native app.

### Option 1: Expo Go (Testing Only)

**Easiest way to test on real devices, but NOT for distribution.**

#### How It Works

1. Students install **Expo Go** from App Store/Play Store
2. You share a QR code or link
3. They scan it to load your app

#### Steps

```bash
# Start development server
npm start

# Share the QR code with students
# Or use: npx expo start --tunnel (for external access)
```

**Limitations:**

- Requires internet connection
- Students need Expo Go installed
- Not a "real" app (can't publish to stores)
- Some native features may not work

---

### Option 2: EAS Build (Development Build)

**Creates a real app for testing, with full native features.**

#### Prerequisites

- Expo account (free at [expo.dev](https://expo.dev))
- EAS CLI: `npm install -g eas-cli`

#### Step 1: Configure EAS

```bash
# Login to Expo
eas login

# Initialise EAS (if not done)
eas build:configure
```

#### Step 2: Create Development Build

**For iOS:**

```bash
eas build --profile development --platform ios
```

**For Android:**

```bash
eas build --profile development --platform android
```

This takes 10-20 minutes and creates a `.ipa` (iOS) or `.apk` (Android) file.

#### Step 3: Install on Devices

**iOS:**

- Download the `.ipa` from the EAS build page
- Install via TestFlight or a device provisioning profile

**Android:**

- Download the `.apk` from the EAS build page
- Transfer to device and install (may need to enable "Install from unknown sources")

---

### Option 3: EAS Build (Production/App Stores)

**For publishing to Apple App Store or Google Play Store.**

⚠️ **Note**: This requires paid developer accounts:

- Apple Developer Program: $99/year
- Google Play Console: $25 one-time fee
- Expo EAS subscription: $29/month (or use free tier with limitations)

#### Step 1: Prepare App Information

Update `app.json`:

```json
{
  "expo": {
    "name": "Irish Learning (Navaria)",
    "slug": "navaria-yourschool",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourschool.navaria",
      "appleTeamId": "YOUR_TEAM_ID"
    },
    "android": {
      "package": "com.yourschool.navaria"
    }
  }
}
```

#### Step 2: Build for Production

**iOS:**

```bash
eas build --profile production --platform ios
```

**Android:**

```bash
eas build --profile production --platform android
```

#### Step 3: Submit to Stores

**iOS (App Store):**

```bash
eas submit --platform ios
```

**Android (Google Play):**

```bash
eas submit --platform android
```

Follow the prompts to complete submission.

#### App Store Requirements

**Apple App Store:**

- Screenshots (multiple sizes)
- App description and keywords
- Privacy policy URL
- Support URL
- Age rating information

**Google Play Store:**

- Feature graphic (1024x500)
- Screenshots
- App description
- Content rating questionnaire
- Privacy policy

---

### Option 4: Local Build (Advanced)

**Build the app on your own computer without EAS.**

#### iOS (Mac Only)

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
cd ios
open Navaria.xcworkspace

# Build and archive in Xcode:
# Product → Archive → Distribute App
```

#### Android

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK will be in: android/app/build/outputs/apk/release/
```

---

## Custom Domain Setup

### For Cloudflare Pages

1. Go to your Cloudflare Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `learn.yourschool.ie`)
5. Cloudflare will automatically configure DNS

### For Netlify

1. In Netlify project, go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration instructions

### For Vercel

1. In Vercel project, go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS records as instructed

---

## Environment Variables for Production

**Never commit your `.env` file!** For production deployments, set environment variables in your hosting platform.

### Cloudflare Pages

1. In your project, go to **Settings** → **Environment variables**
2. Add:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (if needed)

### Netlify

```bash
# Using CLI
netlify env:set EXPO_PUBLIC_SUPABASE_URL "your-url"
netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "your-key"
```

Or add via Netlify dashboard: **Site settings** → **Environment variables**

### Vercel

```bash
# Using CLI
vercel env add EXPO_PUBLIC_SUPABASE_URL
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Or add via Vercel dashboard: **Settings** → **Environment Variables**

### EAS Build

Create `eas.json` (should already exist):

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
      }
    }
  }
}
```

Or use EAS Secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
```

---

## Troubleshooting

### Web Deployment Issues

#### "Blank page after deployment"

- Check browser console for errors
- Verify environment variables are set
- Ensure `baseUrl` in `app.json` matches your deployment path
- Check SPA redirects are configured

#### "Assets not loading"

- Verify the `dist` folder contains all files
- Check asset paths are relative (not absolute)
- Ensure static file hosting is enabled

#### "API calls failing"

- Verify environment variables are set correctly
- Check Supabase project is not paused
- Verify CORS settings in Supabase (should allow your domain)

### Mobile Build Issues

#### "Build failed on EAS"

- Check build logs in the EAS dashboard
- Verify `app.json` is valid JSON
- Ensure all dependencies are compatible
- Try: `npm install` and rebuild

#### "App crashes on launch"

- Check environment variables are set
- Review crash logs in EAS or device logs
- Verify Supabase credentials are correct
- Test in development build first

#### "Can't install APK on Android"

- Enable "Install from unknown sources" in Android settings
- Verify the APK was built for the correct architecture
- Try uninstalling any previous version first

#### "iOS app won't install"

- Verify provisioning profile matches your device
- Check your Apple Developer account status
- For development builds, device must be registered in Apple Developer portal

---

## Next Steps After Deployment

1. **Test thoroughly**: Try all features in the deployed environment
2. **Monitor usage**: Set up analytics (optional)
3. **Backup your database**: Regular Supabase backups
4. **Update content**: Use the admin panel to add courses
5. **Gather feedback**: Get student input for improvements

---

## Deployment Checklist

Before going live:

- [ ] Tested all core features (signup, login, exercises, audio)
- [ ] Environment variables set correctly
- [ ] At least one complete course with audio
- [ ] Admin panel access working
- [ ] Custom domain configured (if using)
- [ ] Privacy policy and terms of service (if required)
- [ ] App icons and splash screen updated
- [ ] Supabase project on appropriate plan for expected users
- [ ] Backup strategy in place

---

## Cost Summary

### Free Tier (Recommended for Small Deployments)

**Web Hosting:**

- Cloudflare Pages: Free (unlimited bandwidth)
- Netlify: Free (100GB bandwidth/month)
- Vercel: Free (100GB bandwidth/month)

**Mobile Testing:**

- Expo Go: Free
- EAS Build (limited): 15 builds/month free

**Backend:**

- Supabase Free Tier: See [SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md)

### Paid Requirements (Optional)

**App Store Distribution:**

- Apple Developer: $99/year
- Google Play: $25 one-time
- EAS Build Production: $29/month (or use local builds)

**Scaling:**

- Supabase Pro: $25/month (for more users/storage)
- Custom domains: Usually free or ~$10-15/year

---

## Additional Resources

- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Guide**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **Cloudflare Pages**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages/)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

**Good luck with your deployment!** 🚀
