"use client"

import { Suspense, memo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'

// Lazy load chart components
const SpendingChart = dynamic(
  () => import('@/components/app/charts/bar-chart-multiple').then(mod => ({ default: mod.SpendingChart })),
  { loading: () => <ChartLoadingSkeleton />, ssr: false }
)

const PieDonutChart = dynamic(
  () => import('@/components/app/charts/pie-donut-chart').then(mod => ({ default: mod.PieDonutChart })),
  { loading: () => <ChartLoadingSkeleton />, ssr: false }
)

const TransactionChart = dynamic(
  () => import('@/components/app/charts/bar-chart-interactive').then(mod => ({ default: mod.TransactionChart })),
  { loading: () => <ChartLoadingSkeleton />, ssr: false }
)

const NetBalanceChart = dynamic(
  () => import('@/components/app/charts/line-chart').then(mod => ({ default: mod.NetBalanceChart })),
  { loading: () => <ChartLoadingSkeleton />, ssr: false }
)

interface ChartTransaction {
  date: string
  amount: number
  type: string | null
  category_name: string | null
}

interface ChartsGridProps {
  transactions: ChartTransaction[]
}

function ChartLoadingSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <div className="space-y-3 w-full px-6">
        <Skeleton className="h-4 w-32 bg-gray-200" />
        <Skeleton className="h-[250px] w-full bg-gray-200" />
      </div>
    </div>
  )
}

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

export function ChartsGrid({ transactions }: ChartsGridProps) {
  return (
    <div className="space-y-6">
      {/* Main Chart - Full Width */}
      <div className="w-full">
        <ErrorBoundaryWrapper>
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <MemoizedTransactionChart transactions={transactions} />
          </Suspense>
        </ErrorBoundaryWrapper>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundaryWrapper>
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <MemoizedPieDonutChart transactions={transactions} />
          </Suspense>
        </ErrorBoundaryWrapper>

        <ErrorBoundaryWrapper>
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <MemoizedSpendingChart transactions={transactions} />
          </Suspense>
        </ErrorBoundaryWrapper>
      </div>

      {/* Net Balance - Full Width */}
      <div className="w-full">
        <ErrorBoundaryWrapper>
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <MemoizedNetBalanceChart transactions={transactions} />
          </Suspense>
        </ErrorBoundaryWrapper>
      </div>
    </div>
  )
}

