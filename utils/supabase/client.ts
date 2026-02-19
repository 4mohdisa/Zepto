import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'

// Track if we've logged the connection error to avoid spam
let hasLoggedConnectionError = false

/**
 * Hook to create an authenticated Supabase client with Clerk
 * Uses the modern Third-Party Auth approach with accessToken option
 * 
 * CRITICAL: This is the ONLY way to make authenticated requests to Supabase
 * when using Clerk for authentication. The accessToken option automatically
 * adds the Clerk JWT to the Authorization header.
 */
export const useSupabaseClient = () => {
  const { getToken } = useAuth()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    // MODERN APPROACH: Use accessToken option for Clerk integration
    // This automatically adds the Clerk session token to all requests
    accessToken: async () => {
      try {
        const token = await getToken()
        if (!token && !hasLoggedConnectionError) {
          console.warn('[Supabase] No Clerk token available - requests may fail')
          hasLoggedConnectionError = true
        }
        return token ?? null
      } catch (err) {
        if (!hasLoggedConnectionError) {
          console.error('[Supabase] Failed to get Clerk token:', err)
          hasLoggedConnectionError = true
        }
        return null
      }
    },
    auth: {
      persistSession: false, // Clerk manages sessions
      autoRefreshToken: false, // Clerk handles token refresh
      detectSessionInUrl: false,
    },
  })
}

/**
 * ⚠️ WARNING: This creates an UNAUTHENTICATED Supabase client
 * Only use this for public/unauthenticated queries (if any)
 * 
 * For ALL authenticated operations, you MUST use useSupabaseClient() hook
 * which properly includes the Clerk JWT token
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
