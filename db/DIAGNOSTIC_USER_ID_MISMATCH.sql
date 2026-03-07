-- ============================================
-- DIAGNOSTIC: User ID Mismatch Investigation
-- Run this in Supabase SQL Editor to diagnose the issue
-- ============================================

-- 1. Check what user_id values are stored in transactions
--    (Pick 5 rows for current user or any rows to see the format)
SELECT 
    'transactions.user_id samples' as check_name,
    user_id,
    LEFT(name, 30) as name_preview,
    created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check what user_id values are stored in merchants
--    (See if any exist and what format they're in)
SELECT 
    'merchants.user_id samples' as check_name,
    user_id,
    merchant_name,
    transaction_count
FROM merchants
ORDER BY transaction_count DESC
LIMIT 10;

-- 3. Count merchants grouped by user_id to see all users with merchants
SELECT 
    'merchants count by user_id' as check_name,
    user_id,
    COUNT(*) as merchant_count
FROM merchants
GROUP BY user_id
ORDER BY merchant_count DESC
LIMIT 10;

-- 4. Count transactions grouped by user_id to see all users with transactions
SELECT 
    'transactions count by user_id' as check_name,
    user_id,
    COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id
ORDER BY transaction_count DESC
LIMIT 10;

-- 5. Check if auth.uid() returns UUID or Clerk ID
--    (Run this in a session where you're authenticated via Clerk)
--    This will show what auth.uid() returns vs what the JWT sub claim contains
SELECT 
    'auth function test' as check_name,
    auth.uid() as auth_uid_result,
    auth.jwt() ->> 'sub' as jwt_sub_claim,
    auth.jwt() ->> 'role' as jwt_role_claim;

-- 6. Check RLS policies on merchants table
SELECT 
    'RLS policies' as check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'merchants';

-- 7. Test direct query with service role equivalent (bypasses RLS)
--    This simulates what the API route does
--    Replace 'user_xxx...' with your actual Clerk user ID to test
-- SELECT * FROM merchants WHERE user_id = 'user_39onc31TdlU8wAkUbSiHU7Gwnr0' LIMIT 5;

-- 8. Check the user_id column type in both tables
SELECT 
    'column types' as check_name,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('merchants', 'transactions') 
  AND column_name = 'user_id'
ORDER BY table_name;
