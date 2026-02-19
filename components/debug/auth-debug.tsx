'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSupabaseClient } from '@/utils/supabase/client'

/**
 * AuthDebug Component
 * 
 * Temporary debug component to verify Clerk + Supabase authentication is working correctly.
 * Add this to any page to diagnose authentication issues.
 * 
 * Usage:
 * ```tsx
 * import { AuthDebug } from '@/components/debug/auth-debug'
 * 
 * export default function MyPage() {
 *   return (
 *     <div>
 *       <AuthDebug />
 *       <div>Your page content here</div>
 *     </div>
 *   )
 * }
 * ```
 */
export function AuthDebug() {
  const { getToken, userId, isSignedIn, isLoaded } = useAuth()
  const supabase = useSupabaseClient()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      if (!isSignedIn) return

      const token = await getToken()
      let payload = null
      
      if (token) {
        try {
          // Decode JWT payload (middle section)
          const base64Payload = token.split('.')[1]
          const jsonPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
          payload = JSON.parse(jsonPayload)
        } catch (e) {
          console.error('Failed to decode token:', e)
        }
      }

      setDebugInfo({
        isLoaded,
        isSignedIn,
        userId,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 50)}...` : null,
        jwtPayload: payload,
        hasRoleClaim: payload?.role === 'authenticated',
        roleClaim: payload?.role,
      })
    }

    checkAuth()
  }, [getToken, userId, isSignedIn, isLoaded])

  const testSupabaseConnection = async () => {
    setTestResult('Testing...')
    try {
      // Try to fetch a single row from profiles to test RLS
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)

      if (error) {
        setTestResult(`❌ Error: ${error.message} (Code: ${error.code})`)
        console.error('Supabase test error:', error)
      } else {
        setTestResult(`✅ Success! Fetched ${data?.length || 0} profile(s)`)
      }
    } catch (err) {
      setTestResult(`❌ Exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!isLoaded) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-gray-100 rounded-lg shadow-lg z-50">
        <p className="text-sm text-gray-600">Loading auth...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 rounded-lg shadow-lg z-50">
        <p className="text-sm text-yellow-800">⚠️ Not signed in</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Auth Debug</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Critical Status */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className={debugInfo?.hasToken ? 'text-green-600' : 'text-red-600'}>
            {debugInfo?.hasToken ? '✅' : '❌'} Token
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={debugInfo?.hasRoleClaim ? 'text-green-600' : 'text-red-600'}>
            {debugInfo?.hasRoleClaim ? '✅' : '❌'} Role Claim
          </span>
          {debugInfo?.roleClaim && (
            <span className="text-xs text-gray-500">({debugInfo.roleClaim})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">User ID:</span>
          <span className="text-xs font-mono">{userId || 'N/A'}</span>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={testSupabaseConnection}
        className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
      >
        Test Supabase Connection
      </button>

      {testResult && (
        <div className={`mt-2 text-xs ${testResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {testResult}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && debugInfo && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <pre className="text-xs text-gray-600 overflow-auto max-h-48">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
