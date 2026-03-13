'use client'

import { useState, useEffect, useCallback } from 'react'
import { Report, CreateReportInput, GenerateReportResult } from '@/types/report'
import { toast } from 'sonner'

interface UseReportsReturn {
  reports: Report[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createReport: (input: CreateReportInput) => Promise<GenerateReportResult>
  updateReport: (id: string, updates: { name?: string; exported?: boolean }) => Promise<boolean>
  deleteReport: (id: string) => Promise<boolean>
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reports')
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`)
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch reports'))
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const createReport = useCallback(async (input: CreateReportInput): Promise<GenerateReportResult> => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const data = await response.json()
      
      // Refresh the list
      await fetchReports()
      
      toast.success('Report generated successfully')
      return { success: true, report: data.report }
    } catch (err) {
      console.error('Error creating report:', err)
      const message = err instanceof Error ? err.message : 'Failed to create report'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [fetchReports])

  const updateReport = useCallback(async (id: string, updates: { name?: string; exported?: boolean }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update report')
      }

      // Refresh the list
      await fetchReports()
      
      toast.success('Report updated')
      return true
    } catch (err) {
      console.error('Error updating report:', err)
      const message = err instanceof Error ? err.message : 'Failed to update report'
      toast.error(message)
      return false
    }
  }, [fetchReports])

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete report')
      }

      // Refresh the list
      await fetchReports()
      
      toast.success('Report deleted')
      return true
    } catch (err) {
      console.error('Error deleting report:', err)
      const message = err instanceof Error ? err.message : 'Failed to delete report'
      toast.error(message)
      return false
    }
  }, [fetchReports])

  return {
    reports,
    loading,
    error,
    refresh: fetchReports,
    createReport,
    updateReport,
    deleteReport,
  }
}

// Hook for single report
export function useReport(reportId: string | null) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(!!reportId)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!reportId) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found')
        }
        throw new Error(`Failed to fetch report: ${response.statusText}`)
      }

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch report'))
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateReport = useCallback(async (updates: { name?: string; exported?: boolean }): Promise<boolean> => {
    if (!reportId) return false
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update report')
      }

      const data = await response.json()
      setReport(data.report)
      
      if (updates.name) {
        toast.success('Report renamed')
      }
      return true
    } catch (err) {
      console.error('Error updating report:', err)
      const message = err instanceof Error ? err.message : 'Failed to update report'
      toast.error(message)
      return false
    }
  }, [reportId])

  return { report, loading, error, refresh, updateReport }
}
