import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client for Server Components and Server Actions
 * Integrates with Clerk authentication using JWT tokens
 *
 * @example
 * ```tsx
 * import { createClient } from '@/utils/supabase/server'
 *
 * export default async function ServerComponent() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('table').select()
 *   return <div>{data}</div>
 * }
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Get Clerk token
  const authObj = await auth()
  const token = await authObj.getToken({ template: 'supabase' })

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    },
    auth: {
      persistSession: false, // Don't persist Supabase sessions, use Clerk instead
      autoRefreshToken: false, // Clerk handles token refresh
      detectSessionInUrl: false,
    },
  })
}

/**
 * Creates a Supabase client for use in Server Components and Server Actions
 * This matches the Clerk documentation recommended pattern with accessToken callback
 *
 * @example
 * ```tsx
 * import { createServerSupabaseClient } from '@/utils/supabase/server'
 *
 * export default function Page() {
 *   const supabase = createServerSupabaseClient()
 *   const { data } = await supabase.from('tasks').select()
 *   return <div>{data}</div>
 * }
 * ```
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    global: {
      // Use fetch to get token dynamically for each request
      fetch: async (url, options = {}) => {
        const authObj = await auth()
        const clerkToken = await authObj.getToken({ template: 'supabase' })

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
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
