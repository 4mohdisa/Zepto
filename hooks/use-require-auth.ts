'use client'

import { useAuth } from '@/context/auth-context'

export function useRequireAuth() {
  const { user, isLoaded } = useAuth()
  return { user, isLoading: !isLoaded }
}
