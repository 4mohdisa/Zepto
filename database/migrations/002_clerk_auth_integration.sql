-- Migration: Clerk Authentication Integration with Supabase
-- Description: Updates RLS policies to work with Clerk JWT authentication
-- Date: 2025-12-02

-- ============================================================================
-- STEP 1: Drop existing Supabase Auth-based RLS policies
-- ============================================================================

-- Drop policies on transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Drop policies on recurring_transactions table
DROP POLICY IF EXISTS "Users can view their own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can insert their own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can update their own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can delete their own recurring transactions" ON recurring_transactions;

-- Drop policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Drop policies on categories table (if they exist)
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can insert categories" ON categories;
DROP POLICY IF EXISTS "Users can update categories" ON categories;
DROP POLICY IF EXISTS "Users can delete categories" ON categories;

-- ============================================================================
-- STEP 2: Update user_id columns to match Clerk user IDs
-- ============================================================================

-- Note: Clerk user IDs are different from Supabase Auth UUIDs
-- You'll need to migrate existing data or start fresh
-- For now, we'll ensure the columns can handle Clerk's string IDs

-- Transactions table - user_id should be TEXT to match Clerk IDs
-- If you have existing data, you'll need to migrate it first
-- ALTER TABLE transactions ALTER COLUMN user_id TYPE TEXT;

-- Recurring transactions table
-- ALTER TABLE recurring_transactions ALTER COLUMN user_id TYPE TEXT;

-- Profiles table
-- ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- ============================================================================
-- STEP 3: Create Clerk-compatible RLS policies
-- ============================================================================

-- Helper function to extract user ID from Clerk JWT
-- The Clerk JWT contains the user ID in the 'sub' claim
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    NULL
  )::TEXT;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Transactions Table RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.clerk_user_id());

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.clerk_user_id());

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.clerk_user_id())
  WITH CHECK (user_id = auth.clerk_user_id());

-- Policy: Users can delete their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.clerk_user_id());

-- ============================================================================
-- Recurring Transactions Table RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recurring transactions
CREATE POLICY "Users can view their own recurring transactions"
  ON recurring_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.clerk_user_id());

-- Policy: Users can insert their own recurring transactions
CREATE POLICY "Users can insert their own recurring transactions"
  ON recurring_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.clerk_user_id());

-- Policy: Users can update their own recurring transactions
CREATE POLICY "Users can update their own recurring transactions"
  ON recurring_transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.clerk_user_id())
  WITH CHECK (user_id = auth.clerk_user_id());

-- Policy: Users can delete their own recurring transactions
CREATE POLICY "Users can delete their own recurring transactions"
  ON recurring_transactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.clerk_user_id());

-- ============================================================================
-- Profiles Table RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.clerk_user_id());

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.clerk_user_id());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.clerk_user_id())
  WITH CHECK (id = auth.clerk_user_id());

-- ============================================================================
-- Categories Table RLS Policies (if global categories)
-- ============================================================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view categories
CREATE POLICY "All authenticated users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- If categories are user-specific, use this instead:
-- CREATE POLICY "Users can view their own categories"
--   ON categories
--   FOR SELECT
--   TO authenticated
--   USING (user_id = auth.clerk_user_id());

-- CREATE POLICY "Users can insert their own categories"
--   ON categories
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (user_id = auth.clerk_user_id());

-- CREATE POLICY "Users can update their own categories"
--   ON categories
--   FOR UPDATE
--   TO authenticated
--   USING (user_id = auth.clerk_user_id())
--   WITH CHECK (user_id = auth.clerk_user_id());

-- CREATE POLICY "Users can delete their own categories"
--   ON categories
--   FOR DELETE
--   TO authenticated
--   USING (user_id = auth.clerk_user_id());

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant execute on the helper function
GRANT EXECUTE ON FUNCTION auth.clerk_user_id() TO authenticated;

-- ============================================================================
-- STEP 5: Verification queries
-- ============================================================================

-- To verify the policies are working, run these queries after migration:
-- SELECT * FROM transactions; -- Should only show your transactions
-- SELECT * FROM recurring_transactions; -- Should only show your recurring transactions
-- SELECT * FROM profiles; -- Should only show your profile

-- To check which policies are active:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Clerk JWT Template Setup:
--    - Create a JWT template named "supabase" in Clerk Dashboard
--    - Include these claims: sub (user ID), exp, iat, aud, email
--    - Set aud to "authenticated" to match Supabase's role

-- 2. Data Migration:
--    - Existing Supabase Auth user IDs (UUIDs) need to be migrated to Clerk user IDs
--    - Create a mapping table if you need to preserve old data
--    - Or start fresh with new user data

-- 3. Testing:
--    - Test with a real Clerk session token
--    - Verify RLS policies work correctly
--    - Check that users can only access their own data

-- 4. Rollback:
--    - If you need to rollback, restore the previous RLS policies
--    - Revert user_id column types if changed
