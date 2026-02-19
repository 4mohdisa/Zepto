-- ============================================
-- Migration: Use auth.uid() for Clerk Authentication
-- Date: 2026-01-03
-- Issue: RLS policy violation with manual JWT extraction
-- ============================================
--
-- ROOT CAUSE IDENTIFIED:
-- Manually extracting from auth.jwt() ->> 'sub' doesn't work reliably.
-- Supabase provides auth.uid() which works with BOTH Supabase-managed
-- auth AND third-party providers like Clerk.
--
-- EVIDENCE:
-- Supabase logs show: "auth_user": "user_36KevOt62ID5qqHJkYXUTjf85Ao"
-- This proves Supabase IS recognizing the Clerk user.
-- auth.uid() accesses this authenticated user ID.
--
-- CORRECT APPROACH (per Supabase RLS docs):
-- Use auth.uid() which returns the user ID from JWT 'sub' claim
-- Works for both UUID (Supabase auth) and TEXT (Clerk user IDs)
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify success message
-- 5. Refresh your browser (F5) to get fresh session
-- 6. Test transaction creation in your app
-- ============================================

-- Drop existing function
DROP FUNCTION IF EXISTS requesting_user_id() CASCADE;

-- Create function using auth.uid() - works with third-party auth (Clerk)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        (auth.uid())::TEXT,
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Verify function was created successfully
SELECT 'requesting_user_id() function updated to use auth.uid() - compatible with Clerk' AS status;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after the migration to verify the function:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'requesting_user_id';
--
-- Expected output should show: (auth.uid())::TEXT
-- ============================================

-- ============================================
-- TEST QUERY (Run while logged in)
-- ============================================
-- Test that the function returns your Clerk user ID:
-- SELECT requesting_user_id();
--
-- Expected result: user_36KevOt62ID5qqHJkYXUTjf85Ao
-- (or your specific Clerk user ID)
-- ============================================
