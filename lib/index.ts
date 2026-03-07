// Library exports - shared utilities and helpers

// Core utilities
export { cn } from './utils';
export * from './utils/format';
export * from './utils/frequency-utils';
export * from './utils/csv-validator';
export * from './utils/debug-logger';
export * from './utils/predict-transactions';

// Note: Supabase clients should be imported directly from their specific paths
// to avoid naming conflicts:
//   - import { createClient } from '@/lib/supabase/client'  (browser client)
//   - import { createClient } from '@/lib/supabase/server'  (server client)

// Legacy supabase helpers (deprecated, use supabase/ instead)
export * from './supabase-helpers';
