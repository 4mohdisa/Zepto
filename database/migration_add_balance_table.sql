-- ============================================
-- MIGRATION: Add Account Balances Table
-- Run this in Supabase SQL Editor to add balance tracking
-- This is SAFE and won't affect existing data
-- ============================================

-- ============================================
-- ACCOUNT BALANCES TABLE
-- Stores user account balances for tracking against bank accounts
-- ============================================
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('Cash', 'Savings', 'Checking', 'Credit Card', 'Investment', 'Other')),
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_account_type ON account_balances(account_type);

-- Enable Row Level Security
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- Account balances policies
CREATE POLICY "Users can view own account balances" ON account_balances
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'authenticated'
        AND (auth.jwt() ->> 'sub') = user_id
    );

CREATE POLICY "Users can insert own account balances" ON account_balances
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'authenticated'
        AND (auth.jwt() ->> 'sub') = user_id
    );

CREATE POLICY "Users can update own account balances" ON account_balances
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'authenticated'
        AND (auth.jwt() ->> 'sub') = user_id
    );

CREATE POLICY "Users can delete own account balances" ON account_balances
    FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'authenticated'
        AND (auth.jwt() ->> 'sub') = user_id
    );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_balances_updated_at
    BEFORE UPDATE ON account_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate expected balance based on transactions
CREATE OR REPLACE FUNCTION calculate_expected_balance(
    p_user_id TEXT,
    p_account_type TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(
        SUM(CASE 
            WHEN type = 'Income' THEN amount 
            ELSE -amount 
        END), 
        0
    ) INTO v_balance
    FROM transactions
    WHERE user_id = p_user_id
      AND account_type = p_account_type;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get balance summary for all accounts
CREATE OR REPLACE FUNCTION get_balance_summary(
    p_user_id TEXT
)
RETURNS TABLE (
    account_type TEXT,
    expected_balance DECIMAL,
    actual_balance DECIMAL,
    difference DECIMAL,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.account_type,
        calculate_expected_balance(p_user_id, ab.account_type) as expected_balance,
        ab.current_balance as actual_balance,
        ab.current_balance - calculate_expected_balance(p_user_id, ab.account_type) as difference,
        ab.last_updated
    FROM account_balances ab
    WHERE ab.user_id = p_user_id
    ORDER BY ab.account_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON account_balances TO anon, authenticated;
GRANT ALL ON SEQUENCE account_balances_id_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_expected_balance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_balance_summary TO anon, authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Account balances table and functions created successfully!' as status;
