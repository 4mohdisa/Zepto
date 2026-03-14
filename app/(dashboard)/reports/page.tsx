'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useReports } from '@/hooks/use-reports'
import { Report, ReportPeriodType } from '@/types/report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Calendar, Trash2, Eye, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isValid } from 'date-fns'
import { toast } from 'sonner'
import { pageContainer, pageContent, primaryButton, secondaryButton } from '@/lib/styles'
import { usePageView } from '@/hooks/use-page-view'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'
import { cn } from '@/lib/utils'

// Predefined period options
const PERIOD_OPTIONS = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
]

// Safe date format helper - returns fallback if date is invalid
function safeFormatDate(dateString: string, formatStr: string, fallback: string = 'Invalid date'): string {
  if (!dateString) return fallback
  try {
    const parsed = parseISO(dateString)
    if (!isValid(parsed)) return fallback
    return format(parsed, formatStr)
  } catch {
    return fallback
  }
}

// Safe date range display
function formatDateRange(dateFrom: string, dateTo: string): string {
  if (!dateFrom || !dateTo) return 'Select a period'
  const fromFormatted = safeFormatDate(dateFrom, 'MMM dd, yyyy')
  const toFormatted = safeFormatDate(dateTo, 'MMM dd, yyyy')
  return `${fromFormatted} - ${toFormatted}`
}

// Generate default report name
function generateDefaultName(dateFrom: string): string {
  if (!dateFrom) return 'Financial Summary'
  try {
    const parsed = parseISO(dateFrom)
    if (!isValid(parsed)) return 'Financial Summary'
    return `${format(parsed, 'MMMM yyyy')} Financial Summary`
  } catch {
    return 'Financial Summary'
  }
}

export default function ReportsPage() {
  const { reports, loading, createReport, deleteReport } = useReports()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Form state - initialized with empty strings, will be set on mount
  const [reportName, setReportName] = useState('')
  const [periodOption, setPeriodOption] = useState('current_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  usePageView('reports')

  // Initialize dates on mount
  useEffect(() => {
    if (!isInitialized) {
      const now = new Date()
      setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
      setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Handle period selection
  const handlePeriodChange = (value: string) => {
    setPeriodOption(value)
    const now = new Date()
    
    switch (value) {
      case 'current_month':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
        break
      case 'last_3_months':
        setDateFrom(format(subMonths(now, 3), 'yyyy-MM-dd'))
        setDateTo(format(now, 'yyyy-MM-dd'))
        break
      case 'last_6_months':
        setDateFrom(format(subMonths(now, 6), 'yyyy-MM-dd'))
        setDateTo(format(now, 'yyyy-MM-dd'))
        break
      case 'year_to_date':
        setDateFrom(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'))
        setDateTo(format(now, 'yyyy-MM-dd'))
        break
      case 'custom':
        // Keep existing dates or set defaults
        if (!dateFrom) setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
        if (!dateTo) setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
    }
  }

  // Handle create report
  const handleCreate = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select a date range')
      return
    }

    setIsGenerating(true)
    
    const name = reportName.trim() || generateDefaultName(dateFrom)
    
    const result = await createReport({
      name,
      periodType: periodOption === 'custom' ? 'custom' : 'month' as ReportPeriodType,
      dateFrom,
      dateTo,
    })

    setIsGenerating(false)
    
    if (result.success) {
      setIsCreateOpen(false)
      setReportName('')
      // Reset to defaults
      handlePeriodChange('current_month')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    const success = await deleteReport(id)
    if (success) {
      setDeletingId(null)
    }
  }

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    }
    return (
      <Badge variant="outline" className={cn('text-xs', variants[status] || variants.pending)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate and view financial reports
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className={primaryButton}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Reports List */}
        {loading ? (
          <ReportsSkeleton />
        ) : reports.length === 0 ? (
          <EmptyState onCreate={() => setIsCreateOpen(true)} />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onDelete={() => setDeletingId(report.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Report Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>
              Create a financial summary report for a specific period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Report Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Report Name (optional)</Label>
              <Input
                id="name"
                placeholder={isInitialized ? generateDefaultName(dateFrom) : 'Financial Summary'}
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave blank for auto-generated name
              </p>
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={periodOption} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            {periodOption === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From</Label>
                  <DatePicker
                    id="dateFrom"
                    value={dateFrom}
                    onChange={setDateFrom}
                    placeholder="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To</Label>
                  <DatePicker
                    id="dateTo"
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="End date"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange(dateFrom, dateTo)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isGenerating || !dateFrom || !dateTo}
              className={primaryButton}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
      />
    </div>
  )
}

// Report Card Component
function ReportCard({ report, onDelete }: { report: Report; onDelete: () => void }) {
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    }
    return (
      <Badge variant="outline" className={cn('text-xs', variants[status] || variants.pending)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const summary = report.summary_json

  // Safe date range display
  const displayDateRange = () => {
    try {
      if (!report.date_from || !report.date_to) return 'Invalid date range'
      const from = parseISO(report.date_from)
      const to = parseISO(report.date_to)
      if (!isValid(from) || !isValid(to)) return 'Invalid date range'
      return `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`
    } catch {
      return 'Invalid date range'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 truncate">{report.name}</h3>
            <StatusBadge status={report.status} />
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            {displayDateRange()}
          </p>

          {report.status === 'completed' && summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Income</p>
                <p className="text-sm font-medium text-green-600">
                  +${summary.income?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expenses</p>
                <p className="text-sm font-medium text-red-600">
                  -${summary.expenses?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Net</p>
                <p className={cn(
                  'text-sm font-medium',
                  (summary.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {(summary.netBalance || 0) >= 0 ? '+' : ''}${summary.netBalance?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Savings Rate</p>
                <p className="text-sm font-medium text-gray-900">
                  {summary.savingsRate?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          )}

          {report.status === 'failed' && (
            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Report generation failed. Please try again.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/reports/${report.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Empty State
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16 bg-white rounded-lg border border-gray-200 border-dashed">
      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Generate your first financial report to track your spending, income, and savings over time.
      </p>
      <Button onClick={onCreate} className={primaryButton}>
        <Plus className="h-4 w-4 mr-2" />
        Generate First Report
      </Button>
    </div>
  )
}

// Skeleton Loader
function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-32 mt-2" />
              <div className="grid grid-cols-4 gap-4 mt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
