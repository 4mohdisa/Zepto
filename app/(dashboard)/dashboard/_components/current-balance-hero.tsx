'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { Wallet, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { BalanceDialog } from '@/components/app/dialogs/balance-dialog'

interface AccountBalance {
  account_type: string
  current_balance: number
}

interface CurrentBalanceHeroProps {
  totalBalance: number
  balancesByAccount: AccountBalance[]
  loading: boolean
  onBalanceUpdate?: () => void
}

export function CurrentBalanceHero({
  totalBalance,
  balancesByAccount,
  loading,
  onBalanceUpdate,
}: CurrentBalanceHeroProps) {
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card className="border-2 border-[#635BFF]/20 bg-gradient-to-br from-[#635BFF]/5 to-[#635BFF]/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
            <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
          </div>
          <Skeleton className="h-10 sm:h-16 w-40 sm:w-64 mb-3 sm:mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn(
        "border-2 border-[#635BFF]/20 bg-gradient-to-br from-[#635BFF]/5 to-[#635BFF]/10",
        "relative overflow-hidden"
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-lg bg-[#635BFF]/10">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-[#635BFF]" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold">Current Balance</h2>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBalanceDialogOpen(true)}
              className="bg-white/50 hover:bg-white/80 border-[#635BFF]/30 text-xs sm:text-sm h-8"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Set Balance
            </Button>
          </div>

          <p className="text-3xl sm:text-5xl font-bold text-[#635BFF] mb-3 sm:mb-4">
            {formatCurrency(totalBalance)}
          </p>

          {balancesByAccount.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {balancesByAccount.map((account) => (
                <div
                  key={account.account_type}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-background/80 text-xs sm:text-sm"
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

      <BalanceDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen}
        onSuccess={onBalanceUpdate}
      />
    </>
  )
}

export default CurrentBalanceHero;
