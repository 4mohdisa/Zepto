# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Next.js development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

Tests are located in `tests/` directory and use Jest with React Testing Library.

## Architecture Overview

### Authentication & Database Integration

This app uses **Clerk for authentication** and **Supabase for database storage**. The integration uses Clerk's native third-party auth with Supabase:

1. **Clerk Native Integration**: Uses Clerk session tokens directly (no JWT template required)
2. **RLS (Row Level Security)**: Supabase uses `requesting_user_id()` function to extract Clerk user ID from JWT `sub` claim
3. **User ID Format**: Clerk user IDs are TEXT type (e.g., `user_2abc123xyz`), not UUID

**Critical Pattern**: Always use `useSupabaseClient()` hook for authenticated queries:

```tsx
import { useSupabaseClient } from '@/utils/supabase/client'

const supabase = useSupabaseClient() // Automatically includes Clerk auth token
const { data } = await supabase.from('transactions').select()
```

### Data Flow Architecture

The app follows a layered architecture:

**Layer 1: UI Components** (`app/(dashboard)/*/page.tsx`)
- Dashboard pages are client components (`'use client'`)
- Manage UI state and dialog visibility
- Delegate business logic to hooks

**Layer 2: Custom Hooks** (`hooks/`, `app/(dashboard)/*/_hooks/`)
- `use-transactions.ts` - Main transaction CRUD with optimistic updates
- `use-recurring-transactions.ts` - Recurring transaction management
- Page-specific hooks (e.g., `use-dashboard-data.ts`) - Data transformation for UI

**Layer 3: Service Layer** (`app/services/`)
- `transaction-services.ts` - Core business logic (singleton `transactionService`)
- `transaction-builders.ts` - Data transformation utilities
- Handles all Supabase queries and validation

**Layer 4: Database** (Supabase PostgreSQL)
- See `database/schema.sql` for complete schema
- Tables: `profiles`, `categories`, `transactions`, `recurring_transactions`

### Key Data Patterns

**Transaction Lifecycle**:
1. User submits form → `TransactionDialog` component
2. Dialog calls hook function (e.g., `createTransaction`)
3. Hook performs optimistic update + calls Supabase
4. Supabase validates via RLS policies using Clerk user ID
5. Hook updates state with real data on success or reverts on error

**Recurring Transactions**:
- Stored in `recurring_transactions` table with frequency rules
- **NOT** pre-generated - calculated on-demand for performance
- `predictUpcomingTransactions()` generates predictions in-memory
- `generateDueTransactions()` creates actual transactions when due

### Route Groups & Layouts

The app uses Next.js 15 App Router with route groups:

- `app/(dashboard)/` - Protected routes (requires Clerk auth)
  - `dashboard/` - Main dashboard with financial overview
  - `transactions/` - Transaction management table
  - `recurring-transactions/` - Recurring transaction management

- `app/(marketing)/` - Public routes
  - `help/`, `privacy/`, `terms/`, `security/`

- `app/sign-in/`, `app/sign-up/` - Clerk authentication pages

### Component Organization

**Page-Level Components**: Co-located with pages in `_components/` subdirectories
```
app/(dashboard)/dashboard/
├── _components/        # Dashboard-specific components
│   ├── welcome-banner.tsx
│   ├── stats-overview.tsx
│   └── index.ts       # Barrel export
├── _hooks/            # Dashboard-specific hooks
│   ├── use-dashboard-data.ts
│   └── index.ts
└── page.tsx           # Main dashboard page
```

**Shared Components**: Organized by domain in `components/app/`
```
components/
├── app/
│   ├── charts/        # Recharts visualization components
│   ├── dialogs/       # Modal dialogs (Balance, Upload)
│   ├── layout/        # AppSidebar, TopNav
│   ├── shared/        # Reusable form fields, LoadingState
│   └── transactions/  # Transaction table, columns, dialogs
└── ui/                # Shadcn/Radix UI primitives
```

### State Management

**No global state library** - uses React hooks and context:

- `context/auth-context.tsx` - Wraps Clerk's `useAuth()` and `useUser()`
- `context/cache-context.tsx` - Category caching to reduce DB queries
- Local state with `useState` for UI
- Optimistic updates in hooks (update UI immediately, rollback on error)

