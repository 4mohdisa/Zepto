-- ============================================
-- MIGRATION: Add Unique Constraint for Recurring Transaction Duplicates
-- Version: 015
-- Date: 2024-03-08
-- Purpose: Prevent duplicate transaction generation from recurring templates
-- ============================================

-- ============================================
-- STEP 1: Clean up existing duplicates
-- ============================================

-- First, identify and delete duplicate recurring transactions
-- Keep the one with the lowest ID (first created) for each (user_id, recurring_transaction_id, date) combination
WITH duplicates AS (
    SELECT 
        id,
        user_id,
        recurring_transaction_id,
        date,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, recurring_transaction_id, date 
            ORDER BY id ASC
        ) as row_num
    FROM transactions
    WHERE recurring_transaction_id IS NOT NULL
)
DELETE FROM transactions
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- ============================================
-- STEP 2: Create unique constraint
-- ============================================

-- Add unique constraint to prevent duplicate recurring transactions
-- This ensures only one transaction can exist per (user, recurring_item, date) combination
-- The WHERE clause ensures this only applies to recurring-generated transactions
-- (manual transactions have recurring_transaction_id = NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_unique 
    ON transactions(user_id, recurring_transaction_id, date) 
    WHERE recurring_transaction_id IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_transactions_recurring_unique IS 
    'Prevents duplicate recurring transactions: only one transaction per (user, recurring_item, date)';

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
    v_duplicate_count INTEGER;
BEGIN
    -- Check if index was created
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'transactions'
      AND indexname = 'idx_transactions_recurring_unique';
    
    IF v_count = 1 THEN
        RAISE NOTICE '✅ Unique constraint idx_transactions_recurring_unique created successfully';
    ELSE
        RAISE WARNING '⚠️ Unique constraint was not created';
    END IF;

    -- Verify no duplicates remain
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
        SELECT user_id, recurring_transaction_id, date, COUNT(*) as cnt
        FROM transactions
        WHERE recurring_transaction_id IS NOT NULL
        GROUP BY user_id, recurring_transaction_id, date
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_duplicate_count > 0 THEN
        RAISE WARNING '⚠️ Found % duplicate recurring transactions remaining', v_duplicate_count;
    ELSE
        RAISE NOTICE '✅ No duplicates remaining - constraint is active';
    END IF;
END $$;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- 
-- To remove this constraint, run:
-- DROP INDEX IF EXISTS idx_transactions_recurring_unique;
--
-- ============================================

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
