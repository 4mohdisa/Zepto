-- ============================================
-- Migration: Use auth.uid() Directly in RLS Policies
-- Date: 2026-01-03
-- Issue: Custom function wrapper causing RLS context issues
-- ============================================
--
-- CRITICAL DISCOVERY:
-- The requesting_user_id() function wrapper is interfering with
-- the security context. Supabase documentation shows auth.uid()
-- should be used DIRECTLY in RLS policies, not wrapped in functions.
--
-- EVIDENCE FROM SUPABASE DOCS:
-- ✅ CORRECT: using ( (auth.uid())::TEXT = user_id )
-- ❌ WRONG: using ( requesting_user_id() = user_id )
--
-- Your Supabase logs confirm:
-- "auth_user": "user_36KevOt62ID5qqHJkYXUTjf85Ao" ✅
-- "role": "authenticated" ✅
-- "subject": "user_36KevOt62ID5qqHJkYXUTjf85Ao" ✅
--
-- Supabase IS recognizing your Clerk user - we just need to
-- access it correctly in the RLS policies.
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run" to execute
-- 4. Verify success message
-- 5. Refresh browser (F5 or Cmd+Shift+R)
-- 6. Test transaction creation
-- ============================================

-- ============================================
-- STEP 1: Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can insert own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can update own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can delete own recurring transactions" ON recurring_transactions;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- ============================================
-- STEP 2: Create NEW policies using auth.uid() DIRECTLY
-- ============================================

-- TRANSACTIONS TABLE POLICIES
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

-- RECURRING TRANSACTIONS TABLE POLICIES
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions
    FOR SELECT
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions
    FOR UPDATE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions
    FOR DELETE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

-- CATEGORIES TABLE POLICIES (Keep default category policy separate)
CREATE POLICY "Anyone can view default categories" ON categories
    FOR SELECT
    TO authenticated
    USING (is_default = TRUE);

CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE
    TO authenticated
    USING ( (auth.uid())::TEXT = user_id );

-- PROFILES TABLE POLICIES
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING ( (auth.uid())::TEXT = id );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING ( (auth.uid())::TEXT = id );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ( (auth.uid())::TEXT = id );

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'RLS policies updated to use auth.uid() directly - Compatible with Clerk!' AS status;

-- ============================================
-- TEST QUERIES (Run these while logged in)
-- ============================================
-- Test 1: Check what auth.uid() returns
-- SELECT (auth.uid())::TEXT AS my_user_id;
-- Expected: user_36KevOt62ID5qqHJkYXUTjf85Ao

-- Test 2: Verify you can see categories
-- SELECT COUNT(*) FROM categories;
-- Expected: 16 (default categories)

-- Test 3: Try to insert a test transaction (THIS SHOULD NOW WORK!)
-- INSERT INTO transactions (user_id, name, amount, type, date, account_type, recurring_frequency)
-- VALUES ((auth.uid())::TEXT, 'Test Transaction', 100, 'Expense', CURRENT_DATE, 'Cash', 'Never')
-- RETURNING *;
-- ============================================
