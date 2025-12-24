#!/bin/bash

# Export Supabase Schema Script
# This script exports the current Supabase schema to use as a single setup file

echo "🔄 Exporting Supabase schema..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "⚠️  Not linked to a Supabase project"
    echo ""
    echo "To link to your project, run:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Find your project ref in your Supabase URL:"
    echo "  https://YOUR_PROJECT_REF.supabase.co"
    exit 1
fi

# Create output directory
mkdir -p database

# Export the schema
echo "📥 Pulling schema from Supabase..."
supabase db pull

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema exported successfully!"
    echo "📁 Check: supabase/migrations/ for the new migration file"
    echo ""
    echo "Next steps:"
    echo "1. Review the exported migration file"
    echo "2. Combine with storage_policies.sql if needed"
    echo "3. Create database/init_schema.sql as the single setup file"
else
    echo ""
    echo "❌ Export failed!"
    echo "Make sure you're authenticated: supabase login"
fi
