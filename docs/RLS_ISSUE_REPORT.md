# RLS Policy Violation - Issue Report

**Date**: 2025-12-15
**Error Code**: `42501` (PostgreSQL RLS Policy Violation)
**Impact**: ❌ Cannot create transactions - all INSERT operations blocked
**Status**: ✅ FIX APPLIED - Testing Required
**Fix Date**: 2026-01-03

---

## 🎯 FIX APPLIED (2026-01-03)

### Root Cause Identified

The `requesting_user_id()` SQL function was using `current_setting('request.jwt.claims')::json->>'sub'` which is designed for **Supabase-managed authentication only**. This function is **incompatible with third-party Clerk JWTs**.

According to Supabase documentation for third-party authentication providers (Clerk, Auth0, etc.), the correct approach is to use **`auth.jwt()->>'sub'`** to access JWT claims.

### Fix Applied

**File Updated**: `database/schema.sql` (lines 31-37)

**Previous Code** (Incompatible):
```sql
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;
```

**Updated Code** (Clerk Compatible):
```sql
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        (auth.jwt()->>'sub'),
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;
```

### Migration Instructions

**IMPORTANT**: You must run the database migration to apply this fix.

**Steps**:
1. Open **Supabase Dashboard** → **SQL Editor**
2. Open the migration file: `database/migrations/003_fix_clerk_jwt_compatibility.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run** to execute
6. Verify success message appears
7. Test transaction creation in your application

**Quick Migration**:
```bash
# The migration file is located at:
database/migrations/003_fix_clerk_jwt_compatibility.sql
```

### Expected Results After Migration

✅ **Transaction Creation**:
- Dashboard → Add Transaction → SUCCESS (no RLS error)
- Transactions Page → Add Transaction → SUCCESS
- Console shows successful insert, no error 42501

✅ **RLS Isolation**:
- User can only see their own transactions
- Other users' transactions remain hidden
- User ID correctly extracted from Clerk JWT

✅ **Console Logs**:
```
[SUPABASE CLIENT] Token retrieved: eyJhbGc...
[SUPABASE CLIENT] Authorization header set
[DEBUG] Attempting to insert transaction: {...}
[DEBUG] User ID: user_36KevOt62ID5qqHJkYXUTjf85Ao
✅ Transaction created successfully
```

### Testing Checklist

After running the migration, test the following:

- [ ] **Create Transaction from Dashboard**
  - Navigate to Dashboard
  - Click "Add Transaction" button
  - Fill in details and submit
  - Verify transaction appears in recent transactions list
  - Check console for success (no RLS errors)

- [ ] **Create Transaction from Transactions Page**
  - Navigate to Transactions page
  - Click "Add Transaction"
  - Fill in details and submit
  - Verify transaction appears in table
  - Check console for success

- [ ] **Update Existing Transaction**
  - Select any transaction
  - Edit details
  - Save changes
  - Verify update succeeds

- [ ] **Delete Transaction**
  - Select any transaction
  - Delete it
  - Verify deletion succeeds

- [ ] **Verify RLS Isolation** (if testing with multiple accounts)
  - Create transactions with User A
  - Sign in as User B
  - Verify User B cannot see User A's transactions

### Evidence

**Supabase Logs Confirmed** (from investigation):
- JWT being received: ✅
- JWT parsed correctly: ✅
- Claims present: `role: "authenticated"`, `subject: "user_36KevOt62ID5qqHJkYXUTjf85Ao"` ✅
- Issuer verified: `https://next-mullet-24.clerk.accounts.dev` ✅
- Previous function could not extract user ID from third-party JWT: ❌
- Updated function uses correct Supabase method for third-party auth: ✅

---

## Issue Summary (Original Report)

Transaction creation fails with RLS (Row Level Security) policy violation when attempting to insert data into the `transactions` table.

**Error Message**:
```
new row violates row-level security policy for table "transactions"
```

**User ID**: `user_36KevOt62ID5qqHJkYXUTjf85Ao`
**Location**: Dashboard → Add Transaction button

---

## Root Cause

Supabase RLS policies cannot validate the Clerk JWT token because **native Clerk integration is not configured**.

### Evidence

✅ **Working Components**:
- Clerk authentication (user is logged in)
- User ID correctly passed to transaction data
- Transaction data structure is valid
- Code correctly uses `useSupabaseClient()` hook
- `requesting_user_id()` function exists in database

❌ **Missing Configuration**:
- Supabase does not recognize Clerk as a valid JWT issuer
- JWT tokens sent but not validated by Supabase
- RLS policies cannot extract `user_id` from JWT `sub` claim

### Technical Flow

```
User Action → TransactionDialog
  → createTransaction hook
    → useSupabaseClient (includes Clerk token)
      → Supabase INSERT
        ❌ BLOCKED: RLS cannot validate JWT
          → Error 42501: RLS policy violation
```

---

## Required Configuration

### **Step 1: Supabase Dashboard**

**Location**: Supabase Dashboard → Your Project → Settings → Authentication

**Action**: Configure Clerk as JWT Issuer

**Settings Needed**:
1. Find **JWT Settings** or **Additional JWT Issuers** section
2. Add Clerk JWKS URL:
   ```
   https://[your-clerk-frontend-api].clerk.accounts.dev/.well-known/jwks.json
   ```

**To Find Clerk Frontend API**:
- Go to Clerk Dashboard → API Keys
- Look for "Frontend API" (e.g., `clerk.abc123.xyz.lcl.dev`)

---

