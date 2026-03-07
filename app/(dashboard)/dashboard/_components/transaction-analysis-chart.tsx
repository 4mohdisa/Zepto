'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DailyData {
  date: string
  income: number
  expense: number
}

interface TransactionAnalysisChartProps {
  data: DailyData[]
  loading: boolean
  className?: string
}

export function TransactionAnalysisChart({
  data,
  loading,
  className,
}: TransactionAnalysisChartProps) {
  // Memoize data transformation to prevent re-calculation on every render
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      day: d.date.split('-')[2],
    }))
  }, [data])

  if (loading) {
    return (
      <Card className={cn("h-[350px] sm:h-[400px]", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn("h-[350px] sm:h-[400px]", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Transaction Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("h-[350px] sm:h-[400px] flex flex-col", className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg">Transaction Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={formattedData} 
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `$${value}`}
              width={50}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name,
              ]}
              labelFormatter={(label) => `Day ${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#22c55e"
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="#ef4444"
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
