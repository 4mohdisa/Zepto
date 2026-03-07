'use client'

import { useState, useEffect } from 'react'
import { debugLogger, type DebugEvent } from '@/lib/utils/debug-logger'

export function useDebugEvents() {
  const [events, setEvents] = useState<DebugEvent[]>([])
  
  useEffect(() => {
    setEvents(debugLogger.getEvents())
    return debugLogger.subscribe(setEvents)
  }, [])
  
  return events
}
