# Database Migration Guide

## ⚠️ IMPORTANT: DO NOT RUN THE FULL schema.sql FILE!

Running the full `schema.sql` file will **DELETE ALL YOUR DATA** because it contains `DROP TABLE` statements at the top.

## ✅ How to Add the Balance Table (Safe Method)

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to the **SQL Editor** (left sidebar)

### Step 2: Run the Migration
1. Click **"New Query"**
2. Copy the contents of `migration_add_balance_table.sql`
3. Paste it into the SQL Editor
4. Click **"Run"**

### Step 3: Verify
Run this query to check if the table was created:
```sql
SELECT * FROM account_balances LIMIT 1;
```

If you see column names (id, user_id, account_type, etc.), it worked!

## What This Migration Adds

1. **`account_balances` table** - Stores your actual bank account balances
2. **`calculate_expected_balance()`** - Function that calculates what your balance should be based on transactions
3. **`get_balance_summary()`** - Function that compares expected vs actual balances
4. **RLS Policies** - Security rules so users can only see their own balances

## Troubleshooting

### "relation 'account_balances' already exists"
This means the table already exists. You can skip this migration.

### "permission denied"
Make sure you're running this as the project owner or have admin privileges.

### RLS Policy errors
If you get errors about `is_authenticated()` function, make sure your existing schema has that function defined (it should be in your original schema.sql).

## After Running the Migration

Your app will automatically work with the new balance features. The `useAccountBalances` hook will:
- Fetch balances from the new table
- Calculate expected balances from transactions
- Show differences between expected and actual
