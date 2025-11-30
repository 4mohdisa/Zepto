# Zepto Project Structure

Updated: November 30, 2025

---

## Directory Overview

```
zepto/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard page
│   │   ├── transactions/         # Transactions page
│   │   ├── recurring-transactions/  # Recurring transactions page
│   │   └── layout.tsx            # Dashboard layout (sidebar, header)
│   │
│   ├── (marketing)/              # Public marketing pages (shared layout)
│   │   ├── privacy/              # Privacy policy
│   │   ├── terms/                # Terms of service
│   │   ├── security/             # Security & disclaimer
│   │   ├── help/                 # Help center
│   │   └── layout.tsx            # Shared navbar/footer layout
│   │
│   ├── auth/                     # Auth callback route
│   ├── auth-error/               # Auth error page
│   ├── sign-in/                  # Sign in page
│   ├── sign-up/                  # Sign up page
│   ├── forgot-password/          # Forgot password page
│   ├── reset-password/           # Reset password page
│   │
│   ├── services/                 # Business logic services
│   │   ├── transaction-builders.ts
│   │   └── transaction-services.ts
│   │
│   ├── types/                    # TypeScript types
│   │   └── transaction.ts
│   │
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.tsx                # Root layout
│   ├── metadata.ts               # SEO metadata
│   ├── page.tsx                  # Landing page
│   └── not-found.tsx             # 404 page
│
├── components/
│   ├── app/                      # Application-specific components
│   │   ├── charts/               # Chart components
│   │   │   ├── index.ts          # Barrel exports
│   │   │   └── *.tsx
│   │   ├── dashboard/            # Dashboard widgets
│   │   │   ├── index.ts
│   │   │   └── metrics-cards.tsx
│   │   ├── dialogs/              # Modal dialogs
│   │   │   ├── index.ts
│   │   │   └── *.tsx
│   │   ├── landing/              # Landing page components
│   │   │   ├── index.ts
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── index.ts
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── shared/               # Reusable components
│   │   │   ├── index.ts
│   │   │   ├── empty-state.tsx
│   │   │   ├── loading-state.tsx
│   │   │   └── *.tsx
│   │   └── transactions/         # Transaction components
│   │       ├── index.ts
│   │       ├── _columns/
│   │       ├── hooks/
│   │       └── *.tsx
│   │
│   └── ui/                       # Shadcn UI components (29 files)
│       └── *.tsx
│
├── features/                     # Feature-based module exports
│   ├── index.ts                  # All features barrel export
│   ├── transactions/             # Transaction feature
│   │   └── index.ts              # Re-exports hooks, services, types
│   ├── recurring/                # Recurring transactions feature
│   │   └── index.ts
│   ├── auth/                     # Authentication feature
│   │   └── index.ts
│   └── categories/               # Categories feature
│       └── index.ts
│
├── hooks/                        # Global React hooks
│   ├── index.ts                  # Barrel exports
│   ├── use-transactions.ts
│   ├── use-recurring-transactions.ts
│   ├── use-categories.ts
│   └── use-require-auth.ts
│
├── context/                      # React Context providers
│   ├── index.ts                  # Barrel exports
│   ├── auth-context.tsx
│   └── cache-context.tsx
│
├── utils/                        # Utility functions
│   ├── index.ts                  # Barrel exports
│   ├── format.ts                 # Formatting utilities
│   ├── frequency-utils.ts        # Date/frequency calculations
│   ├── predict-transactions.ts   # Transaction predictions
│   └── supabase/                 # Supabase clients
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── types/                        # Consolidated type exports
│   └── index.ts                  # Re-exports all types
│
├── data/                         # Static data/constants
│   ├── index.ts                  # Barrel exports
│   ├── categories.ts
│   ├── frequencies.ts
│   ├── account-types.ts
│   └── transactiontypes.ts
│
├── lib/                          # Library utilities
│   └── utils.ts                  # cn() helper for Tailwind
│
├── public/                       # Static assets
│   ├── logo.png
│   └── favicon/
│
├── docs/                         # Documentation
│   ├── PROJECT-STRUCTURE.md      # This file
│   └── COLOR-USAGE-REPORT.md
│
└── Config files
    ├── database.types.ts         # Supabase generated types
    ├── middleware.ts             # Next.js middleware (auth)
    ├── tailwind.config.js
    ├── next.config.js
    ├── tsconfig.json
    └── package.json
```

