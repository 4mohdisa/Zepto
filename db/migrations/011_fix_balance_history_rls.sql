-- Migration: Fix RLS policies for account_balance_history to work with Clerk
-- Problem: auth.uid() returns a UUID, but Clerk stores user IDs as 'user_xxx' strings
-- Solution: Use requesting_user_id() function that reads from JWT sub claim

-- First, create/update the helper function to return Clerk ID from JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() ->> 'sub';  -- Clerk stores user ID in 'sub' claim
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can insert own balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can update own balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can delete own balance history" ON account_balance_history;

-- Create fixed policies using requesting_user_id()
CREATE POLICY "Users can view own balance history" 
    ON account_balance_history 
    FOR SELECT 
    USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own balance history" 
    ON account_balance_history 
    FOR INSERT 
    WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own balance history" 
    ON account_balance_history 
    FOR UPDATE 
    USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own balance history" 
    ON account_balance_history 
    FOR DELETE 
    USING (requesting_user_id() = user_id);

-- Also fix account_balances table if it has the same issue
DROP POLICY IF EXISTS "Users can view own account balances" ON account_balances;
DROP POLICY IF EXISTS "Users can insert own account balances" ON account_balances;
DROP POLICY IF EXISTS "Users can update own account balances" ON account_balances;
DROP POLICY IF EXISTS "Users can delete own account balances" ON account_balances;

CREATE POLICY "Users can view own account balances" 
    ON account_balances 
    FOR SELECT 
    USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own account balances" 
    ON account_balances 
    FOR INSERT 
    WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own account balances" 
    ON account_balances 
    FOR UPDATE 
    USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own account balances" 
    ON account_balances 
    FOR DELETE 
    USING (requesting_user_id() = user_id);

-- Grant permissions
GRANT ALL ON account_balance_history TO anon, authenticated;
GRANT ALL ON account_balances TO anon, authenticated;
GRANT EXECUTE ON FUNCTION requesting_user_id() TO anon, authenticated;

COMMENT ON FUNCTION requesting_user_id() IS 'Extracts the Clerk user ID from the JWT sub claim for RLS policies';
