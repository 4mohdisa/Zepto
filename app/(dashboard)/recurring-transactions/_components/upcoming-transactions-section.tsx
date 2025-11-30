'use client'

import { UpcomingTransactionsTable } from '@/components/app/transactions/upcoming-table'

interface UpcomingTransactionsSectionProps {
  limit?: number
}

export function UpcomingTransactionsSection({ limit = 10 }: UpcomingTransactionsSectionProps) {
  return (
    <section className="space-y-4 md:space-y-6 w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600">
            Upcoming Transactions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Preview of your scheduled transactions
          </p>
        </div>
      </div>

      {/* Upcoming Transactions Table */}
      <div className="w-full">
        <UpcomingTransactionsTable limit={limit} />
      </div>
    </section>
  )
}
