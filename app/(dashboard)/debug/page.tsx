'use client'

/**
 * Sentry Debug Page
 * Used to verify Sentry integration is working correctly
 * This page is only accessible in development mode
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { captureException, captureMessage, isSentryInitialized } from '@/lib/sentry'
import { toast } from 'sonner'
import { 
  pageContainer, 
  pageContent, 
  pageHeading, 
  bodyText,
  primaryButton,
  secondaryButton 
} from '@/lib/styles'

export default function DebugPage() {
  const userId = 'debug-user' // Debug page uses placeholder user
  const [testResults, setTestResults] = useState<string[]>([])

  const logResult = useCallback((message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    toast.info(message)
  }, [])

  // Test 1: Client-side error capture
  const testClientError = useCallback(() => {
    try {
      // Simulate a controlled error
      const testError = new Error('Test client-side error from debug page')
      testError.name = 'TestClientError'
      
      const eventId = captureException(testError, {
        testType: 'client-error',
        userId,
        timestamp: Date.now(),
      })
      
      if (eventId) {
        logResult(`✅ Client error captured (Event ID: ${eventId})`)
      } else {
        logResult('⚠️ Client error not sent - Sentry may not be initialized')
      }
    } catch (e) {
      logResult(`❌ Failed to capture client error: ${e}`)
    }
  }, [userId, logResult])

  // Test 2: React rendering error (triggers error boundary)
  const [shouldThrow, setShouldThrow] = useState(false)
  
  const testReactError = useCallback(() => {
    logResult('🧪 Triggering React rendering error...')
    setShouldThrow(true)
  }, [logResult])

  if (shouldThrow) {
    // This will trigger the error boundary
    throw new Error('Test React rendering error from debug page')
  }

  // Test 3: Capture message
  const testMessage = useCallback(() => {
    const eventId = captureMessage('Test info message from debug page', 'info')
    if (eventId) {
      logResult(`✅ Message captured (Event ID: ${eventId})`)
    } else {
      logResult('⚠️ Message not sent - Sentry may not be initialized')
    }
  }, [logResult])

  // Test 4: API error
  const testApiError = useCallback(async () => {
    try {
      logResult('🧪 Calling test API error endpoint...')
      const response = await fetch('/api/debug/sentry-test?type=error')
      const data = await response.json()
      
      // This endpoint returns 500 intentionally - that's the test
      if (!response.ok && data.isIntentionalTest) {
        logResult(`✅ API error test successful: Received expected ${response.status} response`)
      } else if (response.ok) {
        logResult(`✅ API error test completed: ${data.message}`)
      } else {
        logResult(`⚠️ Unexpected error: ${data.error}`)
      }
    } catch (e) {
      logResult(`❌ API call failed: ${e}`)
    }
  }, [logResult])

  // Test 5: API success with tracing
  const testApiSuccess = useCallback(async () => {
    try {
      logResult('🧪 Calling test API success endpoint...')
      const response = await fetch('/api/debug/sentry-test?type=success')
      const data = await response.json()
      
      if (response.ok) {
        logResult(`✅ API success test completed: ${data.message}`)
      } else {
        logResult(`⚠️ API success test failed: ${data.error}`)
      }
    } catch (e) {
      logResult(`❌ API call failed: ${e}`)
    }
  }, [logResult])

  // Clear results
  const clearResults = useCallback(() => {
    setTestResults([])
    toast.info('Test results cleared')
  }, [])

  const sentryStatus = isSentryInitialized() ? '✅ Initialized' : '⚠️ Not Initialized'

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        <div className="mb-6">
          <h1 className={pageHeading}>Sentry Debug</h1>
          <p className={bodyText}>
            Test Sentry error monitoring and performance tracing
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="font-medium text-gray-900 mb-2">Configuration Status</h2>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Sentry Status:</span>
              <span className="font-medium">{sentryStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Environment:</span>
              <span className="font-medium">{process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Debug Mode:</span>
              <span className="font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Intentional Test Notice */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-purple-600 text-lg">🧪</span>
            <div>
              <h3 className="font-medium text-purple-900 mb-1">Intentional Test Events</h3>
              <p className="text-sm text-purple-700">
                The buttons below intentionally trigger errors for Sentry verification. 
                These are <strong>expected</strong> and will be sent to your Sentry dashboard.
                In the console, they appear as "🧪 [TEST EVENT]" instead of errors.
              </p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Client-Side Tests</h3>
            <div className="space-y-2">
              <Button 
                onClick={testClientError}
                className={secondaryButton}
                variant="outline"
              >
                Test Client Error
              </Button>
              <Button 
                onClick={testReactError}
                className={secondaryButton}
                variant="outline"
              >
                Test React Boundary Error
              </Button>
              <Button 
                onClick={testMessage}
                className={secondaryButton}
                variant="outline"
              >
                Test Capture Message
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              These trigger intentional JavaScript errors that should appear in Sentry with user context.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Server/API Tests</h3>
            <div className="space-y-2">
              <Button 
                onClick={testApiError}
                className={secondaryButton}
                variant="outline"
              >
                Test API Error (Expected 500)
              </Button>
              <Button 
                onClick={testApiSuccess}
                className={secondaryButton}
                variant="outline"
              >
                Test API Success + Tracing
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              The API Error test returns HTTP 500 intentionally to verify Sentry server-side capture.
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Test Results</h3>
            <Button 
              onClick={clearResults}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          
          {testResults.length === 0 ? (
            <p className="text-sm text-gray-500">No tests run yet</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="text-sm font-mono bg-gray-50 p-2 rounded"
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-6 text-xs text-gray-500">
          <p className="font-medium mb-1">Privacy Notice:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All test errors include user ID for verification</li>
            <li>Financial data, auth tokens, and PII are scrubbed before sending</li>
            <li>Session replay masks all inputs and text by default</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
