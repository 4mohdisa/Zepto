'use client'

import { EnhancedDebugPanel } from './enhanced-debug-panel'
import { useDebug } from './debug-provider'

/**
 * DebugPanelWrapper
 * 
 * Conditionally renders the debug panel based on environment and settings.
 * - Always shown in development
 * - Shown in production only if debug mode is enabled via localStorage or URL param
 */
export function DebugPanelWrapper() {
  const { isDebugMode } = useDebug()

  // In development, always show
  if (process.env.NODE_ENV === 'development') {
    return <EnhancedDebugPanel />
  }

  // In production, only show if explicitly enabled
  if (isDebugMode) {
    return <EnhancedDebugPanel />
  }

  return null
}
