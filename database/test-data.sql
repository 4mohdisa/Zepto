-- ============================================
-- TEST DATA FOR ZEPTO FINANCE APP
-- Run this to populate test data for manual testing
-- ============================================

-- NOTE: Replace 'TEST_USER_ID' with an actual user_id from your Clerk users
-- Get this from the dashboard after signing in (check console logs for user ID)

-- ============================================
-- CLEANUP (Optional - uncomment to clear existing test data)
-- ============================================
-- DELETE FROM transactions WHERE user_id = 'YOUR_TEST_USER_ID';
-- DELETE FROM account_balances WHERE user_id = 'YOUR_TEST_USER_ID';
-- DELETE FROM recurring_transactions WHERE user_id = 'YOUR_TEST_USER_ID';

-- ============================================
-- TEST USER ID (Replace this!)
-- ============================================
-- DO $$ 
-- DECLARE
--     v_user_id TEXT := 'user_xxxxxxxxxxxxxxxx'; -- Replace with your Clerk user ID

-- ============================================
-- CATEGORIES (if not exists)
-- ============================================
INSERT INTO categories (name, color) VALUES
    ('Salary', '#22c55e'),
    ('Freelance', '#16a34a'),
    ('Investments', '#15803d'),
    ('Rent', '#ef4444'),
    ('Food', '#f97316'),
    ('Transport', '#f59e0b'),
    ('Entertainment', '#8b5cf6'),
    ('Shopping', '#ec4899'),
    ('Utilities', '#06b6d4'),
    ('Health', '#14b8a6'),
    ('Education', '#6366f1'),
    ('Other', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TEST SCENARIO 1: Basic User with Mixed Transactions
-- ============================================
-- User: test_user_1@example.com
-- Expected Results:
--   Income: $8,000
--   Expenses: $2,930
--   Net Balance: $5,070
--   Top Category: Housing
-- ============================================

-- Income Transactions
INSERT INTO transactions (user_id, name, amount, type, account_type, category_id, date, description) VALUES
    ('TEST_USER_ID', 'Monthly Salary', 5000.00, 'Income', 'Checking', 1, '2024-02-01', 'Regular monthly salary'),
    ('TEST_USER_ID', 'Freelance Project', 2000.00, 'Income', 'Savings', 2, '2024-02-15', 'Website design project'),
    ('TEST_USER_ID', 'Stock Dividend', 1000.00, 'Income', 'Investment', 3, '2024-02-20', 'Quarterly dividend payment');

-- Expense Transactions
INSERT INTO transactions (user_id, name, amount, type, account_type, category_id, date, description) VALUES
    ('TEST_USER_ID', 'Monthly Rent', 1500.00, 'Expense', 'Checking', 4, '2024-02-01', 'Apartment rent'),
    ('TEST_USER_ID', 'Grocery Shopping', 250.00, 'Expense', 'Credit Card', 5, '2024-02-05', 'Weekly groceries'),
    ('TEST_USER_ID', 'Gas Station', 60.00, 'Expense', 'Credit Card', 6, '2024-02-08', 'Car fuel'),
    ('TEST_USER_ID', 'Movie Night', 45.00, 'Expense', 'Credit Card', 7, '2024-02-10', 'Cinema tickets'),
    ('TEST_USER_ID', 'Grocery Shopping', 275.00, 'Expense', 'Credit Card', 5, '2024-02-12', 'Weekly groceries'),
    ('TEST_USER_ID', 'Electric Bill', 120.00, 'Expense', 'Checking', 9, '2024-02-15', 'Monthly electricity'),
    ('TEST_USER_ID', 'Internet Bill', 80.00, 'Expense', 'Checking', 9, '2024-02-15', 'Monthly internet'),
    ('TEST_USER_ID', 'New Shoes', 120.00, 'Expense', 'Credit Card', 8, '2024-02-18', 'Running shoes'),
    ('TEST_USER_ID', 'Restaurant', 85.00, 'Expense', 'Cash', 5, '2024-02-20', 'Dinner with friends'),
    ('TEST_USER_ID', 'Gas Station', 55.00, 'Expense', 'Credit Card', 6, '2024-02-22', 'Car fuel'),
    ('TEST_USER_ID', 'Pharmacy', 35.00, 'Expense', 'Cash', 10, '2024-02-25', 'Medicine'),
    ('TEST_USER_ID', 'Online Course', 200.00, 'Expense', 'Credit Card', 11, '2024-02-28', 'Programming course'),
    ('TEST_USER_ID', 'Miscellaneous', 95.00, 'Expense', 'Cash', 12, '2024-02-28', 'Various small expenses');

-- Account Balances
INSERT INTO account_balances (user_id, account_type, current_balance, last_updated) VALUES
    ('TEST_USER_ID', 'Checking', 3500.00, NOW()),
    ('TEST_USER_ID', 'Savings', 12000.00, NOW()),
    ('TEST_USER_ID', 'Credit Card', -800.00, NOW()),
    ('TEST_USER_ID', 'Cash', 150.00, NOW()),
    ('TEST_USER_ID', 'Investment', 5000.00, NOW())
ON CONFLICT (user_id, account_type) DO UPDATE 
SET current_balance = EXCLUDED.current_balance, last_updated = NOW();

-- ============================================
-- TEST SCENARIO 2: High Earner
-- ============================================
-- User: test_user_2@example.com
-- Expected Results:
--   Income: $25,000
--   Expenses: $8,500
--   Net Balance: $16,500
-- ============================================

-- INSERT INTO transactions (user_id, name, amount, type, account_type, category_id, date) VALUES
--     ('TEST_USER_2_ID', 'Executive Salary', 20000.00, 'Income', 'Checking', 1, '2024-02-01'),
--     ('TEST_USER_2_ID', 'Consulting', 5000.00, 'Income', 'Savings', 2, '2024-02-15');

-- ============================================
-- TEST SCENARIO 3: Overspender (Negative Net)
-- ============================================
-- User: test_user_3@example.com
-- Expected Results:
--   Income: $3,000
--   Expenses: $5,500
--   Net Balance: -$2,500
-- ============================================

-- INSERT INTO transactions (user_id, name, amount, type, account_type, category_id, date) VALUES
--     ('TEST_USER_3_ID', 'Part-time Job', 3000.00, 'Income', 'Checking', 1, '2024-02-01'),
--     ('TEST_USER_3_ID', 'Luxury Shopping', 3000.00, 'Expense', 'Credit Card', 8, '2024-02-05'),
--     ('TEST_USER_3_ID', 'Fancy Dinner', 800.00, 'Expense', 'Credit Card', 5, '2024-02-10'),
--     ('TEST_USER_3_ID', 'New Gadgets', 1200.00, 'Expense', 'Credit Card', 8, '2024-02-15'),
--     ('TEST_USER_3_ID', 'Weekend Trip', 500.00, 'Expense', 'Credit Card', 7, '2024-02-20');

-- ============================================
-- TEST SCENARIO 4: Empty User (No Transactions)
-- ============================================
-- User: test_user_4@example.com
-- Expected Results:
--   All KPIs: $0
--   Empty state messages shown
-- ============================================

-- Just create the user account, no transactions

-- ============================================
-- TEST SCENARIO 5: Category Distribution Test
-- ============================================
-- Creates transactions across many categories for pie chart testing
-- ============================================

-- INSERT INTO transactions (user_id, name, amount, type, account_type, category_id, date) VALUES
--     ('TEST_USER_ID', 'Category Test Income', 10000.00, 'Income', 'Checking', 1, '2024-02-01'),
--     ('TEST_USER_ID', 'Rent', 2000.00, 'Expense', 'Checking', 4, '2024-02-01'),
--     ('TEST_USER_ID', 'Food 1', 400.00, 'Expense', 'Credit Card', 5, '2024-02-05'),
--     ('TEST_USER_ID', 'Food 2', 350.00, 'Expense', 'Credit Card', 5, '2024-02-12'),
--     ('TEST_USER_ID', 'Transport 1', 100.00, 'Expense', 'Cash', 6, '2024-02-08'),
--     ('TEST_USER_ID', 'Transport 2', 120.00, 'Expense', 'Cash', 6, '2024-02-22'),
--     ('TEST_USER_ID', 'Entertainment 1', 200.00, 'Expense', 'Credit Card', 7, '2024-02-10'),
--     ('TEST_USER_ID', 'Entertainment 2', 150.00, 'Expense', 'Credit Card', 7, '2024-02-24'),
--     ('TEST_USER_ID', 'Shopping', 600.00, 'Expense', 'Credit Card', 8, '2024-02-15'),
--     ('TEST_USER_ID', 'Utilities', 300.00, 'Expense', 'Checking', 9, '2024-02-15'),
--     ('TEST_USER_ID', 'Health', 250.00, 'Expense', 'Cash', 10, '2024-02-20'),
--     ('TEST_USER_ID', 'Education', 500.00, 'Expense', 'Credit Card', 11, '2024-02-25);

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify test data was inserted correctly
-- ============================================

SELECT 
    'Income' as metric,
    COALESCE(SUM(amount), 0) as total
FROM transactions 
WHERE user_id = 'TEST_USER_ID' AND type = 'Income'

UNION ALL

SELECT 
    'Expenses' as metric,
    COALESCE(SUM(amount), 0) as total
FROM transactions 
WHERE user_id = 'TEST_USER_ID' AND type = 'Expense'

UNION ALL

SELECT 
    'Net Balance' as metric,
    COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END), 0) as total
FROM transactions 
WHERE user_id = 'TEST_USER_ID'

UNION ALL

SELECT 
    'Transaction Count' as metric,
    COUNT(*)::numeric as total
FROM transactions 
WHERE user_id = 'TEST_USER_ID';

-- ============================================
-- CATEGORY BREAKDOWN
-- ============================================

SELECT 
    c.name as category,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'TEST_USER_ID' AND t.type = 'Expense'
GROUP BY c.name
ORDER BY total_amount DESC;

-- ============================================
-- ACCOUNT BALANCE SUMMARY
-- ============================================

SELECT 
    account_type,
    current_balance as actual_balance,
    calculate_expected_balance('TEST_USER_ID', account_type) as expected_balance,
    current_balance - calculate_expected_balance('TEST_USER_ID', account_type) as difference
FROM account_balances
WHERE user_id = 'TEST_USER_ID'
ORDER BY account_type;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Test data inserted successfully! Replace TEST_USER_ID with your actual user ID.' as status;
