# Navaria Development Guide

**📘 Documentation Navigation:**
[← Back to README](./README.md) | [Setup Guide](./COMMUNITY_SETUP.md) | [Admin Guide](./ADMIN_GUIDE.md) | [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

This guide covers technical details for developers who want to contribute to Navaria or understand its architecture.

**Not a developer?** See [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md) for deploying Navaria without coding.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Development Setup](#development-setup)
5. [Windows Development](#windows-development)
6. [Achievement System](#achievement-system)
7. [Admin Access](#admin-access)
8. [Scripts](#scripts)
9. [Contributing](#contributing)

---

## Tech Stack

| Category             | Technology                                       |
| -------------------- | ------------------------------------------------ |
| **Framework**        | React Native 0.81.5 / Expo 54                    |
| **Language**         | TypeScript                                       |
| **State Management** | Zustand                                          |
| **Navigation**       | React Navigation v7 (Stack, Drawer, Bottom Tabs) |
| **Backend**          | Supabase (PostgreSQL + Auth + Storage)           |
| **Storage**          | MMKV (primary), AsyncStorage (fallback)          |
| **Animations**       | React Native Reanimated                          |
| **Audio**            | expo-audio                                       |
| **Styling**          | Custom theme system with light/dark mode         |

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/           # Admin CMS components
│   ├── content/         # Content rendering (markdown, audio blocks)
│   ├── courses/         # Course cards, lists
│   ├── exercise/        # Exercise UI (sentence display, word boxes)
│   ├── home/            # Home screen widgets (stats, streaks)
│   ├── lesson/          # Lesson components (progress tracking)
│   ├── navigation/      # Navigation components (drawer, headers)
│   ├── profile/         # Profile & achievement display
│   └── shared/          # Common UI elements (buttons, modals)
│
├── screens/             # Application screens
│   ├── admin/           # Admin CMS screens
│   │   ├── DashboardScreen.tsx
│   │   ├── CourseManagerScreen.tsx
│   │   ├── CourseContentEditorScreen.tsx
│   │   ├── LessonEditorScreen.tsx
│   │   └── SpeakerManagerScreen.tsx
│   ├── auth/            # Login, registration
│   ├── courses/         # Course browsing & selection
│   ├── exercise/        # Main exercise screen
│   ├── home/            # Home dashboard
│   ├── profile/         # User profile & settings
│   └── tools/           # Utility screens
│
├── services/            # Business logic & API layer
│   ├── achievements.ts  # Achievement unlocking & checking
│   ├── audio.ts         # Audio playback (native)
│   ├── audio.web.ts     # Audio playback (web)
│   ├── content.ts       # Content fetching
│   ├── contentManagement.ts  # Admin CRUD operations
│   ├── dynamicContent.ts     # Dynamic content loading
│   ├── haptics.ts       # Haptic feedback
│   ├── progress.ts      # Progress & XP tracking
│   ├── storage.ts       # Local storage abstraction
│   ├── supabase.ts      # Supabase client & auth
│   └── syncQueue.ts     # Offline sync queue
│
├── stores/              # Zustand state stores
│   ├── achievementStore.ts   # Achievement state & notifications
│   ├── exerciseStore.ts      # Exercise session state
│   ├── fontStore.ts          # Custom font loading
│   ├── settingsStore.ts      # App settings
│   ├── themeStore.ts         # Theme (light/dark) management
│   └── userStore.ts          # User profile & auth state
│
├── theme/               # Theming system
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
└── utils/               # Utility functions

database/
├── init_schema.sql           # Complete database initialisation
├── migrations/               # Database migrations (source files)
└── scripts/                  # Database utility scripts

database-schemas/             # Exported schema JSON files
```

---

## Database Schema

The app uses PostgreSQL (via Supabase) with the following core tables:

### Content Tables

- **languages**: Supported languages with codes and voice prefixes
- **courses**: Top-level course containers (linked to language)
- **lessons**: Lessons within courses
- **exercises**: Individual exercises (typing with Irish keyboard, cloze, matching pairs)
- **exercise_units**: Individual sentence pairs within exercises
- **speakers**: Global speaker definitions with profile pictures and dialect information
- **sentence_audio**: Audio files for full sentence pronunciation (links to speakers)
- **word_audio**: Audio files for individual word pronunciation
- **content_blocks**: Rich content blocks (audio, text, images)

### User Tables

- **profiles**: User profile with XP, streaks, preferences, avatar
- **lesson_progress**: Per-lesson progress tracking with XP and unit completion
- **course_progress**: Course completion tracking
- **user_stats**: Aggregate user statistics
- **user_language_stats**: Per-language statistics
- **user_achievements**: Unlocked achievements (language-specific)

### Database Features

- **Row Level Security (RLS)** enabled on all tables
- **Automatic `updated_at` triggers** for audit trails
- **Comprehensive views** for aggregated data
- **Full indexing** for performance
- **Storage buckets**: `course_media`, `profile-images`, `content_drafts`

### Exercise Types

Navaria supports three exercise types:

1. **Standard Typing** (`standard`): Students type the target language text using a custom keyboard
   - Irish keyboard includes fada support (á, é, í, ó, ú) and special characters (ḃ, ċ, ḋ, etc.)
   - Validation against correct answer
   - Word-by-word audio pronunciation

2. **Cloze** (`cloze`): Fill-in-the-blank exercises
   - Students complete missing words or phrases
   - Context-based learning

3. **Matching Pairs** (`matching_pairs`): Match items with their translations or definitions
   - Visual matching interface
   - Reinforces vocabulary

---

## Development Setup

### Prerequisites

- **Node.js** (LTS version recommended, 18.x or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Simulator** (Mac only) or **Android Emulator**
- **Supabase Account** for backend services

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd navaria_languages
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**:

   Run the initialisation script in your Supabase SQL editor:

   ```bash
   # Copy contents of database/init_schema.sql to Supabase SQL Editor
   # Run the script (will take 10-30 seconds)
   ```

   See [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md) for detailed database setup instructions.

### Running the App

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm start`       | Start the Expo development server |
| `npm run ios`     | Run on iOS Simulator              |
| `npm run android` | Run on Android Emulator           |
| `npm run web`     | Run in web browser                |
| `npm test`        | Run test suite                    |
| `npm run lint`    | Run ESLint                        |
| `npm run format`  | Format code with Prettier         |

### Development Builds

For full native functionality (MMKV, haptics, etc.), create a development build:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

## Windows Development

This section covers setting up the development environment on Windows.

### 1. Install Prerequisites

#### Git

1. Download Git from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer (use default options, or select "Git Bash" as terminal)
3. Verify installation:
   ```powershell
   git --version
   ```

#### Node.js

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer (includes npm)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### 2. Configure Git

Open PowerShell or Git Bash and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Set Up GitHub Authentication (SSH Key)

1. **Generate an SSH key**:

   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

   Press Enter to accept the default file location, then set a passphrase (optional).

2. **Start the SSH agent**:

   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy your public key**:

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

   Copy the entire output.

4. **Add key to GitHub**:
   - Go to [GitHub SSH Settings](https://github.com/settings/keys)
   - Click "New SSH key"
   - Paste your key and save

5. **Test the connection**:

   ```bash
   ssh -T git@github.com
   ```

   You should see: "Hi username! You've successfully authenticated..."

### 4. Clone and Install the Project

```bash
git clone git@github.com:mkeenan-kdb/navaria_languages.git
cd navaria_languages
npm install
```

### 5. Running the App on Windows

#### Option A: Web Browser (Easiest - No Additional Setup)

```bash
npm run web
```

Opens in your default browser. Most features work, though native-specific ones (haptics, MMKV) are simulated.

#### Option B: Android Emulator (Full Native Experience)

1. **Install Android Studio**:
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - During installation, ensure "Android Virtual Device" is selected

2. **Set up environment variables**:
   Add to your system PATH:

   ```
   %LOCALAPPDATA%\Android\Sdk\platform-tools
   ```

3. **Create an Android Virtual Device (AVD)**:
   - Open Android Studio → Tools → Device Manager
   - Click "Create Device"
   - Select a phone (e.g., Pixel 6) → Next
   - Download a system image (e.g., API 34) → Next → Finish

4. **Run the app**:

   ```bash
   npm run android
   ```

#### Option C: Physical Android Device

1. Enable "Developer Options" on your phone (tap Build Number 7 times in Settings → About)
2. Enable "USB Debugging" in Developer Options
3. Connect your phone via USB
4. Run:

   ```bash
   npm run android
   ```

### Windows Troubleshooting

| Issue                                | Solution                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `npm install` fails with permissions | Run PowerShell as Administrator                                           |
| Android emulator won't start         | Enable virtualisation in BIOS (VT-x/AMD-V)                                |
| `adb` not found                      | Add Android SDK platform-tools to PATH                                    |
| Metro bundler stuck                  | Delete `node_modules` and reinstall: `rm -rf node_modules && npm install` |

---

## Achievement System

Navaria includes a comprehensive achievement system with two categories:

### Language-Specific Achievements

Earned separately for each language:

- **First Steps**: Complete your first lesson
- **Scholar**: Earn 100 XP
- **Consistent**: Maintain a 3-day streak
- **Dedicated**: Maintain a 7-day streak
- **Master**: Complete 50 lessons
- **Expert**: Earn 500 XP

### Polyglot Achievements

Cross-language achievements:

- **Bilingual**: Start learning 2 languages
- **Trilingual**: Start learning 3 languages
- **Polyglot**: Start learning 5 languages
- **Cultural Ambassador**: Earn 100 XP in 3 different languages

### Implementation

Achievements are checked in `src/services/achievements.ts` and managed through the `achievementStore` in Zustand. The system automatically:

1. Checks achievement conditions after XP updates
2. Unlocks achievements in the database (`user_achievements` table)
3. Displays achievement notifications to the user
4. Tracks both language-specific and cross-language progress

---

## Admin Access

The admin CMS is accessible from the app's drawer menu (for authorised users). Features include:

1. **Dashboard**: Overview of content and user statistics
2. **Course Manager**: Create and manage courses for each language
3. **Lesson Editor**: Build lessons with exercises, sentences, and audio
4. **Speaker Manager**: Define speakers for conversational exercises
5. **Media Uploader**: Upload or record audio files directly

### Granting Admin Access

See [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md#creating-your-first-admin-user) for instructions on making a user an admin.

---

## Scripts

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run export-schema` | Export database schema to JSON files |
| `npm start`             | Start Expo development server        |
| `npm run ios`           | Run on iOS simulator                 |
| `npm run android`       | Run on Android emulator              |
| `npm run web`           | Run in web browser                   |
| `npm test`              | Run test suite                       |
| `npm run lint`          | Run ESLint                           |
| `npm run format`        | Format code with Prettier            |

---

## Contributing

We welcome contributions to Navaria! Here's how to get started:

### 1. Set Up Your Development Environment

Follow the [Development Setup](#development-setup) instructions above.

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:

- `feature/add-welsh-keyboard` - New feature
- `bugfix/fix-audio-playback` - Bug fix
- `docs/update-setup-guide` - Documentation
- `refactor/simplify-achievement-logic` - Code refactoring

### 3. Make Your Changes

- Write clean, well-documented code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm test

# Test on multiple platforms
npm run web
npm run ios
npm run android
```

### 5. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add Welsh keyboard support with special characters"
```

### 6. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:

- Clear description of what you changed
- Why the change is needed
- Screenshots (if UI changes)
- Testing steps

### Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Functional components with hooks
- **Naming**:
  - Components: `PascalCase` (e.g., `ExerciseCard.tsx`)
  - Files: `camelCase` for utilities, `PascalCase` for components
  - Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Group and order: React, third-party, local
- **Comments**: Explain "why", not "what"

### Areas We Need Help

- **Documentation**: Improve setup guides, add translations
- **Accessibility**: Improve screen reader support, keyboard navigation
- **Localisation**: Add UI translations for more languages
- **Performance**: Optimise rendering, reduce bundle size
- **Testing**: Increase test coverage
- **Features**: Custom keyboard layouts for more languages

---

## Project Architecture

### State Management

Navaria uses **Zustand** for state management:

- **userStore**: User profile, authentication state
- **exerciseStore**: Current exercise session, answers, progress
- **achievementStore**: Achievement notifications and state
- **themeStore**: Light/dark mode, theme preferences
- **settingsStore**: App settings, language preferences

### Data Flow

1. **User Action** → Component event handler
2. **Service Layer** → Business logic and API calls (`src/services/`)
3. **Supabase** → Database operations, auth, storage
4. **Store Update** → Zustand store mutation
5. **Component Re-render** → UI updates automatically

### Offline Support

Navaria uses a **sync queue** pattern:

1. User actions are stored locally (MMKV)
2. When offline, operations queue in `syncQueue.ts`
3. When online, queued operations sync to Supabase
4. Conflicts resolved with "last write wins" strategy

### Audio Architecture

Platform-specific implementations:

- **Native** (`audio.ts`): Uses `expo-audio` for native playback
- **Web** (`audio.web.ts`): Uses HTML5 Audio API

Audio files are stored in Supabase Storage (`course_media` bucket) and cached locally.

---

## Deployment for Development

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:

- Building production web bundles
- Creating mobile app builds with EAS Build
- Deploying to Netlify, Vercel, or Cloudflare Pages
- Submitting to App Store and Google Play

---

## License

Navaria is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Questions?

- **General Setup**: See [COMMUNITY_SETUP.md](./COMMUNITY_SETUP.md)
- **Content Creation**: See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Technical Issues**: Open an issue on GitHub
- **Feature Requests**: Open a discussion on GitHub

---

**Happy developing!** 🚀
