import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'

/**
 * Creates a Supabase client for use in Client Components
 * Integrates with Clerk authentication using JWT tokens
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

/**
 * Creates a Supabase client with Clerk authentication
 * Use this in client components where you need authenticated Supabase access
 *
 * @example
 * ```tsx
 * 'use client'
 * import { useSupabaseClient } from '@/utils/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = useSupabaseClient()
 *
 *   const fetchData = async () => {
 *     const { data } = await supabase.from('table').select()
 *   }
 * }
 * ```
 */
export const useSupabaseClient = () => {
  const { getToken } = useAuth()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      // Use fetch to dynamically get token for each request
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: 'supabase' })

        // Add Authorization header with Clerk token
        const headers = new Headers(options?.headers)
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`)
        }

        return fetch(url, {
          ...options,
          headers,
        })
      },
    },
    auth: {
      persistSession: false, // Don't persist Supabase sessions, use Clerk instead
      autoRefreshToken: false, // Clerk handles token refresh
      detectSessionInUrl: false,
    },
  })
}
