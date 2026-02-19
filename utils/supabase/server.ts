import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client for Server Components and Server Actions
 * Integrates with Clerk authentication using the modern accessToken approach
 * 
 * CRITICAL: Uses Clerk session tokens directly - no JWT template needed
 * Requires Supabase Third-Party Auth to be configured with Clerk
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

  // Get Clerk token (no template needed for modern Third-Party Auth)
  const authObj = await auth()
  const token = await authObj.getToken()

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    accessToken: async () => token ?? null,
    auth: {
      persistSession: false, // Clerk manages sessions
      autoRefreshToken: false, // Clerk handles token refresh
      detectSessionInUrl: false,
    },
  })
}

/**
 * @deprecated Use createClient() instead which uses the modern accessToken approach
 */
export function createServerSupabaseClient() {
  throw new Error('createServerSupabaseClient is deprecated. Use createClient() instead.')
}
