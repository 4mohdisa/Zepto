'use client'

import { useDashboardPeriod } from '@/hooks/use-dashboard-period'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { PeriodFilter } from './_components/period-filter'
import { CurrentBalanceHero } from './_components/current-balance-hero'
import { KpiRow } from './_components/kpi-row'
import { TransactionAnalysisChart } from './_components/transaction-analysis-chart'
import { CategoryDistributionChart } from './_components/category-distribution-chart'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { TransactionDialog } from '@/components/app/transactions/transaction-dialog'
import { UploadDialog } from '@/components/app/dialogs/upload-dialog'

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

  const { data, loading, error, refetch } = useDashboardData(period)

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px]">
        {/* Header with Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          
          <div className="flex items-center gap-3">
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
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            <Button
              size="sm"
              onClick={() => setIsAddTransactionOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Top Section: Current Balance + KPIs */}
        <div className="space-y-6 mb-6">
          <CurrentBalanceHero
            totalBalance={data?.total_balance || 0}
            balancesByAccount={data?.balances_by_account || []}
            loading={loading}
          />

          <KpiRow kpis={data?.kpis || null} loading={loading} />
        </div>

        {/* Bottom Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionAnalysisChart
            data={data?.daily_series || []}
            loading={loading}
          />
          <CategoryDistributionChart
            data={data?.category_distribution || []}
            loading={loading}
          />
        </div>
      </div>

      {/* Dialogs */}
      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        mode="create"
      />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={refetch}
      />
    </div>
  )
}
