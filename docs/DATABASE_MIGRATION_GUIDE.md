# Database Migration Guide - Fix user_id Type

## 🔴 Problem

Your Supabase database has `UUID` type for `user_id` columns, but Clerk provides string IDs like `user_37jcHPfWyq0mk0UIg4WjGImokH1`.

This causes the error:
```
invalid input syntax for type uuid: "user_37jcHPfWyq0mk0UIg4WjGImokH1" (Code: 22P02)
```

## ✅ Solution

Run a migration to change the column types from UUID to TEXT.

---

## 🚀 Quick Fix (If You Have No Data)

If you don't mind losing existing data, the easiest fix is to reset the database:

1. Go to Supabase Dashboard → SQL Editor
2. Run the full schema: `database/schema.sql`
3. This will drop all tables and recreate them with TEXT types

---

## 🔄 Migration Fix (Preserves Data)

If you have existing data you want to keep:

### Step 1: Check Current Schema

Run this in Supabase SQL Editor to see current types:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;
```

### Step 2: Run the Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Drop foreign key constraints temporarily
ALTER TABLE IF EXISTS categories 
    DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

ALTER TABLE IF EXISTS transactions 
    DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE IF EXISTS recurring_transactions 
    DROP CONSTRAINT IF EXISTS recurring_transactions_user_id_fkey;

-- Change column types from UUID to TEXT
ALTER TABLE IF EXISTS profiles 
    ALTER COLUMN id TYPE TEXT;

ALTER TABLE IF EXISTS categories 
    ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE IF EXISTS transactions 
    ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE IF EXISTS recurring_transactions 
    ALTER COLUMN user_id TYPE TEXT;

-- Recreate foreign key constraints
ALTER TABLE IF EXISTS categories 
    ADD CONSTRAINT categories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS transactions 
    ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS recurring_transactions 
    ADD CONSTRAINT recurring_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update the function
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(auth.uid()::TEXT, '');
$$ LANGUAGE SQL STABLE;
```

### Step 3: Verify

Run this to verify the changes:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'transactions', 'recurring_transactions', 'categories')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;
```

You should see `text` for all user_id columns.

---

## ⚠️ Important Notes

### If You Have Existing Data

The migration above will fail if:
1. You have existing UUID values in user_id columns
2. Those UUIDs don't match Clerk user IDs

**Options:**

1. **Export and reimport data** with proper string IDs
2. **Start fresh** by dropping tables and recreating
3. **Use a conversion script** to map old UUIDs to new Clerk IDs

### For New Projects

The schema in `database/schema.sql` is already correct. Just run it on a fresh database.

---

## 🧪 Test After Migration

1. Go back to http://localhost:3000
2. Click "Test Supabase Connection" in the Auth Debug panel
3. Should now show: ✅ Success!

---

## 📁 Files Updated

| File | Change |
|------|--------|
| `database.types.ts` | Changed `user_id: number` to `user_id: string` |
| `database/migrations/008_fix_user_id_type_to_text.sql` | Migration script created |

---

## 🔍 Why This Happened

The database was likely created with UUID types before the Clerk integration was set up. Clerk uses string IDs like `user_xxxxx`, not UUIDs like `550e8400-e29b-41d4-a716-446655440000`.

The schema in the codebase has always specified TEXT type, but the actual database had UUID type.

---

Run the migration SQL in your Supabase SQL Editor and the error will be fixed! 🎉
