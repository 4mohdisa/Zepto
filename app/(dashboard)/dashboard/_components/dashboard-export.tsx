'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Download, Printer, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { primaryButton, secondaryButton } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface AccountBalance {
  account_type: string
  current_balance: number
}

interface CategoryItem {
  name: string
  total: number
}

interface DashboardData {
  period: string
  total_balance: number
  balances_by_account: AccountBalance[]
  kpis: {
    income: number
    expenses: number
    net_balance: number
    savings_rate: number
  }
  category_distribution: CategoryItem[]
}

interface DashboardExportProps {
  data: DashboardData | null
  loading: boolean
}

export function DashboardExport({ data, loading }: DashboardExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handleOpen = useCallback(() => {
    if (!data) {
      toast.error('No data available to export')
      return
    }
    setIsOpen(true)
  }, [data])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Failed to open print window')
      return
    }

    const styles = `
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
          font-size: 11pt;
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
        .section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .section-title {
          font-size: 9pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
        }
        
        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .kpi-card {
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
        }
        
        .kpi-label {
          font-size: 8pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .kpi-value {
          font-size: 20pt;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .kpi-value.positive { color: #16a34a; }
        .kpi-value.negative { color: #dc2626; }
        .kpi-value.neutral { color: #0f172a; }
        
        /* Summary Tables */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        @media (max-width: 600px) {
          .summary-grid { grid-template-columns: 1fr; }
          .kpi-grid { grid-template-columns: 1fr; }
        }
        
        .summary-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .card-header {
          background: #f1f5f9;
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .card-title {
          font-size: 10pt;
          font-weight: 600;
          color: #334155;
          margin: 0;
        }
        
        .card-body {
          padding: 0;
        }
        
        /* Row Items */
        .row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .row-item:last-child {
          border-bottom: none;
        }
        
        .row-item.total {
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
          font-weight: 600;
        }
        
        .row-name {
          font-size: 10pt;
          color: #475569;
        }
        
        .row-value {
          font-size: 10pt;
          font-weight: 600;
          color: #0f172a;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        
        .row-value.negative {
          color: #dc2626;
        }
        
        /* Empty State */
        .empty-state {
          padding: 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 10pt;
          font-style: italic;
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
          .no-print { display: none !important; }
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section { page-break-inside: avoid; }
          .kpi-card, .summary-card { break-inside: avoid; }
        }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zepto Dashboard Report</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    toast.success('Report sent to printer')
  }, [])

  const handleDownloadPDF = useCallback(() => {
    handlePrint()
    toast.success('Use Print to PDF in the print dialog to save as PDF')
  }, [handlePrint])

  if (loading || !data) {
    return null
  }

  const periodDate = new Date(data.period + '-01')
  const periodLabel = format(periodDate, 'MMMM yyyy')
  const generatedAt = format(new Date(), 'MMM dd, yyyy • h:mm a')

  // Get top 5 categories
  const topCategories = data.category_distribution.slice(0, 5)

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className={cn(secondaryButton, 'hidden sm:flex')}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Financial Report
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {periodLabel} • Generated {format(new Date(), 'MMM dd, yyyy')}
                </DialogDescription>
              </div>
              <div className="flex gap-2 no-print">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className={secondaryButton}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  size="sm"
                  className={primaryButton}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Report Preview */}
          <div ref={printRef} className="p-6 sm:p-8 bg-white">
            <div className="zepto-report">
              {/* Header */}
              <div className="report-header">
                <div className="report-brand">Zepto</div>
                <h1 className="report-title">Financial Dashboard Report</h1>
                <p className="report-meta">
                  {periodLabel} <span>•</span> Generated on {generatedAt}
                </p>
              </div>

              {/* KPI Summary */}
              <div className="section">
                <div className="section-header">
                  <span className="section-title">Financial Summary</span>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-label">Total Income</div>
                    <div className="kpi-value positive">
                      +{formatCurrency(data.kpis.income)}
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Total Expenses</div>
                    <div className="kpi-value negative">
                      -{formatCurrency(data.kpis.expenses)}
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Net Balance</div>
                    <div className={cn(
                      'kpi-value',
                      data.kpis.net_balance >= 0 ? 'positive' : 'negative'
                    )}>
                      {data.kpis.net_balance >= 0 ? '+' : ''}
                      {formatCurrency(data.kpis.net_balance)}
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Savings Rate</div>
                    <div className="kpi-value neutral">
                      {data.kpis.savings_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Balances & Categories Grid */}
              <div className="summary-grid">
                {/* Account Balances Card */}
                <div className="section">
                  <div className="summary-card">
                    <div className="card-header">
                      <h3 className="card-title">Account Balances</h3>
                    </div>
                    <div className="card-body">
                      {data.balances_by_account.length > 0 ? (
                        <>
                          {data.balances_by_account.map((account) => (
                            <div key={account.account_type} className="row-item">
                              <span className="row-name">{account.account_type}</span>
                              <span className="row-value">
                                {formatCurrency(account.current_balance)}
                              </span>
                            </div>
                          ))}
                          <div className="row-item total">
                            <span className="row-name">Total Balance</span>
                            <span className="row-value">
                              {formatCurrency(data.total_balance)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">No account balance data</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Categories Card */}
                <div className="section">
                  <div className="summary-card">
                    <div className="card-header">
                      <h3 className="card-title">Top Expense Categories</h3>
                    </div>
                    <div className="card-body">
                      {topCategories.length > 0 ? (
                        topCategories.map((category) => (
                          <div key={category.name} className="row-item">
                            <span className="row-name">{category.name}</span>
                            <span className="row-value negative">
                              -{formatCurrency(category.total)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No expense data for this period</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="report-footer">
                <div className="report-footer-brand">Zepto Financial Report</div>
                <p className="report-footer-text">
                  {periodLabel} • Generated from your Zepto dashboard data
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DashboardExport
