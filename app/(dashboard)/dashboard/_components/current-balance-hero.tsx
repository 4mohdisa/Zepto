'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import { Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AccountBalance {
  account_type: string
  current_balance: number
}

interface CurrentBalanceHeroProps {
  totalBalance: number
  balancesByAccount: AccountBalance[]
  loading: boolean
}

export function CurrentBalanceHero({
  totalBalance,
  balancesByAccount,
  loading,
}: CurrentBalanceHeroProps) {
  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-16 w-64 mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Current Balance</h2>
        </div>

        <p className="text-5xl font-bold text-primary mb-4">
          {formatCurrency(totalBalance)}
        </p>

        {balancesByAccount.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {balancesByAccount.map((account) => (
              <div
                key={account.account_type}
                className="px-3 py-1.5 rounded-full bg-background/80 text-sm"
              >
                <span className="text-muted-foreground">{account.account_type}:</span>{' '}
                <span className="font-medium">
                  {formatCurrency(account.current_balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
