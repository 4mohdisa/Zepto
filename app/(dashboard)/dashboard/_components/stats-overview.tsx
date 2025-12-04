"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"

interface Transaction {
  amount: number
  type: string | null
  category_name?: string | null
  date?: string | Date
  [key: string]: any
}

interface StatsOverviewProps {
  transactions?: Transaction[]
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  isLast?: boolean
}

const StatCard = React.memo(({ title, value, trend, isLast }: StatCardProps) => {
  return (
    <div className={cn("flex flex-col py-5", !isLast && "border-r border-gray-200 pr-8")}>
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
        {title}
      </span>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-gray-900">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </span>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
})

StatCard.displayName = 'StatCard'

const StatCardSkeleton = ({ isLast }: { isLast?: boolean }) => (
  <div className={cn("flex flex-col py-5", !isLast && "border-r border-gray-200 pr-8")}>
    <Skeleton className="h-3 w-20 mb-2 bg-gray-200" />
    <Skeleton className="h-7 w-28 bg-gray-200" />
  </div>
)

export const StatsOverview = React.memo(function StatsOverview({ 
  transactions = [], 
  isLoading = false 
}: StatsOverviewProps) {
  
  const metrics = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        topCategory: "None",
        incomeChange: 0,
        expensesChange: 0,
        balanceChange: 0,
      }
    }
    
    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
      
    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
    
    const categoryMap: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        const category = t.category_name || 'Uncategorized'
        categoryMap[category] = (categoryMap[category] || 0) + (parseFloat(String(t.amount)) || 0)
      })
    
    let topCategory = "None"
    let maxAmount = 0
    Object.entries(categoryMap).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount
        topCategory = category
      }
    })
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || '')
      const transactionMonth = transactionDate.getMonth()
      const transactionYear = transactionDate.getFullYear()
      
      if (currentMonth === 0) {
        return transactionMonth === 11 && transactionYear === currentYear - 1
      } else {
        return transactionMonth === currentMonth - 1 && transactionYear === currentYear
      }
    })
    
    const prevIncome = previousMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
      
    const prevExpenses = previousMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
    
    const prevBalance = prevIncome - prevExpenses
    
    const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : (income > 0 ? 100 : 0)
    const expensesChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : (expenses > 0 ? 100 : 0)
    const balanceChange = prevBalance !== 0 ? ((income - expenses - prevBalance) / Math.abs(prevBalance)) * 100 : 
                         (income - expenses > 0 ? 100 : (income - expenses < 0 ? -100 : 0))
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      topCategory,
      incomeChange,
      expensesChange,
      balanceChange,
    }
  }, [transactions])

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="grid grid-cols-4 divide-x divide-gray-200 px-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} isLast={i === 4} />
          ))}
        </div>
      </div>
    )
  }
  
  const stats = [
    {
      title: "Income",
      value: metrics.totalIncome,
      trend: { value: metrics.incomeChange, isPositive: metrics.incomeChange >= 0 },
    },
    {
      title: "Expenses",
      value: metrics.totalExpenses,
      trend: { value: Math.abs(metrics.expensesChange), isPositive: metrics.expensesChange < 0 },
    },
    {
      title: "Net Balance",
      value: metrics.netBalance,
      trend: { value: metrics.balanceChange, isPositive: metrics.balanceChange >= 0 },
    },
    {
      title: "Top Category",
      value: metrics.topCategory,
    },
  ]
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} isLast={index === stats.length - 1} />
        ))}
      </div>
    </div>
  )
})
