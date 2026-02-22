'use client'

import { useState, useCallback, useMemo } from 'react'

interface UseDashboardPeriodReturn {
  period: string // YYYY-MM format
  year: number
  month: number
  setPeriod: (period: string) => void
  setYear: (year: number) => void
  setMonth: (month: number) => void
  goToPreviousPeriod: () => void
  goToNextPeriod: () => void
  monthOptions: { value: number; label: string }[]
  yearOptions: number[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function useDashboardPeriod(): UseDashboardPeriodReturn {
  // Initialize with current month
  const now = new Date()
  const [period, setPeriod] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )

  const year = useMemo(() => {
    return parseInt(period.split('-')[0])
  }, [period])

  const month = useMemo(() => {
    return parseInt(period.split('-')[1])
  }, [period])

  const setYear = useCallback((newYear: number) => {
    setPeriod(`${newYear}-${String(month).padStart(2, '0')}`)
  }, [month])

  const setMonth = useCallback((newMonth: number) => {
    setPeriod(`${year}-${String(newMonth).padStart(2, '0')}`)
  }, [year])

  const goToPreviousPeriod = useCallback(() => {
    let newMonth = month - 1
    let newYear = year
    
    if (newMonth < 1) {
      newMonth = 12
      newYear = year - 1
    }
    
    setPeriod(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }, [month, year])

  const goToNextPeriod = useCallback(() => {
    let newMonth = month + 1
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }
    
    setPeriod(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }, [month, year])

  const monthOptions = useMemo(() => {
    return MONTH_NAMES.map((name, index) => ({
      value: index + 1,
      label: name,
    }))
  }, [])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y)
    }
    return years
  }, [])

  return {
    period,
    year,
    month,
    setPeriod,
    setYear,
    setMonth,
    goToPreviousPeriod,
    goToNextPeriod,
    monthOptions,
    yearOptions,
  }
}
