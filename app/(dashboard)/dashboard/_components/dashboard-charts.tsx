'use client'

import { Suspense, memo } from 'react'
import dynamic from 'next/dynamic'
import { ChartSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'

// Lazy load chart components for better performance
const SpendingChart = dynamic(
  () => import('@/components/app/charts/bar-chart-multiple').then(mod => ({ default: mod.SpendingChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
)

const PieDonutChart = dynamic(
  () => import('@/components/app/charts/pie-donut-chart').then(mod => ({ default: mod.PieDonutChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
)

const TransactionChart = dynamic(
  () => import('@/components/app/charts/bar-chart-interactive').then(mod => ({ default: mod.TransactionChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
)

const NetBalanceChart = dynamic(
  () => import('@/components/app/charts/line-chart').then(mod => ({ default: mod.NetBalanceChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
)

interface ChartTransaction {
  date: string
  amount: number
  type: string | null
  category_name: string | null
}

interface DashboardChartsProps {
  transactions: ChartTransaction[]
}

// Memoize individual chart wrappers to prevent unnecessary re-renders
const MemoizedTransactionChart = memo(function MemoizedTransactionChart({ 
  transactions 
}: { 
  transactions: ChartTransaction[] 
}) {
  return (
    <TransactionChart 
      transactions={transactions}
      metrics={[
        { key: "Income", label: "Income", color: "hsl(var(--chart-1))" },
        { key: "Expense", label: "Expense", color: "hsl(var(--chart-2))" }
      ]}
    />
  )
})

const MemoizedPieDonutChart = memo(function MemoizedPieDonutChart({ 
  transactions 
}: { 
  transactions: ChartTransaction[] 
}) {
  return (
    <PieDonutChart 
      transactions={transactions.map(t => ({
        category_name: t.category_name,
        amount: t.amount,
        type: t.type
      }))}
    />
  )
})

const MemoizedNetBalanceChart = memo(function MemoizedNetBalanceChart({ 
  transactions 
}: { 
  transactions: ChartTransaction[] 
}) {
  return (
    <NetBalanceChart 
      transactions={transactions.map(t => ({
        date: t.date,
        amount: t.amount,
        type: t.type
      }))}
    />
  )
})

const MemoizedSpendingChart = memo(function MemoizedSpendingChart({ 
  transactions 
}: { 
  transactions: ChartTransaction[] 
}) {
  return (
    <SpendingChart 
      transactions={transactions.map(t => ({
        date: t.date,
        amount: t.amount,
        type: t.type
      }))}
    />
  )
})

export function DashboardCharts({ transactions }: DashboardChartsProps) {
  return (
    <section className="space-y-6">
      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Main Transaction Chart - Takes 2/3 on desktop */}
        <div className="xl:col-span-2 w-full">
          <ErrorBoundaryWrapper>
            <Suspense fallback={<ChartSkeleton />}>
              <MemoizedTransactionChart transactions={transactions} />
            </Suspense>
          </ErrorBoundaryWrapper>
        </div>

        {/* Category Breakdown - Takes 1/3 on desktop */}
        <div className="w-full">
          <ErrorBoundaryWrapper>
            <Suspense fallback={<ChartSkeleton />}>
              <MemoizedPieDonutChart transactions={transactions} />
            </Suspense>
          </ErrorBoundaryWrapper>
        </div>
      </div>

      {/* Secondary Charts Row - Equal width on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="w-full">
          <ErrorBoundaryWrapper>
            <Suspense fallback={<ChartSkeleton />}>
              <MemoizedNetBalanceChart transactions={transactions} />
            </Suspense>
          </ErrorBoundaryWrapper>
        </div>

        <div className="w-full">
          <ErrorBoundaryWrapper>
            <Suspense fallback={<ChartSkeleton />}>
              <MemoizedSpendingChart transactions={transactions} />
            </Suspense>
          </ErrorBoundaryWrapper>
        </div>
      </div>
    </section>
  )
}
