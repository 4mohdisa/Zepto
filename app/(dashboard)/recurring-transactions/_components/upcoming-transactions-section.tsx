'use client'

import { UpcomingTransactionsTable } from "@/components/app/transactions/upcoming-table"

interface UpcomingTransactionsSectionProps {
  limit?: number
}

export function UpcomingTransactionsSection({ limit = 10 }: UpcomingTransactionsSectionProps) {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Upcoming transactions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Predicted based on your recurring patterns</p>
      </div>
      
      <UpcomingTransactionsTable limit={limit} />
    </div>
  )
}
