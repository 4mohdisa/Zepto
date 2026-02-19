# Clerk + Supabase Integration Troubleshooting Guide

## 🔥 Critical Issue Fixed

Your transactions were not saving because the `TransactionService` was using an **unauthenticated Supabase client**. The service was calling `createClient()` which creates a client without any Clerk JWT token, causing all RLS policies to reject the requests.

## ✅ Changes Made

### 1. Fixed `utils/supabase/client.ts`
- Updated `useSupabaseClient()` hook to use the modern `accessToken` option
- Added clear warnings about using `createClient()` (unauthenticated) vs `useSupabaseClient()` (authenticated)

### 2. Fixed `app/services/transaction-services.ts`
- Changed from singleton pattern to factory function `createTransactionService(supabaseClient)`
- Service now accepts an authenticated Supabase client via constructor
- All methods use the injected authenticated client

### 3. Updated `hooks/use-transactions.ts`
- Now creates transaction service with authenticated client: `createTransactionService(supabase)`
- Uses service for create/update/delete operations

### 4. Updated `hooks/use-recurring-transactions.ts`
- Same fix as use-transactions

### 5. Updated `hooks/use-categories.ts`
- Uses `useSupabaseClient()` hook properly
- Added better debug logging

### 6. Updated `database/schema.sql`
- Added `is_authenticated()` function to verify `role` claim
- Updated all RLS policies to use `is_authenticated()` AND `requesting_user_id()`
- Added comprehensive documentation comments

### 7. Added Debug Component (`components/debug/auth-debug.tsx`)
- Temporary component to verify authentication is working
- Shows token status, role claim, and Supabase connection test

## 🚀 Steps to Test

### Step 1: Apply Database Changes

Run the updated schema in Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Copy the contents of `database/schema.sql`
3. Run the SQL (this will drop and recreate tables - **WARNING: this deletes existing data!**)

If you want to preserve existing data, run only these specific changes:

```sql
-- Add the is_authenticated function
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role') = 'authenticated';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update policies to use is_authenticated()
-- Example for transactions table:
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_authenticated() 
        AND requesting_user_id() = user_id
    );

-- Do the same for other policies...
```

### Step 2: Verify Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your Application
2. Navigate to **Sessions** → **Customize session token**
3. Ensure you have added:
   ```json
   {
     "role": "authenticated"
   }
   ```
4. Click **Save**

### Step 3: Verify Supabase Third-Party Auth

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Navigate to **Authentication** → **Providers** → **Third-Party Auth**
3. Ensure Clerk is added with your Frontend API URL
4. The URL format is: `https://your-app.clerk.accounts.dev`

### Step 4: Test the Application

1. Start your dev server: `npm run dev`
2. Sign in to the application
3. You should see the **Auth Debug** panel in the bottom-right corner
4. Check the debug panel shows:
   - ✅ Token
   - ✅ Role Claim (authenticated)
   - Your User ID
5. Click **"Test Supabase Connection"** button
   - Should show: ✅ Success! Fetched X profile(s)
   - If it shows ❌ Error, check the error message

### Step 5: Create a Test Transaction

1. Go to Dashboard
2. Click "Add Transaction"
3. Fill in details and submit
4. Check the browser console for success/error messages
5. Verify in Supabase Table Editor that the transaction was created with your `user_id`

## 🔍 Common Issues & Solutions

### Issue 1: "Row Level Security policy violation" Error

**Cause**: The Clerk JWT token doesn't have the `role` claim, or Supabase Third-Party Auth is not configured.

**Solution**:
1. Check Clerk Dashboard → Sessions → Customize session token
2. Verify `"role": "authenticated"` is present
3. Check Supabase Dashboard → Auth → Providers → Third-Party Auth is enabled

### Issue 2: "Invalid API key" or "JWT expired" Error

**Cause**: Using wrong Supabase credentials or token expired.

**Solution**:
1. Verify `.env.local` has correct values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Sign out and sign back in to get fresh token

### Issue 3: Empty Error (no message) on Transaction Create

