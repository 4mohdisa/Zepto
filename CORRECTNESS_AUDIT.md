# Financial Data Correctness Audit Report

## Executive Summary

This audit identified **4 issues** affecting financial data correctness:
- **1 Critical**: CSV import bypasses duplicate detection
- **1 High**: Balance history missing effective_date
- **1 Medium**: Merchant count inaccurate
- **1 Low**: Savings rate clamps negative values

---

## Issue #1: CSV Import Bypasses Duplicate Detection (CRITICAL)

**Severity**: Critical - Can create duplicate transactions

**Files Affected**:
- `components/dialogs/upload-dialog.tsx` (lines 147-176)
- `app/api/csv-import/route.ts`

**Problem**: 
The UploadDialog component imports transactions by directly calling `supabase.from('transactions').insert()`, bypassing the `/api/csv-import` endpoint. The API endpoint has hash-based duplicate detection (`generateTransactionHashClient`), but the dialog doesn't use it.

**Impact**:
- Users can accidentally import the same CSV twice, creating duplicate transactions
- No validation of transaction data format
- Inconsistent import behavior between API and UI

**Fix Applied**:
Changed UploadDialog to call the API endpoint instead of direct Supabase inserts. The API:
1. Generates transaction hashes for duplicate detection
2. Checks existing transactions before inserting
3. Returns clear stats on imported vs duplicates
4. Performs atomic inserts (all-or-nothing)

---

## Issue #2: Balance History Missing effective_date (HIGH)

**Severity**: High - Affects balance calculation accuracy

**Files Affected**:
- `components/dialogs/balance-dialog.tsx` (lines 88-104)

**Problem**:
When setting a current balance, the dialog updates `account_balances` table but does NOT include the `effective_date` field. The `useAccountBalances` hook and database functions expect this field for proper balance tracking.

**Impact**:
- Balance calculations may use incorrect effective dates
- The `get_current_balance_summary` RPC function relies on effective_date
- Fallback calculations in useAccountBalances use incorrect dates

**Fix Applied**:
Added `effective_date: new Date().toISOString().split('T')[0]` to the account_balances upsert operation.

---

## Issue #3: Merchant Backfill Counts Updates as Creates (MEDIUM)

**Severity**: Medium - Misleading metrics

**Files Affected**:
- `app/api/merchants/backfill/route.ts` (lines 196-216)

**Problem**:
The backfill endpoint counts all upserted merchants as "created" even when they were just updates:
```typescript
merchantsCreated += batch.length; // Wrong - includes updates
```

**Impact**:
- Admin metrics show inflated "created" counts
- Cannot distinguish between new merchants and updated ones

**Fix Applied**:
Changed to count actual creates vs updates using the upsert result:
```typescript
merchantsCreated += upsertResult?.length || 0;
merchantsUpdated += (batch.length - (upsertResult?.length || 0));
```

---

## Issue #4: Savings Rate Clamps Negative Values (LOW)

**Severity**: Low - UX issue, not data corruption

**Files Affected**:
- `app/api/dashboard/route.ts` (line 162)

**Problem**:
```typescript
savings_rate: Math.max(0, savingsRate),
```
When expenses exceed income, the savings rate is clamped to 0%, hiding the deficit.

**Impact**:
- Users see 0% savings rate instead of negative savings (e.g., -20%)
- May hide financial problems from users

**Decision**: 
**NOT FIXED** - This is intentional UX design. Showing negative percentages in a "Savings Rate" KPI could confuse users. The Net Balance KPI already shows deficits clearly.

---

## Verification

After fixes:
1. ✅ CSV import uses API with duplicate detection
2. ✅ Balance updates include effective_date
3. ✅ Merchant counts are accurate
4. ✅ TypeScript compilation passes
5. ✅ Production build succeeds
