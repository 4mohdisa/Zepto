'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useReport } from '@/hooks/use-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertCircle,
  Building2,
  Tag,
  Store,
  Repeat,
  Receipt,
  Loader2,
  MoreHorizontal,
  Pencil,
  Printer,
  Trash2,
  Check,
  X,
  FileText
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { pageContainer, pageContent, secondaryButton, primaryButton } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { useState, useRef, useCallback } from 'react'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'

// Safe date format helper
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

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  const { report, loading, error, updateReport } = useReport(reportId)
  const [isExporting, setIsExporting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Initialize rename state when report loads
  if (report && newName === '' && !isRenaming) {
    setNewName(report.name)
  }

  const handleExport = useCallback(async () => {
    if (!report) return
    
    setIsExporting(true)
    
    try {
      // Update export tracking
      await updateReport({ exported: true })
      
      // Show success feedback
      setShowExportSuccess(true)
      setTimeout(() => setShowExportSuccess(false), 3000)
      
      // Trigger print dialog for PDF export
      if (printRef.current) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          const printContent = printRef.current.innerHTML
          const styles = generatePrintStyles()
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${report.name} - Zepto Report</title>
                ${styles}
              </head>
              <body>
                <div class="zepto-report">
                  <div class="report-header">
                    <div class="report-brand">Zepto</div>
                    <div class="report-title">${report.name}</div>
                    <div class="report-meta">
                      ${safeFormatDate(report.date_from, 'MMM dd, yyyy')} - ${safeFormatDate(report.date_to, 'MMM dd, yyyy')}
                      <span>•</span>
                      Generated on ${safeFormatDate(report.generated_at, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  ${printContent}
                  <div class="report-footer">
                    <div class="report-footer-brand">Zepto Financial Report</div>
                    <p class="report-footer-text">This report was generated from your Zepto dashboard data.</p>
                  </div>
                </div>
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
          }, 250)
        }
      }
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }, [report, updateReport])

  const handleRename = useCallback(async () => {
    if (!report || !newName.trim() || newName.trim() === report.name) {
      setIsRenaming(false)
      return
    }
    
    const success = await updateReport({ name: newName.trim() })
    if (success) {
      setIsRenaming(false)
    }
  }, [report, newName, updateReport])

  const handleCancelRename = useCallback(() => {
    setIsRenaming(false)
    if (report) {
      setNewName(report.name)
    }
  }, [report])

  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      router.push('/reports')
    } catch (err) {
      console.error('Error deleting report:', err)
    }
  }, [reportId, router])

  if (loading) {
    return <ReportDetailSkeleton />
  }

  if (error || !report) {
    return (
      <div className={pageContainer}>
        <div className={pageContent}>
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Report not found</h2>
            <p className="text-sm text-gray-500 mb-4">
              {error?.message || "The report you're looking for doesn't exist or has been deleted."}
            </p>
            <Link href="/reports">
              <Button variant="outline">Back to Reports</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const snapshot = report.snapshot_json
  const summary = report.summary_json
  const insights = report.insights_json || []

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="pl-0 mb-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Reports
              </Button>
            </Link>
            
            {/* Title with rename functionality */}
            <div className="flex items-center gap-3 flex-wrap">
              {isRenaming ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-lg font-bold h-10 flex-1 min-w-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') handleCancelRename()
                    }}
                  />
                  <Button size="sm" onClick={handleRename} className="h-10 px-3">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelRename} className="h-10 px-3">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{report.name}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRenaming(true)}
                    className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {safeFormatDate(report.date_from, 'MMM dd, yyyy')} - {safeFormatDate(report.date_to, 'MMM dd, yyyy')}
              </span>
              <StatusBadge status={report.status} />
              <span className="text-xs text-gray-400">
                Generated {safeFormatDate(report.generated_at, 'MMM dd, yyyy HH:mm')}
              </span>
              {report.export_count > 0 && (
                <span className="text-xs text-gray-400">
                  • Exported {report.export_count} time{report.export_count > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showExportSuccess && (
              <span className="text-sm text-green-600 flex items-center gap-1 animate-fade-in">
                <Check className="h-4 w-4" />
                Ready to print
              </span>
            )}
            
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || report.status !== 'completed'}
              className={secondaryButton}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print / PDF
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-gray-300">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {report.status === 'completed' && snapshot && (
          <div ref={printRef} className="space-y-6">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="grid gap-3">
                {insights.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Income"
                value={summary?.income || 0}
                prefix="+"
                icon={<TrendingUp className="h-4 w-4" />}
                color="green"
                comparison={snapshot.comparison}
                comparisonField="income"
              />
              <KPICard
                title="Total Expenses"
                value={summary?.expenses || 0}
                prefix="-"
                icon={<TrendingDown className="h-4 w-4" />}
                color="red"
                comparison={snapshot.comparison}
                comparisonField="expenses"
              />
              <KPICard
                title="Net Balance"
                value={summary?.netBalance || 0}
                icon={<Wallet className="h-4 w-4" />}
                color={summary?.netBalance >= 0 ? 'green' : 'red'}
                comparison={snapshot.comparison}
                comparisonField="netBalance"
              />
              <KPICard
                title="Savings Rate"
                value={`${summary?.savingsRate?.toFixed(1) || 0}%`}
                icon={<PiggyBank className="h-4 w-4" />}
                color="blue"
                isPercentage
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Balances */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    Account Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshot.balancesByAccount?.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.balancesByAccount.map((account: any) => (
                        <div key={account.account_type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{account.account_type}</span>
                          <span className="text-sm font-medium font-mono">
                            ${account.current_balance?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Balance</span>
                        <span className="text-sm font-bold font-mono">
                          ${summary?.totalBalance?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No account balance data</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    Top Expense Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshot.topCategories?.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.topCategories.slice(0, 5).map((cat: any) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">{cat.name}</span>
                            <span className="text-sm font-medium font-mono">
                              ${cat.total?.toLocaleString()}
                              <span className="text-xs text-gray-400 ml-1">
                                ({cat.percentage?.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${Math.min(cat.percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No expense data</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Merchants */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    Top Merchants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshot.topMerchants?.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.topMerchants.slice(0, 5).map((merchant: any) => (
                        <div key={merchant.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-900">{merchant.name}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {merchant.transactionCount} transactions
                            </span>
                          </div>
                          <span className="text-sm font-medium font-mono">
                            ${merchant.total?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No merchant data</p>
                  )}
                </CardContent>
              </Card>

              {/* Recurring Commitments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-gray-500" />
                    Recurring Commitments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshot.recurringCommitments?.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.recurringCommitments.slice(0, 5).map((rec: any) => (
                        <div key={rec.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-900">{rec.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{rec.frequency}</span>
                          </div>
                          <span className="text-sm font-medium text-red-600 font-mono">
                            -${rec.amount?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Monthly</span>
                        <span className="text-sm font-bold text-red-600 font-mono">
                          -${snapshot.recurringCommitments.reduce((sum: number, r: any) => sum + (r.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recurring payments</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Largest Expenses */}
            {snapshot.largestExpenses?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    Largest Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {snapshot.largestExpenses.slice(0, 5).map((tx: any) => (
                      <div key={tx.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tx.name}</p>
                          <p className="text-xs text-gray-500">
                            {safeFormatDate(tx.date, 'MMM dd, yyyy')}
                            {tx.category_name && ` • ${tx.category_name}`}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-red-600 font-mono">
                          -${tx.amount?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Section */}
            {snapshot.comparison && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">
                    Month-over-Month Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <ComparisonItem
                      label="Income"
                      current={snapshot.comparison.currentIncome}
                      previous={snapshot.comparison.previousIncome}
                      change={snapshot.comparison.incomeChange}
                      changePercent={snapshot.comparison.incomeChangePercent}
                    />
                    <ComparisonItem
                      label="Expenses"
                      current={snapshot.comparison.currentExpenses}
                      previous={snapshot.comparison.previousExpenses}
                      change={snapshot.comparison.expensesChange}
                      changePercent={snapshot.comparison.expensesChangePercent}
                      inverse
                    />
                    <ComparisonItem
                      label="Net Balance"
                      current={snapshot.comparison.currentNetBalance}
                      previous={snapshot.comparison.previousNetBalance}
                      change={snapshot.comparison.netBalanceChange}
                      changePercent={snapshot.comparison.netBalanceChangePercent}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {report.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Report Generation Failed</h3>
            <p className="text-sm text-red-600">
              Something went wrong while generating this report. Please try creating a new report.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
      />
    </div>
  )
}

// Generate print styles for professional report
function generatePrintStyles(): string {
  return `
    <style>
      @page { size: auto; margin: 15mm; }
      * { box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #0f172a;
        background: #fff;
        line-height: 1.6;
        padding: 0;
        margin: 0;
        font-size: 10pt;
      }
      
      .zepto-report {
        max-width: 210mm;
        margin: 0 auto;
      }
      
      /* Header Section */
      .report-header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 3px solid #0f172a;
        margin-bottom: 24px;
      }
      
      .report-brand {
        font-size: 28pt;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #0f172a;
        margin-bottom: 4px;
      }
      
      .report-title {
        font-size: 16pt;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }
      
      .report-meta {
        font-size: 10pt;
        color: #64748b;
      }
      
      .report-meta span {
        margin: 0 8px;
        color: #94a3b8;
      }
      
      /* Section Styling */
      .mb-6 { margin-bottom: 24px; }
      .space-y-6 > * + * { margin-top: 24px; }
      .space-y-3 > * + * { margin-top: 12px; }
      .gap-3 { gap: 12px; }
      .grid { display: grid; }
      .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      @media (max-width: 600px) {
        .grid-cols-4, .grid-cols-2 { grid-template-columns: 1fr; }
      }
      
      /* Cards */
      .rounded-lg { border-radius: 8px; }
      .border { border: 1px solid #e2e8f0; }
      .bg-white { background: #fff; }
      .bg-gray-50 { background: #f8fafc; }
      .bg-gray-100 { background: #f1f5f9; }
      .bg-green-50 { background: #f0fdf4; }
      .bg-red-50 { background: #fef2f2; }
      .bg-blue-50 { background: #eff6ff; }
      .bg-yellow-50 { background: #fefce8; }
      .p-6 { padding: 24px; }
      .p-4 { padding: 16px; }
      .p-3 { padding: 12px; }
      .pb-3 { padding-bottom: 12px; }
      
      /* Typography */
      .text-2xl { font-size: 20pt; font-weight: 700; }
      .text-xl { font-size: 16pt; font-weight: 700; }
      .text-lg { font-size: 14pt; font-weight: 600; }
      .text-base { font-size: 11pt; }
      .text-sm { font-size: 10pt; }
      .text-xs { font-size: 9pt; }
      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .font-medium { font-weight: 500; }
      .font-mono { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
      
      .text-gray-900 { color: #0f172a; }
      .text-gray-700 { color: #334155; }
      .text-gray-600 { color: #475569; }
      .text-gray-500 { color: #64748b; }
      .text-gray-400 { color: #94a3b8; }
      .text-green-600 { color: #16a34a; }
      .text-green-700 { color: #15803d; }
      .text-red-600 { color: #dc2626; }
      .text-red-700 { color: #b91c1c; }
      .text-blue-600 { color: #2563eb; }
      .text-yellow-700 { color: #a16207; }
      
      /* Layout */
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-2 { gap: 8px; }
      .gap-4 { gap: 16px; }
      .gap-6 { gap: 24px; }
      
      /* Dividers */
      .divide-y > * + * { border-top: 1px solid #e2e8f0; }
      
      /* Progress Bars */
      .h-1-5 { height: 6px; }
      .bg-gray-100 { background: #f1f5f9; }
      .bg-blue-500 { background: #3b82f6; }
      .rounded-full { border-radius: 9999px; }
      .overflow-hidden { overflow: hidden; }
      
      /* Section Header */
      .section-title {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      /* Footer */
      .report-footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 2px solid #e2e8f0;
        text-align: center;
      }
      
      .report-footer-brand {
        font-size: 12pt;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 4px;
      }
      
      .report-footer-text {
        font-size: 8pt;
        color: #94a3b8;
      }
      
      @media print {
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .mb-6, .space-y-6 > * { page-break-inside: avoid; }
      }
    </style>
  `
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
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

// Insight Card
function InsightCard({ insight }: { insight: any }) {
  const colors: Record<string, string> = {
    positive: 'bg-green-50 border-green-200 text-green-800',
    negative: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  }

  return (
    <div className={cn('rounded-lg border p-3', colors[insight.type] || colors.neutral)}>
      <p className="font-medium text-sm">{insight.title}</p>
      <p className="text-sm opacity-90 mt-1">{insight.description}</p>
    </div>
  )
}

// KPI Card
function KPICard({
  title,
  value,
  prefix = '',
  icon,
  color,
  comparison,
  comparisonField,
  isPercentage = false
}: any) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
  }

  const change = comparison && comparisonField ? comparison[`${comparisonField}Change`] : null
  const changePercent = comparison && comparisonField ? comparison[`${comparisonField}ChangePercent`] : null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('p-2 rounded-lg', colorClasses[color] || colorClasses.blue)}>
            {icon}
          </div>
          {change !== null && (
            <div className={cn(
              'text-xs font-medium flex items-center',
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            )}>
              {change > 0 ? '+' : ''}{changePercent?.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className={cn('text-2xl font-bold font-mono', colorClasses[color]?.split(' ')[0] || 'text-gray-900')}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Comparison Item
function ComparisonItem({ label, current, previous, change, changePercent, inverse = false }: any) {
  const isPositive = inverse ? change < 0 : change > 0

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className="text-xl font-bold font-mono">${current?.toLocaleString()}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn(
          'text-xs font-medium',
          isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
        )}>
          {change > 0 ? '+' : ''}{change?.toLocaleString()}
        </span>
        <span className={cn(
          'text-xs',
          isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
        )}>
          ({change > 0 ? '+' : ''}{changePercent?.toFixed(1)}%)
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        vs ${previous?.toLocaleString()} last period
      </p>
    </div>
  )
}

// Skeleton Loader
function ReportDetailSkeleton() {
  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        <div className="mb-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}
