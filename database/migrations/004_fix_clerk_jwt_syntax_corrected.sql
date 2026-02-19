-- ============================================
-- Migration: Fix Clerk JWT Syntax (CORRECTED)
-- Date: 2026-01-03
-- Issue: Previous migration had incorrect syntax
-- ============================================
--
-- ISSUE WITH PREVIOUS MIGRATION:
-- The syntax (auth.jwt()->>'sub') with parentheses was incorrect
--
-- CORRECT SYNTAX (per Supabase docs):
-- auth.jwt() ->> 'sub'
-- The ->> operator extracts JSON field as TEXT
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify success message
-- 5. Test transaction creation in your app
-- ============================================

-- Drop existing function
DROP FUNCTION IF EXISTS requesting_user_id() CASCADE;

-- Create updated function with CORRECT syntax for third-party JWT (Clerk)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        auth.jwt() ->> 'sub',
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Verify function was created successfully
SELECT 'requesting_user_id() function updated successfully with CORRECT syntax' AS status;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after the migration to verify the function:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'requesting_user_id';
--
-- Expected output should show: auth.jwt() ->> 'sub'
-- (WITHOUT parentheses around the whole expression)
-- ============================================
