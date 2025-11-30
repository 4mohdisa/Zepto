'use client'

import { UpcomingTransactionsTable } from '@/components/app/transactions/upcoming-table'

interface UpcomingTransactionsSectionProps {
  limit?: number
}

export function UpcomingTransactionsSection({ limit = 10 }: UpcomingTransactionsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Upcoming Transactions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Preview of your scheduled transactions
          </p>
        </div>
      </div>
      <UpcomingTransactionsTable limit={limit} />
    </section>
  )
}
