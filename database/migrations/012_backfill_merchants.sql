-- Migration: Backfill merchants from existing transactions
-- This populates the merchants table with data from existing transactions

-- Function to backfill merchants for a specific user
CREATE OR REPLACE FUNCTION backfill_merchants_for_user(target_user_id TEXT)
RETURNS TABLE(merchant_name TEXT, transaction_count BIGINT, last_used_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
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
    )
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
    RETURNING 
        EXCLUDED.merchant_name,
        EXCLUDED.transaction_count,
        EXCLUDED.last_used_at;
END;
$$ LANGUAGE plpgsql;

-- Function to backfill for all users
CREATE OR REPLACE FUNCTION backfill_all_merchants()
RETURNS TABLE(user_id TEXT, merchants_count BIGINT) AS $$
DECLARE
    user_record RECORD;
    merchant_count BIGINT;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT t.user_id 
        FROM transactions t
        WHERE t.user_id IS NOT NULL
    LOOP
        SELECT COUNT(*) INTO merchant_count
        FROM backfill_merchants_for_user(user_record.user_id);
        
        user_id := user_record.user_id;
        merchants_count := merchant_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_merchants_for_user(TEXT) IS 'Backfills merchants table from existing transactions for a specific user';
COMMENT ON FUNCTION backfill_all_merchants() IS 'Backfills merchants table from existing transactions for all users';

-- Example usage:
-- SELECT * FROM backfill_merchants_for_user('your_user_id_here');
-- SELECT * FROM backfill_all_merchants();
