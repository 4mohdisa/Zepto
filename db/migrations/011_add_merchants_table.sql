-- Migration: Add merchants table with proper Clerk compatibility
-- Purpose: Store frequently used merchants per user for suggestions and analytics
-- IMPORTANT: user_id must be TEXT to work with Clerk string IDs like "user_xxx"

-- Step 1: Drop existing table if it exists with wrong schema (allows clean recreation)
DROP TABLE IF EXISTS merchants CASCADE;

-- Step 2: Create the merchants table with user_id as TEXT (NOT UUID)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per user on normalized name
    CONSTRAINT unique_user_merchant UNIQUE (user_id, normalized_name)
);

-- Step 3: Add indexes for efficient querying
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_user_count ON merchants(user_id, transaction_count DESC);
CREATE INDEX idx_merchants_user_last_used ON merchants(user_id, last_used_at DESC);
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);

-- Step 4: Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies (using auth.uid()::text for Clerk compatibility)
CREATE POLICY "Users can view own merchants" 
    ON merchants 
    FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own merchants" 
    ON merchants 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own merchants" 
    ON merchants 
    FOR UPDATE 
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own merchants" 
    ON merchants 
    FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Step 6: Function to normalize merchant names
CREATE OR REPLACE FUNCTION normalize_merchant_name(input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(regexp_replace(input, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Function to upsert merchant on transaction create
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
    
    -- Upsert merchant
    INSERT INTO merchants (
        user_id, 
        merchant_name, 
        normalized_name, 
        transaction_count, 
        last_used_at
    )
    VALUES (
        NEW.user_id,
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

-- Step 8: Trigger to automatically upsert merchants on transaction insert
DROP TRIGGER IF EXISTS tr_upsert_merchant_on_transaction ON transactions;
CREATE TRIGGER tr_upsert_merchant_on_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION upsert_merchant_on_transaction();

-- Step 9: Function to backfill merchants from existing transactions
CREATE OR REPLACE FUNCTION backfill_merchants_for_user(target_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    WITH merchant_stats AS (
        SELECT 
            t.name AS original_name,
            normalize_merchant_name(t.name) AS normalized,
            COUNT(*) AS cnt,
            MAX(t.date) AS last_date
        FROM transactions t
        WHERE t.user_id = target_user_id
          AND length(normalize_merchant_name(t.name)) > 0
        GROUP BY t.name, normalize_merchant_name(t.name)
    ),
    inserted AS (
        INSERT INTO merchants (user_id, merchant_name, normalized_name, transaction_count, last_used_at)
        SELECT 
            target_user_id,
            ms.original_name,
            ms.normalized,
            ms.cnt::INTEGER,
            ms.last_date
        FROM merchant_stats ms
        ON CONFLICT (user_id, normalized_name)
        DO UPDATE SET
            transaction_count = EXCLUDED.transaction_count,
            last_used_at = GREATEST(merchants.last_used_at, EXCLUDED.last_used_at),
            updated_at = NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO inserted_count FROM inserted;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Grant permissions
GRANT ALL ON merchants TO anon, authenticated;
GRANT EXECUTE ON FUNCTION normalize_merchant_name(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION backfill_merchants_for_user(TEXT) TO anon, authenticated;

-- Comments
COMMENT ON TABLE merchants IS 'Stores frequently used merchants per user. user_id must be TEXT for Clerk compatibility.';
COMMENT ON FUNCTION normalize_merchant_name(TEXT) IS 'Normalizes merchant names by trimming, lowercasing, and collapsing whitespace';
COMMENT ON FUNCTION upsert_merchant_on_transaction() IS 'Automatically upserts merchant record when a new transaction is created';
COMMENT ON FUNCTION backfill_merchants_for_user(TEXT) IS 'Backfills merchants table from existing transactions for a specific user';

-- Verify setup
SELECT 
    'Merchants table created successfully' as status,
    (SELECT data_type FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'user_id') as user_id_type,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'merchants') as policy_count;