### **Step 2: Clerk Dashboard**

**Location**: Clerk Dashboard → Configure → Sessions

**Action**: Add `role: "authenticated"` claim to session token

**Steps**:
1. Navigate to **Customize session token**
2. Add custom claim:
   ```json
   {
     "role": "authenticated"
   }
   ```
3. Save changes

---

### **Step 3: Refresh Session**

**Action**: Sign out and sign back in

**Reason**: New session token needs to include the `role` claim and be issued after Supabase configuration.

---

## Verification Steps

After configuration, test with these console commands:

### 1. Check Token Claims
```javascript
// In browser console when logged in
const token = await window.Clerk.session.getToken();
const claims = JSON.parse(atob(token.split('.')[1]));
console.log('Token Claims:', claims);
```

**Expected Claims**:
```json
{
  "sub": "user_36KevOt62ID5qqHJkYXUTjf85Ao",
  "iss": "https://your-app.clerk.accounts.dev",
  "role": "authenticated"
}
```

### 2. Test Transaction Creation
- Go to Dashboard → Add Transaction
- Fill in transaction details
- Submit

**Expected Logs** (browser console):
```
[SUPABASE CLIENT] Token retrieved: eyJhbGc...
[SUPABASE CLIENT] Authorization header set
[DEBUG] Attempting to insert transaction: {...}
[DEBUG] User ID: user_36KevOt62ID5qqHJkYXUTjf85Ao
✅ Transaction created successfully
```

---

## Current Logs Analysis

**Observed Behavior**:
```
[ERROR] Supabase insert failed
[ERROR] Error code: "42501"
[ERROR] Error message: "new row violates row-level security policy for table \"transactions\""
```

**Missing Logs**:
- No `[SUPABASE CLIENT]` logs visible
- Need to confirm token is being retrieved and sent

**Action Required**: Check browser console for `[SUPABASE CLIENT]` logs to verify token flow.

---

## Database Schema Verification

**RLS Policy** (`database/schema.sql:30-36`):
```sql
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
    )::TEXT;
$$ LANGUAGE SQL STABLE;
```

**Status**: ✅ Function is correct and extracts `sub` claim from JWT

**RLS Policies**: Applied to all tables, checking `requesting_user_id() = user_id`

**Issue**: Supabase cannot validate JWT to populate `request.jwt.claims`

---

## Transaction Data Inspection

**Submitted Data** (Validated ✅):
```json
{
  "user_id": "user_36KevOt62ID5qqHJkYXUTjf85Ao",
  "date": "2025-12-18",
  "amount": 35,
  "name": "Al Sultan Pty Ltd Enfield",
  "description": "asdadasdadasd",
  "type": "Expense",
  "account_type": "Cash",
  "category_id": 16,
  "recurring_frequency": "Never"
}
```

**All required fields present** ✅
**User ID format correct** ✅
**Data structure matches schema** ✅

**Problem**: Not a data issue - purely authentication/RLS configuration

---

## Impact Assessment

**Current State**:
- ❌ Cannot create transactions
- ❌ Cannot update transactions
- ❌ Cannot delete transactions
- ✅ Can read existing transactions (if any exist)
- ✅ Authentication works
- ✅ UI/UX functional

**Affected Features**:
1. Dashboard → Add Transaction (primary issue)
2. Transactions page → All CRUD operations
3. Recurring Transactions → All CRUD operations

**User Experience**: Complete blocking issue - no data can be modified

---

## Priority & Urgency

**Priority**: 🔴 **CRITICAL**
**Urgency**: 🔴 **IMMEDIATE**
**Reason**: Application is non-functional for its primary purpose (transaction management)

**Estimated Fix Time**: 10-15 minutes (configuration only, no code changes needed)

---

## Next Actions

### Immediate (User)
1. [ ] Configure Supabase JWT settings with Clerk JWKS URL
2. [ ] Add `role: "authenticated"` claim in Clerk session token
3. [ ] Sign out and sign back in
4. [ ] Test transaction creation
5. [ ] Report results (check for `[SUPABASE CLIENT]` logs)

### After Configuration (Development)
1. [ ] Verify RLS policies work correctly
2. [ ] Test all CRUD operations
3. [ ] Remove debug logging from production code
4. [ ] Update documentation with configuration steps
5. [ ] Run automated test suite

---

## Documentation References

- **Supabase Third-Party Auth**: https://supabase.com/docs/guides/auth/third-party/clerk
- **Clerk JWT Configuration**: https://clerk.com/docs/backend-requests/making/jwt-templates
- **RLS Debugging Guide**: See `CLAUDE.md:231-240`

---

## Support Information

**Code Locations**:
- Supabase Client: `utils/supabase/client.ts:40-75`
- Transaction Hook: `hooks/use-transactions.ts:139-168`
- RLS Function: `database/schema.sql:30-36`
- Error Logs: Browser console (Next.js dev server)

**Debug Logging**: Enhanced logging added to:
- `utils/supabase/client.ts` (token retrieval)
- `hooks/use-transactions.ts` (insert operation)

**Test Once Fixed**: See `TESTING_GUIDE.md` for comprehensive testing checklist

---

## Summary

**Issue**: RLS policy blocks all transaction inserts
**Cause**: Supabase cannot validate Clerk JWT tokens
**Fix**: Configure native Clerk integration in both Supabase and Clerk
**Time**: 10-15 minutes configuration
**Impact**: CRITICAL - blocks all data modification

**Status**: ⏳ Awaiting user configuration of Clerk + Supabase integration
