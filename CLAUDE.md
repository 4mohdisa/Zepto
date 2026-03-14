# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js with Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Start production server
```

No test framework is configured.

## Architecture

**Zepto** is a personal finance management app built with Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL), and Clerk authentication.

### Auth Flow (Clerk + Supabase)

Authentication uses Clerk for session management and Supabase for data storage with Row-Level Security (RLS):

1. **Clerk middleware** (`middleware.ts`) protects dashboard routes and lets public routes through
2. **Server-side Supabase client** (`lib/supabase/server.ts`) gets a Clerk token via `auth().getToken()` and passes it to Supabase's `accessToken` option — no JWT template needed (uses Supabase Third-Party Auth)
3. **RLS policies** use a custom `requesting_user_id()` SQL function that extracts the Clerk user ID from the JWT `sub` claim — this is NOT `auth.uid()`
4. **API routes** call `auth()` from `@clerk/nextjs/server` to get `userId`, then use either the authenticated Supabase client or a service role client for admin operations

The service role client (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS and is used in dashboard aggregation, CSV import, and cron jobs.

### Data Layer

- **Database**: Supabase PostgreSQL with RLS on all tables
- **Schema**: `db/schema.sql` — core tables: `profiles`, `transactions`, `categories`, `recurring_transactions`, `merchants`, `account_balances`, `balance_history`
- **Migrations**: `db/migrations/` (18+ files, applied manually)
- **Generated types**: `database.types.ts` (auto-generated from Supabase)
- **Denormalized fields**: `category_name` and `merchant_name` on transactions for query performance

### Code Organization

```
app/(dashboard)/        → Protected pages (dashboard, transactions, categories, merchants, etc.)
app/api/                → Route handlers — each does auth + Supabase queries directly
features/               → Feature modules with components/ and services/ subdirectories
hooks/                  → Custom React hooks (data fetching, CRUD, caching)
lib/supabase/           → Browser client (client.ts) and server client (server.ts)
lib/utils/              → Frequency calculations, transaction prediction, CSV validation
lib/analytics/          → PostHog event tracking
providers/              → React context providers (auth, cache, analytics)
components/ui/          → Shadcn/Radix UI primitives
components/layout/      → Sidebar, header
types/                  → TypeScript interfaces
constants/              → Default categories, frequencies, account types
```

### Key Patterns

- **API routes** handle all data mutations — no direct Supabase calls from client components for writes
- **Custom hooks** (`hooks/use-*.ts`) manage data fetching, loading/error states, and cache invalidation
- **Caching**: `use-data-cache.ts` provides a centralized cache layer with 30-second stale time via `CacheProvider`
- **Forms**: React Hook Form + Zod schemas for all form validation
- **Tables**: TanStack Table with custom column definitions in `features/transactions/components/_columns/`
- **Cursor-based pagination** on the transactions API
- **Recurring transaction generation**: Vercel cron job at 5am UTC daily (`/api/recurring/generate`), protected by `CRON_SECRET`

### UI Stack

- Shadcn UI components (Radix UI primitives) in `components/ui/`
- Tailwind CSS with HSL design token variables defined in `app/globals.css`
- Dark mode supported via CSS variables
- Recharts for dashboard charts, wrapped in `components/ui/chart.tsx`
- Sonner for toast notifications

### Monitoring (Optional)

- **Sentry**: Error tracking — configured in `next.config.js`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- **PostHog**: Analytics — configured in `providers/posthog-provider.tsx`, tracked via `hooks/use-page-view.ts`

### Environment Variables

Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

Optional: `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `OPENAI_API_KEY` (for merchant classification)

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
