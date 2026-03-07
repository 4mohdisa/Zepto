'use client'

import { useAuth } from '@/providers'

export function useRequireAuth() {
  const { user, isLoaded } = useAuth()
  return { user, isLoading: !isLoaded }
}