### Type System

All transaction types defined in `app/types/transaction.ts`:

```typescript
// Core types
Transaction, RecurringTransaction
TransactionType: 'Income' | 'Expense'
AccountType: 'Cash' | 'Checking' | 'Credit Card' | 'Savings'
FrequencyType: 'Never' | 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly' | 'Annually'

// Form types
TransactionFormData, RecurringTransactionFormData

// Update types (Partial with required fields)
UpdateTransaction, UpdateRecurringTransaction
```

### Date Handling

Uses `date-fns` for all date operations:

- **Storage Format**: ISO date strings (`YYYY-MM-DD`)
- **Display Format**: Localized via `date-fns/format`
- **Frequency Calculations**: `utils/frequency-utils.ts`
  - `getNextDates()` - Calculate future occurrence dates
  - `getMostRecentDueDate()` - Find last due date
  - `formatDateToISO()` - Consistent date formatting

### Form Validation

Uses `react-hook-form` + `zod` for all forms:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().positive(),
  name: z.string().min(1),
  // ...
})

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ }
})
```

## Environment Variables

Required variables (create `.env.local` from README):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Clerk Webhook (for user sync)
CLERK_WEBHOOK_SECRET=
```

## Database Schema

**Critical Tables**:

1. **profiles** - Linked to Clerk users via TEXT id
   - `id TEXT PRIMARY KEY` (Clerk user ID)
   - Synced via Clerk webhook (`app/api/webhooks/clerk/route.ts`)

2. **transactions** - All financial transactions
   - Has `recurring_frequency` field but NOT a recurring template
   - `category_id` is nullable (defaults to 1)
   - `category_name` is denormalized for performance

3. **recurring_transactions** - Recurring transaction templates
   - Uses `frequency` field for schedule type
   - `start_date` and optional `end_date`
   - Does NOT store generated transactions

4. **categories** - Transaction categories
   - Can be user-specific or default (shared)
   - `is_default` flag for system categories

All tables have RLS policies that validate `requesting_user_id() = user_id`.

## Common Patterns

### Adding a New Transaction Feature

1. Add types to `app/types/transaction.ts`
2. Update database schema in `database/schema.sql`
3. Add service method to `app/services/transaction-services.ts`
4. Create/update hook in `hooks/use-transactions.ts`
5. Update UI component in `components/app/transactions/`
6. Add tests in `tests/`

### Debugging RLS Issues

If you see empty errors or authentication failures:

1. Check that `useSupabaseClient()` is used (not `createClient()`)
2. Verify Clerk session token is present in browser DevTools → Network → Authorization header
3. Check Supabase logs for RLS policy violations
4. Ensure `requesting_user_id()` function exists in database
5. Verify user profile exists in `profiles` table (created via webhook)

### Optimistic Updates Pattern

All CRUD hooks follow this pattern:

```tsx
const updateTransaction = async (id, data) => {
  // 1. Optimistic update
  setTransactions(prev => prev.map(t => t.id === id ? {...t, ...data} : t))

  try {
    // 2. Actual update
    await supabase.from('transactions').update(data).eq('id', id)
    toast.success('Updated')
  } catch (err) {
    // 3. Rollback on error
    refresh() // Re-fetch from server
    toast.error('Failed')
    throw err
  }
}
```

## Performance Considerations

- **Category Caching**: Categories cached in `CacheContext` to avoid repeated queries
- **Optimistic Updates**: UI updates immediately for better UX
- **Date Range Filtering**: Dashboard defaults to current month to limit data
- **Polling**: Transactions auto-refresh every 30 seconds (see `use-transactions.ts:86`)
- **In-Memory Predictions**: Recurring predictions calculated client-side, not stored

## Testing Strategy

- **Unit Tests**: Service layer functions, utility functions
- **Component Tests**: React components with `@testing-library/react`
- **Integration Tests**: Full user flows (form submission, CRUD operations)
- Use `jest.setup.js` for global test configuration
- Mock Supabase client and Clerk hooks in tests
