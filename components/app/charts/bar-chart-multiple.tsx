"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';

interface Transaction {
  date: string;
  amount: number;
  type: string;
  category_name?: string | null;
  [key: string]: any;
}

interface SpendingChartProps {
  transactions?: Transaction[];
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Process transactions into monthly data
const processMonthlyData = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get date range from transactions
  const dates = transactions.map(t => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = startOfMonth(dates[0]);
  const endDate = endOfMonth(dates[dates.length - 1]);
  
  // Generate all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  return months.map(month => {
    const monthTransactions = transactions.filter(t => 
      isSameMonth(parseISO(t.date), month)
    );
    
    const income = monthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);
      
    const expenses = monthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);
    
    return {
      month: format(month, 'MMMM'),
      income,
      expenses
    };
  });
};

export function SpendingChart({ transactions = [] }: SpendingChartProps) {
  const chartData = React.useMemo(() => processMonthlyData(transactions), [transactions]);
  
  const isEmpty = !chartData || chartData.length === 0;
  
  return (
    <Card className="w-full h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-card">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border p-6">
        <CardTitle className="text-lg font-semibold text-card-foreground">Monthly Spending</CardTitle>
        <CardDescription className="text-muted-foreground">Income vs Expenses over time</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 h-[300px]">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid 
                  vertical={false} 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.3}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar 
                  dataKey="income" 
                  fill="var(--color-income)" 
                  radius={[4, 4, 0, 0]}
                  name="Income"
                />
                <Bar 
                  dataKey="expenses" 
                  fill="var(--color-expenses)" 
                  radius={[4, 4, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}