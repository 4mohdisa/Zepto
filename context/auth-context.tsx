'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  signUp: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
    needsEmailVerification: boolean
  }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session with timeout and error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Failed to get initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout reached, setting loading to false')
      setIsLoading(false)
    }, 5000) // 5 second timeout

    getInitialSession().then(() => {
      clearTimeout(timeoutId)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false) // Ensure loading is set to false on any auth change
      router.refresh()
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { error: null, success: true }
    } catch (error) {
      console.error('Error signing in:', error)
      return {
        error: error as Error,
        success: false,
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      return {
        error: null,
        success: true,
        needsEmailVerification: data.user?.identities?.length === 0,
      }
    } catch (error) {
      console.error('Error signing up:', error)
      return {
        error: error as Error,
        success: false,
        needsEmailVerification: false,
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
