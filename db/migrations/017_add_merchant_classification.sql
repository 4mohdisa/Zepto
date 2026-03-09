-- Migration: Add merchant classification system
-- Purpose: Improve merchant accuracy with AI-assisted classification and caching

-- ============================================================================
-- Step 1: Create merchant classification cache table
-- This caches AI classification results to avoid repeated API calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_classification_cache (
    raw_name TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('merchant', 'payment_processor', 'marketplace', 'bank_transfer', 'unknown', 'noise')),
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    normalized_key TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    use_count INTEGER DEFAULT 1
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_merchant_cache_normalized ON merchant_classification_cache(normalized_key);
CREATE INDEX IF NOT EXISTS idx_merchant_cache_classification ON merchant_classification_cache(classification);
CREATE INDEX IF NOT EXISTS idx_merchant_cache_confidence ON merchant_classification_cache(confidence);

-- Grant permissions
GRANT ALL ON merchant_classification_cache TO anon, authenticated;

-- ============================================================================
-- Step 2: Add new columns to merchants table for classification
-- ============================================================================

-- Add display_name for clean human-readable names
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add canonical_name for grouping (e.g., "OTR" for "OTR Blair", "OTR Thorngate")
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS canonical_name TEXT;

-- Add classification type
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS classification TEXT 
    CHECK (classification IN ('merchant', 'payment_processor', 'marketplace', 'bank_transfer', 'unknown', 'noise'));

-- Add confidence score
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) 
    CHECK (confidence >= 0 AND confidence <= 1);

-- Add raw_names array to track all variations that map to this merchant
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS raw_names JSONB DEFAULT '[]';

-- ============================================================================
-- Step 3: Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_merchants_canonical ON merchants(user_id, canonical_name);
CREATE INDEX IF NOT EXISTS idx_merchants_classification ON merchants(user_id, classification);
CREATE INDEX IF NOT EXISTS idx_merchants_confidence ON merchants(user_id, confidence);

-- ============================================================================
-- Step 4: Function to safely merge merchants (with conflict detection)
-- ============================================================================

