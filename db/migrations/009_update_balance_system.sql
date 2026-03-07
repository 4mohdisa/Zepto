-- ============================================
-- MIGRATION: Update Balance System for Bank-Style Tracking
-- 
-- Changes:
-- 1. Add effective_date to account_balances (the date from which this balance is valid)
-- 2. Create function to calculate current balance based on effective_date
-- 3. Transactions after effective_date affect balance, before don't
-- ============================================

-- Add effective_date column to track when balance was recorded
ALTER TABLE account_balances 
ADD COLUMN IF NOT EXISTS effective_date DATE DEFAULT CURRENT_DATE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_account_balances_effective_date 
ON account_balances(user_id, account_type, effective_date);

-- Function to calculate current balance for an account
-- Starting from the effective_date balance, apply all transactions after that date
CREATE OR REPLACE FUNCTION calculate_current_balance(
    p_user_id TEXT,
    p_account_type TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    v_starting_balance DECIMAL := 0;
    v_effective_date DATE;
    v_income_after DECIMAL := 0;
    v_expenses_after DECIMAL := 0;
    v_current_balance DECIMAL := 0;
BEGIN
    -- Get the most recent balance and its effective date for this account
    SELECT 
        current_balance,
        effective_date
    INTO 
        v_starting_balance,
        v_effective_date
    FROM account_balances
    WHERE user_id = p_user_id 
      AND account_type = p_account_type
    ORDER BY effective_date DESC, last_updated DESC
    LIMIT 1;
    
    -- If no balance recorded, return 0
    IF v_starting_balance IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate income after effective date
    SELECT COALESCE(SUM(amount), 0)
    INTO v_income_after
    FROM transactions
    WHERE user_id = p_user_id
      AND account_type = p_account_type
      AND type = 'Income'
      AND date > v_effective_date;
    
    -- Calculate expenses after effective date
    SELECT COALESCE(SUM(amount), 0)
    INTO v_expenses_after
    FROM transactions
    WHERE user_id = p_user_id
      AND account_type = p_account_type
      AND type = 'Expense'
      AND date > v_effective_date;
    
    -- Current balance = Starting balance + Income after - Expenses after
    v_current_balance := v_starting_balance + v_income_after - v_expenses_after;
    
    RETURN v_current_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current balance summary for all accounts
CREATE OR REPLACE FUNCTION get_current_balance_summary(
    p_user_id TEXT
)
RETURNS TABLE (
    account_type TEXT,
    starting_balance DECIMAL,
    effective_date DATE,
    income_after DECIMAL,
    expenses_after DECIMAL,
    current_balance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_balances AS (
        SELECT DISTINCT ON (account_type)
            account_type,
            current_balance as starting_balance,
            effective_date
        FROM account_balances
        WHERE user_id = p_user_id
        ORDER BY account_type, effective_date DESC, last_updated DESC
    ),
    income_calc AS (
        SELECT 
            lb.account_type,
            COALESCE(SUM(t.amount), 0) as income_after
        FROM latest_balances lb
        LEFT JOIN transactions t ON 
            t.user_id = p_user_id
            AND t.account_type = lb.account_type
            AND t.type = 'Income'
            AND t.date > lb.effective_date
        GROUP BY lb.account_type
    ),
    expense_calc AS (
        SELECT 
            lb.account_type,
            COALESCE(SUM(t.amount), 0) as expenses_after
        FROM latest_balances lb
        LEFT JOIN transactions t ON 
            t.user_id = p_user_id
            AND t.account_type = lb.account_type
            AND t.type = 'Expense'
            AND t.date > lb.effective_date
        GROUP BY lb.account_type
    )
    SELECT 
        lb.account_type,
        lb.starting_balance,
        lb.effective_date,
        COALESCE(ic.income_after, 0) as income_after,
        COALESCE(ec.expenses_after, 0) as expenses_after,
        lb.starting_balance + COALESCE(ic.income_after, 0) - COALESCE(ec.expenses_after, 0) as current_balance
    FROM latest_balances lb
    LEFT JOIN income_calc ic ON ic.account_type = lb.account_type
    LEFT JOIN expense_calc ec ON ec.account_type = lb.account_type
    ORDER BY lb.account_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_current_balance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_balance_summary TO anon, authenticated;

-- Success message
SELECT 'Balance system updated successfully!' as status;
