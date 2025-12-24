#!/bin/bash

# Create Unified Supabase Setup Script
# Combines schema and storage policies into one file

echo "🔧 Creating unified Supabase setup script..."
echo ""

OUTPUT_FILE="database/init_schema.sql"

# Create header
cat > "$OUTPUT_FILE" << 'EOF'
-- ============================================================================
-- Navaria Database Setup
-- ============================================================================
-- This script initializes a complete Navaria database instance
-- Run this in your Supabase SQL Editor to set up everything
--
-- What this includes:
-- - All tables (courses, lessons, exercises, user progress, etc.)
-- - Row Level Security (RLS) policies
-- - Functions and triggers
-- - Storage buckets and policies
-- - Indexes for performance
--
-- Usage:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

EOF

# Find the most recent schema migration
LATEST_MIGRATION=$(ls -t supabase/migrations/*_remote_schema.sql 2>/dev/null | head -1)

if [ -f "$LATEST_MIGRATION" ]; then
    echo "📄 Adding schema from: $LATEST_MIGRATION"
    cat "$LATEST_MIGRATION" >> "$OUTPUT_FILE"
else
    echo "⚠️  No schema migration found in supabase/migrations/"
    echo "Run ./scripts/export-supabase-schema.sh first"
    exit 1
fi

# Add storage policies if exists
if [ -f "database/storage_policies.sql" ]; then
    echo "📄 Adding storage policies..."
    cat >> "$OUTPUT_FILE" << 'EOF'

-- ============================================================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================================================

EOF
    cat "database/storage_policies.sql" >> "$OUTPUT_FILE"
fi

# Add footer
cat >> "$OUTPUT_FILE" << 'EOF'

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Your Navaria database is now ready!
--
-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard:
--    - Bucket name: "audio" (public)
--    - Bucket name: "images" (public)
--
-- 2. Create your first admin user (see COMMUNITY_SETUP.md)
--
-- 3. Start adding course content!
-- ============================================================================
EOF

echo ""
echo "✅ Unified setup script created!"
echo "📁 Location: $OUTPUT_FILE"
echo ""
echo "📝 This file can now be used by community members to set up their Navaria instance"
echo ""
