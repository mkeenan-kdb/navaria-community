# Navaria Quick Start Guide

**Get your language learning platform running in under an hour.**

---

## What is Navaria?

Navaria is a **free, open-source language learning platform** designed for preserving endangered and minority languages. Perfect for schools, educators, and communities.

**Cost:** Free for ~400 students (using Supabase free tier)

---

## ⚡ Super Quick Start (5 Steps)

### 1. Create Supabase Account (5 minutes)

- Go to [supabase.com](https://supabase.com) → Sign up
- Create new project → Save your password
- Copy **Project URL** and **anon key** from Settings → API

### 2. Set Up Database (2 minutes)

- Go to SQL Editor in Supabase
- Copy **all contents** of `database/init_schema.sql`
- Paste and click **Run**
- Wait for "Success. No rows returned"

### 3. Clone and Install (5 minutes)

```bash
git clone <repository-url>
cd navaria_languages
npm install
```

### 4. Configure App (2 minutes)

Create `.env` file in project root (you can use the provided `.env.example` as a template):

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run the App (1 minute)

```bash
npm run web #EASIEST setup; for web version
npx expo prebuild --platform ios --clean #to build your app for ios
npx expo prebuild --platform android --clean #to build your app for android
npx expo run:ios #to run on your ios device or simulator
npx expo run:android #to run on your android device or simulator
```

**Done!** Your app is running at `http://localhost:8081`

---

## 🎓 Next Steps

### Create Your First Admin User

1. **Sign up** in the app (any email/password)
2. Go to Supabase → **Authentication** → **Users**
3. Click your user → **Edit User**
4. Add to **User Metadata**:
   ```json
   change the role column from "user" to "admin"
   ```
5. Restart app and log in
6. You'll now see **Admin Panel** in the menu!

### Create Your First Course

**Default Languages Available:**
Your database includes Irish, Navajo, and Māori by default. You can create courses for any of these immediately!

1. Open **Admin Panel** → **Manage Courses**
2. Click **+** to create a course
3. Fill in: Title, Description
4. Select **Language** from dropdown (Irish, Navajo, or Māori)
5. Click **Save**

See **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** for detailed course creation and adding new languages.

---

## 📚 Full Documentation

| Guide                                            | When to Use                 | Time      |
| ------------------------------------------------ | --------------------------- | --------- |
| **[README.md](./README.md)**                     | Overview and mission        | 5 min     |
| **[COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)**   | Detailed setup instructions | 30-45 min |
| **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)**           | Creating courses & lessons  | Ongoing   |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Publishing to students      | 1-2 hours |
| **[SUPABASE_LIMITS.md](./SUPABASE_LIMITS.md)**   | Capacity planning           | As needed |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)**           | For developers              | As needed |

---

## 🆘 Common Issues

### "Cannot connect to Supabase"

- Check your `.env` file has correct URL and key
- Verify project is active (not paused) in Supabase dashboard

### "No tables found"

- Re-run `database/init_schema.sql` in Supabase SQL Editor
- Check for error messages during script execution

### "Permission denied" on admin panel

- Make sure you changed your users `role` value in the `profiles` table from `"user"` to `"admin"`
- Log out and log back in

### App won't start

```bash
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 💡 Pro Tips

✅ **Use the web version first** - Easiest to get started
✅ **Start with 1-2 simple lessons** - Test before building full courses
✅ **Add audio later** - Create text content first, add pronunciation after
✅ **Test with real students** - Get feedback before scaling up
✅ **Backup your database** - Export from Supabase regularly

---

## 📞 Need Help?

- **Detailed setup**: [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)
- **Creating content**: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **Troubleshooting**: Check guide's troubleshooting section
- **Technical issues**: Open GitHub issue
- **Questions**: GitHub Discussions

---

## 🌟 You're Ready!

With these basics, you can:

- ✅ Deploy Navaria locally
- ✅ Create admin users
- ✅ Build your first course
- ✅ Test with students

**Want to share with the world?**
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for web and mobile deployment.

---

**Navaria: Preserving languages, one lesson at a time.** 🌍
