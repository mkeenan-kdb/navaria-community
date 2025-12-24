#! /bin/bash

# 1. Clean previous build
rm -rf dist
# 2. Export
npx expo export -p web
# 3. Create the structure Cloudflare expects for a subpath
# We want the site root to contain an 'app' folder
mv dist app_build
mkdir dist
mv app_build dist/app
# 4. Copy _redirects to dist root for Cloudflare Pages SPA routing
cp public/_redirects dist/_redirects
# 5. Create 404.html as a fallback for SPA routing (helps if _redirects is ignored)
cp dist/app/index.html dist/404.html