---

## Import Patterns

### Using Barrel Exports (Recommended)

```typescript
// Instead of deep imports:
import { EmptyState } from '@/components/app/shared/empty-state'
import { LoadingState } from '@/components/app/shared/loading-state'

// Use barrel exports:
import { EmptyState, LoadingState } from '@/components/app/shared'
```

### Using Feature Modules

```typescript
// Import from feature modules for related functionality:
import { useTransactions, TransactionDialog } from '@/features/transactions'
import { useRecurringTransactions, predictUpcomingTransactions } from '@/features/recurring'
import { useAuth, AuthProvider } from '@/features/auth'
```

### Available Barrel Exports

| Path | Exports |
|------|---------|
| `@/components/app/shared` | EmptyState, LoadingState, DateRangePickerWithRange, FormErrorSummary, LoadingButton, MonthPicker |
| `@/components/app/charts` | TransactionChart, SpendingChart, NetBalanceChart, PieDonutChart |
| `@/components/app/dialogs` | AccountManagementDialog, BalanceDialog, ConfirmationDialog, UploadDialog |
| `@/components/app/layout` | AppSidebar, AppHeader |
| `@/components/app/landing` | LandingNavbar, LandingFooter |
| `@/components/app/transactions` | TransactionsTable, UpcomingTransactionsTable, TransactionDialog, RecurringTransactionDialog |
| `@/components/app/dashboard` | MetricsCards |
| `@/hooks` | useTransactions, useRecurringTransactions, useCategories, useRequireAuth |
| `@/context` | AuthProvider, useAuth, CacheProvider, useCache |
| `@/utils` | formatCurrency, formatDateToISO, predictUpcomingTransactions, etc. |
| `@/data` | categories, frequencies, accountTypes, transactionTypes |
| `@/types` | Transaction, RecurringTransaction, etc. |

---

## Route Groups

### (dashboard)
Protected routes requiring authentication. Uses dashboard layout with sidebar and header.

**Pages:**
- `/dashboard` - Main dashboard with metrics and charts
- `/transactions` - Transaction list and management
- `/recurring-transactions` - Recurring transaction management

### (marketing)
Public pages with shared navbar and footer layout.

**Pages:**
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/security` - Security & disclaimer
- `/help` - Help center with FAQ

---

## Feature Modules

Feature modules provide a convenient way to import related functionality:

### `@/features/transactions`
- `useTransactions` - Hook for transaction CRUD
- `transactionService` - Service class
- `TransactionsTable` - Table component
- `TransactionDialog` - Create/edit dialog
- Transaction types

### `@/features/recurring`
- `useRecurringTransactions` - Hook for recurring transactions
- `RecurringTransactionDialog` - Dialog component
- `UpcomingTransactionsTable` - Predicted transactions table
- `predictUpcomingTransactions` - Prediction utility
- Frequency utilities

### `@/features/auth`
- `AuthProvider` - Auth context provider
- `useAuth` - Auth hook
- `useRequireAuth` - Auth guard hook
- `createClient` - Supabase client

### `@/features/categories`
- `useCategories` - Categories hook
- `categories` - Static category data

---

## Best Practices

1. **Use barrel exports** for cleaner imports
2. **Use feature modules** when working on a specific feature
3. **Keep page-specific components** in `_components` folders within route folders
4. **Keep page-specific hooks** in `_hooks` folders within route folders
5. **Shared components** go in `components/app/shared`
6. **UI primitives** stay in `components/ui` (Shadcn)

---

## Adding New Features

1. Create a new folder in `features/` with an `index.ts`
2. Re-export related hooks, services, types, and components
3. Add the export to `features/index.ts`
4. Document in this file
