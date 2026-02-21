"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from "@/utils/format"

interface Transaction {
  amount: number
  type: string | null
  category_name?: string | null
  date?: string | Date
  [key: string]: any
}

interface CategoryTrendsProps {
  transactions?: Transaction[]
}

export function CategoryTrends({ transactions = [] }: CategoryTrendsProps) {
  const trends = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return []
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Parse date parts to avoid timezone issues
    const parseDateParts = (dateStr: string) => {
      const parts = dateStr.split('-').map(Number)
      return { year: parts[0], month: parts[1] - 1 } // month is 0-indexed
    }

    // Current month spending by category
    const currentMonthCategories: Record<string, number> = {}
    transactions
      .filter(t => {
        if (!t.date) return false
        const { year, month } = parseDateParts(String(t.date))
        return t.type === 'Expense' && 
               month === currentMonth && 
               year === currentYear
      })
      .forEach(t => {
        const category = t.category_name || 'Uncategorized'
        currentMonthCategories[category] = (currentMonthCategories[category] || 0) + t.amount
      })

    // Previous month spending by category
    const prevMonthCategories: Record<string, number> = {}
    transactions
      .filter(t => {
        if (!t.date) return false
        const { year, month } = parseDateParts(String(t.date))
        return t.type === 'Expense' && 
               month === prevMonth && 
               year === prevYear
      })
      .forEach(t => {
        const category = t.category_name || 'Uncategorized'
        prevMonthCategories[category] = (prevMonthCategories[category] || 0) + t.amount
      })

    // Calculate trends
    const allCategories = new Set([
      ...Object.keys(currentMonthCategories),
      ...Object.keys(prevMonthCategories)
    ])

    const categoryTrends = Array.from(allCategories).map(category => {
      const current = currentMonthCategories[category] || 0
      const previous = prevMonthCategories[category] || 0
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)
      
      return {
        category,
        current,
        previous,
        change,
        isIncreasing: change > 0
      }
    })

    // Sort by current spending (highest first)
    return categoryTrends
      .filter(t => t.current > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 5)
  }, [transactions])

  if (trends.length === 0) {
    return null
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = monthNames[new Date().getMonth()]
  const prevMonth = monthNames[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Category Trends</CardTitle>
          <div className="text-xs text-gray-500">{prevMonth} → {currentMonth}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.category} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="text-sm font-medium text-gray-700">{trend.category}</span>
                  {Math.abs(trend.change) > 0 && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                      trend.isIncreasing 
                        ? 'text-red-700 bg-red-50' 
                        : 'text-green-700 bg-green-50'
                    }`}>
                      {trend.isIncreasing ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(trend.change).toFixed(0)}%
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(trend.current)}
                </span>
              </div>
              
              {/* Comparison bars */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-gray-500">{currentMonth}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B85FF] rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="w-16 text-xs text-right text-gray-600 tabular-nums">
                    {formatCurrency(trend.current)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-12 text-xs text-gray-400">{prevMonth}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-300 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${trend.previous > 0 ? (trend.previous / trend.current) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="w-16 text-xs text-right text-gray-400 tabular-nums">
                    {formatCurrency(trend.previous)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

