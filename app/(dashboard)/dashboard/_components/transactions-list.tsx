"use client"

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from 'lucide-react'
import { formatCurrency } from "@/utils/format"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  name: string
  amount: number
  type: 'Income' | 'Expense'
  date: string
  category_name: string | null
}

interface TransactionsListProps {
  transactions: Transaction[]
  isLoading: boolean
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'Income'
  
  return (
    <div className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-green-50' : 'bg-gray-100'}`}>
          <span className={`text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-gray-600'}`}>
            {transaction.category_name?.charAt(0) || transaction.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{transaction.name}</p>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span>
              {new Date(transaction.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            {transaction.category_name && (
              <>
                <span>·</span>
                <Badge variant="secondary" className="text-xs font-normal py-0 px-1.5 bg-gray-100 text-gray-600 border-0">
                  {transaction.category_name}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
          {isIncome ? '+' : '−'}{formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  )
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-200" />
          <Skeleton className="h-3 w-48 bg-gray-200" />
        </div>
      </div>
      <Skeleton className="h-4 w-20 bg-gray-200" />
    </div>
  )
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  const displayTransactions = transactions.slice(0, 6)
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[#635BFF] hover:text-[#5851EA] hover:bg-[#635BFF]/5 -mr-2"
        >
          <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="px-6 py-3">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : displayTransactions.length > 0 ? (
          <div className="space-y-1">
            {displayTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
