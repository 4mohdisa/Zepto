'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { DateRange } from 'react-day-picker'

interface CacheState {
  // UI state
  dateRange: DateRange | null
  sidebarOpen: boolean
  
  // Cache invalidation triggers
  transactionsLastUpdated: number
  recurringTransactionsLastUpdated: number
  categoriesLastUpdated: number
}

interface CacheContextType {
  state: CacheState
  
  // UI actions
  setDateRange: (dateRange: DateRange | null) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Cache invalidation
  invalidateTransactions: () => void
  invalidateRecurringTransactions: () => void
  invalidateCategories: () => void
  invalidateAll: () => void
}

const initialState: CacheState = {
  dateRange: null,
  sidebarOpen: false,
  transactionsLastUpdated: 0,
  recurringTransactionsLastUpdated: 0,
  categoriesLastUpdated: 0
}

const CacheContext = createContext<CacheContextType | null>(null)

export function CacheProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CacheState>(initialState)

  // UI actions
  const setDateRange = useCallback((dateRange: DateRange | null) => {
    setState(prev => ({ ...prev, dateRange }))
  }, [])

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }))
  }, [])

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))
  }, [])

  // Cache invalidation
  const invalidateTransactions = useCallback(() => {
    setState(prev => ({ ...prev, transactionsLastUpdated: Date.now() }))
  }, [])

  const invalidateRecurringTransactions = useCallback(() => {
    setState(prev => ({ ...prev, recurringTransactionsLastUpdated: Date.now() }))
  }, [])

  const invalidateCategories = useCallback(() => {
    setState(prev => ({ ...prev, categoriesLastUpdated: Date.now() }))
  }, [])

  const invalidateAll = useCallback(() => {
    const now = Date.now()
    setState(prev => ({
      ...prev,
      transactionsLastUpdated: now,
      recurringTransactionsLastUpdated: now,
      categoriesLastUpdated: now
    }))
  }, [])

  const value: CacheContextType = {
    state,
    setDateRange,
    setSidebarOpen,
    toggleSidebar,
    invalidateTransactions,
    invalidateRecurringTransactions,
    invalidateCategories,
    invalidateAll
  }

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}