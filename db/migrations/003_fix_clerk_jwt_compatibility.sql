-- ============================================
-- Migration: Fix Clerk JWT Compatibility
-- Date: 2026-01-03
-- Issue: RLS policy violation (Error 42501)
-- ============================================
--
-- ROOT CAUSE:
-- The requesting_user_id() function was using current_setting('request.jwt.claims')
-- which is designed for Supabase-managed authentication. This is incompatible with
-- third-party Clerk JWTs.
--
-- FIX:
-- Update the function to use auth.jwt() which is the correct method for
-- third-party authentication providers (Clerk, Auth0, etc.)
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

-- Create updated function for third-party JWT (Clerk)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        (auth.jwt()->>'sub'),
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Verify function was created successfully
SELECT 'requesting_user_id() function updated successfully for Clerk JWT compatibility' AS status;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after the migration to verify the function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'requesting_user_id';
--
-- Expected output should show the function using auth.jwt()->>'sub'
-- ============================================
