# Zepto Codebase Refactoring Report

Generated: November 30, 2025

---

## Executive Summary

After analyzing the codebase, I've identified several areas with duplicate code, inconsistent patterns, and opportunities for consolidation. This report outlines specific issues and recommended fixes.

---

## 1. Duplicate `formatCurrency` Functions

### Issue
The `formatCurrency` function is defined in **3 different places**:

| Location | Implementation |
|----------|----------------|
| `utils/format.ts` | ✅ Proper utility (should be the single source) |
| `components/app/transactions/_columns/transaction-columns.tsx` | ❌ Local duplicate |
| `components/app/charts/line-chart.tsx` | ❌ Local duplicate |

### Current Duplicates

```typescript
// In transaction-columns.tsx (line 33-38)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// In line-chart.tsx (line 82-84)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
```

### Recommendation
**Delete local implementations** and import from `@/utils/format`:

```typescript
import { formatCurrency } from '@/utils/format'
```

**Files to update:**
- `components/app/transactions/_columns/transaction-columns.tsx`
- `components/app/charts/line-chart.tsx`

---

## 2. Duplicate Date Formatting Logic

### Issue
Date formatting is done inconsistently across the codebase:

| Pattern | Occurrences |
|---------|-------------|
| `new Date().toISOString().split('T')[0]` | 15+ times |
| `formatDateToISO()` from frequency-utils | Used in services |
| `format(date, 'yyyy-MM-dd')` from date-fns | Used in some components |

### Current Problem Areas

```typescript
// In hooks/use-transactions.ts (multiple occurrences)
data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date

// In hooks/use-recurring-transactions.ts
data.start_date instanceof Date ? data.start_date.toISOString() : data.start_date
```

### Recommendation
**Consolidate all date formatting** to use `formatDateToISO` from `@/utils/frequency-utils`:

```typescript
import { formatDateToISO } from '@/utils/frequency-utils'

// Instead of:
data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date

// Use:
formatDateToISO(data.date)
```

**Files to update:**
- `hooks/use-transactions.ts`
- `hooks/use-recurring-transactions.ts`
- `components/app/transactions/hooks/use-transaction-submit.ts`
- `components/app/transactions/hooks/use-recurring-transaction-submit.ts`

---

## 3. Duplicate Timestamp Generation

### Issue
`new Date().toISOString()` is called repeatedly for `created_at` and `updated_at` fields.

### Current Pattern (repeated 20+ times)

```typescript
{
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

### Recommendation
**Add a helper function** to `utils/format.ts`:

```typescript
/**
 * Returns current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Returns timestamp fields for database records
 */
export function getTimestampFields(isNew: boolean = true) {
  const now = getCurrentTimestamp()
  return isNew 
    ? { created_at: now, updated_at: now }
    : { updated_at: now }
}
```

---

## 4. Duplicate Prediction Logic

### Issue
There are **TWO** implementations for predicting upcoming transactions:

| File | Purpose |
|------|---------|
| `utils/predict-transactions.ts` | Standalone utility |
| `app/services/transaction-services.ts` | Service method using `transaction-builders.ts` |

Both do similar things but with different approaches.

### Recommendation
**Keep only `utils/predict-transactions.ts`** and update it to use `frequency-utils.ts` for date calculations. Remove the duplicate logic from `transaction-services.ts`.

The `predictUpcomingTransactions` in the service should simply call the utility:

```typescript
import { predictUpcomingTransactions } from '@/utils/predict-transactions'

// In TransactionService class
async predictUpcomingTransactions(userId, recurringTransactions, count = 2) {
  const transactions = recurringTransactions || await this.getRecurringTransactions(userId)
  return predictUpcomingTransactions(transactions, count)
}
```

---

## 5. Inconsistent Frequency Handling

### Issue
Frequency values are handled inconsistently:

| Location | Format Used |
|----------|-------------|
| `frequency-utils.ts` | `'Daily'`, `'Weekly'`, `'Monthly'` (PascalCase) |
| `predict-transactions.ts` | `'daily'`, `'weekly'`, `'monthly'` (lowercase) |
| Database/Forms | Mixed |

### Current Problem

```typescript
// In frequency-utils.ts
case 'Daily':
case 'daily':  // Has to handle both!

// In predict-transactions.ts
case 'daily':
case 'weekly':
```

### Recommendation
**Standardize on PascalCase** (matches the database enum) and update `predict-transactions.ts` to use the existing `advanceDateByFrequency` from `frequency-utils.ts`:

```typescript
import { advanceDateByFrequency, normalizeDate } from '@/utils/frequency-utils'

