'use client'

import { createContext, useContext, useEffect } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'
import { setUser } from '@/lib/sentry'

type AuthContextType = {
  user: {
    id: string
    email: string | undefined
    fullName: string | null
  } | null
  userId: string | null | undefined
  isLoaded: boolean
  isSignedIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded, isSignedIn } = useClerkAuth()
  const { user: clerkUser } = useUser()

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        fullName: clerkUser.fullName ?? null,
      }
    : null

  // Set Sentry user context and initialize categories when auth state changes
  useEffect(() => {
    if (isSignedIn && userId) {
      setUser({ id: userId })
      
      // Initialize default categories for new users
      // This is safe to call multiple times as it's idempotent
      fetch('/api/categories/init', { method: 'POST' }).catch(() => {
        // Silent fail - category init is best-effort
      })
    } else {
      setUser(null)
    }
  }, [isSignedIn, userId])

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isLoaded,
        isSignedIn: isSignedIn ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
