'use client'

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

export interface DebugLogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  details?: any
  source?: string
}

interface DebugContextValue {
  logs: DebugLogEntry[]
  addLog: (level: LogLevel, category: string, message: string, details?: any) => void
  clearLogs: () => void
  isDebugMode: boolean
  setDebugMode: (enabled: boolean) => void
  exportLogs: () => string
}

const DebugContext = createContext<DebugContextValue | null>(null)

const MAX_LOGS = 500

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<DebugLogEntry[]>([])
  const [isDebugMode, setDebugMode] = useState(false)
  
  // Use refs to avoid dependency issues
  const logsRef = useRef(logs)
  logsRef.current = logs

  // Check for debug mode in URL or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get('debug')
    const storedDebug = localStorage.getItem('zeptodebug')
    
    if (debugParam === 'true' || storedDebug === 'true') {
      setDebugMode(true)
      localStorage.setItem('zeptodebug', 'true')
    }
  }, [])

  // Stable addLog function - never changes identity
  const addLog = useCallback((level: LogLevel, category: string, message: string, details?: any) => {
    const newLog: DebugLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details: details ? sanitizeForSerialization(details) : undefined,
      source: getCallerInfo()
    }

    setLogs(prev => {
      const newLogs = [newLog, ...prev]
      return newLogs.slice(0, MAX_LOGS)
    })

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${category}]`
      // eslint-disable-next-line no-console
      const consoleFn = console[level === 'success' ? 'log' : level] as (...args: any[]) => void
      if (details !== undefined) {
        consoleFn(prefix, message, details)
      } else {
        consoleFn(prefix, message)
      }
    }
  }, []) // Empty dependency array - never changes

  const clearLogs = useCallback(() => {
    setLogs([])
    addLog('info', 'System', 'Logs cleared')
  }, [addLog])

  const exportLogs = useCallback(() => {
    const currentLogs = logsRef.current
    const header = `Zepto Debug Logs Export\nGenerated: ${new Date().toISOString()}\nTotal Logs: ${currentLogs.length}\n${'='.repeat(50)}\n\n`
    
    const logText = currentLogs.map(log => {
      const details = log.details ? `\n  Details: ${JSON.stringify(log.details, null, 2)}` : ''
      const source = log.source ? ` [${log.source}]` : ''
      return `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]${source} [${log.category}] ${log.message}${details}`
    }).join('\n\n')

    return header + logText
  }, []) // No dependencies needed since we use ref

  // Stable context value
  const value = React.useMemo(() => ({
    logs,
    addLog,
    clearLogs,
    isDebugMode,
    setDebugMode,
    exportLogs
  }), [logs, addLog, clearLogs, isDebugMode, exportLogs])

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}

// Helper function to get caller info
function getCallerInfo(): string | undefined {
  try {
    const stack = new Error().stack
    if (!stack) return undefined
    
    const lines = stack.split('\n')
    // Find the first line that's not from this file
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i]
      if (line && !line.includes('debug-provider') && !line.includes('debug-logger')) {
        // Extract filename from the stack trace
        const match = line.match(/at .* \((.+):(\d+):(\d+)\)/) || line.match(/at (.+):(\d+):(\d+)/)
        if (match) {
          const [, filepath, lineno] = match
          const filename = filepath.split('/').pop()?.split('?')[0] || 'unknown'
          return `${filename}:${lineno}`
        }
      }
    }
  } catch {
    // Silently fail
  }
  return undefined
}

// Helper to sanitize objects for serialization
function sanitizeForSerialization(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  
  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack
    }
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForSerialization)
  }
  
  // Handle objects
  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip circular references and functions
    if (typeof value === 'function') continue
    if (typeof value === 'object' && value !== null) {
      try {
        JSON.stringify(value) // Test for circular references
        sanitized[key] = sanitizeForSerialization(value)
      } catch {
        sanitized[key] = '[Circular/Reference]'
      }
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Convenience hook for component-level logging
// Returns stable callbacks that never change identity
export function useDebugLogger(componentName: string) {
  const { addLog } = useDebug()
  
  // Use refs to avoid dependency issues
  const componentNameRef = useRef(componentName)
  componentNameRef.current = componentName
  const addLogRef = useRef(addLog)
  addLogRef.current = addLog

  // Stable callbacks that never change
  const logger = React.useMemo(() => ({
    debug: (message: string, details?: any) => {
      addLogRef.current('debug', componentNameRef.current, message, details)
    },
    
    info: (message: string, details?: any) => {
      addLogRef.current('info', componentNameRef.current, message, details)
    },
    
    warn: (message: string, details?: any) => {
      addLogRef.current('warn', componentNameRef.current, message, details)
    },
    
    error: (message: string, details?: any) => {
      addLogRef.current('error', componentNameRef.current, message, details)
    },
    
    success: (message: string, details?: any) => {
      addLogRef.current('success', componentNameRef.current, message, details)
    }
  }), []) // Empty deps - never changes

  return logger
}
