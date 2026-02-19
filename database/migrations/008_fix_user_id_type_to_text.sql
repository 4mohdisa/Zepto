-- ============================================
-- Migration: Fix user_id column type from UUID to TEXT
-- This is required for Clerk integration
-- ============================================

-- Check current column types
-- Run this first to see current types:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
-- AND column_name = 'user_id';

-- Step 1: Drop foreign key constraints temporarily
ALTER TABLE IF EXISTS categories 
    DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

ALTER TABLE IF EXISTS transactions 
    DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE IF EXISTS recurring_transactions 
    DROP CONSTRAINT IF EXISTS recurring_transactions_user_id_fkey;

-- Step 2: Change profiles.id from UUID to TEXT (if needed)
-- Note: This will fail if there are existing UUID values
-- If you have existing data, you may need to export, drop, recreate, and reimport
ALTER TABLE IF EXISTS profiles 
    ALTER COLUMN id TYPE TEXT;

-- Step 3: Change categories.user_id from UUID to TEXT
ALTER TABLE IF EXISTS categories 
    ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Change transactions.user_id from UUID to TEXT
ALTER TABLE IF EXISTS transactions 
    ALTER COLUMN user_id TYPE TEXT;

-- Step 5: Change recurring_transactions.user_id from UUID to TEXT
ALTER TABLE IF EXISTS recurring_transactions 
    ALTER COLUMN user_id TYPE TEXT;

-- Step 6: Recreate foreign key constraints
ALTER TABLE IF EXISTS categories 
    ADD CONSTRAINT categories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS transactions 
    ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS recurring_transactions 
    ADD CONSTRAINT recurring_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 7: Update the requesting_user_id function to return TEXT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        auth.uid()::TEXT,
        ''
    );
$$ LANGUAGE SQL STABLE;

-- Step 8: Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;
