'use client'

import { useDashboardPeriod } from '@/hooks/use-dashboard-period'
import { useDashboardCache, invalidateCache } from '@/hooks/use-data-cache'
import { PeriodFilter } from './_components/period-filter'
import { CurrentBalanceHero } from './_components/current-balance-hero'
import { KpiRow } from './_components/kpi-row'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useState, Suspense, lazy, useCallback, useMemo } from 'react'
import { TransactionDialog } from '@/features/transactions/components/transaction-dialog'
import { UploadDialog } from '@/components/dialogs/upload-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'
import { 
  pageContainer, 
  pageContent, 
  flexBetween, 
  flexWrap,
  primaryButton,
  primaryButtonIcon,
  secondaryButton,
  sectionGap 
} from '@/lib/styles'

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

  // Memoize chart data references to prevent unnecessary re-renders
  const dailySeries = useMemo(() => data?.daily_series || [], [data?.daily_series])
  const categoryDistribution = useMemo(() => data?.category_distribution || [], [data?.category_distribution])
  const totalBalance = useMemo(() => data?.total_balance || 0, [data?.total_balance])
  const balancesByAccount = useMemo(() => data?.balances_by_account || [], [data?.balances_by_account])
  const kpis = useMemo(() => data?.kpis || null, [data?.kpis])

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
    <div className={`${pageContainer} page-transition`}>
      <div className={pageContent}>
        {/* Header with Period Filter */}
        <div className={`${flexBetween} mb-4 sm:mb-6`}>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          
          <div className={`${flexWrap} overflow-x-auto pb-1 sm:pb-0`}>
            <div className="flex-shrink-0">
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
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className={secondaryButton}
            >
              <Upload className={primaryButtonIcon} />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
            
            <Button
              size="sm"
              onClick={() => setIsAddTransactionOpen(true)}
              className={primaryButton}
            >
              <Plus className={primaryButtonIcon} />
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
        <div className={`${sectionGap} mb-4 sm:mb-6`}>
          <SectionErrorBoundary sectionName="Current Balance">
            <div className="animate-fade-in-scale">
              <CurrentBalanceHero
                totalBalance={totalBalance}
                balancesByAccount={balancesByAccount}
                loading={loading}
                onBalanceUpdate={handleSuccess}
              />
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="KPIs">
            <div className="stagger-children">
              <KpiRow kpis={kpis} loading={loading} />
            </div>
          </SectionErrorBoundary>
        </div>

        {/* Bottom Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionErrorBoundary sectionName="Transaction Analysis">
            <Suspense fallback={<ChartSkeleton />}>
              <TransactionAnalysisChart
                data={dailySeries}
                loading={loading}
              />
            </Suspense>
          </SectionErrorBoundary>
          
          <SectionErrorBoundary sectionName="Category Distribution">
            <Suspense fallback={<ChartSkeleton />}>
              <CategoryDistributionChart
                data={categoryDistribution}
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