**Cause**: This was the original bug - using unauthenticated client.

**Solution**: Should be fixed now with the updated code. If still happening:
1. Ensure you're using `useSupabaseClient()` hook
2. Check browser console for "❌ Supabase error" messages
3. Verify `transactionService` is created with authenticated client

### Issue 4: Profile Not Found Error

**Cause**: Clerk webhook not syncing user to Supabase profiles table.

**Solution**:
1. Check webhook is configured in Clerk Dashboard
2. Verify `CLERK_WEBHOOK_SECRET` is set in environment
3. Check webhook logs in Clerk Dashboard for errors
4. Manually create profile in Supabase if needed:
   ```sql
   INSERT INTO profiles (id, email, name, created_at, updated_at)
   VALUES ('your-clerk-user-id', 'your@email.com', 'Your Name', NOW(), NOW());
   ```

## 🧪 Debug Commands

Run these in Supabase SQL Editor to verify your setup:

```sql
-- Test 1: Check if is_authenticated function works
SELECT is_authenticated();

-- Test 2: Check requesting_user_id function
SELECT requesting_user_id();

-- Test 3: Check auth.jwt() output (run as authenticated user)
SELECT auth.jwt();

-- Test 4: List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- Test 5: Check if user can insert (simulated)
-- Replace 'your-user-id' with actual Clerk user ID
SELECT 
    is_authenticated() as is_auth,
    requesting_user_id() as user_id,
    is_authenticated() AND requesting_user_id() = 'your-user-id' as can_insert;
```

## 📋 Checklist Before Testing

- [ ] Clerk Dashboard: Session token has `"role": "authenticated"` claim
- [ ] Supabase Dashboard: Third-Party Auth enabled for Clerk
- [ ] Supabase SQL Editor: Ran updated schema or migration
- [ ] Environment variables: All Supabase and Clerk keys configured
- [ ] Code: Pulled latest changes with fixed hooks and services
- [ ] Browser: Hard refresh (Ctrl+F5 or Cmd+Shift+R) to clear cache
- [ ] User: Signed out and back in to get fresh token with role claim

## 🚨 Important Notes

1. **The `role` claim is CRITICAL**: Without it, Supabase RLS policies with `TO authenticated` will reject all requests.

2. **Always use `useSupabaseClient()`**: Never use `createClient()` for authenticated operations.

3. **Token changes take effect on next sign-in**: After changing Clerk session token config, users must sign out and back in.

4. **Debug component is temporary**: Remove `<AuthDebug />` from dashboard/page.tsx before deploying to production.

5. **Database changes may need manual migration**: If you have existing data, don't run the full schema.sql. Instead, apply specific changes manually.

## 🎯 Success Indicators

You'll know it's working when:
- ✅ Auth Debug panel shows "✅ Token" and "✅ Role Claim"
- ✅ "Test Supabase Connection" button shows success
- ✅ Creating a transaction shows "Transaction created successfully" toast
- ✅ Transaction appears in Supabase Table Editor with correct `user_id`
- ✅ Only your transactions are visible (RLS working)

## 📞 Still Having Issues?

If you've followed all steps and still have problems:

1. Check browser console for detailed error messages
2. Check Supabase Dashboard → Logs → Auth for RLS violations
3. Check Clerk Dashboard → Logs → Webhooks for sync issues
4. Take a screenshot of the Auth Debug panel and share it
5. Check network tab in DevTools for failed requests and their error codes

## 🧹 Cleanup (After Everything Works)

Once you've confirmed everything is working:

1. Remove the debug component from dashboard:
   ```tsx
   // Remove this line from app/(dashboard)/dashboard/page.tsx
   import { AuthDebug } from '@/components/debug/auth-debug'
   
   // Remove this line from the JSX
   <AuthDebug />
   ```

2. Delete the debug component if desired:
   ```bash
   rm -rf components/debug/
   ```

3. Commit your changes:
   ```bash
   git add .
   git commit -m "Fix Clerk + Supabase authentication integration"
   ```
