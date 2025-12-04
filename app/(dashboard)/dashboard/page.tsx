'use client'

import { useState, useCallback } from 'react'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"

// Context & Hooks
import { useAuth } from '@/context/auth-context'
import { useTransactions } from '@/hooks/use-transactions'
import { useDashboardData, useDashboardActions } from './_hooks'

// Components
import { PageSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { BalanceDialog } from "@/components/app/dialogs/balance-dialog"
import { TransactionDialog } from "@/components/app/transactions/transaction-dialog"
import { UploadDialog } from "@/components/app/dialogs/upload-dialog"

// New Components
import { 
  WelcomeBanner,
  StatsOverview, 
  QuickActions,
  QuickStats,
  ChartsGrid, 
  TransactionsList,
  SpendingInsights,
  MonthlyComparison
} from './_components'

const DEFAULT_DATE_RANGE = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function DashboardPage() {
  const { user } = useAuth()
  
  // Dialog states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  
  // Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE)
  
  // Fetch transactions
  const { 
    transactions: transactionsList, 
    loading: isLoading, 
    refresh: refreshTransactions,
    deleteTransaction,
    updateTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions
  } = useTransactions(dateRange)

  // Transform data for components
  const { chartTransactions, recentTransactions, hasTransactions } = useDashboardData(transactionsList)

  // Action handlers
  const {
    handleTransactionSubmit,
    handleDeleteTransaction,
    handleBulkDelete,
    handleEditTransaction,
    handleBulkEdit
  } = useDashboardActions({
    user,
    refreshTransactions,
    deleteTransaction,
    bulkDeleteTransactions,
    updateTransaction,
    bulkUpdateTransactions
  })

  // Date change handler
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    setDateRange({
      from: startOfMonth(date),
      to: endOfMonth(date)
    })
  }, [])

  // Dialog handlers
  const openAddTransaction = useCallback(() => setIsAddTransactionOpen(true), [])
  const openUploadFile = useCallback(() => setIsUploadFileOpen(true), [])
  const openBalanceDialog = useCallback(() => setIsBalanceDialogOpen(true), [])

  // Get user display name
  const userName = user?.fullName || user?.email?.split('@')[0] || 'there'

  // Show loading skeleton on initial load
  if (isLoading && !hasTransactions) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-[1400px]">
        {/* Welcome Banner */}
        <WelcomeBanner userName={userName} />

        {/* Quick Actions */}
        <QuickActions
          onAddTransaction={openAddTransaction}
          onUploadFile={openUploadFile}
          onAddBalance={openBalanceDialog}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* Stats Overview */}
        <ErrorBoundaryWrapper>
          <StatsOverview 
            transactions={chartTransactions}
            isLoading={isLoading}
          />
        </ErrorBoundaryWrapper>

        {/* Quick Stats */}
        {hasTransactions && (
          <div className="mb-6">
            <QuickStats transactions={chartTransactions} />
          </div>
        )}

        {/* Two Column Layout - Charts and Insights */}
        {hasTransactions && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left: Charts (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <ChartsGrid transactions={chartTransactions} />
            </div>

            {/* Right: Insights (1 col) */}
            <div className="space-y-6">
              <SpendingInsights transactions={chartTransactions} />
              <MonthlyComparison transactions={chartTransactions} />
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {hasTransactions && (
          <div className="mb-6">
            <TransactionsList
              transactions={recentTransactions}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Empty State */}
        {!hasTransactions && !isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No transactions yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Get started by adding your first transaction
              </p>
              <button
                onClick={openAddTransaction}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white text-sm font-medium rounded-lg hover:bg-[#5851EA] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add transaction
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BalanceDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen}
      />

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create"
      />

      <UploadDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen}
      />
    </div>
  )
}