// Replace the switch statements with:
nextDate = advanceDateByFrequency(nextDate, rt.frequency)
```

---

## 6. Transaction Interface Duplication

### Issue
The `Transaction` interface is defined in `app/types/transaction.ts`, but some components define their own local interfaces:

| File | Local Interface |
|------|-----------------|
| `components/app/dashboard/metrics-cards.tsx` | `interface Transaction` |
| `components/app/charts/line-chart.tsx` | `interface Transaction` |

### Recommendation
**Import from the central type file**:

```typescript
import { Transaction } from '@/app/types/transaction'
```

---

## 7. Empty State Component Duplication

### Issue
The empty state UI is duplicated in multiple table components:

```tsx
// Repeated in table.tsx and upcoming-table.tsx
<div className="flex flex-col items-center justify-center h-full">
  <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center" 
       style={{ background: 'linear-gradient(135deg, rgba(76, 126, 243, 0.1) 0%, rgba(109, 76, 255, 0.1) 100%)' }}>
    <CreditCard className="h-8 w-8 text-primary" />
  </div>
  <p className="text-muted-foreground font-medium">No transactions yet</p>
</div>
```

### Recommendation
**Create a reusable `EmptyState` component**:

```typescript
// components/app/shared/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
}

export function EmptyState({ 
  icon: Icon = CreditCard, 
  title = "No data yet",
  description 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center gradient-primary-bg">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <p className="text-muted-foreground font-medium">{title}</p>
      {description && <p className="text-muted-foreground/70 text-sm mt-1">{description}</p>}
    </div>
  )
}
```

---

## 8. Loading State Duplication

### Issue
Loading spinners are implemented similarly across components:

```tsx
// Repeated pattern
<Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
<p className="text-muted-foreground">Loading...</p>
```

### Recommendation
**Create a reusable `LoadingState` component**:

```typescript
// components/app/shared/loading-state.tsx
interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
```

---

## 9. Supabase Client Creation

### Issue
`createClient()` is called in multiple places, creating new instances each time.

### Files Creating Clients
- `hooks/use-transactions.ts`
- `hooks/use-recurring-transactions.ts`
- `hooks/use-categories.ts`
- `app/services/transaction-services.ts`
- Multiple page components

### Recommendation
This is actually **correct behavior** for Supabase SSR - each component should create its own client. However, the service class (`TransactionService`) creates a client at class instantiation which could be problematic.

**Consider making the service methods accept a client parameter** or use a singleton pattern for client-side usage.

---

## 10. Unused Code to Remove

### Files/Code to Delete

| Item | Reason |
|------|--------|
| `utils/predict-transactions.ts` duplicate logic | Consolidate with frequency-utils |
| `transaction-services.ts` - `createCombinedTransaction` | Duplicates `createTransaction` logic |
| Local `formatCurrency` functions | Use centralized utility |
| Local `Transaction` interfaces | Use centralized type |

---

## Priority Action Items

### High Priority (Do First)

1. **Consolidate `formatCurrency`** - Remove duplicates from `transaction-columns.tsx` and `line-chart.tsx`
2. **Standardize date formatting** - Use `formatDateToISO` everywhere
3. **Add timestamp helpers** to `utils/format.ts`

### Medium Priority

4. **Create `EmptyState` component**
5. **Create `LoadingState` component**
6. **Consolidate prediction logic** - Update `predict-transactions.ts` to use `frequency-utils.ts`

### Low Priority

7. **Remove unused code** from `transaction-services.ts`
8. **Standardize frequency case** across the codebase
9. **Clean up local interfaces**

---

## Implementation Checklist

- [x] Remove `formatCurrency` from `transaction-columns.tsx` ✅ DONE
- [x] Remove `formatCurrency` from `line-chart.tsx` ✅ DONE
- [x] Add `getCurrentTimestamp` and `getTimestampFields` to `utils/format.ts` ✅ DONE
- [ ] Update `hooks/use-transactions.ts` to use `formatDateToISO`
- [ ] Update `hooks/use-recurring-transactions.ts` to use `formatDateToISO`
- [x] Create `components/app/shared/empty-state.tsx` ✅ DONE
- [x] Create `components/app/shared/loading-state.tsx` ✅ DONE
- [x] Update `predict-transactions.ts` to use `advanceDateByFrequency` ✅ DONE
- [ ] Remove local `Transaction` interfaces from chart components
- [ ] Review and clean up `transaction-services.ts`

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Duplicate functions | 5+ | 0 |
| Lines of duplicate code | ~150 | ~0 |
| Shared components | 4 | 6 |
| Utility functions | 8 | 12 |

This refactoring will improve maintainability, reduce bugs from inconsistent implementations, and make future changes easier.
