// Feature: Authentication
// This module re-exports all auth-related functionality

// Context & Hooks
export { AuthProvider, useAuth } from '@/context/auth-context'
export { useRequireAuth } from '@/hooks/use-require-auth'

// Supabase clients
export { createClient } from '@/utils/supabase/client'
