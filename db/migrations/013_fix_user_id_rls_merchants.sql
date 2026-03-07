-- ============================================
-- MIGRATION: Fix User ID Mismatch in Merchants RLS Policies
-- Issue: RLS policies used auth.uid()::text which returns UUID, not Clerk user ID
-- Fix: Update RLS policies to use auth.jwt() ->> 'sub' which contains Clerk ID
-- ============================================

-- ============================================
-- STEP 1: Fix the requesting_user_id() function
-- This function is used by all RLS policies to get the current user ID
-- ============================================

-- Drop the old function (cascade to update all dependent policies)
DROP FUNCTION IF EXISTS requesting_user_id() CASCADE;

-- Create the corrected function that extracts Clerk ID from JWT
-- Clerk stores the user ID in the 'sub' claim of the JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
BEGIN
    -- The 'sub' claim in Clerk JWT contains the Clerk user ID (user_xxx format)
    -- This is what we store in transactions.user_id and merchants.user_id
    RETURN auth.jwt() ->> 'sub';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for clarity
COMMENT ON FUNCTION requesting_user_id() IS 'Returns the Clerk user ID from JWT sub claim. Used by all RLS policies.';

-- ============================================
-- STEP 2: Drop existing merchants RLS policies (they use auth.uid()::text)
-- ============================================
DROP POLICY IF EXISTS "Users can view own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can insert own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can update own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can delete own merchants" ON merchants;

-- ============================================
-- STEP 3: Recreate merchants RLS policies with correct user ID function
-- ============================================

-- SELECT policy
CREATE POLICY "Users can view own merchants"
    ON merchants
    FOR SELECT
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- INSERT policy
CREATE POLICY "Users can insert own merchants"
    ON merchants
    FOR INSERT
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- UPDATE policy
CREATE POLICY "Users can update own merchants"
    ON merchants
    FOR UPDATE
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    )
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- DELETE policy
CREATE POLICY "Users can delete own merchants"
    ON merchants
    FOR DELETE
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- ============================================
-- STEP 4: Update the trigger function to be explicit about user_id source
-- ============================================

-- The trigger function already uses NEW.user_id which is correct
-- But let's add a comment and ensure SECURITY DEFINER is set
CREATE OR REPLACE FUNCTION upsert_merchant_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    normalized TEXT;
BEGIN
    -- Normalize the transaction name
    normalized := normalize_merchant_name(NEW.name);
    
    -- Skip if name is empty after normalization
    IF normalized IS NULL OR length(normalized) = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Upsert merchant using the user_id from the transaction
    -- NEW.user_id should be the Clerk user ID (user_xxx format)
    INSERT INTO merchants (
        user_id, 
        merchant_name, 
        normalized_name, 
        transaction_count, 
        last_used_at
    )
    VALUES (
        NEW.user_id,  -- This comes from the transaction row
        NEW.name,
        normalized,
        1,
        NEW.date
    )
    ON CONFLICT (user_id, normalized_name)
    DO UPDATE SET
        transaction_count = merchants.transaction_count + 1,
        last_used_at = GREATEST(merchants.last_used_at, EXCLUDED.last_used_at),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION upsert_merchant_on_transaction() IS 
    'Automatically upserts merchant record when a new transaction is created. 
     Uses NEW.user_id which should be the Clerk user ID (user_xxx format).
     SECURITY DEFINER allows it to bypass RLS.';

-- ============================================
-- STEP 5: Also update transactions RLS policies to be consistent
-- ============================================

-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recreate with requesting_user_id()
CREATE POLICY "Users can view own transactions"
    ON transactions
    FOR SELECT
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can insert own transactions"
    ON transactions
    FOR INSERT
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can update own transactions"
    ON transactions
    FOR UPDATE
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    )
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can delete own transactions"
    ON transactions
    FOR DELETE
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- ============================================
-- STEP 6: Verify the changes
-- ============================================

SELECT 
    'RLS policies updated' as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'merchants';

SELECT 
    'Function definition' as check_name,
    pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'requesting_user_id';

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Test 1: Check requesting_user_id() returns correct format
-- SELECT requesting_user_id();

-- Test 2: Check merchants can be queried with proper auth
-- (Run this through your app or with a valid Clerk JWT)
-- SELECT * FROM merchants LIMIT 5;

-- Test 3: Verify data integrity
-- SELECT 
--     user_id,
--     COUNT(*) as merchant_count
-- FROM merchants
-- GROUP BY user_id
-- ORDER BY merchant_count DESC
-- LIMIT 5;