CREATE OR REPLACE FUNCTION safe_merge_merchants(
    p_user_id TEXT,
    p_canonical_name TEXT,
    p_display_name TEXT,
    p_classification TEXT,
    p_confidence NUMERIC,
    p_raw_name TEXT,
    p_transaction_count INTEGER DEFAULT 1,
    p_last_used_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
    existing_id UUID;
    existing_raw_names JSONB;
    existing_classification TEXT;
    existing_confidence NUMERIC;
    new_raw_names JSONB;
BEGIN
    -- Check if merchant with this canonical name already exists
    SELECT id, raw_names, classification, confidence
    INTO existing_id, existing_raw_names, existing_classification, existing_confidence
    FROM merchants
    WHERE user_id = p_user_id
      AND canonical_name = p_canonical_name
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
        -- Merge raw_names (add new variation if not present)
        new_raw_names = existing_raw_names;
        IF NOT (new_raw_names @> to_jsonb(p_raw_name)) THEN
            new_raw_names = new_raw_names || to_jsonb(p_raw_name);
        END IF;

        -- Update existing merchant
        UPDATE merchants
        SET 
            transaction_count = transaction_count + p_transaction_count,
            last_used_at = GREATEST(last_used_at, p_last_used_at),
            raw_names = new_raw_names,
            -- Keep higher confidence classification
            confidence = GREATEST(existing_confidence, p_confidence),
            -- If new classification has higher confidence, use it
            classification = CASE 
                WHEN p_confidence > existing_confidence THEN p_classification
                ELSE existing_classification
            END,
            updated_at = NOW()
        WHERE id = existing_id;

        RETURN existing_id;
    ELSE
        -- Create new merchant
        INSERT INTO merchants (
            user_id,
            merchant_name,
            normalized_name,
            display_name,
            canonical_name,
            classification,
            confidence,
            raw_names,
            transaction_count,
            last_used_at,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_raw_name,
            normalize_merchant_name(p_raw_name),
            p_display_name,
            p_canonical_name,
            p_classification,
            p_confidence,
            to_jsonb(ARRAY[p_raw_name]),
            p_transaction_count,
            p_last_used_at,
            NOW(),
            NOW()
        )
        RETURNING id INTO existing_id;

        RETURN existing_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 5: Update the transaction trigger to use classification
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_merchant_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    normalized TEXT;
    classification_result JSONB;
    display_name TEXT;
    canonical_name TEXT;
    classification TEXT;
    confidence NUMERIC;
    cache_entry RECORD;
BEGIN
    -- Normalize the transaction name
    normalized := normalize_merchant_name(NEW.name);
    
    -- Skip if name is empty after normalization
    IF normalized IS NULL OR length(normalized) = 0 THEN
        RETURN NEW;
    END IF;

    -- Check cache first
    SELECT * INTO cache_entry
    FROM merchant_classification_cache
    WHERE raw_name = NEW.name
    LIMIT 1;

    IF cache_entry IS NOT NULL THEN
        -- Use cached classification
        display_name := cache_entry.display_name;
        canonical_name := cache_entry.canonical_name;
        classification := cache_entry.classification;
        confidence := cache_entry.confidence;
        
        -- Update use count
        UPDATE merchant_classification_cache
        SET use_count = use_count + 1
        WHERE raw_name = NEW.name;
    ELSE
        -- Apply deterministic fallback rules inline
        -- This mirrors the TypeScript fallback logic for speed
        
        -- Default values
        display_name := initcap(trim(regexp_replace(NEW.name, '\s+', ' ', 'g')));
        canonical_name := upper(trim(regexp_replace(NEW.name, '\s+', ' ', 'g')));
        classification := 'merchant';
        confidence := 0.6;
        
        -- Payment processor patterns
        IF NEW.name ~* '^PP?\*\d+' OR 
           NEW.name ~* '^PAYPAL\s*[*\s]' OR
           NEW.name ~* '^ZLR\*' OR
           NEW.name ~* '^VENMO\s*[*\s]' OR
           NEW.name ~* '^SQ\s*[*\s]' OR
           NEW.name ~* '^[A-Z]{2,3}\*[A-Z0-9]{4,}' THEN
            
            classification := 'payment_processor';
            confidence := 0.8;
            
            -- Try to extract merchant after code
            IF NEW.name ~ '\*' THEN
                display_name := initcap(trim(split_part(NEW.name, '*', 2)));
                canonical_name := upper(trim(split_part(NEW.name, '*', 2)));
                IF length(display_name) > 2 AND display_name !~ '^\d+$' THEN
                    classification := 'merchant';
                    confidence := 0.7;
                END IF;
            END IF;
        END IF;
        
        -- Brand + location patterns
        IF NEW.name ~* '^(OTR|7-ELEVEN|7 ELEVEN|COLES|WOOLWORTHS|ALDI|IGA|BP|SHELL|CALTEX|UNITED|AMAZON)\s+\w' THEN
            canonical_name := regexp_replace(upper(trim(NEW.name)), '^([A-Z][A-Z\-]*\s+).*', '\1');
            canonical_name := trim(regexp_replace(canonical_name, '\s+$', ''));
            display_name := initcap(canonical_name);
            confidence := 0.9;
        END IF;
    END IF;

    -- Use safe merge function
    PERFORM safe_merge_merchants(
        NEW.user_id,
        canonical_name,
        display_name,
        classification,
        confidence,
        NEW.name,
        1,
        NEW.date
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS tr_upsert_merchant_on_transaction ON transactions;
CREATE TRIGGER tr_upsert_merchant_on_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION upsert_merchant_on_transaction();

-- ============================================================================
-- Step 6: Create function to reprocess all merchants for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION reprocess_merchants_for_user(p_user_id TEXT)
RETURNS TABLE(
    processed INTEGER,
    merged INTEGER,
    new_classifications INTEGER,
    avg_confidence NUMERIC
) AS $$
DECLARE
    v_processed INTEGER := 0;
    v_merged INTEGER := 0;
    v_new_class INTEGER := 0;
    v_total_confidence NUMERIC := 0;
    tx RECORD;
    merchant_record RECORD;
BEGIN
    -- Get all unique merchant names from transactions
    FOR tx IN 
        SELECT 
            t.name,
            count(*) as cnt,
            max(t.date) as last_date
        FROM transactions t
        WHERE t.user_id = p_user_id
          AND length(normalize_merchant_name(t.name)) > 0
        GROUP BY t.name
    LOOP
        v_processed := v_processed + 1;
        
        -- Check if already classified
        SELECT * INTO merchant_record
        FROM merchant_classification_cache
        WHERE raw_name = tx.name
        LIMIT 1;
        
        IF merchant_record IS NULL THEN
            v_new_class := v_new_class + 1;
        END IF;
        
        -- The trigger will handle the actual classification on next insert
        -- For existing data, we manually upsert
        
        -- Simple inline classification (matches trigger logic)
        DECLARE
            display_name TEXT := initcap(trim(regexp_replace(tx.name, '\s+', ' ', 'g')));
            canonical_name TEXT := upper(trim(regexp_replace(tx.name, '\s+', ' ', 'g')));
            classification TEXT := 'merchant';
            confidence NUMERIC := 0.6;
        BEGIN
            -- Apply same rules as trigger
            IF tx.name ~* '^PP?\*\d+' OR tx.name ~* '^PAYPAL\s*[*\s]' OR tx.name ~* '^ZLR\*' THEN
                classification := 'payment_processor';
                confidence := 0.8;
            ELSIF tx.name ~* '^(OTR|COLES|WOOLWORTHS|ALDI|IGA|BP|SHELL)\s+\w' THEN
                canonical_name := split_part(upper(trim(tx.name)), ' ', 1);
                display_name := initcap(canonical_name);
                confidence := 0.9;
            END IF;
            
            v_total_confidence := v_total_confidence + confidence;
            
            -- Check if this creates a merge
            IF EXISTS (
                SELECT 1 FROM merchants 
                WHERE user_id = p_user_id 
                  AND canonical_name = reprocess_merchants_for_user.canonical_name
                  AND merchant_name != tx.name
            ) THEN
                v_merged := v_merged + 1;
            END IF;
            
            -- Safe merge
            PERFORM safe_merge_merchants(
                p_user_id,
                canonical_name,
                display_name,
                classification,
                confidence,
                tx.name,
                tx.cnt::INTEGER,
                tx.last_date
            );
        END;
    END LOOP;
    
    -- Clean up old merchant records that were superseded by canonical grouping
    DELETE FROM merchants m1
    WHERE m1.user_id = p_user_id
      AND m1.canonical_name IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM merchants m2
          WHERE m2.user_id = p_user_id
            AND m2.canonical_name = m1.canonical_name
            AND m2.id != m1.id
            AND m2.transaction_count >= m1.transaction_count
      )
      AND m1.id NOT IN (
          SELECT MIN(id) FROM merchants
          WHERE user_id = p_user_id
            AND canonical_name IS NOT NULL
          GROUP BY canonical_name
      );

    RETURN QUERY SELECT 
        v_processed,
        v_merged,
        v_new_class,
        CASE WHEN v_processed > 0 THEN round(v_total_confidence / v_processed, 2) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 7: Backfill existing merchants with new fields
-- ============================================================================

-- Set display_name from merchant_name for existing records
UPDATE merchants
SET display_name = initcap(trim(regexp_replace(merchant_name, '\s+', ' ', 'g'))),
    canonical_name = upper(trim(regexp_replace(merchant_name, '\s+', ' ', 'g'))),
    classification = 'merchant',
    confidence = 0.6
WHERE display_name IS NULL;

-- Apply simple brand extraction for known patterns
UPDATE merchants
SET canonical_name = split_part(upper(trim(merchant_name)), ' ', 1),
    display_name = initcap(split_part(trim(merchant_name), ' ', 1)),
    confidence = 0.9
WHERE canonical_name IS NULL
  AND merchant_name ~* '^(OTR|COLES|WOOLWORTHS|ALDI|IGA|BP|SHELL|CALTEX|UNITED|7-ELEVEN) ';

-- ============================================================================
-- Step 8: Create helper function to get unique merchant names
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unique_merchant_names(p_user_id TEXT)
RETURNS TABLE(name TEXT, cnt BIGINT, last_date DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name,
        count(*)::BIGINT as cnt,
        max(t.date)::DATE as last_date
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.name IS NOT NULL
      AND length(trim(t.name)) > 0
    GROUP BY t.name
    ORDER BY count(*) DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_unique_merchant_names TO anon, authenticated;

-- ============================================================================
-- Step 9: Create cleanup function for merged merchants
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_merged_merchants(target_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    removed_count INTEGER := 0;
BEGIN
    -- Delete merchants that have been superseded by canonical grouping
    -- Keep only the merchant with the highest transaction count for each canonical_name
    WITH ranked_merchants AS (
        SELECT 
            id,
            canonical_name,
            transaction_count,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, canonical_name 
                ORDER BY transaction_count DESC, last_used_at DESC
            ) as rank
        FROM merchants
        WHERE user_id = target_user_id
          AND canonical_name IS NOT NULL
    )
    DELETE FROM merchants
    WHERE id IN (
        SELECT id FROM ranked_merchants WHERE rank > 1
    );
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    
    RETURN removed_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 10: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION safe_merge_merchants TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reprocess_merchants_for_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_merged_merchants TO anon, authenticated;

-- ============================================================================
-- Step 11: Comments
-- ============================================================================

COMMENT ON TABLE merchant_classification_cache IS 'Caches AI-assisted merchant classifications to avoid repeated API calls';
COMMENT ON COLUMN merchants.display_name IS 'Human-readable merchant name (e.g., "Otr" instead of "OTR BLAIR")';
COMMENT ON COLUMN merchants.canonical_name IS 'Canonical name for grouping (e.g., "OTR" groups "OTR Blair", "OTR Thorngate")';
COMMENT ON COLUMN merchants.classification IS 'Type: merchant, payment_processor, marketplace, bank_transfer, unknown, noise';
COMMENT ON COLUMN merchants.confidence IS 'Classification confidence 0.0-1.0';
COMMENT ON COLUMN merchants.raw_names IS 'JSON array of all raw name variations seen for this merchant';
COMMENT ON FUNCTION safe_merge_merchants IS 'Safely merges merchants by canonical name, preventing duplicates';
COMMENT ON FUNCTION reprocess_merchants_for_user IS 'Reprocesses all merchants for a user with improved classification';

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
    'Migration 017 applied successfully' as status,
    (SELECT COUNT(*) FROM merchant_classification_cache) as cached_classifications,
    (SELECT COUNT(*) FROM merchants WHERE display_name IS NOT NULL) as merchants_with_display_name,
    (SELECT COUNT(DISTINCT canonical_name) FROM merchants WHERE canonical_name IS NOT NULL) as unique_canonical_names;
