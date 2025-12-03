'use client'

import { createContext, useContext } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'

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
