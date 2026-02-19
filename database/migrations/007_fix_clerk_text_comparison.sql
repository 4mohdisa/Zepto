-- ============================================
-- Migration: Fix Clerk TEXT Comparison (FINAL FIX)
-- Date: 2026-01-03
-- Issue: UUID casting error with Clerk user IDs
-- ============================================
--
-- ROOT CAUSE IDENTIFIED:
-- Clerk user IDs are TEXT strings (e.g., "user_37jcHPfWyq0mk0UIg4WjGImokH1")
-- The ::TEXT cast was causing PostgreSQL to try interpreting them as UUIDs first
-- auth.uid() already returns TEXT for Clerk users - NO CASTING NEEDED!
--
-- ERROR: "invalid input syntax for type uuid"
-- This happened because (auth.uid())::TEXT was trying to cast TEXT as UUID first
--
-- SOLUTION: Remove ::TEXT casting - use auth.uid() directly
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run" to execute
-- 4. Refresh browser (F5)
-- 5. Test transaction creation
-- ============================================

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recurring transactions
DROP POLICY IF EXISTS "Users can view own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can insert own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can update own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can delete own recurring transactions" ON recurring_transactions;

-- Categories
DROP POLICY IF EXISTS "Anyone can view default categories" ON categories;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- ============================================
-- STEP 2: Create policies WITHOUT ::TEXT cast
-- ============================================

-- TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE
    TO authenticated
    USING ( auth.uid() = user_id );

-- RECURRING TRANSACTIONS
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions
    FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions
    FOR DELETE
    TO authenticated
    USING ( auth.uid() = user_id );

-- CATEGORIES
CREATE POLICY "Anyone can view default categories" ON categories
    FOR SELECT
    TO authenticated
    USING (is_default = TRUE);

CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE
    TO authenticated
    USING ( auth.uid() = user_id );

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = id );

-- ============================================
-- SUCCESS
-- ============================================
SELECT 'SUCCESS: RLS policies fixed for Clerk TEXT user IDs (no casting)' AS status;

-- ============================================
-- VERIFICATION
-- ============================================
-- Test that auth.uid() returns your Clerk user ID:
-- SELECT auth.uid() AS my_clerk_user_id;
-- Expected: user_37jcHPfWyq0mk0UIg4WjGImokH1
--
-- Test categories query:
-- SELECT COUNT(*) FROM categories WHERE is_default = TRUE;
-- Expected: 16
-- ============================================
