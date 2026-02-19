-- ============================================
-- MIGRATION: Fix Transaction Type Column
-- Makes type column NOT NULL with default 'Expense'
-- This ensures all transactions have a valid type
-- ============================================

-- First, update any existing transactions with NULL type to 'Expense'
UPDATE transactions 
SET type = 'Expense' 
WHERE type IS NULL;

-- Add NOT NULL constraint and default value
ALTER TABLE transactions 
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN type SET DEFAULT 'Expense';

-- Verify the constraint
SELECT 
    column_name, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'type';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Transaction type column fixed successfully!' as status;
