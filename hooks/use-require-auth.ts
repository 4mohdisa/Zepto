'use client'

import { useAuth } from '@/context/auth-context'

// TODO: TEMPORARY - Auth disabled for development. Re-enable when done.
export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  return { user, isLoading }
}
