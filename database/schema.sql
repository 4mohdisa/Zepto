-- ============================================
-- Zepto Database Schema
-- Financial Management Application
-- ============================================
-- This schema is configured for CLERK AUTHENTICATION with Supabase Database.
-- Clerk handles user management, Supabase handles data storage.
-- Run this in your Supabase SQL Editor to set up the database.
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (Clean Slate)
-- Run this to reset the database
-- ============================================
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_transaction_summary(TEXT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_spending_by_category(TEXT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS requesting_user_id() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;

-- ============================================
-- HELPER FUNCTIONS: Clerk Authentication
-- ============================================

-- Function to get Clerk User ID from JWT 'sub' claim
-- This is extracted from the Clerk session token
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        auth.uid(),
        ''
    );
$$ LANGUAGE SQL STABLE;

-- Function to check if user is authenticated via Clerk
-- Verifies the 'role' claim is set to 'authenticated'
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role') = 'authenticated';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PROFILES TABLE
-- Stores user profile information linked to Clerk Auth
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,  -- Clerk user ID (e.g., 'user_2abc123xyz')
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies (using Clerk JWT)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = id
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = id
    );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = id
    );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CATEGORIES TABLE
-- Stores transaction categories (default and user-defined)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view default categories" ON categories
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND is_default = TRUE
    );

CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRANSACTIONS TABLE
-- Stores individual financial transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT requesting_user_id(),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('Income', 'Expense')),
    account_type TEXT,
    category_name TEXT,
    date DATE NOT NULL,
    recurring_frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies (using Clerk JWT with role verification)
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RECURRING TRANSACTIONS TABLE
-- Stores recurring transaction templates
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT requesting_user_id(),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    account_type TEXT NOT NULL,
    category_name TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_frequency ON recurring_transactions(frequency);

-- Enable Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Recurring transactions policies (using Clerk JWT with role verification)
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions
    FOR UPDATE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions
    FOR DELETE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ACCOUNT BALANCES TABLE
-- Stores user account balances for tracking against bank accounts
-- ============================================
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT requesting_user_id(),
    account_type TEXT NOT NULL CHECK (account_type IN ('Cash', 'Savings', 'Checking', 'Credit Card', 'Investment', 'Other')),
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_type)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_account_type ON account_balances(account_type);

-- Enable Row Level Security
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- Account balances policies
CREATE POLICY "Users can view own account balances" ON account_balances
    FOR SELECT
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can insert own account balances" ON account_balances
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can update own account balances" ON account_balances
    FOR UPDATE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE POLICY "Users can delete own account balances" ON account_balances
    FOR DELETE
    TO authenticated
    USING (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

CREATE TRIGGER update_account_balances_updated_at
    BEFORE UPDATE ON account_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
-- DEFAULT CATEGORIES SEED DATA
-- Insert default categories (available to all users)
-- ============================================
INSERT INTO categories (name, description, icon, color, is_default) VALUES
    ('Housing', 'Rent, mortgage, utilities, maintenance', 'home', '#3B82F6', TRUE),
    ('Transportation', 'Car payments, gas, public transit, rideshare', 'car', '#8B5CF6', TRUE),
    ('Food & Dining', 'Groceries, restaurants, takeout', 'utensils', '#F59E0B', TRUE),
    ('Healthcare', 'Medical bills, prescriptions, insurance', 'heart-pulse', '#EF4444', TRUE),
    ('Entertainment', 'Movies, games, streaming services, hobbies', 'gamepad-2', '#EC4899', TRUE),
    ('Shopping', 'Clothing, electronics, household items', 'shopping-bag', '#10B981', TRUE),
    ('Personal Care', 'Haircuts, gym, personal products', 'sparkles', '#F97316', TRUE),
    ('Education', 'Tuition, books, courses, training', 'graduation-cap', '#6366F1', TRUE),
    ('Travel', 'Flights, hotels, vacation expenses', 'plane', '#0EA5E9', TRUE),
    ('Subscriptions', 'Monthly services, memberships', 'credit-card', '#14B8A6', TRUE),
    ('Salary', 'Regular employment income', 'briefcase', '#22C55E', TRUE),
    ('Freelance', 'Contract and freelance work', 'laptop', '#84CC16', TRUE),
    ('Investments', 'Dividends, capital gains, interest', 'trending-up', '#A855F7', TRUE),
    ('Gifts', 'Money received as gifts', 'gift', '#F472B6', TRUE),
    ('Other Income', 'Miscellaneous income sources', 'plus-circle', '#64748B', TRUE),
    ('Other Expense', 'Miscellaneous expenses', 'minus-circle', '#94A3B8', TRUE);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's transaction summary for a date range
CREATE OR REPLACE FUNCTION get_transaction_summary(
    p_user_id TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_balance DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END), 0) AS net_balance,
        COUNT(*) AS transaction_count
    FROM transactions
    WHERE user_id = p_user_id
      AND date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get spending by category for a user
CREATE OR REPLACE FUNCTION get_spending_by_category(
    p_user_id TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    category_name TEXT,
    total_amount DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(t.category_name, 'Uncategorized') AS category_name,
        SUM(t.amount) AS total_amount,
        COUNT(*) AS transaction_count
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.type = 'Expense'
      AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY t.category_name
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- CLERK + SUPABASE MODERN INTEGRATION NOTES
-- ============================================
-- 
-- 1. CLERK DASHBOARD SETUP:
--    - Go to Clerk Dashboard → Sessions → Customize session token
--    - Add claim: { "role": "authenticated" }
--    - This is REQUIRED for Supabase to recognize authenticated users
--
-- 2. SUPABASE DASHBOARD SETUP:
--    - Go to Authentication → Providers → Third-Party Auth
--    - Add Clerk provider with your Frontend API URL
--    - Example: https://your-app.clerk.accounts.dev
--
-- 3. LOCAL DEVELOPMENT (supabase/config.toml):
--    [auth.third_party.clerk]
--    enabled = true
--    domain = "your-app.clerk.accounts.dev"
--
-- 4. CLIENT SETUP (Next.js):
--    Use the accessToken option with createBrowserClient:
--    
--    const supabase = createBrowserClient(url, key, {
--      accessToken: async () => {
--        const token = await getToken() // from useAuth() hook
--        return token ?? null
--      },
--      auth: {
--        persistSession: false,
--        autoRefreshToken: false,
--      },
--    })
--
-- 5. RLS POLICY DESIGN:
--    All policies now use is_authenticated() function which checks:
--    - (auth.jwt() ->> 'role') = 'authenticated'
--    - This ensures only properly authenticated Clerk users can access data
--
-- 6. TROUBLESHOOTING:
--    - If you get "Row Level Security policy violation" errors:
--      a) Check Clerk session token has "role": "authenticated" claim
--      b) Verify Supabase Third-Party Auth is enabled for Clerk
--      c) Ensure you're using useSupabaseClient() hook (not createClient)
--
-- ============================================
