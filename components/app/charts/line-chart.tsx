"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { formatCurrency } from '@/utils/format'

interface Transaction {
  date: string;
  amount: number;
  type: string | null;
  category_name?: string | null;
  [key: string]: any;
}

interface DailyBalance {
  date: string
  balance: number
}

interface NetBalanceChartProps {
  transactions?: Transaction[];
}

// Process transactions data for the chart
const processTransactions = (transactions: Transaction[]): DailyBalance[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get date range from transactions
  const dates = transactions.map(t => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  // Generate all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  let runningBalance = 0;
  const dailyBalances: DailyBalance[] = [];
  
  allDays.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === dayStr);
    
    // Calculate net change for this day
    const dayNet = dayTransactions.reduce((net, transaction) => {
      const amount = parseFloat(String(transaction.amount)) || 0;
      return net + (transaction.type === 'Income' ? amount : -amount);
    }, 0);
    
    runningBalance += dayNet;
    dailyBalances.push({
      date: dayStr,
      balance: runningBalance
    });
  });

  return dailyBalances;
}

const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function NetBalanceChart({ transactions = [] }: NetBalanceChartProps) {
  // Use useRef to track component mounted state
  const isMounted = React.useRef(true);
  const chartData = React.useMemo(() => processTransactions(transactions), [transactions]);
  const minBalance = chartData.length > 0 ? Math.min(...chartData.map(d => d.balance)) : 0;
  const maxBalance = chartData.length > 0 ? Math.max(...chartData.map(d => d.balance)) : 0;
  
  // Add cleanup effect to prevent memory leaks and disconnection errors
  React.useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <Card className="w-full h-full shadow-lg hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border p-6">
        <CardTitle className="text-lg font-bold text-foreground">Net Balance Over Time</CardTitle>
        <CardDescription className="text-muted-foreground">
          Tracking daily net balance (income minus expenses)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          {/* Use width and height as percentages to make it truly responsive */}
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="balance"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value: any) => formatCurrency(value as number)}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                // Use activeDot with a function to determine color based on balance value
                activeDot={(props: any) => {
                  const fillColor = props.payload.balance >= 0 
                    ? "hsl(var(--success))" 
                    : "hsl(var(--destructive))";
                  return (
                    <circle
                      key={`dot-balance-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={fillColor}
                      stroke={fillColor}
                      strokeWidth={2}
                    />
                  );
                }}
                // Use a simple dot object instead of a function to avoid TypeScript errors
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  // We'll use the activeDot for custom coloring instead
                  fill: "hsl(var(--chart-1))",
                  stroke: "hsl(var(--chart-1))"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}