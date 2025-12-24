Prerequisites
Cloudflare Wrangler CLI (npm install -g wrangler)
Node.js (LTS)
Configuration Summary
Base URL: Set to /app in
app.json
.
Deep Linking: Configured in
RootNavigator.tsx
to handle https://navaria.app/app.
Step-by-Step Deployment

1. Build the Web App
   Run the export command. This compiles the app and places static files in dist.

npx expo export -p web 2. Prepare for Subpath Serving
Since we are deploying to /app, but Cloudflare usually serves the root of the build folder, we need to restructure the output so that index.html resides at app/index.html.

Option A: Manual Move

# Create the app subdirectory

mkdir -p dist/app

# Move everything into /app (requires enabling dotglob in bash or being careful not to move 'app' into itself)

# Safer approach:

cd dist
mkdir app_tmp
mv \* app_tmp/ 2>/dev/null
mv app_tmp app
cd ..
Option B: Custom Script (Recommended) We can just use a temporary folder and rename it.

# 1. Clean previous build

rm -rf dist

# 2. Export

npx expo export -p web

# 3. Create the structure Cloudflare expects for a subpath

# We want the site root to contain an 'app' folder

mv dist app_build
mkdir dist
mv app_build dist/app 3. Handle SPA Routing (Redirects)
Single Page Apps (SPAs) need all requests to /app/\* to be rewritten to /app/index.html so React Navigation handles the routing.

Create a \_redirects file in the dist folder:

# dist/\_redirects

/app/\* /app/index.html 200 4. Deploy to Cloudflare
Deploy the dist folder.

npx wrangler pages deploy dist --project-name navaria-app --branch main
Note: In your Cloudflare Pages dashboard, ensure the project is set up. You might need to link it to your custom domain navaria.app if you haven't already.

Verification
Visit https://navaria.app/app to verify the application loads correctly.
