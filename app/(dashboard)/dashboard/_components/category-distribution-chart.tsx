'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface CategoryData {
  name: string
  total: number
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

interface CategoryDistributionChartProps {
  data: CategoryData[]
  loading: boolean
  className?: string
}

export function CategoryDistributionChart({
  data,
  loading,
  className,
}: CategoryDistributionChartProps) {
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

  // Take top 8 categories
  const chartData = data.slice(0, 8)

  if (chartData.length === 0) {
    return (
      <Card className={cn("h-[350px] sm:h-[400px]", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Category Distribution</CardTitle>
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
        <CardTitle className="text-base sm:text-lg">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Chart Container */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="total"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name,
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Scrollable on small screens */}
        <div className="mt-2 pt-2 border-t flex-shrink-0 overflow-y-auto max-h-[100px] sm:max-h-[120px]">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:text-sm">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
