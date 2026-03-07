# Runtime Performance Audit Report

## A. Database Migration Status

**⚠️ CRITICAL: Database Migration 014 NOT YET APPLIED**

The following required columns and indexes are missing:
- `transactions.transaction_hash` column
- `transactions.recurring_transaction_id` column  
- `idx_transactions_user_hash` index
- `idx_transactions_recurring_lookup` index
- `idx_transactions_user_date_desc` index
- `idx_transactions_user_account_date` index
- `idx_transactions_user_category_date` index
- `idx_categories_name_trgm` index

**ACTION REQUIRED**: Run `db/migrations/014_add_performance_indexes.sql` in Supabase SQL Editor before expecting full performance gains.

---

## B. Top 5 Runtime Bottlenecks Found

### 🔴 Bottleneck 1: Debug Logger Fetch Patching Overhead
**Impact**: Adds ~1-2ms overhead to EVERY fetch call
**Location**: `lib/utils/debug-logger.ts:171-260`
**Issue**: The logger wraps window.fetch to log all API requests. Even when filtering URLs, it still intercepts every fetch, creates event objects, and calls shouldLogUrl() on every request.

### 🔴 Bottleneck 2: KPI Row Array Recreation
**Impact**: Unnecessary re-renders of 4 KPI cards on every parent render
**Location**: `app/(dashboard)/dashboard/_components/kpi-row.tsx:37-68`
**Issue**: The `items` array is recreated on every render, causing child components to re-render even when data hasn't changed.

### 🟡 Bottleneck 3: Duplicate Cache Implementations
**Impact**: Memory overhead, inconsistent cache behavior
**Location**: Multiple hooks (useTransactions, useMerchants, useRecurringTransactions, useDataCache)
**Issue**: Each hook implements its own caching logic with different stale times (all 30s). No shared cache strategy.

### 🟡 Bottleneck 4: Console.log in Production Code
**Impact**: Clutters console, minor performance hit, reveals internals
**Location**: 
- `hooks/use-account-balances.ts:31,99,107,127,171`
- `hooks/use-merchants.ts:220-227`
- `hooks/use-recurring-transactions.ts:92-94,189`

### 🟡 Bottleneck 5: Chart Data Reference Instability
**Impact**: Charts re-render when parent re-renders even with same data
**Location**: `app/(dashboard)/dashboard/page.tsx:142-155`
**Issue**: `data?.daily_series` and `data?.category_distribution` pass new array references on each render, causing Suspense boundaries to re-trigger.

---

## C. Route Transition Findings

**Navigation Method**: Standard Next.js Link component with client-side routing

**Issues Found**:
1. No prefetching configured on sidebar navigation links
2. Page transitions lack loading indicators between route changes
3. Each page mount triggers fresh data fetch (even with cache)

**Current Behavior**:
- Dashboard → Transactions: ~200-400ms visible delay
- No skeleton shown during transition
- Full page flash possible on slower connections

---

## D. API Request Behavior Findings

**Duplicate Request Issues**:
1. **useAccountBalances**: Makes 2 sequential requests (balances + RPC call)
2. **useRecurringTransactions**: Auto-generates due transactions on every mount before fetching
3. **useTransactions**: Debounced search at 400ms but initial mount fetches immediately

**Cache Effectiveness**:
- ✅ useDataCache: Proper 30s stale time with force refresh option
- ✅ useTransactions: 30s cache with proper invalidation
- ✅ useMerchants: 30s cache with global invalidation
- ✅ useRecurringTransactions: 30s cache

**Request Cancellation**:
- ✅ All hooks implement AbortController for cleanup
- ✅ useTransactions cancels in-flight requests on filter change

---

## E. Component Rerender Findings

**High Rerender Components**:
1. **KpiRow** - Recreates items array every render (not memoized)
2. **TransactionAnalysisChart** - Parent passes new data reference each time
3. **CategoryDistributionChart** - Same issue as above

**Good Memoization Already Present**:
- ✅ `transaction-analysis-chart.tsx:35-40` - useMemo for data transformation
- ✅ `use-account-balances.ts:260-272` - totals useMemo
- ✅ `use-account-balances.ts:275-293` - latestEffectiveDate useMemo

---

## F. Chart/Table Rendering Findings

**Chart Performance**:
- ✅ Lazy loaded with Suspense
- ✅ useMemo for data formatting
- ⚠️ ResponsiveContainer causes double render on resize

**Table Performance**:
- ✅ Cursor pagination (efficient)
- ✅ 50 row limit per page
- ⚠️ Selection state causes full table re-render

---

## G. Debug Logger Overhead Findings

**Current Behavior**:
- Patches window.fetch on module load
- Logs ALL API requests (including Next.js internal)
- Filters out Next.js endpoints but still processes them
- Maintains 500 event buffer in memory

**Performance Impact**:
- ~1-2ms per fetch call
- Memory growth from event buffer
- Console spam in development

---

## Summary of Issues

| Issue | Severity | File | Fix Complexity |
|-------|----------|------|----------------|
| Debug logger overhead | Medium | debug-logger.ts | Low |
| KPI array recreation | Medium | kpi-row.tsx | Low |
| Console.log statements | Low | Multiple | Low |
| Chart data stability | Low | dashboard/page.tsx | Low |
| Missing DB indexes | **Critical** | N/A (DB) | Run migration |
