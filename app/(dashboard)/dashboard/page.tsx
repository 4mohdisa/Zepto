'use client'

import { useState, useCallback } from 'react'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"

// Context & Hooks
import { useAuth } from '@/context/auth-context'
import { useTransactions } from '@/hooks/use-transactions'
import { useDashboardData, useDashboardActions } from './_hooks'

// Components
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { BalanceDialog } from "@/components/app/dialogs/balance-dialog"
import { TransactionDialog } from "@/components/app/transactions/transaction-dialog"
import { UploadDialog } from "@/components/app/dialogs/upload-dialog"
import { AutoRunDataPopulation } from "@/test-data-generator"

// New Components
import { 
  WelcomeBanner,
  StatsOverview, 
  QuickActions,
  QuickStats,
  ChartsGrid, 
  TransactionsList,
  SpendingInsights,
  MonthlyComparison,
  CategoryTrends,
  AccountBalanceSummary,
  CurrentBalanceKPI
} from './_components'

// Data Generator
import { RealisticDataButton } from '@/test-data-generator'

// Show last 8 months of data to include populated historical data
const DEFAULT_DATE_RANGE = {
  from: new Date(2025, 6, 1), // July 2025
  to: endOfMonth(new Date())   // Current month end
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
    createTransaction,
    deleteTransaction,
    updateTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions
  } = useTransactions(dateRange)

  // Transform data for components
  const { chartTransactions, recentTransactions, hasTransactions } = useDashboardData(transactionsList)

  // Action handlers
  const {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auto-populate test data (dev only) */}
      <AutoRunDataPopulation />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px]">
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

        {/* Current Balance KPI - Big Display */}
        <div className="mt-6">
          <CurrentBalanceKPI />
        </div>

        {/* Stats Overview */}
        <ErrorBoundaryWrapper>
          <StatsOverview 
            transactions={chartTransactions}
            isLoading={isLoading}
          />
        </ErrorBoundaryWrapper>

        {/* Quick Stats */}
        {hasTransactions && (
          <QuickStats transactions={chartTransactions} />
        )}

        {/* Two Column Layout - Charts and Insights */}
        {hasTransactions && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
            {/* Left: Charts (2 cols) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <ChartsGrid transactions={chartTransactions} />
            </div>

            {/* Right: Insights (1 col) */}
            <div className="space-y-4 sm:space-y-6">
              <RealisticDataButton />
              <AccountBalanceSummary />
              <CategoryTrends transactions={chartTransactions} />
              <SpendingInsights transactions={chartTransactions} />
              <MonthlyComparison transactions={chartTransactions} />
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {hasTransactions && (
          <div className="mt-6">
            <TransactionsList
              transactions={recentTransactions}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Empty State */}
        {!hasTransactions && !isLoading && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#8B85FF] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Tracking Your Finances</h3>
              <p className="text-sm text-gray-500 mb-8 max-w-md text-center">
                Add your first transaction to begin monitoring your income and expenses. You'll get instant insights into your spending habits.
              </p>
              <button
                onClick={openAddTransaction}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#635BFF] text-white text-sm font-semibold rounded-lg hover:bg-[#5851EA] transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add your first transaction
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
        mode="create"
        createTransaction={createTransaction}
        updateTransaction={updateTransaction}
      />

      <UploadDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen}
      />
    </div>
  )
}
