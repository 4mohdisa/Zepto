'use client'

/**
 * PostHog Analytics Provider
 * Initializes PostHog and handles user identification
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { EVENT_APP_OPENED } from '@/lib/analytics/constants'

// Track if PostHog is already initialized
let posthogInitialized = false

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth()
  const appOpenedTracked = useRef(false)

  // Initialize PostHog once
  useEffect(() => {
    if (posthogInitialized) return
    
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    
    if (!posthogKey) {
      // PostHog not configured - app works without analytics
      if (process.env.NODE_ENV === 'development') {
        console.debug('📊 PostHog not configured - analytics disabled')
      }
      return
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Disable auto-capture to avoid tracking every click
      autocapture: false,
      // Disable session recording by default
      disable_session_recording: true,
      // Respect Do Not Track
      respect_dnt: true,
      // Capture only pageviews we explicitly track
      capture_pageview: false,
      // Persistence
      persistence: 'localStorage',
      // Loaded callback
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('📊 PostHog initialized')
        }
      },
    })

    posthogInitialized = true
  }, [])

  // Track app opened (once per session)
  useEffect(() => {
    if (!posthogInitialized || appOpenedTracked.current) return
    
    appOpenedTracked.current = true
    posthog.capture(EVENT_APP_OPENED, {
      route: window.location.pathname,
    })
  }, [])

  // Identify user when signed in
  useEffect(() => {
    if (!posthogInitialized) return

    if (isSignedIn && userId) {
      // Only identify with user ID - no PII
      posthog.identify(userId)
      if (process.env.NODE_ENV === 'development') {
        console.debug('📊 PostHog identified user:', userId.slice(0, 8) + '...')
      }
    } else {
      posthog.reset()
    }
  }, [isSignedIn, userId])

  return <>{children}</>
}

export { posthog }
