'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface KPIData {
  income: number
  expenses: number
  net_balance: number
  savings_rate: number
}

interface KpiRowProps {
  kpis: KPIData | null
  loading: boolean
}

export function KpiRow({ kpis, loading }: KpiRowProps) {
  // Memoize items array to prevent unnecessary re-renders
  const items = useMemo(() => [
    {
      label: 'Income',
      value: kpis?.income || 0,
      icon: TrendingUp,
      iconClass: 'text-green-600 bg-green-100',
      format: formatCurrency,
    },
    {
      label: 'Expenses',
      value: kpis?.expenses || 0,
      icon: TrendingDown,
      iconClass: 'text-red-600 bg-red-100',
      format: formatCurrency,
    },
    {
      label: 'Net Balance',
      value: kpis?.net_balance || 0,
      icon: Wallet,
      iconClass: kpis && kpis.net_balance >= 0
        ? 'text-green-600 bg-green-100'
        : 'text-red-600 bg-red-100',
      format: formatCurrency,
    },
    {
      label: 'Savings Rate',
      value: kpis?.savings_rate || 0,
      icon: PiggyBank,
      iconClass: 'text-blue-600 bg-blue-100',
      format: (v: number) => `${v.toFixed(1)}%`,
    },
  ], [kpis])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:pt-6">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-2" />
              <Skeleton className="h-6 sm:h-8 w-20 sm:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3 sm:p-4 sm:pt-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", item.iconClass)}>
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</p>
                <p className="text-lg sm:text-2xl font-semibold truncate">
                  {item.format(item.value)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
