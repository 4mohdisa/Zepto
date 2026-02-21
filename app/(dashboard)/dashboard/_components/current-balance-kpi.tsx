'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { useCurrentBalance } from '@/hooks/use-current-balance'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function CurrentBalanceKPI() {
  const { balanceSummary, totals, loading } = useCurrentBalance()

  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48 mt-2" />
        <Skeleton className="h-3 w-40 mt-1" />
        <Skeleton className="h-3 w-32 mt-1" />
        <Skeleton className="h-3 w-36 mt-1" />
        <Skeleton className="h-3 w-28 mt-1" />
        <Skeleton className="h-3 w-44 mt-1" />
        <Skeleton className="h-3 w-24 mt-1" />
        <Skeleton className="h-3 w-32 mt-1" />
          </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasBalances = balanceSummary.length > 0

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Current Balance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Updates automatically with transactions
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Balance - Big Number */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold text-primary">
            {formatCurrency(totals.totalCurrentBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Across {balanceSummary.length} account{balanceSummary.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Account Breakdown */}
        {hasBalances ? (
          <div className="space-y-3 mt-4">
            {balanceSummary.map((account) => (
              <div 
                key={account.account_type} 
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border"
              >
                <div className="flex-1">
                  <p className="font-medium">{account.account_type}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      From {new Date(account.effective_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +{formatCurrency(account.income_after)}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      -{formatCurrency(account.expenses_after)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-semibold",
                    account.current_balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(account.current_balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started: {formatCurrency(account.starting_balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No balances recorded yet</p>
            <p className="text-sm">Add your current balance to start tracking</p>
          </div>
        )}

        {/* Summary Stats */}
        {hasBalances && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Starting Balance</p>
              <p className="text-lg font-semibold">{formatCurrency(totals.totalStartingBalance)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Income Added</p>
              <p className="text-lg font-semibold text-green-600">+{formatCurrency(totals.totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Expenses Deducted</p>
              <p className="text-lg font-semibold text-red-600">-{formatCurrency(totals.totalExpenses)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
