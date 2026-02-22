'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'

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
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const items = [
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
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.iconClass}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.format(item.value)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
