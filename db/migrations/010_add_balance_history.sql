-- Migration: Add account_balance_history table
-- Purpose: Track immutable history of balance updates

-- Create the balance history table
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_type TEXT NOT NULL,
    balance_amount DECIMAL(12, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id 
    ON account_balance_history(user_id);

CREATE INDEX IF NOT EXISTS idx_balance_history_user_account 
    ON account_balance_history(user_id, account_type);

CREATE INDEX IF NOT EXISTS idx_balance_history_created_at 
    ON account_balance_history(created_at DESC);

-- Enable RLS
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own balance history" 
    ON account_balance_history 
    FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own balance history" 
    ON account_balance_history 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

-- Trigger for updated_at
CREATE TRIGGER update_balance_history_updated_at
    BEFORE UPDATE ON account_balance_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON account_balance_history TO anon, authenticated;
GRANT ALL ON SEQUENCE account_balance_history_id_seq TO anon, authenticated;

COMMENT ON TABLE account_balance_history IS 'Immutable history of account balance updates';
