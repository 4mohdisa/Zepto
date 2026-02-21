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

    // Parse date parts to avoid timezone issues
    const parseDateParts = (dateStr: string) => {
      const parts = dateStr.split('-').map(Number)
      return { year: parts[0], month: parts[1] - 1 } // month is 0-indexed
    }

    // Current month
    const currentMonthTransactions = transactions.filter(t => {
      if (!t.date) return false
      const { year, month } = parseDateParts(String(t.date))
      return month === currentMonth && year === currentYear
    })

    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthTransactions = transactions.filter(t => {
      if (!t.date) return false
      const { year, month } = parseDateParts(String(t.date))
      return month === prevMonth && year === prevYear
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
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Month Comparison</CardTitle>
          <div className="p-1.5 rounded-md bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Income Comparison */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Income</span>
              <div className="flex items-center gap-2">
                {comparison.changes.income !== 0 && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${comparison.changes.income > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {comparison.changes.income > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(comparison.changes.income).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{currentMonth}</div>
                <div className="text-base font-semibold text-gray-900 tabular-nums">{formatCurrency(comparison.current.income)}</div>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{prevMonth}</div>
                <div className="text-base font-medium text-gray-600 tabular-nums">{formatCurrency(comparison.previous.income)}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Expenses Comparison */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expenses</span>
              <div className="flex items-center gap-2">
                {comparison.changes.expenses !== 0 && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${comparison.changes.expenses < 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {comparison.changes.expenses < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {Math.abs(comparison.changes.expenses).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{currentMonth}</div>
                <div className="text-base font-semibold text-gray-900 tabular-nums">{formatCurrency(comparison.current.expenses)}</div>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{prevMonth}</div>
                <div className="text-base font-medium text-gray-600 tabular-nums">{formatCurrency(comparison.previous.expenses)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

