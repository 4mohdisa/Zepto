"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from "@/utils/format"

interface Transaction {
  amount: number
  type: string | null
  date?: string | Date
  [key: string]: any
}

interface MonthlyComparisonProps {
  transactions?: Transaction[]
}

export function MonthlyComparison({ transactions = [] }: MonthlyComparisonProps) {
  const comparison = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    // Current month
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date || '')
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date || '')
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    })

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevIncome = prevMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const prevExpenses = prevMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0
    const expensesChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0

    return {
      current: { income: currentIncome, expenses: currentExpenses },
      previous: { income: prevIncome, expenses: prevExpenses },
      changes: { income: incomeChange, expenses: expensesChange }
    }
  }, [transactions])

  if (!comparison) {
    return null
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = monthNames[new Date().getMonth()]
  const prevMonth = monthNames[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900">Month comparison</CardTitle>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Income Comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Income</span>
              <div className="flex items-center gap-2">
                {comparison.changes.income !== 0 && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${comparison.changes.income > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.changes.income > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(comparison.changes.income).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500">{currentMonth}</div>
                <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(comparison.current.income)}</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-gray-500">{prevMonth}</div>
                <div className="text-sm font-medium text-gray-600 tabular-nums">{formatCurrency(comparison.previous.income)}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Expenses Comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Expenses</span>
              <div className="flex items-center gap-2">
                {comparison.changes.expenses !== 0 && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${comparison.changes.expenses < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.changes.expenses < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {Math.abs(comparison.changes.expenses).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500">{currentMonth}</div>
                <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(comparison.current.expenses)}</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-gray-500">{prevMonth}</div>
                <div className="text-sm font-medium text-gray-600 tabular-nums">{formatCurrency(comparison.previous.expenses)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

