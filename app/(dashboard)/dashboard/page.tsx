'use client'

import { useDashboardPeriod } from '@/hooks/use-dashboard-period'
import { useDashboardCache, invalidateCache } from '@/hooks/use-data-cache'
import { PeriodFilter } from './_components/period-filter'
import { CurrentBalanceHero } from './_components/current-balance-hero'
import { KpiRow } from './_components/kpi-row'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useState, Suspense, lazy, useCallback } from 'react'
import { TransactionDialog } from '@/components/app/transactions/transaction-dialog'
import { UploadDialog } from '@/components/app/dialogs/upload-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'

// Dynamic imports for heavy chart components
const TransactionAnalysisChart = lazy(() => 
  import('./_components/transaction-analysis-chart').then(mod => ({ default: mod.TransactionAnalysisChart }))
)
const CategoryDistributionChart = lazy(() => 
  import('./_components/category-distribution-chart').then(mod => ({ default: mod.CategoryDistributionChart }))
)

// Loading fallback for charts
function ChartSkeleton() {
  return (
    <div className="h-[350px] sm:h-[400px] border rounded-lg p-4 bg-white">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  )
}

export default function DashboardPage() {
  const {
    period,
    year,
    month,
    setYear,
    setMonth,
    goToPreviousPeriod,
    goToNextPeriod,
    monthOptions,
    yearOptions,
  } = useDashboardPeriod()

  // Use cached data fetching
  const { data, loading, error, refetch } = useDashboardCache(period)

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Handle success with cache invalidation
  const handleSuccess = useCallback(() => {
    // Invalidate related caches
    invalidateCache('dashboard')
    invalidateCache('transactions')
    
    // Refetch current page
    refetch()
    
    toast.success('Dashboard updated')
  }, [refetch])

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1400px]">
        {/* Header with Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <PeriodFilter
              year={year}
              month={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
              onPrevious={goToPreviousPeriod}
              onNext={goToNextPeriod}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="text-xs sm:text-sm"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
            
            <Button
              size="sm"
              onClick={() => setIsAddTransactionOpen(true)}
              className="text-xs sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Top Section: Current Balance + KPIs */}
        <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
          <SectionErrorBoundary sectionName="Current Balance">
            <div className="animate-fade-in-scale">
              <CurrentBalanceHero
                totalBalance={data?.total_balance || 0}
                balancesByAccount={data?.balances_by_account || []}
                loading={loading}
                onBalanceUpdate={handleSuccess}
              />
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="KPIs">
            <div className="stagger-children">
              <KpiRow kpis={data?.kpis || null} loading={loading} />
            </div>
          </SectionErrorBoundary>
        </div>

        {/* Bottom Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionErrorBoundary sectionName="Transaction Analysis">
            <Suspense fallback={<ChartSkeleton />}>
              <TransactionAnalysisChart
                data={data?.daily_series || []}
                loading={loading}
              />
            </Suspense>
          </SectionErrorBoundary>
          
          <SectionErrorBoundary sectionName="Category Distribution">
            <Suspense fallback={<ChartSkeleton />}>
              <CategoryDistributionChart
                data={data?.category_distribution || []}
                loading={loading}
              />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Dialogs */}
      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        mode="create"
        onSuccess={handleSuccess}
      />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
