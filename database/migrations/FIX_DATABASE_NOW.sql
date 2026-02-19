-- ============================================
-- EMERGENCY FIX: Change UUID to TEXT for Clerk IDs
-- Run this in Supabase SQL Editor immediately
-- ============================================

-- Step 1: Check current state
SELECT 'BEFORE FIX:' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;

-- Step 2: Drop foreign key constraints (ignore errors if they don't exist)
ALTER TABLE IF EXISTS categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS recurring_transactions DROP CONSTRAINT IF EXISTS recurring_transactions_user_id_fkey;

-- Step 3: Change profiles.id from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Step 4: Change user_id columns from UUID to TEXT
ALTER TABLE categories ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE recurring_transactions ALTER COLUMN user_id TYPE TEXT;

-- Step 5: Recreate foreign key constraints
ALTER TABLE categories 
    ADD CONSTRAINT categories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE transactions 
    ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE recurring_transactions 
    ADD CONSTRAINT recurring_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 6: Update the requesting_user_id function
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(auth.uid()::TEXT, '');
$$ LANGUAGE SQL STABLE;

-- Step 7: Verify the fix
SELECT 'AFTER FIX:' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;
